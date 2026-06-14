// src/utils/generators.js
// Utility generators for order numbers, container numbers, etc.

const generateOrderNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `ORD-${year}-${random}`;
};

const generateContainerNumber = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const prefix = Array.from({ length: 4 }, () =>
    letters[Math.floor(Math.random() * letters.length)]
  ).join('');
  const digits = Math.floor(Math.random() * 9000000) + 1000000;
  return `${prefix}${digits}`;
};

const generateResetToken = () => {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hashedToken };
};

module.exports = { generateOrderNumber, generateContainerNumber, generateResetToken };
