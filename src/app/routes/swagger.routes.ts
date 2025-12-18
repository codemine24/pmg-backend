import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "../../swagger";

const router = express.Router();

router.use("/", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const swaggerRoutes = router;

export default swaggerRoutes;
