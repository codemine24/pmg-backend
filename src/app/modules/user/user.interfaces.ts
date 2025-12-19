import z from "zod";
import { UserSchemas } from "./user.schemas";

export type CreateUserPayload = z.infer<typeof UserSchemas.createUser>[
  "body"
] & {platform: string};
