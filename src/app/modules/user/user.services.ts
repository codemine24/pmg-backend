import { db } from "../../../db";
import { users } from "../../../db/schema";
import { TCreateUserPayload } from "./user.interfaces";

// -------------------------------------- CREATE USER ---------------------------------
const createUser = async (data: TCreateUserPayload) => {
  const result = await db.insert(users).values(data).returning();

  return result[0];
};

export const UserServices = {
  createUser,
};
