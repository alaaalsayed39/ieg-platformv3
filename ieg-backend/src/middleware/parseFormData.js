/** Convert bracket keys like pricing[pricePerUnit] to nested objects */
const bracketToNested = (body) => {
  const result = { ...body };
  Object.keys(body).forEach((key) => {
    const match = key.match(/^(\w+)\[(\w+)\]$/);
    if (match) {
      const [, parent, child] = match;
      if (!result[parent] || typeof result[parent] !== 'object') result[parent] = {};
      result[parent][child] = body[key];
      delete result[key];
    }
    const arrMatch = key.match(/^(\w+)\[(\d+)\]\[(\w+)\]$/);
    if (arrMatch) {
      const [, parent, idx, child] = arrMatch;
      if (!result[parent]) result[parent] = [];
      if (!result[parent][idx]) result[parent][idx] = {};
      result[parent][idx][child] = body[key];
      delete result[key];
    }
  });
  return result;
};

/**
 * Coerce FormData string values to numbers/booleans for Joi validation.
 */
const parseFormData = (req, res, next) => {
  if (!req.body || typeof req.body !== 'object') return next();

  req.body = bracketToNested(req.body);

  const numericKeys = /^(moq|quantity|pricePerUnit|length|width|height|weight|minQty|maxQty)$/;

  const coerce = (obj) => {
    Object.keys(obj).forEach((key) => {
      const val = obj[key];
      if (val === '' || val === null) {
        delete obj[key];
        return;
      }
      if (val === 'true') obj[key] = true;
      else if (val === 'false') obj[key] = false;
      else if (typeof val === 'string' && val !== '' && !isNaN(val) && (numericKeys.test(key) || key.includes('price') || key.includes('Qty') || key.includes('quantity'))) {
        obj[key] = Number(val);
      } else if (typeof val === 'object' && val !== null) {
        coerce(val);
      }
    });
  };

  coerce(req.body);
  next();
};

module.exports = parseFormData;
