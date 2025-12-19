import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  node_env: process.env.NODE_ENV,
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
  app_name: "Drizzle",
  salt_rounds: Number(process.env.SALT_ROUNDS),
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  jwt_access_expiresin: process.env.JWT_ACCESS_EXPIRESIN,
  jwt_refresh_expiresin: process.env.JWT_REFRESH_EXPIRESIN,
};
