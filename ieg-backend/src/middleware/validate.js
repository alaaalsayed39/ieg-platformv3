const ApiError = require('../utils/ApiError');

const validate = (schema) => (req, res, next) => {
  // 💡 خطوة سحرية: تحويل نصوص الـ JSON القادمة من الـ FormData لكائنات حقيقية قبل الفحص
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach((key) => {
      const val = req.body[key];
      if (typeof val === 'string') {
        // لو النص يبدأ بـ [ أو { فغالباً هو كائن أو مصفوفة مبعوتة من FormData
        if (val.startsWith('{') || val.startsWith('[')) {
          try {
            req.body[key] = JSON.parse(val);
          } catch (e) {
            // تجاهل الخطأ لو النص عادي وليس JSON
          }
        }
      }
    });
  }

  // تنفيذ الفحص العادي بمكتبة Joi
  const { value, error } = schema.validate(req.body, {
    abortEarly: false, // عشان يجيب كل الأخطاء لو موجودة
    allowUnknown: true, // عشان يتغاضى عن أي حقول زيادة مش مسببة أزمة
    stripUnknown: false
  });

  if (error) {
    // طباعة تفاصيل الخطأ في الـ Terminal عندك عشان تشوف الحقل المسبب للأزمة بالظبط
    console.error("❌ Joi Validation Errors:", error.details.map(d => d.message));
    
    const errorMessage = error.details.map((detail) => detail.message).join(', ');
    return next(ApiError.badRequest(`Validation failed: ${errorMessage}`));
  }

  // Normalize tags from comma-separated string (FormData)
  if (typeof value.tags === 'string') {
    value.tags = value.tags.split(',').map((t) => t.trim()).filter(Boolean);
  }

  req.body = value;
  next();
};

module.exports = validate;