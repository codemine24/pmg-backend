/**
 * @swagger
 * /api/operations/v1/company:
 *   post:
 *     tags:
 *       - Company Management
 *     summary: Create a new company
 *     description: Creates a new company with a vanity subdomain. The platform ID is automatically extracted from the X-Platform header. Company domain must be unique within the platform.
 *     parameters:
 *       - $ref: '#/components/parameters/PlatformHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - domain
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Company name
 *                 example: "Diageo Events"
 *               domain:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 pattern: "^[a-z0-9-]+$"
 *                 description: Company subdomain (lowercase, alphanumeric and hyphens only)
 *                 example: "diageo"
 *               settings:
 *                 type: object
 *                 description: Company branding and configuration settings
 *                 properties:
 *                   branding:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         description: Company display title
 *                         example: "Diageo"
 *                       logo_url:
 *                         type: string
 *                         format: uri
 *                         description: URL to company logo
 *                         example: "https://cdn.example.com/logos/diageo.png"
 *                       primary_color:
 *                         type: string
 *                         description: Primary brand color (hex code)
 *                         example: "#000000"
 *                       secondary_color:
 *                         type: string
 *                         description: Secondary brand color (hex code)
 *                         example: "#ffffff"
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Company active status
 *                 example: true
 *     responses:
 *       201:
 *         description: Company created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Company created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       description: Company unique identifier
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
 *                     platform:
 *                       type: string
 *                       format: uuid
 *                       description: Platform ID (from X-Platform header)
 *                       example: "7c9e6679-7425-40de-944b-e07fc1f90ae7"
 *                     name:
 *                       type: string
 *                       example: "Diageo Events"
 *                     domain:
 *                       type: string
 *                       description: Company subdomain
 *                       example: "diageo"
 *                     settings:
 *                       type: object
 *                       properties:
 *                         branding:
 *                           type: object
 *                           properties:
 *                             title:
 *                               type: string
 *                               example: "Diageo"
 *                             logo_url:
 *                               type: string
 *                               example: "https://cdn.example.com/logos/diageo.png"
 *                             primary_color:
 *                               type: string
 *                               example: "#000000"
 *                             secondary_color:
 *                               type: string
 *                               example: "#ffffff"
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       description: Company creation timestamp
 *                       example: "2025-12-19T03:26:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Company last update timestamp
 *                       example: "2025-12-19T03:26:00.000Z"
 *                     deleted_at:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       description: Soft delete timestamp
 *                       example: null
 *                     domains:
 *                       type: array
 *                       description: Company domains (automatically created vanity subdomain)
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: "8d7e5679-8536-51ef-a827-557766551111"
 *                           platform:
 *                             type: string
 *                             format: uuid
 *                             example: "7c9e6679-7425-40de-944b-e07fc1f90ae7"
 *                           company:
 *                             type: string
 *                             format: uuid
 *                             example: "550e8400-e29b-41d4-a716-446655440000"
 *                           hostname:
 *                             type: string
 *                             description: Full hostname for the company
 *                             example: "diageo"
 *                           type:
 *                             type: string
 *                             enum: [VANITY, CUSTOM]
 *                             description: Domain type
 *                             example: "VANITY"
 *                           isVerified:
 *                             type: boolean
 *                             example: false
 *                           isActive:
 *                             type: boolean
 *                             example: true
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-12-19T03:26:00.000Z"
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-12-19T03:26:00.000Z"
 *       400:
 *         description: Bad request - Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "VALIDATION_ERROR"
 *                     message:
 *                       type: string
 *                       example: "Validation failed"
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           field:
 *                             type: string
 *                             example: "domain"
 *                           message:
 *                             type: string
 *                             example: "Domain must be lowercase and contain only alphanumeric characters and hyphens"
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "FORBIDDEN"
 *                     message:
 *                       type: string
 *                       example: "Only platform administrators can create companies"
 *       409:
 *         description: Conflict - Domain already exists for this platform
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "DOMAIN_EXISTS"
 *                     message:
 *                       type: string
 *                       example: "Company domain already exists for this platform"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - BearerAuth: []
 */
