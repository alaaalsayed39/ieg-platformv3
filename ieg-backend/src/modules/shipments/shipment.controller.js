const service = require('./shipment.service');
const ApiResponse = require('../../utils/ApiResponse');

const create = async (req, res) => {
  const s = await service.createShipment(req.user._id, req.body);
  ApiResponse.created(res, s, 'Shipment created');
};

const getAvailableOrders = async (req, res) => {
  const result = await service.getAvailableOrders();
  ApiResponse.success(res, result);
};

const getShipments = async (req, res) => {
  const { data, total, page, limit } = await service.getShipments(req.user, req.query);
  ApiResponse.paginated(res, data, total, page, limit);
};

const getStats = async (req, res) => {
  const stats = await service.getStats(req.user);
  ApiResponse.success(res, stats);
};

const getShipment = async (req, res) => {
  const s = await service.getShipment(req.user, req.params.id);
  ApiResponse.success(res, s);
};

const getShipmentByOrder = async (req, res) => {
  const s = await service.getShipmentByOrder(req.user, req.params.orderId);
  ApiResponse.success(res, s);
};

const updateStatus = async (req, res) => {
  const s = await service.updateStatus(req.user._id, req.params.id, req.body);
  ApiResponse.success(res, s, 'Shipment status updated');
};

const updateLocation = async (req, res) => {
  const s = await service.updateLocation(req.user._id, req.params.id, req.body);
  ApiResponse.success(res, s, 'Location updated');
};

const exportReport = async (req, res) => {
  const { csv, filename } = await service.exportReport(req.user);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
};

const exportReportPdf = async (req, res) => {
  const { pdf, filename } = await service.exportReportPdf(req.user);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(pdf);
};

module.exports = {
  create,
  getAvailableOrders,
  getShipments,
  getStats,
  getShipment,
  getShipmentByOrder,
  updateStatus,
  updateLocation,
  exportReport,
  exportReportPdf,
};
