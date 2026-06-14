const router = require('express').Router();
const ctrl = require('./document.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const upload = require('../../middleware/upload');

router.use(authenticate);

// Static routes first
router.get('/my', ctrl.getMyDocs);
router.get('/stats', ctrl.getStats);
router.get('/pending', authorize('admin'), ctrl.getPending);
router.get('/admin/all', authorize('admin'), ctrl.adminGetAll);
router.get('/admin/stats', authorize('admin'), ctrl.adminStats);
router.post('/upload', upload.single('file'), ctrl.upload);
router.get('/:id/view', ctrl.view);
router.get('/:id/download', ctrl.download);
router.get('/:id', ctrl.getById);

// Admin review actions (before generic :id routes if needed)
router.patch('/:id/approve', authorize('admin'), ctrl.approve);
router.patch('/:id/reject', authorize('admin'), ctrl.reject);
router.patch('/:id/review', authorize('admin'), ctrl.review);

router.delete('/:id', ctrl.remove);

module.exports = router;
