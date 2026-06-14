const router = require('express').Router();
const ctrl = require('./notification.controller');
const authenticate = require('../../middleware/authenticate');

router.use(authenticate);
router.get('/',              ctrl.getAll);
router.patch('/read-all',    ctrl.markAllRead);   // must be BEFORE /:id
router.patch('/:id/read',    ctrl.markRead);

module.exports = router;
