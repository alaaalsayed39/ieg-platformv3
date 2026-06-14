const Product = require('../products/product.model');
const ApiError = require('../../utils/ApiError');

/** Country → high-demand export categories (rule-based, no external AI) */
const COUNTRY_DEMAND = {
  US: ['Agriculture', 'Textiles', 'Food & Beverage'],
  GB: ['Textiles', 'Handicrafts', 'Food & Beverage'],
  DE: ['Machinery', 'Chemicals', 'Marble'],
  FR: ['Agriculture', 'Food & Beverage', 'Textiles'],
  NL: ['Agriculture', 'Chemicals', 'Machinery'],
  AE: ['Marble', 'Handicrafts', 'Furniture'],
  CN: ['Agriculture', 'Chemicals', 'Textiles'],
  SG: ['Food & Beverage', 'Electronics', 'Chemicals'],
  SA: ['Food & Beverage', 'Agriculture', 'Textiles'],
  IT: ['Marble', 'Agriculture', 'Handicrafts'],
  ES: ['Agriculture', 'Food & Beverage', 'Textiles'],
  CA: ['Agriculture', 'Textiles', 'Machinery'],
  AU: ['Food & Beverage', 'Agriculture', 'Textiles'],
  JP: ['Textiles', 'Handicrafts', 'Electronics'],
  IN: ['Chemicals', 'Machinery', 'Agriculture'],
};

const DEFAULT_CATEGORIES = ['Agriculture', 'Textiles', 'Food & Beverage', 'Handicrafts'];

const getRecommendations = async (buyer) => {
  const country = (buyer.country || 'US').toUpperCase();
  const countryKey = country.length === 2 ? country : country.slice(0, 2);
  const preferredCategories = COUNTRY_DEMAND[countryKey] || COUNTRY_DEMAND[country] || DEFAULT_CATEGORIES;

  const products = await Product.find({ status: 'published' })
    .populate('exporterId', 'fullName companyName country isVerified')
    .sort({ rating: -1, createdAt: -1 })
    .limit(50)
    .lean();

  const scored = products.map((p) => {
    let score = 0;
    const reasons = [];

    if (preferredCategories.includes(p.category)) {
      score += 40;
      reasons.push(`High demand for ${p.category} in ${country}`);
    }

    if (p.isVerifiedExporter || p.exporterId?.isVerified) {
      score += 15;
      reasons.push('Verified exporter');
    }

    if (p.rating >= 4) {
      score += 10;
      reasons.push('Top-rated product');
    }

    if (p.inventory?.quantity > (p.moq || 1) * 2) {
      score += 5;
      reasons.push('Strong inventory availability');
    }

    // Country gap: categories underrepresented in current marketplace slice
    const categoryCount = products.filter((x) => x.category === p.category).length;
    if (categoryCount <= 2 && preferredCategories.includes(p.category)) {
      score += 10;
      reasons.push('Emerging category opportunity');
    }

    return { ...p, recommendationScore: score, recommendationReasons: reasons };
  });

  const ranked = scored
    .filter((p) => p.recommendationScore > 0)
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, 8);

  const fallback = products.slice(0, 4).map((p) => ({
    ...p,
    recommendationScore: 1,
    recommendationReasons: ['Popular in marketplace'],
  }));

  return {
    buyerCountry: country,
    preferredCategories,
    products: ranked.length ? ranked : fallback,
    insight: ranked.length
      ? `Based on import demand patterns for ${country}, we prioritized ${preferredCategories.slice(0, 3).join(', ')}.`
      : 'Browse our full marketplace for Egyptian export products.',
  };
};

module.exports = { getRecommendations };
