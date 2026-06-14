const router = require('express').Router();
const ctrl   = require('./payment.controller');
const authenticate = require('../../middleware/authenticate');
const authorize    = require('../../middleware/authorize');

router.use(authenticate);

router.get('/wallet',              ctrl.getWallet);
router.get('/transactions',        ctrl.getTransactions);
router.get('/stats',               ctrl.getStats);
router.post('/deposit',            ctrl.deposit);
router.post('/withdraw',           ctrl.withdraw);
router.post('/pay/:orderId',       authorize('buyer'), ctrl.payForOrder);

module.exports = router;
