import { Router } from "express";
import { UserRoutes } from "../modules/user/user.routes";

const router = Router();

const routes = [
  {
    path: "/user",
    route: UserRoutes,
  },
];

routes.forEach((route) => router.use(route.path, route.route));

export default router;
