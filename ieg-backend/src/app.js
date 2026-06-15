require('express-async-errors');
require('dotenv').config();

const allowedOrigins = [
  'http://localhost:5173',
  'https://ieg-frontend.vercel.app'
];

const express  = require('express');
const path     = require('path');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const cookieParser = require('cookie-parser');
const compression  = require('compression');
const mongoSanitize = require('express-mongo-sanitize');

// Initialise Cloudinary immediately at startup so credentials are validated
// before any upload request arrives. Must come after dotenv.config().
require('./config/cloudinary');

const { globalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Route imports
const authRoutes         = require('./modules/auth/auth.routes');
const userRoutes         = require('./modules/users/user.routes');
const productRoutes      = require('./modules/products/product.routes');
const orderRoutes        = require('./modules/orders/order.routes');
const shipmentRoutes     = require('./modules/shipments/shipment.routes');
const shippingRequestRoutes = require('./modules/shippingRequests/shippingRequest.routes');
const recommendationRoutes = require('./modules/recommendations/recommendation.routes');
const paymentRoutes      = require('./modules/payments/payment.routes');
const documentRoutes     = require('./modules/documents/document.routes');
const adminRoutes        = require('./modules/admin/admin.routes');
const notificationRoutes = require('./modules/notifications/notification.routes');
const verificationRoutes = require('./modules/verifications/verification.routes');
const publicRoutes       = require('./modules/public/public.routes');
const messageRoutes      = require('./modules/messages/message.routes');

const app = express();

// Trust the first proxy (e.g. Railway, Heroku, Render, Cloudflare, etc.)
// Required for express-rate-limit to work correctly behind load balancers/reverse proxies
app.set('trust proxy', 1);

// ── Security Middleware ────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  // origin: process.env.CLIENT_URL || 'http://localhost:5173',
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(mongoSanitize());   // prevent NoSQL injection
app.use(compression());

// ── Request Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Logging ────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
    skip: (req) => req.url === '/health',
  }));
}

// ── Static uploads ─────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Rate Limiting ──────────────────────────────────────────────────────────────
app.use('/api', globalLimiter);

// ── Health Check ───────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const mongoose = require('mongoose');
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
  let collections = {};
  if (dbState === 1) {
    try {
      const names = await mongoose.connection.db.listCollections().toArray();
      for (const c of names) {
        collections[c.name] = await mongoose.connection.db.collection(c.name).countDocuments();
      }
    } catch (_) { /* ignore during startup */ }
  }
  res.json({
    success: true,
    service: 'IEG Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus,
      name: mongoose.connection.name,
      host: mongoose.connection.host,
      provider: (process.env.MONGO_URI || '').includes('mongodb+srv') ? 'atlas' : 'local',
      collections,
    },
  });
});

// ── API Routes ─────────────────────────────────────────────────────────────────
const API = '/api/v1';
app.use(`${API}/auth`,          authRoutes);
app.use(`${API}/users`,         userRoutes);
app.use(`${API}/products`,      productRoutes);
app.use(`${API}/orders`,        orderRoutes);
app.use(`${API}/shipments`,     shipmentRoutes);
app.use(`${API}/shipping-requests`, shippingRequestRoutes);
app.use(`${API}/recommendations`, recommendationRoutes);
app.use(`${API}/payments`,      paymentRoutes);
app.use(`${API}/documents`,     documentRoutes);
app.use(`${API}/admin`,         adminRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/verifications`, verificationRoutes);
app.use(`${API}/public`,        publicRoutes);
app.use(`${API}/messages`,      messageRoutes);

// ── 404 Handler ────────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ── Global Error Handler ───────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
