const router = require('express').Router();
const ctrl   = require('./shipment.controller');
const authenticate = require('../../middleware/authenticate');
const authorize    = require('../../middleware/authorize');

router.use(authenticate);
/**
 * @swagger
 * /shipments/export/report:
 *   get:
 *     summary: Export shipment report
 *     tags: [Shipments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shipment report exported successfully
 */
router.get('/export/report',              ctrl.exportReport);
/**
 * @swagger
 * /shipments/export/report/pdf:
 *   get:
 *     summary: Export shipment report as PDF
 *     tags: [Shipments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shipment report PDF generated successfully
 */
router.get('/export/report/pdf',          ctrl.exportReportPdf);
/**
 * @swagger
 * /shipments/stats:
 *   get:
 *     summary: Get shipment statistics
 *     tags: [Shipments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shipment statistics retrieved successfully
 */
router.get('/stats',                      ctrl.getStats);
/**
 * @swagger
 * /shipments/available-orders:
 *   get:
 *     summary: Get available orders for shipment
 *     tags: [Shipments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available orders retrieved successfully
 *       403:
 *         description: Shipper access only
 */
router.get('/available-orders', authorize('shipper'), ctrl.getAvailableOrders);
/**
 * @swagger
 * /shipments/by-order/{orderId}:
 *   get:
 *     summary: Get shipment by order ID
 *     tags: [Shipments]
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
 *         description: Shipment retrieved successfully
 */
router.get('/by-order/:orderId',          ctrl.getShipmentByOrder);
/**
 * @swagger
 * /shipments:
 *   get:
 *     summary: Get all shipments
 *     tags: [Shipments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shipments retrieved successfully
 */
router.get('/',                           ctrl.getShipments);
/**
 * @swagger
 * /shipments/{id}:
 *   get:
 *     summary: Get shipment details
 *     tags: [Shipments]
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
 *         description: Shipment details retrieved successfully
 */
router.get('/:id',                        ctrl.getShipment);
/**
 * @swagger
 * /shipments/{id}/status:
 *   patch:
 *     summary: Update shipment status
 *     tags: [Shipments]
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
 *         description: Shipment status updated successfully
 *       403:
 *         description: Shipper access only
 */
router.patch('/:id/status',  authorize('shipper'), ctrl.updateStatus);
/**
 * @swagger
 * /shipments/{id}/location:
 *   patch:
 *     summary: Update shipment location
 *     tags: [Shipments]
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
 *         description: Shipment location updated successfully
 *       403:
 *         description: Shipper access only
 */
router.patch('/:id/location',authorize('shipper'), ctrl.updateLocation);

module.exports = router;
