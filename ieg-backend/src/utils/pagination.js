/**
 * Pagination utility.
 * Exports both the canonical getPagination used by active services,
 * and the paginate / paginationMeta aliases used by legacy (dead) modules
 * so that requiring them does not crash at startup.
 */

const getPagination = (query) => {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(100, parseInt(query.limit) || 10);
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
};

/** Alias for dead duplicate modules — same behaviour as getPagination */
const paginate = getPagination;

/**
 * Build a pagination meta object that matches the shape used by
 * the dead duplicate services' callers.
 */
const paginationMeta = (total, page, limit) => {
  const pages = Math.ceil(total / limit);
  return { total, page: Number(page), limit: Number(limit), pages };
};

module.exports = { getPagination, paginate, paginationMeta };
