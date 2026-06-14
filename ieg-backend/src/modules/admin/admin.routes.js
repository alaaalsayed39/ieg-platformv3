const router = require('express').Router();
const ctrl = require('./admin.controller');
const chatCtrl = require('./adminChat.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

router.use(authenticate, authorize('admin'));
router.get('/dashboard',    ctrl.getDashboard);
router.get('/users',        ctrl.getUsers);
router.get('/users/:id',    ctrl.getUser);
router.patch('/users/:id',  ctrl.updateUserStatus);
router.delete('/users/:id', ctrl.deleteUser);
router.get('/reports',      ctrl.getReports);
router.get('/settings',     ctrl.getSettings);

// Chat administration & moderation
router.get('/chat/settings',        chatCtrl.getChatSettings);
router.put('/chat/settings',        chatCtrl.updateChatSettings);
router.get('/chat/logs',            chatCtrl.getChatLogs);
router.get('/chat/blocked-logs',    chatCtrl.getBlockedLogs);
router.patch('/chat/users/:id/suspend', chatCtrl.toggleUserChatSuspension);

module.exports = router;
