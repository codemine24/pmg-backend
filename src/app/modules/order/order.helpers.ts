import { and, eq } from "drizzle-orm";
import { db } from "../../../db";
import { assetBookings, orderItems, orderStatusHistory, scanEvents } from "../../../db/schema";
import { AuthUser } from "../../interface/common";

// ----------------------------------- CREATE STATUS HISTORY ENTRY -----------------------------
/**
 * Creates an entry in the order_status_history table
 */
export async function createStatusHistoryEntry(
    orderId: string,
    newStatus: string,
    userId: string,
    platformId: string,
    notes?: string
): Promise<void> {
    await db.insert(orderStatusHistory).values({
        platform_id: platformId,
        order_id: orderId,
        status: newStatus as any,
        notes: notes || null,
        updated_by: userId,
    });
}

// ----------------------------------- RESERVE ASSETS FOR ORDER --------------------------------
/**
 * Reserves assets by creating entries in asset_bookings table
 */
export async function reserveAssetsForOrder(
    orderId: string,
    eventStartDate: Date,
    eventEndDate: Date,
    platformId: string
): Promise<void> {
    // Get all order items
    const items = await db.query.orderItems.findMany({
        where: eq(orderItems.order_id, orderId),
    });

    if (items.length === 0) {
        throw new Error('No items found in order');
    }

    // Create asset bookings for each item
    const bookingsToInsert = items.map((item) => ({
        asset_id: item.asset_id,
        order_id: orderId,
        quantity: item.quantity,
        blocked_from: eventStartDate,
        blocked_until: eventEndDate,
    }));

    await db.insert(assetBookings).values(bookingsToInsert);
}

// ----------------------------------- RELEASE ASSETS FOR ORDER --------------------------------
/**
 * Releases assets by deleting entries from asset_bookings table
 */
export async function releaseAssetsForOrder(
    orderId: string,
    platformId: string
): Promise<void> {
    await db
        .delete(assetBookings)
        .where(eq(assetBookings.order_id, orderId));
}

// ----------------------------------- VALIDATE INBOUND SCANNING COMPLETE ----------------------
/**
 * Validates that all order items have been scanned in (inbound)
 * Returns true if all items scanned, false otherwise
 */
export async function validateInboundScanningComplete(
    orderId: string
): Promise<boolean> {
    // Get all order items
    const items = await db.query.orderItems.findMany({
        where: eq(orderItems.order_id, orderId),
    });

    if (items.length === 0) {
        return true; // No items to scan
    }

    // Get all inbound scan events for this order
    const inboundScans = await db.query.scanEvents.findMany({
        where: and(
            eq(scanEvents.order_id, orderId),
            eq(scanEvents.scan_type, 'INBOUND')
        ),
    });

    // Check if each item has been fully scanned in
    for (const item of items) {
        const scannedQuantity = inboundScans
            .filter((scan) => scan.asset_id === item.asset_id)
            .reduce((sum, scan) => sum + scan.quantity, 0);

        if (scannedQuantity < item.quantity) {
            console.log(
                `❌ Item ${item.asset_name} not fully scanned: ${scannedQuantity}/${item.quantity}`
            );
            return false;
        }
    }

    console.log(`✅ All items scanned in for order ${orderId}`);
    return true;
}

// ----------------------------------- GET NOTIFICATION TYPE FOR TRANSITION --------------------
/**
 * Maps status transitions to notification types
 */
export function getNotificationTypeForTransition(
    fromStatus: string,
    toStatus: string
): string | null {
    // Map status transitions to notification types
    const transitionMap: Record<string, string> = {
        'DRAFT->SUBMITTED': 'ORDER_SUBMITTED',
        'SUBMITTED->PRICING_REVIEW': '', // No notification needed
        'PRICING_REVIEW->QUOTED': 'QUOTE_SENT', // A2 approved standard pricing, goes direct to client
        'PRICING_REVIEW->PENDING_APPROVAL': 'A2_ADJUSTED_PRICING', // A2 adjusted price, needs PMG review
        'PENDING_APPROVAL->QUOTED': 'QUOTE_SENT', // PMG approved, send to client
        'QUOTED->CONFIRMED': 'QUOTE_APPROVED', // Direct to CONFIRMED
        'QUOTED->DECLINED': 'QUOTE_DECLINED',
        'CONFIRMED->IN_PREPARATION': 'ORDER_CONFIRMED',
        'IN_PREPARATION->READY_FOR_DELIVERY': 'READY_FOR_DELIVERY',
        'READY_FOR_DELIVERY->IN_TRANSIT': 'IN_TRANSIT',
        'IN_TRANSIT->DELIVERED': 'DELIVERED',
        'DELIVERED->IN_USE': '', // No notification needed
        'IN_USE->AWAITING_RETURN': '', // No notification needed (PICKUP_REMINDER sent via cron 48h before)
        'AWAITING_RETURN->CLOSED': 'ORDER_CLOSED',
    };

    const key = `${fromStatus}->${toStatus}`;
    const notificationType = transitionMap[key];

    // Return null if empty string (no notification) or undefined (not in map)
    return notificationType && notificationType !== '' ? notificationType : null;
}
