const router     = require('express').Router();
const controller = require('./support.controller');
const authenticate = require('../../middleware/authenticate');
const authorize    = require('../../middleware/authorize');

// ── User routes (exporter & buyer) ────────────────────────────────────────────
router.post(
  '/tickets',
  authenticate,
  authorize('exporter', 'buyer'),
  controller.createTicket
);

router.get(
  '/tickets/my',
  authenticate,
  authorize('exporter', 'buyer'),
  controller.getMyTickets
);

// ── Admin routes ───────────────────────────────────────────────────────────────
router.get(
  '/tickets',
  authenticate,
  authorize('admin'),
  controller.getAllTickets
);

router.get(
  '/tickets/:id',
  authenticate,
  authorize('admin'),
  controller.getTicketById
);

router.patch(
  '/tickets/:id/reply',
  authenticate,
  authorize('admin'),
  controller.replyToTicket
);

module.exports = router;