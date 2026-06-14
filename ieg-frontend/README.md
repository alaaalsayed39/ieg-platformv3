# 🌍 IEG Frontend — International Export Gateway

> Premium React + Vite + Tailwind SaaS dashboard for a B2B export-tech platform.
> Built to match the 24 UI screens exactly — dark navy + gold design system.

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (requires backend running on :5000)
npm run dev

# 3. Open http://localhost:3000
```

**Backend must be running** at `http://localhost:5000` for API calls to work.

---

## 🔐 Demo Login Credentials

| Role     | Email                 | Password      | Portal           |
|----------|-----------------------|---------------|------------------|
| Admin    | admin@ieg.com         | Admin@1234    | `/admin`         |
| Exporter | exporter1@ieg.com     | Export@1234   | `/exporter`      |
| Exporter | exporter2@ieg.com     | Export@1234   | `/exporter`      |
| Buyer    | buyer1@ieg.com        | Buyer@1234    | `/buyer`         |
| Buyer    | buyer2@ieg.com        | Buyer@1234    | `/buyer`         |
| Shipper  | shipper1@ieg.com      | Ship@1234     | `/shipper`       |

Or click the quick-login buttons on the login page.

---

## 🗂️ Project Structure

```
src/
├── App.jsx                    # Root router — all routes defined here
├── main.jsx                   # React DOM entry + Toaster setup
├── index.css                  # IEG design system: tokens, utilities, badges
│
├── config/
│   ├── api.js                 # Axios instance + JWT interceptors + auto-refresh
│   └── routes.js              # Route constants (ROUTES.ADMIN, etc.)
│
├── store/
│   ├── authStore.js           # Zustand: user, accessToken (in-memory), isAuthenticated
│   └── uiStore.js             # Zustand: sidebarCollapsed
│
├── utils/
│   └── format.js              # formatCurrency, formatDate, timeAgo, statusBadgeClass
│
├── hooks/
│   └── useApi.js              # useApi(url) data fetching hook + useMutation
│
├── components/
│   ├── ui/
│   │   ├── StatCard.jsx       # KPI card (gold/navy/dark variants + delta %)
│   │   ├── DataTable.jsx      # Sortable table with built-in pagination
│   │   ├── StatusBadge.jsx    # Auto-coloring badge (pending/approved/shipped/...)
│   │   ├── Modal.jsx          # Animated modal with backdrop blur
│   │   ├── SearchBar.jsx      # Input with clear button
│   │   ├── EmptyState.jsx     # Illustrated empty state
│   │   ├── PageHeader.jsx     # Title + subtitle + actions slot
│   │   ├── Spinner.jsx        # Loading indicator
│   │   └── IEGLogo.jsx        # Brand logo SVG (collapsible)
│   │
│   ├── layout/
│   │   ├── Sidebar.jsx        # Collapsible navigation (role-adaptive nav items)
│   │   ├── TopBar.jsx         # Search + notifications + user avatar
│   │   └── DashboardLayout.jsx# Sidebar + TopBar + <Outlet> wrapper
│   │
│   └── guards/
│       ├── PrivateRoute.jsx   # Redirect to /auth/login if not authenticated
│       └── GuestRoute.jsx     # Redirect to role home if already logged in
│
└── features/
    ├── public/
    │   └── LandingPage.jsx    # Marketing homepage with features + CTA
    │
    ├── auth/
    │   ├── LoginPage.jsx      # Split-panel login + quick demo buttons
    │   └── RegisterPage.jsx   # Role-selection register form
    │
    ├── admin/
    │   ├── AdminDashboard.jsx # Stats, user growth chart, system health
    │   ├── AdminUsers.jsx     # User management table + verify/suspend actions
    │   ├── AdminVerifications.jsx # KYB review queue + approve/reject modal
    │   ├── AdminReports.jsx   # Revenue by region, categories, monthly line chart
    │   └── AdminSettings.jsx  # SMTP, payment, security, API key settings
    │
    ├── exporter/
    │   ├── ExporterDashboard.jsx # Revenue chart, shipment map, recent orders
    │   ├── ExporterProducts.jsx  # Product catalog table with status toggle
    │   ├── AddProduct.jsx        # Multi-section product creation form
    │   ├── ExporterOrders.jsx    # Orders table with status machine + timeline modal
    │   ├── BuyerRequests.jsx     # Quote request cards with Accept/Negotiate/Decline
    │   ├── ExporterDocuments.jsx # Document cards (approved/pending/expired/rejected)
    │   └── ExporterWallet.jsx    # Balance + monthly bar chart + transaction list
    │
    ├── buyer/
    │   ├── BuyerDashboard.jsx    # Stats, recommended products, recent orders, insights
    │   ├── Marketplace.jsx       # Searchable + filterable product grid with pagination
    │   └── BuyerOrders.jsx       # Order table with expandable shipment timeline
    │
    ├── shipper/
    │   ├── ShipperDashboard.jsx  # Stats + active container list
    │   └── ShipmentTracking.jsx  # World map + container list + stage update modal
    │
    └── shared/
        └── MessagesPage.jsx      # Two-panel B2B chat with conversation list
```

---

## 🎨 Design System

### Colors
```css
--ieg-navy:  #0B1437   /* primary dark background */
--ieg-gold:  #F5A623   /* primary accent, CTAs */
--ieg-blue:  #1e3a8a   /* secondary dark */
--ieg-dark:  #060d24   /* deepest background */
```

### CSS Classes (in index.css)
| Class | Purpose |
|-------|---------|
| `.ieg-card` | Standard card with border + backdrop blur |
| `.ieg-input` | Form input with focus gold ring |
| `.ieg-label` | Uppercase label above inputs |
| `.btn-gold` | Primary gold CTA button |
| `.btn-ghost` | Secondary transparent button |
| `.btn-danger` | Danger/destructive action button |
| `.badge-*` | Status badges (pending/approved/rejected/transit/...) |
| `.ieg-table` | Styled table (th/td rules built-in) |
| `.nav-active` | Active sidebar link (gold left border) |
| `.text-gradient` | Gold gradient text |
| `.page-enter` | Fade-in page transition |

---

## 🔌 API Integration

All API calls go through `src/config/api.js`:
- **Base URL**: `/api/v1` (proxied to `:5000` via Vite)
- **Auth**: `Authorization: Bearer <token>` on every request
- **Auto-refresh**: Axios interceptor catches 401 → calls `/auth/refresh-token` → retries
- **Token storage**: Access token in Zustand memory only (not localStorage — security)

---

## 🏗️ Architecture Decisions

1. **Zustand** for global state (auth + UI) — no Redux boilerplate
2. **Axios interceptors** for transparent JWT refresh — zero auth logic in components
3. **Role-based routing** in App.jsx via `<PrivateRoute roles={[...]}>` wrapper
4. **Session restore** on app mount via refresh token cookie — users stay logged in
5. **CSS custom classes** over Tailwind-only — enables complex dark theme consistently
6. **Feature-scoped modules** — each role's pages live in their own folder

---

## 📱 Responsive Design

- **Sidebar**: Collapsible on mobile (hamburger in TopBar)
- **Grids**: All stat grids use `grid-cols-2 lg:grid-cols-4` pattern
- **Tables**: Horizontal scroll on mobile with `overflow-x-auto`
- **Marketplace**: 2-col on tablet, 3-col on desktop

---

*Built for ITC-Egypt 2026 Innovation Competition | Digilians Training Program*
