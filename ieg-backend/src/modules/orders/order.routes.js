const router = require('express').Router();
const ctrl   = require('./order.controller');
const authenticate = require('../../middleware/authenticate');
const authorize    = require('../../middleware/authorize');

router.use(authenticate);

// Static routes first — prevent being caught by /:id

/**
 * @swagger
 * /orders/stats:
 *   get:
 *     summary: Get order statistics
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order statistics
 */

router.get('/stats',        ctrl.getStats);
/**
 * @swagger
 * /orders/quotes/list:
 *   get:
 *     summary: Get all quote requests
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of quote requests
 */
router.get('/quotes/list',  authorize('buyer','exporter'), ctrl.getQuotes);

// Orders CRUD

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */
router.get('/',             ctrl.getOrders);
/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order details
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details
 */
router.get('/:id',          ctrl.getOrder);
/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Order created successfully
 */
router.post('/',            authorize('buyer'), ctrl.createOrder);
/**
 * @swagger
 * /orders/{id}/confirm-delivery:
 *   patch:
 *     summary: Confirm order delivery
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Delivery confirmed
 */
router.patch('/:id/confirm-delivery', authorize('buyer'), ctrl.confirmDelivery);
/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order status updated
 */
router.patch('/:id/status', authorize('admin','exporter','shipper','buyer'), ctrl.updateStatus);

// Quote Requests
/**
 * @swagger
 * /orders/quotes:
 *   post:
 *     summary: Create a quote request
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Quote request created successfully
 */
router.post('/quotes',              authorize('buyer'), ctrl.createQuote);
/**
 * @swagger
 * /orders/quotes/{id}/respond:
 *   patch:
 *     summary: Respond to a quote request
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quote response submitted
 */
router.patch('/quotes/:id/respond', authorize('exporter'), ctrl.respondToQuote);

module.exports = router;
