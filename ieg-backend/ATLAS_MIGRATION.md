# MongoDB Atlas Migration

## Configuration

| Variable | Purpose |
|----------|---------|
| `MONGO_URI` | Atlas SRV connection string (from Atlas → Connect) |
| `MONGO_DB_NAME` | Database name (`ieg_platform`) — injected if missing from URI |

The app uses `src/config/mongoUri.js` to ensure all connections target **`ieg_platform`** on Atlas, not the default `test` database.

## Verify connection

```bash
cd ieg-backend
npm run verify:db
```

## Seed Atlas (first-time or reset)

```bash
npm run seed          # clears + seeds demo data
npm run seed:clear    # clear only
```

## Health check (runtime)

`GET http://localhost:5000/health` returns database name, provider (`atlas`), and collection document counts.

## Data storage model

| Collection | Model | Notes |
|------------|-------|--------|
| `users` | User | Auth, wallets, roles |
| `products` | Product | Marketplace CRUD |
| `orders` | Order | Buyer/exporter orders |
| `quoterequests` | QuoteRequest | Quote workflow |
| `shipments` | Shipment | Tracking + CSV export |
| `transactions` | Transaction | Wallet ledger |
| `documents` | Document | Metadata in Atlas; files on disk under `uploads/` |
| `verifications` | Verification | KYC submissions |
| `notifications` | Notification | In-app alerts |
| `conversations` | Conversation | Chat threads |
| `messages` | Message | Chat messages (persistent) |

**File uploads:** Binary files are stored on the API server (`uploads/`). MongoDB Atlas stores document metadata (`fileUrl`, `fileName`, `mimeType`, etc.).

## E2E smoke tests

```bash
npm run test:e2e      # API must already be running (npm run dev)
npm run test:e2e:ci   # starts API if needed, then runs tests
```

If every test fails with **`fetch failed`**, the root cause is almost always **`ECONNREFUSED`**: nothing is listening on `PORT` (default **5000**). This is not CORS, Atlas, or a wrong API path — the TCP connection never reaches Express.

1. Start the API: `npm run dev`
2. Confirm: `http://127.0.0.1:5000/health` returns JSON with `"database":{"status":"connected"}`
3. Run: `npm run test:e2e`

Or use `npm run test:e2e:ci` to start the server automatically.

Frontend (`5173`) proxies `/api` → `5000` via Vite; E2E tests call the backend directly on port **5000**.

## Switch back to localhost

In `.env`, comment Atlas URI and uncomment:

```
MONGO_URI=mongodb://localhost:27017/ieg_platform
```
