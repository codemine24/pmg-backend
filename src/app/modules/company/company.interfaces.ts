import z from "zod";
import { UserSchemas } from "../user/user.schemas";

export type TCreateUserPayload = z.infer<typeof UserSchemas.createUser>[
  "body"
];
