import { Router } from "express";
import { PlatformControllers } from "./platform.controllers";

const router = Router();

router.post("/", PlatformControllers.createPlatform);

export const UserRoutes = router;
