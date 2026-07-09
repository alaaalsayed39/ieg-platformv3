const router = require('express').Router();
const ctrl = require('./document.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const upload = require('../../middleware/upload');

router.use(authenticate);

// Static routes first

/**
 * @swagger
 * /documents/my:
 *   get:
 *     summary: Get my uploaded documents
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user documents
 */
router.get('/my', ctrl.getMyDocs);
/**
 * @swagger
 * /documents/stats:
 *   get:
 *     summary: Get document statistics
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Document statistics
 */
router.get('/stats', ctrl.getStats);
/**
 * @swagger
 * /documents/pending:
 *   get:
 *     summary: Get pending documents
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending documents
 */
router.get('/pending', authorize('admin'), ctrl.getPending);
/**
 * @swagger
 * /documents/admin/all:
 *   get:
 *     summary: Get all documents
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All documents
 */
router.get('/admin/all', authorize('admin'), ctrl.adminGetAll);
/**
 * @swagger
 * /documents/admin/stats:
 *   get:
 *     summary: Get documents statistics for admin
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin statistics
 */
router.get('/admin/stats', authorize('admin'), ctrl.adminStats);
/**
 * @swagger
 * /documents/upload:
 *   post:
 *     summary: Upload a new document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 */
router.post('/upload', upload.single('file'), ctrl.upload);
/**
 * @swagger
 * /documents/{id}/view:
 *   get:
 *     summary: View document
 *     tags: [Documents]
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
 *         description: Document preview
 */
router.get('/:id/view', ctrl.view);
/**
 * @swagger
 * /documents/{id}/download:
 *   get:
 *     summary: Download document
 *     tags: [Documents]
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
 *         description: Document downloaded successfully
 */
router.get('/:id/download', ctrl.download);
/**
 * @swagger
 * /documents/{id}:
 *   get:
 *     summary: Get document details
 *     tags: [Documents]
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
 *         description: Document details
 */
router.get('/:id', ctrl.getById);
/**
 * @swagger
 * /documents/{id}/approve:
 *   patch:
 *     summary: Approve document
 *     tags: [Documents]
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
 *         description: Document approved
 */
router.patch('/:id/approve', authorize('admin'), ctrl.approve);

/**
 * @swagger
 * /documents/{id}/reject:
 *   patch:
 *     summary: Reject document
 *     tags: [Documents]
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
 *         description: Document rejected
 */
router.patch('/:id/reject', authorize('admin'), ctrl.reject);
/**
 * @swagger
 * /documents/{id}/review:
 *   patch:
 *     summary: Review document
 *     tags: [Documents]
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
 *         description: Document reviewed
 */
router.patch('/:id/review', authorize('admin'), ctrl.review);
/**
 * @swagger
 * /documents/{id}:
 *   delete:
 *     summary: Delete document
 *     tags: [Documents]
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
 *         description: Document deleted
 */
router.delete('/:id', ctrl.remove);

module.exports = router;
