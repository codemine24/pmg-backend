import { db } from "../../../db";
import { platforms } from "../../../db/schema";
import { CreatePlatformPayload } from "./platform.interfaces";

// ----------------------------------- CREATE PLATFORM --------------------------------
const createPlatform = async (data: CreatePlatformPayload) => {
  const result = await db.insert(platforms).values(data).returning();
  return result;
};

export const PlatformServices = {
  createPlatform,
};
