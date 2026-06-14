/**
 * Standardized API response wrapper
 * All responses follow: { success, message, data, pagination? }
 */
class ApiResponse {
  static success(res, data = null, message = 'Success', statusCode = 200, pagination = null) {
    const response = { success: true, message };
    if (data !== null) response.data = data;
    if (pagination) response.pagination = pagination;
    return res.status(statusCode).json(response);
  }

  static created(res, data = null, message = 'Created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }

  static noContent(res) {
    return res.status(204).send();
  }

  static paginated(res, data, total, page, limit, message = 'Fetched successfully') {
    const pages = Math.ceil(total / limit);
    const pagination = { page: Number(page), limit: Number(limit), total, pages };
    return ApiResponse.success(res, data, message, 200, pagination);
  }
}

module.exports = ApiResponse;
