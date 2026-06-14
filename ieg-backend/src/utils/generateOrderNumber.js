/**
 * Generates a unique, human-readable order number.
 * Format: OR-YYYY-XXXXX
 */
const generateOrderNumber = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `OR-${year}-${rand}`;
};

const generateContainerNumber = () => {
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `CON-${rand}`;
};

module.exports = { generateOrderNumber, generateContainerNumber };
