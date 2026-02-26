# URLY — URL Shortener + Analytics Service

A scalable URL shortening service built with clean architecture principles, featuring analytics tracking, JWT authentication, and Redis caching.

---

## Overview

URLY is a production-grade URL shortener API built on Node.js with TypeScript. It follows **Domain-Driven Design (DDD)** and **Hexagonal Architecture** to ensure separation of concerns, testability, and extensibility.

---

## Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Runtime     | Node.js + TypeScript              |
| Framework   | Express.js                        |
| Database    | MongoDB (Mongoose)                |
| Cache       | Redis                             |
| Auth        | JWT (Phase 5)                     |
| Container   | Docker + Docker Compose           |
| Reverse Proxy | Nginx                           |

---

## Features

- [x] URL shortening with expiration
- [x] Redis caching for fast redirects
- [x] Clean / Hexagonal Architecture
- [ ] Click analytics dashboard (Phase 4)
- [ ] JWT authentication (Phase 5)
- [ ] Rate limiting (Phase 6)
- [ ] Custom aliases (Phase 7)

---

## Architecture

```
src/
 ├── domain/          # Entities and use case interfaces
 ├── datalayer/       # Data contracts and service adapters
 ├── infra/           # Database repositories (MongoDB, FakeDB)
 ├── presentation/    # Controllers, HTTP contracts, error handling
 └── main/            # Express server, factories, entry point
```

The architecture follows the **Dependency Rule**: outer layers depend on inner layers, never the reverse.

---

## Setup

### Prerequisites

- Docker & Docker Compose

### Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

### Run with Docker

```bash
docker-compose up --build
```

### Run locally

```bash
npm install
npm run dev
```

---

## API Reference

### Shorten a URL

```
POST /shorten
Content-Type: application/json

{
  "long_url": "https://example.com/very/long/url"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "long_url": "https://example.com/very/long/url",
    "short_url": "urly.io/bRtlBX",
    "expiresAt": "2026-02-27T00:00:00.000Z",
    "createdAt": "2026-02-26T00:00:00.000Z"
  }
}
```

### Redirect

```
GET /:short_code
→ 301 redirect to original URL
```

---

## Roadmap

| Phase | Feature                        | Status      |
|-------|--------------------------------|-------------|
| 1     | Repository setup               | Done        |
| 2     | Rebrand + structure cleanup    | Done        |
| 3     | Core URL shortening logic      | In Progress |
| 4     | Click analytics                | Planned     |
| 5     | JWT authentication             | Planned     |
| 6     | Rate limiting + Redis          | Planned     |
| 7     | Custom aliases                 | Planned     |

---

## Author

**Mithileshan** — [GitHub](https://github.com/Mithileshan)
