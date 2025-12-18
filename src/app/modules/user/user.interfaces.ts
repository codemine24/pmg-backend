import z from "zod";
import { UserSchemas } from "./user.schemas";

export type TCreateUserPayload = z.infer<typeof UserSchemas.createUser>[
  "body"
];
