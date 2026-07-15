const router      = require('express').Router();
const ctrl        = require('./government.controller');
const authenticate = require('../../middleware/authenticate');
const authorize    = require('../../middleware/authorize');
const upload       = require('../../middleware/upload');

const docUpload = upload.imageUpload.array('documents', 5);

// Exporter routes
router.post('/apply',   authenticate, authorize('exporter'), docUpload, ctrl.apply);
router.get('/my',       authenticate, authorize('exporter', 'buyer'), ctrl.getMyRequests);
router.get('/:id',      authenticate, ctrl.getById);

// Admin routes
router.get('/all',            authenticate, authorize('admin'), ctrl.getAllRequests);
router.patch('/:id/status',   authenticate, authorize('admin'), ctrl.updateStatus);

module.exports = router;