import { ErrorRequestHandler } from "express";
import httpStatus from "http-status";
import { ZodError } from "zod";
import config from "../config";
import zodErrorHandler from "../error/zod-error-handler";
import { IErrorSources } from "../interface/error";

const globalErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  let message = error.message || "Something went wrong!";
  let errorSources: IErrorSources[] = [
    {
      path: "",
      message: error.message || "",
    },
  ];

  // Helper to extract Postgres error details
  if ((error as any).code && (error as any).detail) {
    errorSources.push({
      path: "",
      message: `DB Error Code: ${(error as any).code}, Detail: ${(error as any).detail}`
    })
  }

  if (error instanceof ZodError) {
    const simplifiedError = zodErrorHandler(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
  } else if (error.message === "jwt expired") {
    statusCode = httpStatus.UNAUTHORIZED;
    message = "Token has been expired";
  }
  res.status(statusCode).json({
    success: false,
    message: message,
    errorSources,
    stack: config.node_env === "development" ? error.stack : null,
  });
};

export default globalErrorHandler;
