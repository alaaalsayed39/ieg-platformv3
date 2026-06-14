const router = require('express').Router();
const ctrl   = require('./shipment.controller');
const authenticate = require('../../middleware/authenticate');
const authorize    = require('../../middleware/authorize');

router.use(authenticate);

router.get('/export/report',              ctrl.exportReport);
router.get('/export/report/pdf',          ctrl.exportReportPdf);
router.get('/stats',                      ctrl.getStats);
router.get('/available-orders', authorize('shipper'), ctrl.getAvailableOrders);
router.get('/by-order/:orderId',          ctrl.getShipmentByOrder);
router.get('/',                           ctrl.getShipments);
router.get('/:id',                        ctrl.getShipment);
router.patch('/:id/status',  authorize('shipper'), ctrl.updateStatus);
router.patch('/:id/location',authorize('shipper'), ctrl.updateLocation);

module.exports = router;
