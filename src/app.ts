import cookiePerser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import httpStatus from "http-status";
import config from "./app/config";
import globalErrorHandler from "./app/middleware/global-error-handler";
import notFoundHandler from "./app/middleware/not-found-handler";
import router from "./app/routes";
import swaggerRoutes from "./app/routes/swagger.routes";

const app: Application = express();

// third party middleware configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookiePerser());

// cors configuration
app.use((req, res, next) => {
  res.header("Vary", "Origin");
  next();
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    callback(null, origin);
  },
  allowedHeaders: "Content-Type, Authorization",
  credentials: true
}));

// test server
app.get("/", (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: `${config.app_name} server is working fine`,
  });
});

// main routes
app.use("/api", router);
app.use("/api-docs", swaggerRoutes);

// handle error
app.use(globalErrorHandler);
app.use(notFoundHandler);

export default app;
