const router = require('express').Router();
const service = require('./recommendation.service');
const ApiResponse = require('../../utils/ApiResponse');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

/**
 * @swagger
 * /recommendations/products:
 *   get:
 *     summary: Get personalized product recommendations
 *     description: Returns recommended products for the authenticated buyer based on preferences and activity.
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommendations retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied (Buyer only)
 */

router.get('/products', authenticate, authorize('buyer'), async (req, res) => {
  const data = await service.getRecommendations(req.user);
  ApiResponse.success(res, data);
});

module.exports = router;
