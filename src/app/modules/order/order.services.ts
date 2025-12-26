import { and, eq, inArray, isNull, lte, sql } from "drizzle-orm";
import httpStatus from "http-status";
import { db } from "../../../db";
import {
    assetBookings,
    assets,
    collections,
    companies,
    orderItems,
    orders,
    pricingTiers,
    users,
} from "../../../db/schema";
import CustomizedError from "../../error/customized-error";
import { AuthUser } from "../../interface/common";
import { sendEmail } from "../../services/email.service";
import { OrderSubmittedEmailData, RecipientRole, SubmitOrderPayload } from "./order.interfaces";
import { generateOrderId } from "./order.utils";

// Import asset availability checker
import { AssetServices } from "../asset/assets.services";

// ----------------------------------- SUBMIT ORDER FROM CART ---------------------------------
const submitOrderFromCart = async (
    userId: string,
    companyId: string,
    platformId: string,
    request: SubmitOrderPayload
): Promise<{
    orderId: string;
    status: string;
    companyName: string;
    calculatedVolume: string;
    itemCount: number;
}> => {
    // Step 1: Validate items array
    if (!request.items || request.items.length === 0) {
        throw new CustomizedError(httpStatus.BAD_REQUEST, "At least one item is required");
    }

    // Step 2: Validate dates first (needed for availability check)
    const eventStart = new Date(request.eventStartDate);
    const eventEnd = new Date(request.eventEndDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (eventStart < today) {
        throw new CustomizedError(httpStatus.BAD_REQUEST, "Event start date cannot be in the past");
    }

    if (eventEnd < eventStart) {
        throw new CustomizedError(httpStatus.BAD_REQUEST, "Event end date must be on or after start date");
    }

    // Step 3: Validate all assets belong to company and are available
    const assetIds = request.items.map((item: { assetId: string; quantity: number; fromCollectionId?: string }) => item.assetId);
    const foundAssets = await db
        .select()
        .from(assets)
        .where(
            and(
                inArray(assets.id, assetIds),
                eq(assets.company_id, companyId),
                eq(assets.platform_id, platformId),
                isNull(assets.deleted_at)
            )
        );

    if (foundAssets.length !== assetIds.length) {
        throw new CustomizedError(
            httpStatus.NOT_FOUND,
            "One or more assets not found or do not belong to your company"
        );
    }

    // Step 4: Validate all assets are AVAILABLE (status check)
    const unavailableAssets = foundAssets.filter((a) => a.status !== "AVAILABLE");
    if (unavailableAssets.length > 0) {
        throw new CustomizedError(
            httpStatus.BAD_REQUEST,
            `Cannot order unavailable assets: ${unavailableAssets.map((a) => a.name).join(", ")}`
        );
    }

    // Step 5: Validate date-based availability with buffer days
    console.log("🔍 Checking availability for event dates:", {
        eventStart: eventStart.toISOString(),
        eventEnd: eventEnd.toISOString(),
        items: request.items,
    });

    const mockUser: AuthUser & { permissions: string[] } = {
        id: userId,
        platform_id: platformId,
        company_id: companyId,
        email: "",
        role: "CLIENT",
        iat: 0,
        exp: 0,
        permissions: [],
    };

    const availabilityCheck = await AssetServices.checkAssetAvailability(
        {
            items: request.items.map((item: { assetId: string; quantity: number; fromCollectionId?: string }) => ({
                asset_id: item.assetId,
                quantity: item.quantity,
            })),
            start_date: request.eventStartDate,
            end_date: request.eventEndDate,
        },
        mockUser,
        platformId
    );

    console.log("✅ Availability check result:", availabilityCheck);

    if (!(availabilityCheck as any).all_available) {
        const unavailableList = (availabilityCheck as any).unavailable_items
            .map(
                (item: any) =>
                    `${item.asset_name}: requested ${item.requested}, available ${item.available}${item.next_available_date
                        ? ` (available from ${new Date(item.next_available_date).toLocaleDateString()})`
                        : ""
                    }`
            )
            .join("; ");
        console.log("❌ Availability check FAILED:", unavailableList);
        throw new CustomizedError(
            httpStatus.BAD_REQUEST,
            `Insufficient availability for requested dates: ${unavailableList}`
        );
    }

    console.log("✅ Availability check PASSED - proceeding with order creation");

    // Step 6: Validate required fields
    if (
        !request.venueName ||
        !request.venueCountry ||
        !request.venueCity ||
        !request.venueAddress
    ) {
        throw new CustomizedError(httpStatus.BAD_REQUEST, "All venue information fields are required");
    }

    if (!request.contactName || !request.contactEmail || !request.contactPhone) {
        throw new CustomizedError(httpStatus.BAD_REQUEST, "All contact information fields are required");
    }

    // Step 7: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.contactEmail)) {
        throw new CustomizedError(httpStatus.BAD_REQUEST, "Invalid email format");
    }

    // Step 8: Create order items data with totals
    const orderItemsData = [];
    let totalVolume = 0;
    let totalWeight = 0;

    for (const item of request.items) {
        const asset = foundAssets.find((a) => a.id === item.assetId)!;
        const itemVolume = parseFloat(asset.volume_per_unit) * item.quantity;
        const itemWeight = parseFloat(asset.weight_per_unit) * item.quantity;

        totalVolume += itemVolume;
        totalWeight += itemWeight;

        // Get collection name if from collection
        let collectionName: string | null = null;
        if (item.fromCollectionId) {
            const [collection] = await db
                .select()
                .from(collections)
                .where(eq(collections.id, item.fromCollectionId));
            collectionName = collection?.name || null;
        }

        orderItemsData.push({
            platform_id: platformId,
            asset_id: asset.id,
            asset_name: asset.name,
            quantity: item.quantity,
            volume_per_unit: asset.volume_per_unit,
            weight_per_unit: asset.weight_per_unit,
            total_volume: itemVolume.toFixed(3),
            total_weight: itemWeight.toFixed(2),
            condition_notes: asset.condition_notes,
            handling_tags: asset.handling_tags || [],
            from_collection: item.fromCollectionId || null,
            from_collection_name: collectionName,
        });
    }

    const calculatedVolume = totalVolume.toFixed(3);
    const calculatedWeight = totalWeight.toFixed(2);

    // Step 9: Find matching pricing tier
    const volume = parseFloat(calculatedVolume);
    const matchingTiers = await db
        .select()
        .from(pricingTiers)
        .where(
            and(
                sql`LOWER(${pricingTiers.country}) = LOWER(${request.venueCountry})`,
                sql`LOWER(${pricingTiers.city}) = LOWER(${request.venueCity})`,
                eq(pricingTiers.is_active, true),
                eq(pricingTiers.platform_id, platformId),
                lte(sql`CAST(${pricingTiers.volume_min} AS DECIMAL)`, volume),
                sql`CAST(${pricingTiers.volume_max} AS DECIMAL) > ${volume}`
            )
        )
        .orderBy(
            sql`CAST(${pricingTiers.volume_max} AS DECIMAL) - CAST(${pricingTiers.volume_min} AS DECIMAL)`
        )
        .limit(1);

    const pricingTier = matchingTiers[0] || null;

    // Step 10: Create order directly as PRICING_REVIEW (A2 staff reviews immediately)
    const [order] = await db
        .insert(orders)
        .values({
            order_id: await generateOrderId(),
            platform_id: platformId,
            company_id: companyId,
            brand_id: request.brand || null,
            user_id: userId,
            order_status: "PRICING_REVIEW",
            financial_status: "PENDING_QUOTE",
            contact_name: request.contactName,
            contact_email: request.contactEmail,
            contact_phone: request.contactPhone,
            event_start_date: eventStart,
            event_end_date: eventEnd,
            venue_name: request.venueName,
            venue_location: {
                country: request.venueCountry,
                city: request.venueCity,
                address: request.venueAddress,
                access_notes: request.venueAccessNotes || null,
            },
            special_instructions: request.specialInstructions || null,
            calculated_totals: {
                volume: calculatedVolume,
                weight: calculatedWeight,
            },
            tier_id: pricingTier?.id || null,
        })
        .returning();

    // Step 11: Add order items
    const itemsToInsert = orderItemsData.map((item) => ({
        ...item,
        order_id: order.id,
    }));

    await db.insert(orderItems).values(itemsToInsert);

    // Step 12: Create asset bookings for the order
    const bookingsToInsert = request.items.map((item: { assetId: string; quantity: number; fromCollectionId?: string }) => ({
        asset: item.assetId,
        order: order.id,
        quantity: item.quantity,
        blocked_from: eventStart,
        blocked_until: eventEnd,
    }));

    await db.insert(assetBookings).values(bookingsToInsert);

    // Step 13: Get company name for response
    const [company] = await db.select().from(companies).where(eq(companies.id, companyId));

    return {
        orderId: order.order_id,
        status: "PRICING_REVIEW",
        companyName: company?.name || "",
        calculatedVolume,
        itemCount: request.items.length,
    };
};

// ----------------------------------- SEND ORDER SUBMITTED NOTIFICATIONS ---------------------
const sendOrderSubmittedNotifications = async (data: OrderSubmittedEmailData): Promise<void> => {
    try {
        // Find PMG Admins (permission_template = 'PMG_ADMIN' OR 'orders:receive_notifications' in permissions)
        const pmgAdmins = await db
            .select({ email: users.email, name: users.name })
            .from(users)
            .where(
                sql`(
                    ${users.permission_template} = 'PMG_ADMIN'
                    OR 'orders:receive_notifications' = ANY(${users.permissions})
                ) AND ${users.email} NOT LIKE '%@system.internal'`
            );

        // Find A2 Staff (permission_template = 'A2_STAFF' OR 'orders:receive_notifications' in permissions)
        const a2Staff = await db
            .select({ email: users.email, name: users.name })
            .from(users)
            .where(
                sql`(
                    ${users.permission_template} = 'A2_STAFF'
                    OR 'orders:receive_notifications' = ANY(${users.permissions})
                ) AND ${users.email} NOT LIKE '%@system.internal'`
            );

        // Send emails to PMG Admins
        const pmgAdminPromises = pmgAdmins.map(async (admin) => {
            const html = renderOrderSubmittedEmail("PMG_ADMIN", data);
            return sendEmail({
                to: admin.email,
                subject: `New Order Submitted: ${data.orderId}`,
                html,
            });
        });

        // Send emails to A2 Staff
        const a2StaffPromises = a2Staff.map(async (staff) => {
            const html = renderOrderSubmittedEmail("A2_STAFF", data);
            return sendEmail({
                to: staff.email,
                subject: `New Order Submitted: ${data.orderId}`,
                html,
            });
        });

        // Send all emails concurrently
        await Promise.all([...pmgAdminPromises, ...a2StaffPromises]);

        console.log(`Order submission notifications sent for order ${data.orderId}`);
    } catch (error) {
        // Log error but don't throw - email failures shouldn't block order submission
        console.error("Error sending order submission notifications:", error);
    }
};

// ----------------------------------- SEND ORDER CONFIRMATION TO CLIENT ----------------------
const sendOrderSubmittedConfirmationToClient = async (
    clientEmail: string,
    clientName: string,
    data: OrderSubmittedEmailData
): Promise<void> => {
    try {
        const html = renderOrderSubmittedEmail("CLIENT_USER", data);

        await sendEmail({
            to: clientEmail,
            subject: `Order Confirmation: ${data.orderId}`,
            html,
        });

        console.log(`Order confirmation sent to client: ${clientEmail}`);
    } catch (error) {
        // Log error but don't throw - email failures shouldn't block order submission
        console.error("Error sending order confirmation to client:", error);
    }
};

// ----------------------------------- RENDER ORDER SUBMITTED EMAIL ---------------------------
const renderOrderSubmittedEmail = (
    recipientRole: RecipientRole,
    data: OrderSubmittedEmailData
): string => {
    const roleMessages = {
        PMG_ADMIN: {
            greeting: "PMG Admin",
            message: "A new order has been submitted and requires review.",
            action: "Review this order in the admin dashboard and monitor the pricing workflow.",
        },
        A2_STAFF: {
            greeting: "A2 Logistics Team",
            message: "A new order has been submitted and requires pricing review.",
            action: "Review the order details and provide pricing within 24-48 hours.",
        },
        CLIENT_USER: {
            greeting: "Client",
            message: "Your order has been successfully submitted.",
            action:
                "You will receive a quote via email within 24-48 hours. Track your order status in the dashboard.",
        },
    };

    const roleMessage = roleMessages[recipientRole];

    return `
<!DOCTYPE html>
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Order Submitted: ${data.orderId}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; background-color: #f6f9fc;">
	<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f6f9fc;">
		<tr>
			<td align="center" style="padding: 40px 20px;">
				<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
					<!-- Header -->
					<tr>
						<td style="padding: 40px 40px 0;">
							<h1 style="margin: 0; font-size: 32px; font-weight: bold; color: #1f2937; line-height: 1.3;">Order Submitted</h1>
						</td>
					</tr>

					<!-- Greeting -->
					<tr>
						<td style="padding: 16px 40px 0;">
							<p style="margin: 0; font-size: 16px; line-height: 1.6; color: #374151;">Hello ${roleMessage.greeting},</p>
						</td>
					</tr>

					<!-- Message -->
					<tr>
						<td style="padding: 16px 40px 0;">
							<p style="margin: 0; font-size: 16px; line-height: 1.6; color: #374151;">${roleMessage.message}</p>
						</td>
					</tr>

					<!-- Order Details Box -->
					<tr>
						<td style="padding: 24px 40px;">
							<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f9fafb; border-radius: 8px;">
								<tr>
									<td style="padding: 24px;">
										<p style="margin: 0 0 16px; font-size: 18px; font-weight: bold; color: #111827;">Order Details</p>
										<hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 0 0 16px;">

										<p style="margin: 8px 0; font-size: 14px; line-height: 1.6; color: #374151;">
											<strong>Order ID:</strong> ${data.orderId}
										</p>
										<p style="margin: 8px 0; font-size: 14px; line-height: 1.6; color: #374151;">
											<strong>Company:</strong> ${data.companyName}
										</p>
										<p style="margin: 8px 0; font-size: 14px; line-height: 1.6; color: #374151;">
											<strong>Event Dates:</strong> ${data.eventStartDate} to ${data.eventEndDate}
										</p>
										<p style="margin: 8px 0; font-size: 14px; line-height: 1.6; color: #374151;">
											<strong>Venue City:</strong> ${data.venueCity}
										</p>
										<p style="margin: 8px 0; font-size: 14px; line-height: 1.6; color: #374151;">
											<strong>Total Volume:</strong> ${data.totalVolume} m³
										</p>
										<p style="margin: 8px 0; font-size: 14px; line-height: 1.6; color: #374151;">
											<strong>Item Count:</strong> ${data.itemCount} items
										</p>
									</td>
								</tr>
							</table>
						</td>
					</tr>

					<!-- Action Section -->
					<tr>
						<td style="padding: 0 40px 32px;">
							<p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #374151;">${roleMessage.action}</p>
							<a href="${data.viewOrderUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; padding: 12px 32px; border-radius: 6px;">View Order</a>
						</td>
					</tr>

					<!-- Footer -->
					<tr>
						<td style="padding: 32px 40px;">
							<hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 0 0 32px;">
							<p style="margin: 0; font-size: 12px; line-height: 1.5; color: #6b7280;">
								This is an automated message from the Asset Fulfillment System. Please do not reply to this email.
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
	`.trim();
};

export const OrderServices = {
    submitOrderFromCart,
    sendOrderSubmittedNotifications,
    sendOrderSubmittedConfirmationToClient,
    renderOrderSubmittedEmail,
};
