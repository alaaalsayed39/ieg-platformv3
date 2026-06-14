const router = require('express').Router();
const service = require('./recommendation.service');
const ApiResponse = require('../../utils/ApiResponse');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

router.get('/products', authenticate, authorize('buyer'), async (req, res) => {
  const data = await service.getRecommendations(req.user);
  ApiResponse.success(res, data);
});

module.exports = router;
