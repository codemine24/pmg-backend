import { eq } from "drizzle-orm";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { JwtPayload, Secret } from "jsonwebtoken";
import { db } from "../../db";
import { users } from "../../db/schema";
import config from "../config";
import CustomizedError from "../error/customized-error";
import { AuthUser } from "../interface/common";
import { tokenVerifier } from "../utils/jwt-helpers";

const auth = (...roles: string[]) => {
  return async (
    req: Request & { user?: JwtPayload },
    res: Response,
    next: NextFunction
  ) => {
    try {
      let token = req.headers.authorization;
      if (token?.startsWith("Bearer ")) {
        token = token.split("Bearer ")[1];
      }
      if (!token) {
        throw new CustomizedError(
          httpStatus.UNAUTHORIZED,
          "You are not authorized"
        );
      }

      const verifiedUser = tokenVerifier(
        token,
        config.jwt_access_secret as Secret
      ) as AuthUser;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, verifiedUser.id));

      if (!user) {
        throw new CustomizedError(httpStatus.NOT_FOUND, "User not found");
      }

      if (!user.isActive) {
        throw new CustomizedError(httpStatus.FORBIDDEN, "User is not active");
      }

      // Password changed check is removed as password_changed_at is not in schema yet
      /*
      const passwordChangedTime = Math.floor(
        new Date(user.password_changed_at).getTime() / 1000
      );

      if (passwordChangedTime > verifiedUser.iat) {
        throw new CustomizedError(
          httpStatus.UNAUTHORIZED,
          "Password changed recently"
        );
      }
      */

      if (roles?.length && !roles.includes(verifiedUser?.role)) {
        throw new CustomizedError(
          httpStatus.UNAUTHORIZED,
          "You are not authorized"
        );
      }

      req.user = verifiedUser;

      next();
    } catch (error: any) {
      next(error);
    }
  };
};

export default auth;
