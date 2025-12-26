import z from "zod";
import { orderSchemas } from "./order.schemas";

// Submit order payload interface
export type SubmitOrderPayload = z.infer<typeof orderSchemas.submitOrderSchema>["body"] & {
    platform_id: string;
    user_id: string;
    company_id: string;
};

// Email data interface for order notifications
export interface OrderSubmittedEmailData {
    orderId: string;
    companyName: string;
    eventStartDate: string;
    eventEndDate: string;
    venueCity: string;
    totalVolume: string;
    itemCount: number;
    viewOrderUrl: string;
}

// Email recipient role type
export type RecipientRole = 'PMG_ADMIN' | 'A2_STAFF' | 'CLIENT_USER';
