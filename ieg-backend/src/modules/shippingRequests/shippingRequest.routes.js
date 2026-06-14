const router = require('express').Router();
const ctrl = require('./shippingRequest.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

router.use(authenticate);

router.get('/eligible-orders', authorize('exporter'), ctrl.eligibleOrders);
router.get('/', ctrl.list);
router.post('/', authorize('exporter'), ctrl.create);
router.patch('/:id/review', authorize('shipper'), ctrl.review);

module.exports = router;
