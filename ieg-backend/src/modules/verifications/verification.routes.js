const router = require('express').Router();
const ctrl = require('./verification.controller');
const authenticate = require('../../middleware/authenticate');
const authorize    = require('../../middleware/authorize');

router.use(authenticate);
/**
 * @swagger
 * /verifications/my:
 *   get:
 *     summary: Get my verification status
 *     description: Returns the verification status of the authenticated user.
 *     tags: [Verifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification status retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/my',            ctrl.getMyStatus);
/**
 * @swagger
 * /verifications/submit:
 *   post:
 *     summary: Submit verification request
 *     description: Submit a new account verification request.
 *     tags: [Verifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Verification request submitted successfully
 *       400:
 *         description: Invalid request
 */
router.post('/submit',       ctrl.submit);
/**
 * @swagger
 * /verifications:
 *   get:
 *     summary: Get all verification requests
 *     description: Returns all submitted verification requests.
 *     tags: [Verifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification requests retrieved successfully
 *       403:
 *         description: Admin access only
 */
router.get('/',              authorize('admin'), ctrl.getAll);
/**
 * @swagger
 * /verifications/{id}/review:
 *   patch:
 *     summary: Review verification request
 *     description: Approve or reject a verification request.
 *     tags: [Verifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Verification request reviewed successfully
 *       403:
 *         description: Admin access only
 *       404:
 *         description: Verification request not found
 */
router.patch('/:id/review',  authorize('admin'), ctrl.review);

module.exports = router;
