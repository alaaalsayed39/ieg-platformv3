# 🌍 IEG Backend — International Export Gateway API

> Production-grade Node.js + Express + MongoDB backend for a multi-sided B2B export-tech platform.

---

## 🏗️ Architecture Overview

```
src/
├── config/          # DB connection, JWT config
├── middleware/       # Auth, authorize, validate, error handler, rate limiter, upload
├── modules/          # Feature modules (auth, products, orders, shipments, payments, documents, admin, ...)
│   ├── auth/         # register, login, refresh, logout, forgot/reset password
│   ├── users/        # profile, stats
│   ├── products/     # marketplace, CRUD, search
│   ├── orders/       # order lifecycle, quote requests
│   ├── shipments/    # tracking, stage updates, GPS
│   ├── payments/     # wallet, transactions, escrow
│   ├── documents/    # export documents, review workflow
│   ├── admin/        # dashboard, user management, reports
│   ├── notifications/# in-app notifications
│   ├── messages/     # B2B chat (REST + WebSocket)
│   └── verifications/# KYB document review
├── sockets/          # Socket.io real-time engine
├── utils/            # ApiResponse, ApiError, asyncHandler, logger, email, pagination
└── seed/             # Complete demo dataset
```

---

## ⚡ Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
```

### 3. Seed the database
```bash
npm run seed
```

### 4. Start the server
```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server runs on **http://localhost:5000**

---

## 🔐 Test Credentials (after seeding)

| Role     | Email                  | Password      |
|----------|------------------------|---------------|
| Admin    | admin@ieg.com          | Admin@1234    |
| Exporter | exporter1@ieg.com      | Export@1234   |
| Exporter | exporter2@ieg.com      | Export@1234   |
| Buyer    | buyer1@ieg.com         | Buyer@1234    |
| Buyer    | buyer2@ieg.com         | Buyer@1234    |
| Shipper  | shipper1@ieg.com       | Ship@1234     |

---

## 📡 API Reference

**Base URL:** `http://localhost:5000/api/v1`

**Auth header:** `Authorization: Bearer <accessToken>`

**Response envelope:**
```json
{
  "success": true,
  "message": "Products fetched successfully",
  "data": { ... },
  "pagination": { "page": 1, "limit": 10, "total": 248, "pages": 25 }
}
```

---

### 🔑 Auth — `/api/v1/auth`

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/register` | ❌ | `fullName, email, password, role, companyName` | Register new user |
| POST | `/login` | ❌ | `email, password` | Login → returns `accessToken` + sets refresh cookie |
| POST | `/refresh-token` | Cookie | — | Issue new access token |
| POST | `/logout` | ✅ | — | Invalidate refresh token |
| POST | `/forgot-password` | ❌ | `email` | Send password reset email |
| POST | `/reset-password/:token` | ❌ | `password` | Reset password |
| GET  | `/me` | ✅ | — | Get logged-in user profile |

---

### 📦 Products — `/api/v1/products`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/` | ❌ | Public | Marketplace listing with filters |
| GET | `/search?q=cotton&category=Textiles&moq=50&minPrice=1000` | ❌ | Public | Full-text search + filter |
| GET | `/:id` | ❌ | Public | Product detail (increments views) |
| GET | `/my/products` | ✅ | exporter | Get own products |
| POST | `/` | ✅ | exporter | Create product |
| PUT | `/:id` | ✅ | exporter | Update product |
| PATCH | `/:id/status` | ✅ | exporter | `{ status: "published" }` |
| DELETE | `/:id` | ✅ | exporter | Delete product |
| GET | `/admin/all` | ✅ | admin | All products |

---

### 🛒 Orders — `/api/v1/orders`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/` | ✅ | all | Role-filtered order list |
| GET | `/stats` | ✅ | all | Dashboard KPIs (total, revenue, by status) |
| GET | `/:id` | ✅ | all | Order detail |
| POST | `/` | ✅ | buyer | Place order |
| PATCH | `/:id/status` | ✅ | exporter/admin/shipper/buyer | Update status + timeline |
| POST | `/quotes` | ✅ | buyer | Send quote request |
| GET | `/quotes/list` | ✅ | buyer/exporter | Get quotes (role-filtered) |
| PATCH | `/quotes/:id/respond` | ✅ | exporter | Accept / Decline / Negotiate |

**Order status machine:**
```
pending → processing → shipped → in_transit → delivered
       ↘                                    ↗
         cancelled (any stage)
```

---

### 🚢 Shipments — `/api/v1/shipments`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/` | ✅ | all | Role-filtered shipments |
| GET | `/:id` | ✅ | all | Shipment detail with full stage history |
| POST | `/` | ✅ | shipper | Create shipment (links to order) |
| PATCH | `/:id/status` | ✅ | shipper | Update stage + location note |
| PATCH | `/:id/location` | ✅ | shipper | Update GPS coordinates |

**Shipment stages:** `pickup → customs_cleared → in_transit → arrived → delivered`

---

### 💳 Payments — `/api/v1/payments`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/wallet` | ✅ | all | Wallet balance + bank info |
| GET | `/transactions` | ✅ | all | Transaction history |
| GET | `/stats?year=2025` | ✅ | all | Monthly revenue chart data |
| POST | `/deposit` | ✅ | all | Add funds to wallet |
| POST | `/withdraw` | ✅ | all | Withdraw from wallet |
| POST | `/pay/:orderId` | ✅ | buyer | Pay for order (escrow hold) |

**Escrow flow:** Buyer pays → funds held → delivery confirmed → funds released to exporter (minus platform fee)

---

### 📄 Documents — `/api/v1/documents`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/my` | ✅ | all | Own documents |
| GET | `/stats` | ✅ | all | Document counts by status |
| POST | `/upload` | ✅ | all | Upload file (`multipart/form-data`) |
| DELETE | `/:id` | ✅ | all | Delete own document |
| GET | `/pending` | ✅ | admin | Pending review queue |
| GET | `/admin/all` | ✅ | admin | All documents |
| PATCH | `/:id/review` | ✅ | admin | `{ status: "approved", reviewNotes: "..." }` |

---

### 👑 Admin — `/api/v1/admin`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/dashboard` | ✅ | admin | Platform overview, stats, user growth |
| GET | `/users` | ✅ | admin | User management (filter by role/status) |
| GET | `/users/:id` | ✅ | admin | User detail |
| PATCH | `/users/:id` | ✅ | admin | `{ isActive, isVerified, subscription }` |
| DELETE | `/users/:id` | ✅ | admin | Delete user |
| GET | `/reports` | ✅ | admin | Revenue by region, product categories, monthly chart |
| GET | `/settings` | ✅ | admin | Platform settings |

---

### 🔔 Notifications — `/api/v1/notifications`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ✅ | Get notifications (unread filter: `?unread=true`) |
| PATCH | `/:id/read` | ✅ | Mark one as read |
| PATCH | `/read-all` | ✅ | Mark all as read |

---

### 💬 Messages — `/api/v1/messages`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/conversations` | ✅ | List of conversations |
| GET | `/conversations/:id` | ✅ | Messages in a conversation |
| POST | `/` | ✅ | Send message `{ receiverId, content }` |

---

### ✅ Verifications — `/api/v1/verifications`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/my` | ✅ | all | Own verification status |
| POST | `/submit` | ✅ | all | Submit KYB documents |
| GET | `/` | ✅ | admin | All verification requests |
| PATCH | `/:id/review` | ✅ | admin | `{ status: "approved", reviewerNotes: "..." }` |

---

## 🔌 WebSocket Events (Socket.io)

**Connect:** `ws://localhost:5000` with `{ auth: { token: "<accessToken>" } }`

| Event (emit) | Payload | Description |
|---|---|---|
| `join:conversation` | `conversationId` | Join a chat room |
| `message:send` | `{ conversationId, receiverId, content }` | Send a message |
| `message:typing` | `{ conversationId }` | Notify typing |
| `message:stop_typing` | `{ conversationId }` | Stop typing |

| Event (listen) | Payload | Description |
|---|---|---|
| `message:new` | Message object | New message in conversation |
| `message:notification` | `{ from, content, conversationId }` | Notification badge trigger |
| `message:typing` | `{ userId, name }` | Someone is typing |
| `order:updated` | Order object | Order status changed |

---

## 🛡️ Security Features

- **Helmet** — HTTP security headers
- **CORS** — Configured origin whitelist
- **Rate Limiting** — 200/15min global, 20/15min on auth routes
- **JWT** — 15min access tokens + 7-day httpOnly refresh cookies
- **bcrypt** — Password hashing (12 rounds)
- **Mongo Sanitize** — NoSQL injection prevention
- **Joi** — Request body validation on all write endpoints
- **Role Guards** — Middleware-enforced role-based access on every protected route

---

## ☁️ Cloudinary Setup & Troubleshooting

### Required environment variables

Add these to `ieg-backend/.env` (all three are required — uploads fall back to local disk if any are missing):

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Get these from **https://cloudinary.com/console** → API Keys.

> ⚠️ Copy the secret **exactly** as shown in the Cloudinary console — including any trailing digits or special characters. The most common cause of `Invalid Signature` errors is a truncated or modified API secret.

### Required npm package

```bash
npm install    # installs cloudinary ^2.x along with all other deps
```

The package is already listed in `package.json` as `"cloudinary": "^2.10.0"`. You just need to run `npm install`.

### How uploads work

```
Request (multipart/form-data)
  └─► multer (memoryStorage) — file buffered in req.file.buffer
        └─► product.service.js / document.service.js
              └─► fileStorage.saveFile(file, userId, subdir)
                    ├─► if Cloudinary configured → cloudinary.uploader.upload_stream
                    │     └─► returns { url: https://res.cloudinary.com/..., publicId: "ieg/..." }
                    └─► if NOT configured → local disk under uploads/{subdir}/{userId}/
                          └─► returns { url: "/uploads/...", publicId: null }
```

- **Product images** → stored under Cloudinary folder `ieg/products/{exporterId}/`
- **Documents** → stored under Cloudinary folder `ieg/documents/{userId}/`
- `publicId` is saved in MongoDB alongside the URL and is used for deletion.

### How document view/download works

Since documents are on Cloudinary's CDN (not on the backend server), the `/view` and `/download` endpoints return a JSON response:

```json
{ "url": "https://res.cloudinary.com/...", "fileName": "invoice.pdf" }
```

The frontend receives this JSON and opens the URL directly in a new tab (view) or via an anchor click (download). This avoids the cross-origin redirect issue that breaks when axios follows a `res.redirect()` to a CDN URL while carrying a JWT Bearer token.

### Common errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Invalid Signature` | Wrong `CLOUDINARY_API_SECRET` in `.env` | Copy the secret exactly from Cloudinary console — do not modify it |
| `Must supply api_key` | `CLOUDINARY_API_KEY` missing or empty | Add key to `.env`, restart server |
| `Cloud not found` | `CLOUDINARY_CLOUD_NAME` wrong | Verify your cloud name at cloudinary.com/console |
| Files save locally instead of Cloudinary | Any env var is missing/empty | All three vars must be set; check server startup logs |
| `Cannot read properties of null (reading 'uploader')` | Cloudinary module not installed | Run `npm install` |
| Upload works but View/Download fails | Frontend using `responseType: 'blob'` against a redirect | Fixed in current code — frontend reads `r.data.url` directly |

### How to fix Invalid Signature errors

1. Open your Cloudinary console: https://cloudinary.com/console
2. Click **API Keys** in the left sidebar
3. Copy the **API Secret** exactly — it may contain numbers, letters, underscores, and end with digits
4. Paste it into `.env` as `CLOUDINARY_API_SECRET=<paste here>` with no spaces or quotes
5. Save `.env` and **restart the server** (`Ctrl+C` then `npm run dev`)
6. Watch the startup log — you should see: `✅ Cloudinary configured (cloud: your_cloud_name)`

### How to verify uploads are working

After starting the server, watch the terminal for:
```
✅ Cloudinary configured (cloud: djxaqdfik)
```

If you see instead:
```
⚠️  Cloudinary not configured — file uploads will fall back to local disk
```
…then one or more env vars are missing. Check your `.env` file.

To test an upload manually with curl:
```bash
curl -X POST http://localhost:5000/api/v1/documents/upload \
  -H "Authorization: Bearer <your_token>" \
  -F "file=@/path/to/test.pdf" \
  -F "type=other"
```

A successful Cloudinary upload returns a `fileUrl` starting with `https://res.cloudinary.com/`.

---

## 🧩 Environment Variables

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/ieg_platform
JWT_ACCESS_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CLIENT_URL=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_app_password

# Cloudinary — image & document cloud storage
# Without these, files are saved to the local uploads/ directory instead
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

PLATFORM_FEE_PERCENT=2.5
```

---

## 📊 Data Models Summary

| Model | Database | Key Fields |
|-------|----------|------------|
| User | MongoDB | role, isVerified, walletBalance, subscription |
| Product | MongoDB | exporterId, category, pricing (tiered), certifications, status |
| Order | MongoDB | orderNumber, status machine, timeline[], paymentStatus |
| Shipment | MongoDB | containerNumber, stages[], currentLat/Lng |
| Transaction | MongoDB | type (income/withdrawal/platform_fee), amountUsd |
| Document | MongoDB | type, status (pending/approved/rejected/expired), reviewedBy |
| Verification | MongoDB | userId, status, reviewerNotes |
| Notification | MongoDB | userId, type, isRead |
| Conversation | MongoDB | participants[], lastMessage |
| Message | MongoDB | conversationId, attachments[] |

---

*Built for the ITC-Egypt 2026 Innovation Competition | Digilians Training Program*
