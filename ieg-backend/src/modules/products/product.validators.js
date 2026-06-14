const Joi = require('joi');

const tieredPricingItem = Joi.object({
  minQty:       Joi.number().min(1).required(),
  maxQty:       Joi.number().min(1).allow(null),
  pricePerUnit: Joi.number().min(0).required(),
});

const createProductSchema = Joi.object({
  nameEn:      Joi.string().min(2).max(200).required(),
  nameAr:      Joi.string().max(200).allow('', null),
  category:    Joi.string().valid(
    'Agriculture','Textiles','Chemicals','Marble','Handicrafts',
    'Electronics','Food & Beverage','Machinery','Furniture','Other'
  ).required(),
  description: Joi.string().max(5000).allow('', null),
  pricing: Joi.object({
    pricePerUnit:  Joi.number().min(0).required(),
    currency:      Joi.string().default('USD'),
    unit:          Joi.string().required(),
    tieredPricing: Joi.array().items(tieredPricingItem).default([]),
  }).required(),
  moq:       Joi.number().min(1).default(1),
  inventory: Joi.object({
    quantity: Joi.number().min(0).default(0),
    unit:     Joi.string().allow('', null),
  }).default({}),
  shipping: Joi.object({
    length: Joi.number().allow(null).empty(''),
    width:  Joi.number().allow(null).empty(''),
    height: Joi.number().allow(null).empty(''),
    weight: Joi.number().allow(null).empty(''),
  }).default({}),
  certifications: Joi.array().items(Joi.object({
    type: Joi.string().valid('ISO','Organic','Halal','OEKO-TEX','Custom'),
    name: Joi.string().allow('', null),
  })).default([]),
  specifications: Joi.object().pattern(Joi.string(), Joi.string()).default({}),
  tags:           Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string().allow('', null)
  ).default([]),
  countryOfOrigin:Joi.string().length(2).uppercase().default('EG'),
  status:         Joi.string().valid('published', 'draft', 'inactive', 'pending_review').default('draft'),
});

const updateProductSchema = createProductSchema.fork(
  ['nameEn', 'category', 'pricing'], (s) => s.optional()
);

module.exports = { createProductSchema, updateProductSchema };
