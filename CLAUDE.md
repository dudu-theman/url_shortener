# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a URL shortener system with a microservices architecture consisting of two separate Node.js/Express services that share a PostgreSQL database:

1. **Shortening Service** (port 3000): Generates short codes and creates URL mappings
2. **Redirection Service** (port 3001): Resolves short codes and redirects to original URLs

## Architecture

### Service Separation
- Both services connect to the same PostgreSQL database but have different responsibilities
- Services are independently deployable (deployed on Render)
- Shortening service generates 6-character base62 short codes (alphanumeric)
- Redirection service validates short codes (must be exactly 6 chars, alphanumeric only)

### Database Schema
The `url_mappings` table (defined in `database/init.sql`) is shared between services:
- `short_code`: VARCHAR(6) UNIQUE - the generated short code
- `original_url`: TEXT - the full URL to redirect to
- `created_at`: TIMESTAMP - creation time
- `expires_at`: TIMESTAMP - optional expiration (not currently used)
- `click_count`: INTEGER - tracking field (not currently incremented)

### Collision Handling
Short code generation uses a retry mechanism in `shortening_service/src/shortCodeGenerator.js`:
- Generates random 6-character base62 codes
- Checks database for uniqueness before returning
- Retries up to 5 times if collision occurs
- Throws error if all attempts fail

### Redis Integration
The redirection service imports `ioredis` and initializes a Redis client, but the caching implementation is incomplete. The service currently queries PostgreSQL directly for every redirect without using Redis.

## Development Commands

### Shortening Service
```bash
cd shortening_service
npm install
npm run dev     # Run with nodemon (auto-reload)
npm start       # Run in production mode
```

### Redirection Service
```bash
cd redirection_service
npm install
npm run dev     # Run with nodemon (auto-reload)
npm start       # Run in production mode
```

### Database Setup
Execute the initialization script:
```bash
psql $DATABASE_URL -f database/init.sql
```

## Environment Configuration

Both services require a `.env` file with:
- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Optional service port (defaults: 3000 for shortening, 3001 for redirection)

Shortening service additionally needs:
- `BASE_URL`: The base URL for generated short links (should point to redirection service)

Redirection service additionally needs:
- `REDIS_URL`: Redis connection string (currently initialized but not used)

## Important Implementation Notes

### Known Issues
- **Redirection Service (line 30)**: Missing `const` declaration for `originalUrl` variable
- **Redis**: Imported and initialized but not used for caching; all lookups hit PostgreSQL
- **Click Tracking**: Database has `click_count` field but it's never incremented
- **Expiration**: Database has `expires_at` field but TTL is not enforced

### Module System
Both services use CommonJS (`require`) except the redirection service incorrectly uses ES6 import for Redis on line 1 while using `require` elsewhere.

### Database Connection
Both services use identical database configuration with SSL enabled (`rejectUnauthorized: false`) for hosted PostgreSQL on Render.

### API Endpoints
- Shortening: `POST /api/shorten` - body: `{ "url": "https://..." }`
- Redirection: `GET /:shortCode` - 301 redirects to original URL
