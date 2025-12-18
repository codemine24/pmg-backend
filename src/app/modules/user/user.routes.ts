import { Router } from "express";
import { UserControllers } from "./user.controllers";
import { UserSchemas } from "./user.schemas";
import payloadValidator from "../../middleware/payload-validator";

const router = Router();

router.post(
  "/",
  payloadValidator(UserSchemas.createUser),
  UserControllers.createUSer
);

export const UserRoutes = router;
