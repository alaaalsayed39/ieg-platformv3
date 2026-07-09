const router = require('express').Router();
const ctrl = require('./admin.controller');
const chatCtrl = require('./adminChat.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

router.use(authenticate, authorize('admin'));
/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 */
router.get('/dashboard',    ctrl.getDashboard);
/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/users',        ctrl.getUsers);
/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: Get user details
 *     tags: [Admin]
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
 *         description: User details
 */
router.get('/users/:id',    ctrl.getUser);
/**
 * @swagger
 * /admin/users/{id}:
 *   patch:
 *     summary: Update user status
 *     tags: [Admin]
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
 *         description: User status updated
 */
router.patch('/users/:id',  ctrl.updateUserStatus);
/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: User deleted successfully
 */
router.delete('/users/:id', ctrl.deleteUser);
/**
 * @swagger
 * /admin/reports:
 *   get:
 *     summary: Get reports
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reports retrieved
 */
router.get('/reports',      ctrl.getReports);
/**
 * @swagger
 * /admin/settings:
 *   get:
 *     summary: Get system settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved
 */
router.get('/settings',     ctrl.getSettings);

// Chat administration & moderation

/**
 * @swagger
 * /admin/chat/settings:
 *   get:
 *     summary: Get chat settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat settings
 */

router.get('/chat/settings',        chatCtrl.getChatSettings);
/**
 * @swagger
 * /admin/chat/settings:
 *   put:
 *     summary: Update chat settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat settings updated
 */
router.put('/chat/settings',        chatCtrl.updateChatSettings);
/**
 * @swagger
 * /admin/chat/logs:
 *   get:
 *     summary: Get chat logs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat logs
 */
router.get('/chat/logs',            chatCtrl.getChatLogs);
/**
 * @swagger
 * /admin/chat/blocked-logs:
 *   get:
 *     summary: Get blocked chat logs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Blocked messages logs
 */
router.get('/chat/blocked-logs',    chatCtrl.getBlockedLogs);
/**
 * @swagger
 * /admin/chat/users/{id}/suspend:
 *   patch:
 *     summary: Suspend or unsuspend user chat
 *     tags: [Admin]
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
 *         description: User chat status updated
 */
router.patch('/chat/users/:id/suspend', chatCtrl.toggleUserChatSuspension);

module.exports = router;
