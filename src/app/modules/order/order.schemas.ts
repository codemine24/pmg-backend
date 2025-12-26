import { z } from "zod";

const submitOrderSchema = z.object({
    body: z.object({
        items: z
            .array(
                z.object({
                    assetId: z.string().uuid("Invalid asset ID"),
                    quantity: z.number().int().positive("Quantity must be a positive integer"),
                    fromCollectionId: z.string().uuid("Invalid collection ID").optional(),
                })
            )
            .min(1, "At least one item is required"),

        brand: z.string().max(100).optional(),

        eventStartDate: z.string().refine(
            (date) => !isNaN(Date.parse(date)),
            "Invalid event start date format"
        ),

        eventEndDate: z.string().refine(
            (date) => !isNaN(Date.parse(date)),
            "Invalid event end date format"
        ),

        venueName: z.string().min(1, "Venue name is required").max(200),
        venueCountry: z.string().min(1, "Venue country is required").max(50),
        venueCity: z.string().min(1, "Venue city is required").max(50),
        venueAddress: z.string().min(1, "Venue address is required"),
        venueAccessNotes: z.string().optional(),

        contactName: z.string().min(1, "Contact name is required").max(100),
        contactEmail: z.string().email("Invalid email format").max(255),
        contactPhone: z.string().min(1, "Contact phone is required").max(50),

        specialInstructions: z.string().optional(),
    }),
});

export const orderSchemas = {
    submitOrderSchema,
};
