# URLY — URL Shortener + Analytics Service

![CI](https://github.com/Mithileshan/URLY-URL-Shortener-Analytics/actions/workflows/ci.yml/badge.svg)

A production-grade URL shortening and analytics platform built with TypeScript, MongoDB, Redis, and JWT authentication — following Hexagonal Architecture and Domain-Driven Design.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                              │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP
┌──────────────────────▼──────────────────────────────────────┐
│                    EXPRESS SERVER                           │
│  helmet │ rate-limit │ pino-http │ zod validation           │
└──┬──────────┬──────────────┬───────────────┬────────────────┘
   │          │              │               │
   ▼          ▼              ▼               ▼
 Auth      Create URL    Redirect       Analytics
 Routes    (protected)   (public)       (owner-only)
   │          │              │               │
┌──▼──────────▼──────────────▼───────────────▼────────────────┐
│               PRESENTATION LAYER                            │
│         Controllers │ Middleware │ Validators               │
└──────────────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  DOMAIN LAYER                               │
│           Entities │ Use Case Interfaces                    │
└──────────────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│               INFRASTRUCTURE LAYER                          │
│   MongoDB Repos │ Redis Cache │ JWT │ bcrypt │ Logging      │
└──────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer          | Technology                               |
|----------------|------------------------------------------|
| Runtime        | Node.js 20 + TypeScript                  |
| Framework      | Express.js                               |
| Database       | MongoDB 6 (Mongoose)                     |
| Cache          | Redis 7                                  |
| Auth           | JWT (jsonwebtoken) + bcryptjs            |
| Validation     | Zod                                      |
| Security       | Helmet, express-rate-limit               |
| Logging        | Pino + pino-http                         |
| Container      | Docker (multi-stage) + Docker Compose    |
| CI             | GitHub Actions                           |

---

## Features

| Feature                           | Status |
|-----------------------------------|--------|
| URL shortening with expiration    | ✅ |
| Per-user URL ownership            | ✅ |
| Click tracking (ip, ua, referrer) | ✅ |
| Analytics endpoint                | ✅ |
| Redis redirect cache (1h TTL)     | ✅ |
| Redis stats cache (5min TTL)      | ✅ |
| Cache invalidation on click       | ✅ |
| JWT authentication                | ✅ |
| Owner-only analytics enforcement  | ✅ |
| Tiered rate limiting              | ✅ |
| Zod request validation            | ✅ |
| Helmet security headers           | ✅ |
| Structured JSON logging (pino)    | ✅ |
| Standardized error envelope       | ✅ |
| Multi-stage Docker build          | ✅ |
| Docker Compose (app/mongo/redis)  | ✅ |
| GitHub Actions CI                 | ✅ |

---

## Security Layer

```
Request
  │
  ├─ Helmet          → 15 HTTP security headers (XSS, HSTS, CSP, etc.)
  ├─ Rate Limiter    → Global 100/15min | Auth 10/15min | Create 20/min
  ├─ Zod Validation  → Schema validation before controllers are reached
  ├─ Auth Middleware → JWT verification, req.user attachment
  └─ Ownership Check → DB-level owner comparison before returning stats
```

All error responses follow a consistent envelope:
```json
{ "error": { "code": "FORBIDDEN", "message": "You do not own this URL" } }
```

---

## Folder Structure

```
src/
 ├── domain/
 │    ├── entities/       # Shortener, Click, User, UrlStats (framework-agnostic types)
 │    └── usecases/       # Use case interfaces
 ├── datalayer/
 │    ├── contracts/      # Repository interfaces
 │    └── services/       # Application services (thin wrappers)
 ├── infra/
 │    ├── cache/          # Redis singleton with graceful fallback
 │    ├── logging/        # Pino logger
 │    ├── security/       # bcrypt + JWT helpers
 │    └── repositories/
 │         └── mongoose/  # MongoDB implementations + schemas
 ├── presentation/
 │    ├── contracts/      # HTTP types
 │    ├── controllers/    # Thin controllers (validate → delegate → respond)
 │    ├── middleware/     # Auth middleware, error handler
 │    ├── validators/     # Zod schemas + validate() factory
 │    ├── helpers/        # Credentials, send-response
 │    └── errors/         # Error classes
 └── main/
      ├── adapters/express/ # Server entry point, route wiring
      └── factories/        # Dependency injection factories
```

---

## API Reference

### Auth

```http
POST /api/auth/register
{ "name": "Alice", "email": "alice@example.com", "password": "secret123" }
→ { "token": "...", "user": { "id": "...", "name": "Alice", "email": "..." } }

POST /api/auth/login
{ "email": "alice@example.com", "password": "secret123" }
→ { "token": "...", "user": { ... } }
```

### URL Management *(requires Bearer token)*

```http
POST /api/url
Authorization: Bearer <token>
{ "long_url": "https://example.com/very/long/path" }
→ { "short_url": "http://localhost:5000/abc123", "clicks": 0, ... }

GET /api/url/mine
Authorization: Bearer <token>
→ [ { "long_url": "...", "short_url": "...", "clicks": 42 }, ... ]

GET /api/url/:shortCode/stats
Authorization: Bearer <token>  (must be owner)
→ { "totalClicks": 42, "last24Hours": 7, "topReferrers": [...], "recentClicks": [...] }
```

### Public

```http
GET /:shortCode          → 301 redirect to original URL
GET /health              → { "status": "ok", "timestamp": "..." }
```

---

## Setup

### With Docker (recommended)

```bash
# 1. Clone
git clone https://github.com/Mithileshan/URLY-URL-Shortener-Analytics.git
cd URLY-URL-Shortener-Analytics

# 2. Configure
cp .env.example .env
# Edit .env — set MONGO_URI, JWT_SECRET

# 3. Run
docker-compose up --build
```

App will be available at `http://localhost:5000`.

### Local Development

```bash
npm install
cp .env.example .env
# Edit .env — set MONGO_URI, REDIS_URL, JWT_SECRET
npm run dev
```

### Environment Variables

| Variable         | Description                           | Default               |
|------------------|---------------------------------------|-----------------------|
| `NODE_ENV`       | Environment mode                      | `development`         |
| `PORT`           | Server port                           | `5000`                |
| `MONGO_URI`      | MongoDB connection string             | *(required)*          |
| `BASE_URL`       | Base URL for short links              | `http://localhost:5000/` |
| `JWT_SECRET`     | Secret for signing JWTs              | *(required)*          |
| `JWT_EXPIRES_IN` | JWT expiry duration                   | `1d`                  |
| `REDIS_URL`      | Redis connection string               | *(optional — caching disabled if unset)* |
| `EXPIRATION_HOUR`| Hours until short URLs expire         | `24`                  |

---

## Performance Design

```
Redirect flow:
  Redis HIT  → O(1) lookup, no DB query
  Redis MISS → MongoDB query, cache for 1h

Stats flow:
  Redis HIT  → Serve cached JSON (5min TTL)
  Redis MISS → 4-query MongoDB aggregate, cache result
  On redirect → stats cache invalidated (eventual consistency)
```

---

## Roadmap

| Phase | Feature                            | Status  |
|-------|------------------------------------|---------|
| 1     | Repository setup                   | ✅ Done |
| 2     | Rebrand + structure cleanup        | ✅ Done |
| 3     | Core URL shortening logic          | ✅ Done |
| 4     | Click analytics + tracking         | ✅ Done |
| 5     | Redis caching layer                | ✅ Done |
| 6     | JWT auth + user ownership          | ✅ Done |
| 7     | Production hardening               | ✅ Done |
| 8     | Docker + CI + documentation        | ✅ Done |
| 9     | Custom aliases                     | Planned |
| 10    | Geo-IP analytics                   | Planned |

---

## Author

**Mithileshan** — [GitHub](https://github.com/Mithileshan)
