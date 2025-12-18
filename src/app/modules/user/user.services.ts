import bcrypt from "bcrypt";
import { db } from "../../../db";
import { users } from "../../../db/schema";
import config from "../../config";

// ----------------------------------- CREATE USER ------------------------------------
const createUser = async (data: any) => {
  const hashedPassword = await bcrypt.hash(
    data.password,
    config.salt_rounds
  );

  const result = await db.insert(users).values(data).returning();
  return result;
};

export const UserServices = {
  createUser,
};
