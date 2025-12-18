import swaggerJsdoc from "swagger-jsdoc";
import config from "./app/config";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "PMG Asset Fulfillment Platform API",
    version: "1.0.0",
    description: "Multi-tenant asset management and order fulfillment platform API documentation",
    contact: {
      name: "PMG Platform",
      email: "support@pmg-platform.com",
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}`,
      description: "Local Development Server",
    },
    {
      url: "http://52.64.200.190",
      description: "Remote Server",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT token obtained from /auth/login endpoint",
      },
    },
    parameters: {
      PlatformHeader: {
        name: "X-Platform",
        in: "header",
        required: true,
        schema: {
          type: "string",
          format: "uuid",
        },
        description: "Platform UUID (required on all requests)",
      },
      CompanyHeader: {
        name: "X-Company",
        in: "header",
        required: false,
        schema: {
          type: "string",
          format: "uuid",
        },
        description: "Optional company filter for operations API",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          error: {
            type: "object",
            properties: {
              code: {
                type: "string",
                example: "PLATFORM_REQUIRED",
              },
              message: {
                type: "string",
                example: "X-Platform header is required",
              },
              details: {
                type: "object",
              },
            },
          },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          page: {
            type: "integer",
            example: 1,
          },
          limit: {
            type: "integer",
            example: 20,
          },
          total: {
            type: "integer",
            example: 100,
          },
          total_pages: {
            type: "integer",
            example: 5,
          },
        },
      },
    },
  },
  tags: [
    {
      name: "Authentication",
      description: "User authentication and session management",
    },
    {
      name: "Context",
      description: "Company domain resolution for pre-login branding",
    },
    {
      name: "Platform Management",
      description: "Platform configuration and feature flags (Platform Admin only)",
    },
    {
      name: "Company Management",
      description: "Company CRUD operations (Platform Admin only)",
    },
    {
      name: "User Management",
      description: "User management with RBAC (Platform Admin only)",
    },
    {
      name: "Warehouse Management",
      description: "Warehouse and zone management (Platform Admin, Logistics)",
    },
    {
      name: "Asset Management",
      description: "Asset inventory management (Logistics)",
    },
    {
      name: "Collection Management",
      description: "Asset collection management (Logistics)",
    },
    {
      name: "Pricing Management",
      description: "Pricing tier configuration (Platform Admin)",
    },
    {
      name: "Order Management (Operations)",
      description: "Order management for admin and logistics staff",
    },
    {
      name: "QR Scanning",
      description: "Asset scanning for fulfillment (Logistics)",
    },
    {
      name: "Client Catalog",
      description: "Asset catalog browsing (Client Users)",
    },
    {
      name: "Client Collections",
      description: "Collection browsing (Client Users)",
    },
    {
      name: "Client Orders",
      description: "Order management for client users",
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ["./src/app/**/*.swagger.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
