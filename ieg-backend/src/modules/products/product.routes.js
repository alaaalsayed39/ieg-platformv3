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
/**
 * @swagger
 * /products/my/products:
 *   get:
 *     summary: Get current exporter's products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 */
router.get('/my/products',  authenticate, authorize('exporter'), ctrl.getMyProducts);
/**
 * @swagger
 * /products/admin/all:
 *   get:
 *     summary: Get all products (Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All products retrieved
 */
router.get('/admin/all',    authenticate, authorize('admin'), ctrl.adminGetAll);

// Public routes

/**
 * @swagger
 * /products/admin/all:
 *   get:
 *     summary: Get all products (Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All products retrieved
 */

router.get('/meta/categories', ctrl.getMeta);
/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all published products
 *     description: Retrieve all published products available in the marketplace.
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of products per page
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search by product name or description
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price
 *     responses:
 *       200:
 *         description: Products fetched successfully
 */
router.get('/',         ctrl.getMarketplace);
/**
 * @swagger
 * /products/search:
 *   get:
 *     summary: Search marketplace products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search keyword
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search',   ctrl.getMarketplace);
/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product details
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 */
router.get('/:id',      ctrl.getById);

// Exporter protected routes
/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post('/',            authenticate, authorize('exporter'), imageUpload, parseFormData, validate(createProductSchema), ctrl.create);
/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
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
 *         description: Product updated successfully
 */
router.put('/:id',          authenticate, authorize('exporter'), imageUpload, parseFormData, validate(updateProductSchema), ctrl.update);
/**
 * @swagger
 * /products/{id}/status:
 *   patch:
 *     summary: Update product status
 *     tags: [Products]
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
 *         description: Product status updated
 */
router.patch('/:id/status', authenticate, authorize('exporter', 'admin'), ctrl.updateStatus);
/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
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
 *         description: Product deleted successfully
 */
router.delete('/:id',       authenticate, authorize('exporter'), ctrl.remove);

module.exports = router;
