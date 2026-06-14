const router = require('express').Router();
const ctrl = require('./verification.controller');
const authenticate = require('../../middleware/authenticate');
const authorize    = require('../../middleware/authorize');

router.use(authenticate);
router.get('/my',            ctrl.getMyStatus);
router.post('/submit',       ctrl.submit);
router.get('/',              authorize('admin'), ctrl.getAll);
router.patch('/:id/review',  authorize('admin'), ctrl.review);

module.exports = router;
