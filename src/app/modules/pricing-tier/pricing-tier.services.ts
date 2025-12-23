import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import httpStatus from "http-status";
import { db } from "../../../db";
import { pricingTiers } from "../../../db/schema";
import CustomizedError from "../../error/customized-error";
import paginationMaker from "../../utils/pagination-maker";
import queryValidator from "../../utils/query-validator";
import { CreatePricingTierPayload } from "./pricing-tier.interfaces";
import { pricingTierQueryValidationConfig, pricingTierSortableFields } from "./pricing-tier.utils";

// ----------------------------------- CREATE PRICING TIER -----------------------------------
const createPricingTier = async (data: CreatePricingTierPayload) => {
    try {
        // Step 1: Convert number fields to strings for database
        const dbData = {
            ...data,
            volume_min: data.volume_min.toString(),
            volume_max: data.volume_max !== null && data.volume_max !== undefined ? data.volume_max.toString() : null,
            base_price: data.base_price.toString(),
        };

        // Step 2: Insert pricing tier into database
        const [result] = await db.insert(pricingTiers).values(dbData).returning();
        return result;
    } catch (error: any) {
        // Step 3: Handle database errors
        const pgError = error.cause || error;

        if (pgError.code === '23505') {
            if (pgError.constraint === 'pricing_tiers_unique') {
                throw new CustomizedError(
                    httpStatus.CONFLICT,
                    `Pricing tier with this country, city, and volume range already exists`
                );
            }
            throw new CustomizedError(
                httpStatus.CONFLICT,
                'A pricing tier with these details already exists'
            );
        }

        throw error;
    }
};

// ----------------------------------- GET PRICING TIERS -------------------------------------
const getPricingTiers = async (query: Record<string, any>, platformId: string) => {
    const {
        search_term,
        page,
        limit,
        sort_by,
        sort_order,
        country,
        city,
        include_inactive,
    } = query;

    // Step 1: Validate query parameters
    if (sort_by) queryValidator(pricingTierQueryValidationConfig, "sort_by", sort_by);
    if (sort_order)
        queryValidator(pricingTierQueryValidationConfig, "sort_order", sort_order);

    // Step 2: Setup pagination
    const { pageNumber, limitNumber, skip, sortWith, sortSequence } =
        paginationMaker({
            page,
            limit,
            sort_by,
            sort_order,
        });

    // Step 3: Build WHERE conditions
    const conditions: any[] = [eq(pricingTiers.platform_id, platformId)];

    // Step 3a: Search by country or city
    if (search_term) {
        conditions.push(
            or(
                ilike(pricingTiers.country, `%${search_term.trim()}%`),
                ilike(pricingTiers.city, `%${search_term.trim()}%`)
            )
        );
    }

    // Step 3b: Filter by country
    if (country) {
        conditions.push(eq(pricingTiers.country, country));
    }

    // Step 3c: Filter by city
    if (city) {
        conditions.push(eq(pricingTiers.city, city));
    }

    // Step 3d: Filter by active status (default: only active pricing tiers)
    if (include_inactive !== 'true') {
        conditions.push(eq(pricingTiers.is_active, true));
    }

    // Step 4: Determine sort order
    const orderByColumn = pricingTierSortableFields[sortWith] || pricingTiers.created_at;
    const orderDirection = sortSequence === "asc" ? asc(orderByColumn) : desc(orderByColumn);

    // Step 5: Execute queries in parallel (data + count)
    const [result, total] = await Promise.all([
        db
            .select()
            .from(pricingTiers)
            .where(and(...conditions))
            .orderBy(orderDirection)
            .limit(limitNumber)
            .offset(skip),

        db
            .select({
                count: count(),
            })
            .from(pricingTiers)
            .where(and(...conditions)),
    ]);

    // Step 6: Return paginated response
    return {
        meta: {
            page: pageNumber,
            limit: limitNumber,
            total: total[0].count,
        },
        data: result,
    };
};

// ----------------------------------- GET PRICING TIER BY ID --------------------------------
const getPricingTierById = async (id: string, platformId: string) => {
    // Step 1: Build WHERE conditions
    const conditions: any[] = [
        eq(pricingTiers.id, id),
        eq(pricingTiers.platform_id, platformId),
    ];

    // Step 2: Fetch pricing tier
    const [pricingTier] = await db
        .select()
        .from(pricingTiers)
        .where(and(...conditions));

    // Step 3: Handle not found
    if (!pricingTier) {
        throw new CustomizedError(httpStatus.NOT_FOUND, "Pricing tier not found");
    }

    return pricingTier;
};

// ----------------------------------- UPDATE PRICING TIER -----------------------------------
const updatePricingTier = async (id: string, data: any, platformId: string) => {
    try {
        // Step 1: Verify pricing tier exists
        const conditions: any[] = [
            eq(pricingTiers.id, id),
            eq(pricingTiers.platform_id, platformId),
        ];

        const [existingPricingTier] = await db
            .select()
            .from(pricingTiers)
            .where(and(...conditions));

        if (!existingPricingTier) {
            throw new CustomizedError(httpStatus.NOT_FOUND, "Pricing tier not found");
        }

        // Step 2: Convert number fields to strings for database
        const dbData: any = { ...data };
        if (data.volume_min !== undefined) {
            dbData.volume_min = data.volume_min.toString();
        }
        if (data.volume_max !== undefined && data.volume_max !== null) {
            dbData.volume_max = data.volume_max.toString();
        } else if (data.volume_max === null) {
            dbData.volume_max = null;
        }
        if (data.base_price !== undefined) {
            dbData.base_price = data.base_price.toString();
        }

        // Step 3: Update pricing tier
        const [result] = await db
            .update(pricingTiers)
            .set(dbData)
            .where(eq(pricingTiers.id, id))
            .returning();

        return result;
    } catch (error: any) {
        // Step 4: Handle database errors
        const pgError = error.cause || error;

        if (pgError.code === '23505') {
            if (pgError.constraint === 'pricing_tiers_unique') {
                throw new CustomizedError(
                    httpStatus.CONFLICT,
                    `Pricing tier with this country, city, and volume range already exists`
                );
            }
            throw new CustomizedError(
                httpStatus.CONFLICT,
                'A pricing tier with these details already exists'
            );
        }

        throw error;
    }
};

// ----------------------------------- DELETE PRICING TIER -----------------------------------
const deletePricingTier = async (id: string, platformId: string) => {
    // Step 1: Verify pricing tier exists
    const conditions: any[] = [
        eq(pricingTiers.id, id),
        eq(pricingTiers.platform_id, platformId),
    ];

    const [existingPricingTier] = await db
        .select()
        .from(pricingTiers)
        .where(and(...conditions));

    if (!existingPricingTier) {
        throw new CustomizedError(httpStatus.NOT_FOUND, "Pricing tier not found");
    }

    // Step 2: Soft delete pricing tier (set is_active to false)
    await db
        .update(pricingTiers)
        .set({
            is_active: false,
        })
        .where(eq(pricingTiers.id, id))
        .returning();

    return null;
};

export const PricingTierServices = {
    createPricingTier,
    getPricingTiers,
    getPricingTierById,
    updatePricingTier,
    deletePricingTier,
};
