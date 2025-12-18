import { Router } from "express";
import { PlatformRoutes } from "../modules/platform/platform.routes";

const router = Router();

const routes = [
  {
    path: "/platform",
    route: PlatformRoutes,
  },
];

routes.forEach((route) => router.use(route.path, route.route));

export const OperationRoutes = router;
