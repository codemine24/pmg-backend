import { Router } from "express";
import payloadValidator from "../../middleware/payload-validator";
import { zonesSchemas } from "./zone.schemas";

const router = Router();

// Create zone
router.post(
  "/",
  payloadValidator(zonesSchemas.zoneSchema),
);

// Get all zones
router.get("/")

// Get zone by id
router.get("/:id")

// Update zone
router.patch("/:id", payloadValidator(zonesSchemas.updateZoneSchema));

// Delete zone
router.delete("/:id");

export const ZoneRoutes = router;