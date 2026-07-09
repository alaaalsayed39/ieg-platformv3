const router = require('express').Router();
const ctrl = require('./shippingRequest.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

router.use(authenticate);
/**
 * @swagger
 * /shipping-requests/eligible-orders:
 *   get:
 *     summary: Get eligible orders for shipping requests
 *     description: Returns exporter orders that are eligible to create a shipping request.
 *     tags: [Shipping Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Eligible orders retrieved successfully
 *       403:
 *         description: Exporter access only
 */
router.get('/eligible-orders', authorize('exporter'), ctrl.eligibleOrders);
/**
 * @swagger
 * /shipping-requests:
 *   get:
 *     summary: Get all shipping requests
 *     description: Returns shipping requests available to the authenticated user.
 *     tags: [Shipping Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shipping requests retrieved successfully
 */
router.get('/', ctrl.list);
/**
 * @swagger
 * /shipping-requests:
 *   post:
 *     summary: Create a shipping request
 *     description: Creates a new shipping request for an eligible order.
 *     tags: [Shipping Requests]
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
 *         description: Shipping request created successfully
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Exporter access only
 */
router.post('/', authorize('exporter'), ctrl.create);
/**
 * @swagger
 * /shipping-requests/{id}/review:
 *   patch:
 *     summary: Review a shipping request
 *     description: Allows a shipper to approve or reject a shipping request.
 *     tags: [Shipping Requests]
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
 *         description: Shipping request reviewed successfully
 *       403:
 *         description: Shipper access only
 *       404:
 *         description: Shipping request not found
 */
router.patch('/:id/review', authorize('shipper'), ctrl.review);

module.exports = router;
