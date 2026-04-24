# API Test Report — 2026-04-24

**Timestamp:** 2026-04-24T23:46:33.363Z
**App URL:** http://127.0.0.1:3001

---

## Summary

| Metric | Value |
|--------|-------|
| Total | 43 |
| Passed | 36 |
| Failed | 7 |
| Skipped | 2 (auth/me, auth/logout — not implemented) |
| Duration | 0.9s |

---

## Database Snapshot

| Table | Count |
|-------|-------|
| users | 13 |
| customers | 988 |
| products | 8,753 |
| shippers | 3 |
| suppliers | 0 |
| orders | 2 |
| stocks | 48 |
| templates | 1 |

---

## Results

### Authentication (6 tests: 4 pass, 2 skip)

- ✓ POST /api/auth/login admin (role=admin, 28 permissions)
- ✓ POST /api/auth/login salesperson (role=salesperson)
- ✓ POST /api/auth/login operator (role=operator)
- ✓ POST /api/auth/login wrong password → 401
- ✓ POST /api/auth/login missing fields → 400
- ⊘ GET /api/auth/me → HTTP 404 (not implemented)
- ⊘ POST /api/auth/logout → HTTP 404 (not implemented)

### Customers API (4/4)

- ✓ GET /api/customers → 200 (988 customers)
- ✓ GET /api/customers?q=DHSK01 → filtered results
- ✓ GET /api/customers?page=1&pageSize=20 → paginated (total=988)
- ✓ GET /api/customers/{id} → single customer (DHSK01)

### Products API (3/4)

- ✓ GET /api/products → 200 (8753 products)
- ✓ GET /api/products?page=1&pageSize=10 → paginated (total=8753)
- ✗ GET /api/products/categories → HTTP 500
  - Error: `invalid input syntax for type uuid: "categories"`
  - The route at `src/app/api/products/categories/route.ts` is treating "categories" as a UUID — route parameter mismatch
- ✓ GET /api/product-mappings → 50 mappings

### Orders API (4/5)

- ✓ GET /api/orders → 200 (2 orders)
- ✓ GET /api/orders?page=1&pageSize=20 → paginated (total=2)
- ✗ GET /api/orders/{id} → HTTP 404
  - Route `src/app/api/orders/[id]/route.ts` returns null — order ID from db snapshot not found
- ✓ GET /api/orders?status=assigned → filter by status → 200

### Shipping Exports API (2/5)

- ✗ GET /api/shipping-exports/pending → HTTP 500
  - Error: `Unsupported OR operator: not`
  - Prisma/SQL query uses an incompatible `not` operator
- ✗ GET /api/shipping-exports/pending?page=1&pageSize=20 → HTTP 500 (same issue)
- ✗ POST /api/shipping-exports/batch → HTTP 400
  - Error: `请选择至少一个供应商` (no supplier selected)
  - Not a code bug — test sent order IDs but no supplier ID
- ✓ GET /api/templates/default/shipping → HTTP 200
- ✓ GET /api/templates/default/order → HTTP 200

### Templates API (3/4)

- ✓ GET /api/templates → 1 template
- ✓ GET /api/templates/default/shipping → 200
- ✓ GET /api/templates/default/order → 200
- ✗ GET /api/templates/fields → HTTP 400

### Shippers & Suppliers (3/4)

- ✓ GET /api/shippers → 3 shippers
- ✓ GET /api/suppliers → 3 suppliers
- ✗ GET /api/suppliers/stocks → HTTP 500
  - Error: `invalid input syntax for type uuid: "stocks"`
  - Route `src/app/api/suppliers/stocks/route.ts` uses stocks as UUID param
- ✓ GET /api/stocks → 48 stocks

### Roles & Reports (5/5)

- ✓ GET /api/roles → 5 roles
- ✓ GET /api/users → 13 users
- ✓ GET /api/users/me → admin
- ✓ GET /api/reports/stats → 200
- ✓ GET /api/permissions → 200

### Page Loads (9/9)

- ✓ GET / (Home)
- ✓ GET /orders (Orders)
- ✓ GET /customers (Customers)
- ✓ GET /products (Products)
- ✓ GET /roles (Roles)
- ✓ GET /templates (Templates)
- ✓ GET /archive (Archive)
- ✓ GET /shipping-export (Shipping Export)
- ✓ GET /order-parse (Order Parse)

---

## Failed Tests — Action Items

| # | Test | Error | Likely Fix |
|---|------|--------|-----------|
| 1 | GET /api/products/categories | UUID parse error | Route `products/categories/route.ts` has parameter mismatch — `[id]` path segment catching "categories" |
| 2 | GET /api/orders/{id} | 404 not found | Order ID from phase0 snapshot may not exist in current DB (different data) |
| 3 | GET /api/shipping-exports/pending | `Unsupported OR operator: not` | Prisma query uses incompatible `not` operator — needs `.not()` or different query pattern |
| 4 | GET /api/templates/fields | HTTP 400 | Route needs POST body or query params; GET not supported |
| 5 | GET /api/suppliers/stocks | UUID parse error | Route `suppliers/stocks/route.ts` has parameter mismatch |

---

*Generated automatically by api-test-suite.mjs*
