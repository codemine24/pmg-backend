import z from "zod";

const createUser = z.object({
  body: z
    .object({
      name: z.string({ message: "Name is required" }),
      email: z.email({ message: "Invalid email address" }),
    })
    .strict(),
});

export const UserSchemas = {
  createUser,
};
