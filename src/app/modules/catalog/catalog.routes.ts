import { Router } from "express";
import auth from "../../middleware/auth";
import { CatalogControllers } from "./catalog.controllers";

const router = Router();

// Browse catalog
router.get(
  "/",
  auth("ADMIN", "LOGISTICS", "CLIENT"),
  CatalogControllers.getCatalog
);

export const CatalogRoutes = router;
