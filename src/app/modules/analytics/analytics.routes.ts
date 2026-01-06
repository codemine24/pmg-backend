import { Router } from "express";
import auth from "../../middleware/auth";
import platformValidator from "../../middleware/platform-validator";
import { AnalyticsControllers } from "./analytics.controllers";

const router = Router();

// Get time series data (ADMIN only)
router.get(
    "/time-series",
    platformValidator,
    auth('ADMIN'),
    AnalyticsControllers.getTimeSeries
);

// Get revenue summary (ADMIN only)
router.get(
    "/revenue-summary",
    platformValidator,
    auth('ADMIN'),
    AnalyticsControllers.getRevenueSummary
);

// Get margin summary (ADMIN only)
router.get(
    "/margin-summary",
    platformValidator,
    auth('ADMIN'),
    AnalyticsControllers.getMarginSummary
);

// Get company breakdown (ADMIN only)
router.get(
    "/company-breakdown",
    platformValidator,
    auth('ADMIN'),
    AnalyticsControllers.getCompanyBreakdown
);

export const AnalyticsRoutes = router;
