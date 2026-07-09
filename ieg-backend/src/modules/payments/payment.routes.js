const router = require('express').Router();
const ctrl   = require('./payment.controller');
const authenticate = require('../../middleware/authenticate');
const authorize    = require('../../middleware/authorize');

router.use(authenticate);

/**
 * @swagger
 * /payments/wallet:
 *   get:
 *     summary: Get user wallet
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet retrieved successfully
 */

router.get('/wallet',              ctrl.getWallet);
/**
 * @swagger
 * /payments/transactions:
 *   get:
 *     summary: Get wallet transactions
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 */
router.get('/transactions',        ctrl.getTransactions);
/**
 * @swagger
 * /payments/stats:
 *   get:
 *     summary: Get payment statistics
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment statistics
 */
router.get('/stats',               ctrl.getStats);
/**
 * @swagger
 * /payments/deposit:
 *   post:
 *     summary: Deposit money into wallet
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deposit completed successfully
 */
router.post('/deposit',            ctrl.deposit);
/**
 * @swagger
 * /payments/withdraw:
 *   post:
 *     summary: Withdraw money from wallet
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Withdrawal completed successfully
 */
router.post('/withdraw',           ctrl.withdraw);
/**
 * @swagger
 * /payments/pay/{orderId}:
 *   post:
 *     summary: Pay for an order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment completed successfully
 */
router.post('/pay/:orderId',       authorize('buyer'), ctrl.payForOrder);

module.exports = router;
