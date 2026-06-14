/**
 * transaction.model.js
 *
 * Previously this file registered a SECOND "Transaction" Mongoose model,
 * which caused a "Cannot overwrite `Transaction` model once compiled" conflict
 * with wallet.model.js (which is the canonical Transaction model used by all
 * active services).
 *
 * Fix: This file now simply re-exports the canonical model from wallet.model.js.
 * Dead modules that import this file (payments.service.js, orders.service.js)
 * will receive the correct model without any conflict.
 */

const Transaction = require('./wallet.model');
module.exports = Transaction;
