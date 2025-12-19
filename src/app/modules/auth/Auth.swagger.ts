/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: API endpoints related to authentication
 */





// Login an user
/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login an user
 *     description: Logs in an user with email/contact number and password.
 *     tags: [Auth]
 *     parameters:
 *       - in: header
 *         name: x-platform-id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The platform ID
 *     requestBody:
 *       description: Email/Contact number and password must be required
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email_or_contact_number
 *               - password
 *             properties:
 *               email_or_contact_number:
 *                 type: string
 *                 description: The email or contact number of the user
 *                 example: user@example.com | 01511111111
 *               password:
 *                 type: string
 *                 description: The password of the user
 *                 example: password123
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: boolean
 *                    description: Indicates the success or failure of the operation
 *                  message:
 *                    type: string
 *                    description: A message indicating the result of the operation
 *                    example: User logged in successfully
 *                  data:
 *                    type: object
 *                    description: A JSON object representing the logged-in user.
 *                    properties:
 *                      id:
 *                        type: string
 *                        description: The unique ID of the user
 *                        example: 1656c6ccf-199c-454c-937b-f41c148f673b
 *                      name:
 *                        type: string
 *                        description: The name of the user
 *                        example: John Doe
 *                      email:
 *                        type: string
 *                        format: email
 *                        nullable: true
 *                        description: The email of the user
 *                        example: user@example.com
 *                      contact_number:
 *                        type: string
 *                        description: The contact number of the user
 *                        example: '01511111111'
 *                      role:
 *                        type: string
 *                        description: The role of the user
 *                        example: USER
 *                      profile_pic:
 *                        type: string
 *                        format: uri
 *                        nullable: true
 *                        description: The profile picture of the user
 *                        example: https://example.com/profile.jpg | null
 *                      access_token:
 *                        type: string
 *                        description: The access token used for authentication
 *                        example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjIzMzUxMzBkLWViMzctNDViZi1iNTIyLTg5YzUyZmZlMjUyMyIsImNvbnRhY3RfbnVtYm.vFlqGmeUJHS5hjAKqf88EhGcDE8hWktj5MbpLe6axnE
 *       400:
 *         description: If the request is invalid or missing required fields
 *       403:
 *         description: If the email/contact number or password is incorrect
 *       404:
 *         description: If the user is not exists
 */


