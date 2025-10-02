const express = require('express');
const router = express.Router();
const { 
  googleAuth, 
  updateBusinessInfo, 
  getUserByGoogleSub 
} = require('../controllers/googleAuthController');

/**
 * @swagger
 * /api/google/auth:
 *   post:
 *     summary: Authenticate user with Google ID token
 *     tags: [Google Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token from client
 *     responses:
 *       200:
 *         description: User authenticated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: string
 *                   enum: [new, existing]
 *                 user:
 *                   type: object
 *                 message:
 *                   type: string
 *       201:
 *         description: New user created successfully
 *       400:
 *         description: Missing idToken
 *       401:
 *         description: Authentication failed
 */
router.post('/auth', googleAuth);

/**
 * @swagger
 * /api/google/user/business:
 *   post:
 *     summary: Update user business information
 *     tags: [Google Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - googleSub
 *               - businessName
 *               - ownerName
 *               - businessNumber
 *               - address
 *               - city
 *               - zip
 *               - phone
 *             properties:
 *               googleSub:
 *                 type: string
 *               businessName:
 *                 type: string
 *               ownerName:
 *                 type: string
 *               businessNumber:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               zip:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Business information updated successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/user/business', updateBusinessInfo);

/**
 * @swagger
 * /api/google/user/{googleSub}:
 *   get:
 *     summary: Get user by Google Sub ID
 *     tags: [Google Auth]
 *     parameters:
 *       - in: path
 *         name: googleSub
 *         required: true
 *         schema:
 *           type: string
 *         description: Google Sub ID
 *     responses:
 *       200:
 *         description: User found successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/user/:googleSub', getUserByGoogleSub);

module.exports = router;
