const service = require('./product.service');
const ApiResponse = require('../../utils/ApiResponse');

const create = async (req, res) => {
  const product = await service.create(req.user._id, req.body, req.user.isVerified, req.files || []);
  ApiResponse.created(res, product, 'Product created');
};

const getMarketplace = async (req, res) => {
  const { data, total, page, limit } = await service.getMarketplace(req.query);
  ApiResponse.paginated(res, data, total, page, limit, 'Products fetched');
};

const getById = async (req, res) => {
  const product = await service.getById(req.params.id);
  ApiResponse.success(res, product, 'Product fetched');
};

const getMyProducts = async (req, res) => {
  const { data, total, page, limit } = await service.getMyProducts(req.user._id, req.query);
  ApiResponse.paginated(res, data, total, page, limit, 'Your products fetched');
};

const update = async (req, res) => {
  const product = await service.update(req.params.id, req.user._id, req.body, req.files || []);
  ApiResponse.success(res, product, 'Product updated');
};

const updateStatus = async (req, res) => {
  const product = await service.updateStatus(req.params.id, req.user._id, req.user.role, req.body.status);
  ApiResponse.success(res, product, 'Product status updated');
};

const getMeta = async (req, res) => {
  ApiResponse.success(res, {
    categories: ['Agriculture','Textiles','Chemicals','Marble','Handicrafts','Electronics','Food & Beverage','Machinery','Furniture','Other'],
    certifications: ['ISO','Organic','Halal','OEKO-TEX','Custom'],
    statuses: ['published','draft','inactive','pending_review'],
  });
};

const remove = async (req, res) => {
  await service.remove(req.params.id, req.user._id);
  ApiResponse.noContent(res);
};

const adminGetAll = async (req, res) => {
  const { data, total, page, limit } = await service.adminGetAll(req.query);
  ApiResponse.paginated(res, data, total, page, limit);
};

module.exports = { create, getMarketplace, getById, getMyProducts, update, updateStatus, remove, adminGetAll, getMeta };
