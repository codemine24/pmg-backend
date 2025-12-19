import { z } from "zod";





const loginValidationSchema = z.object({
  body: z.object({
    email_or_contact_number: z
      .string()
      .min(1, { message: "Email or contact number is required" }),
    password: z.string({ error: "Password is required" }),
  }),
});



export const AuthValidations = {

  loginValidationSchema,
};
