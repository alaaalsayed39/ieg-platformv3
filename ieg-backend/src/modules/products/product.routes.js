const router = require('express').Router();
const ctrl   = require('./product.controller');
const authenticate = require('../../middleware/authenticate');
const authorize    = require('../../middleware/authorize');
const validate     = require('../../middleware/validate');
const parseFormData = require('../../middleware/parseFormData');
const upload       = require('../../middleware/upload');
const { createProductSchema, updateProductSchema } = require('./product.validators');

const imageUpload = upload.imageUpload.array('images', 10);

// Static public routes first
router.get('/my/products',  authenticate, authorize('exporter'), ctrl.getMyProducts);
router.get('/admin/all',    authenticate, authorize('admin'), ctrl.adminGetAll);

// Public routes
router.get('/meta/categories', ctrl.getMeta);
router.get('/',         ctrl.getMarketplace);
router.get('/search',   ctrl.getMarketplace);
router.get('/:id',      ctrl.getById);

// Exporter protected routes
router.post('/',            authenticate, authorize('exporter'), imageUpload, parseFormData, validate(createProductSchema), ctrl.create);
router.put('/:id',          authenticate, authorize('exporter'), imageUpload, parseFormData, validate(updateProductSchema), ctrl.update);
router.patch('/:id/status', authenticate, authorize('exporter', 'admin'), ctrl.updateStatus);
router.delete('/:id',       authenticate, authorize('exporter'), ctrl.remove);

module.exports = router;
