import { sql } from "drizzle-orm";
import { db } from "../../../db";
import { orders } from "../../../db/schema";
import { sortOrderType } from "../../constants/common";

// Sortable fields for order queries
export const orderSortableFields: Record<string, any> = {
    order_id: orders.order_id,
    order_status: orders.order_status,
    financial_status: orders.financial_status,
    event_start_date: orders.event_start_date,
    created_at: orders.created_at,
    updated_at: orders.updated_at,
};

// Query validation configuration
export const orderQueryValidationConfig = {
    sort_by: Object.keys(orderSortableFields),
    sort_order: sortOrderType,
};

// Generate unique order ID in format: ORD-YYYYMMDD-XXX
export const generateOrderId = async (): Promise<string> => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const datePrefix = `ORD-${year}${month}${day}`;

    // Get count of orders created today
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .where(
            sql`${orders.created_at} >= ${todayStart} AND ${orders.created_at} < ${todayEnd}`
        );

    const count = result?.count || 0;
    const sequence = String(count + 1).padStart(3, '0');

    return `${datePrefix}-${sequence}`;
};

// Order status constants
export const ORDER_STATUSES = [
    'DRAFT',
    'SUBMITTED',
    'PRICING_REVIEW',
    'PENDING_APPROVAL',
    'QUOTED',
    'DECLINED',
    'CONFIRMED',
    'IN_PREPARATION',
    'READY_FOR_DELIVERY',
    'IN_TRANSIT',
    'DELIVERED',
    'IN_USE',
    'AWAITING_RETURN',
    'CLOSED',
] as const;

// Financial status constants
export const FINANCIAL_STATUSES = [
    'PENDING_QUOTE',
    'QUOTE_SENT',
    'QUOTE_ACCEPTED',
    'PENDING_INVOICE',
    'INVOICED',
    'PAID',
] as const;

// Buffer days for asset availability (for delivery/pickup logistics)
export const AVAILABILITY_BUFFER_DAYS = 3;
