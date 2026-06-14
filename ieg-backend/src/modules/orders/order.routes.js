const router = require('express').Router();
const ctrl   = require('./order.controller');
const authenticate = require('../../middleware/authenticate');
const authorize    = require('../../middleware/authorize');

router.use(authenticate);

// Static routes first — prevent being caught by /:id
router.get('/stats',        ctrl.getStats);
router.get('/quotes/list',  authorize('buyer','exporter'), ctrl.getQuotes);

// Orders CRUD
router.get('/',             ctrl.getOrders);
router.get('/:id',          ctrl.getOrder);
router.post('/',            authorize('buyer'), ctrl.createOrder);
router.patch('/:id/confirm-delivery', authorize('buyer'), ctrl.confirmDelivery);
router.patch('/:id/status', authorize('admin','exporter','shipper','buyer'), ctrl.updateStatus);

// Quote Requests
router.post('/quotes',              authorize('buyer'), ctrl.createQuote);
router.patch('/quotes/:id/respond', authorize('exporter'), ctrl.respondToQuote);

module.exports = router;
