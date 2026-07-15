const service = require('./order.service');
const ApiResponse = require('../../utils/ApiResponse');
const Order = require('./order.model');
const ApiError = require('../../utils/ApiError');

const createOrder      = async (req, res) => { const o = await service.createOrder(req.user._id, req.body); ApiResponse.created(res, o, 'Order placed successfully'); };
const getOrders        = async (req, res) => { const { data, total, page, limit } = await service.getOrders(req.user, req.query); ApiResponse.paginated(res, data, total, page, limit); };
const getOrder         = async (req, res) => { const o = await service.getOrder(req.user, req.params.id); ApiResponse.success(res, o); };
const updateStatus     = async (req, res) => { const o = await service.updateStatus(req.user, req.params.id, req.body.status, req.body.note); ApiResponse.success(res, o, 'Order status updated'); };
const getStats         = async (req, res) => { const s = await service.getStats(req.user); ApiResponse.success(res, s); };
const createQuote      = async (req, res) => { const q = await service.createQuote(req.user._id, req.body); ApiResponse.created(res, q, 'Quote request sent'); };
const getQuotes        = async (req, res) => { const { data, total, page, limit } = await service.getQuotes(req.user, req.query); ApiResponse.paginated(res, data, total, page, limit); };
const respondToQuote   = async (req, res) => { const q = await service.respondToQuote(req.user._id, req.params.id, req.body); ApiResponse.success(res, q, 'Response sent'); };
const confirmDelivery  = async (req, res) => { const o = await service.confirmDelivery(req.user._id, req.params.id); ApiResponse.success(res, o, 'Delivery confirmed — escrow released'); };

const getInvoice = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('buyerId',    'fullName companyName email country')
    .populate('exporterId', 'fullName companyName email country')
    .populate('productId',  'nameEn category');

  if (!order) throw new ApiError(404, 'Order not found');

  // Check access — only buyer or exporter of this order
  const userId = req.user._id.toString();
  const isOwner =
    order.buyerId?._id.toString() === userId ||
    order.exporterId?._id.toString() === userId ||
    req.user.role === 'admin';
  if (!isOwner) throw new ApiError(403, 'Access denied');

  // Build simple HTML invoice
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <title>Invoice ${order.orderNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; color: #333; padding: 40px; }
        h1 { color: #F5A623; }
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #0B1437; color: white; padding: 10px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #eee; }
        .total { font-size: 1.2em; font-weight: bold; color: #F5A623; }
        .footer { margin-top: 40px; font-size: 0.8em; color: #999; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>IEG — International Export Gateway</h1>
          <p>Invoice #${order.orderNumber}</p>
          <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <div style="text-align:right">
          <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
          <p><strong>Payment:</strong> ${order.paymentStatus?.toUpperCase() || '—'}</p>
        </div>
      </div>

      <hr/>

      <div style="display:flex; gap:60px; margin: 20px 0;">
        <div>
          <p><strong>Buyer</strong></p>
          <p>${order.buyerId?.fullName || '—'}</p>
          <p>${order.buyerId?.companyName || ''}</p>
          <p>${order.buyerId?.email || ''}</p>
          <p>${order.buyerId?.country || ''}</p>
        </div>
        <div>
          <p><strong>Exporter</strong></p>
          <p>${order.exporterId?.fullName || '—'}</p>
          <p>${order.exporterId?.companyName || ''}</p>
          <p>${order.exporterId?.email || ''}</p>
          <p>${order.exporterId?.country || ''}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Quantity</th>
            <th>Unit</th>
            <th>Total Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${order.productName || '—'}</td>
            <td>${order.productId?.category || '—'}</td>
            <td>${order.quantity}</td>
            <td>${order.unit || '—'}</td>
            <td class="total">$${order.totalValueUsd?.toLocaleString() || '0'}</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top:20px; text-align:right">
        <p>Delivery Method: ${order.deliveryMethod || '—'}</p>
        <p>Insurance: ${order.insurance ? 'Yes' : 'No'}</p>
        <p class="total">Total: $${order.totalValueUsd?.toLocaleString() || '0'} USD</p>
      </div>

      <div class="footer">
        <p>Generated by IEG Platform — ${new Date().toISOString()}</p>
      </div>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Disposition', `attachment; filename="Invoice-${order.orderNumber}.html"`);
  res.send(html);
};

module.exports = { createOrder, getOrders, getOrder, updateStatus, getStats, createQuote, getQuotes, respondToQuote, confirmDelivery, getInvoice };