# Ahlam Gold · Web Engineering Reference

[![Verify web reference](https://github.com/mohsin-shabbir/ahlam-gold-web-reference/actions/workflows/ci.yml/badge.svg)](https://github.com/mohsin-shabbir/ahlam-gold-web-reference/actions)

A public showcase of the engineering ideas behind **Ahlam Golden**, accompanied by an independent booking demo built with **React, Node.js and PostgreSQL**. The demo uses fictional suites and guest aliases. It is not the production application. Created with AI assistance.

## Screenshot slideshow

Overview → room selection and quote → confirmed reservation. Captured from the working public demo with synthetic data. The slideshow loops every 17 seconds.

![Ahlam Gold demo slideshow: overview, booking form, and confirmed reservations](docs/ahlam-gold-slideshow.gif)

**Still images:** [Overview](docs/slide-01-overview.png) · [Booking form](docs/slide-02-booking.png) · [Confirmed stays](docs/slide-03-confirmed.png)

## Project context

The Ahlam Golden project uses React 19, TypeScript, Next.js, Node.js and PostgreSQL for booking, guest operations, accounts and reporting. Its documented modules include agent/hotel/guest directories, unified bookings, arrivals and transfers, receipts and allocations, receivables, expenses, ledgers, access control and audit history.

This repository illustrates a narrow workflow from that domain; it does not reproduce the full product or claim to implement its accounts, permissions or reports. See [the project case study](docs/CASE_STUDY.md).

## Working demo
- Responsive booking workspace with room selection, stay dates, server-generated quotes and confirmed stays.
- React UI calls a Node.js API; PostgreSQL persists every confirmed booking.
- Integer minor-unit pricing is calculated on the server.
- An exclusion constraint rejects overlapping stays even during concurrent requests.
- Unique request references support safe retries and reject conflicting replays.
- Unit tests, real PostgreSQL HTTP integration tests, and GitHub Actions.

## Run

Node.js 22.13+ and PostgreSQL 18. Use a separate demo database; the setup adds tables and three synthetic rooms. The setup role needs permission to create `btree_gist`.

```sh
npm ci
# Set DATABASE_URL to your isolated demo database, for example:
export DATABASE_URL='postgresql://USER:PASSWORD@localhost:5432/ahlam_reference'
npm run db:setup
npm run build
npm start
```

Open **http://127.0.0.1:5085**. For frontend development, keep the API running and run `npm run dev` in another terminal. PowerShell users set environment variables with `$env:DATABASE_URL='...'`. Never commit real credentials.

## Verify
```sh
npm run check
npm test
export TEST_DATABASE_URL='postgresql://USER:PASSWORD@localhost:5432/ahlam_reference_test'
npm run test:integration
npm run build
```
Integration tests create and remove a unique test schema. They verify server-owned pricing, idempotent replays, conflicting references, simultaneous overlapping requests, adjacent stays, quotes and invalid input. CI supplies an ephemeral PostgreSQL service.

## Architecture
```mermaid
flowchart LR
  UI[React booking workspace] --> API[Node.js / Express API]
  API --> V[Input validation and pricing]
  V --> PG[PostgreSQL]
  PG --> U[Unique request reference]
  PG --> E[Room / date-range exclusion]
```
The demo uses Vite and Express to keep its boundaries visible. The main product uses Next.js. Dates are date-only, checkout is exclusive, stays span 1–30 nights, and the demo currency is USD. Each fictional suite represents a single reservable room.

| Route | Purpose |
|---|---|
| GET /api/health | Database connectivity |
| GET /api/rooms | Synthetic inventory and nightly rates |
| POST /api/quotes | Server price and advisory availability |
| POST /api/bookings | Validated reservation with database conflict protection |
| GET /api/bookings | Latest 50 confirmed demo stays |

## Boundaries
The local server binds to loopback. This demo has no authentication, tenant isolation, payment processing, cancellation or production accounting. It accepts historical dates to make test scenarios repeatable. Do not expose it publicly or enter real customer data. A deployed system needs server-enforced permissions, HTTPS, controlled migrations, audit/reversal policies, rate limits, monitoring, retention and backup/recovery. Availability shown before confirmation is advisory; the database decides at write time.

## Author
[Mohsin Shabbir](https://github.com/mohsin-shabbir) · Solution Architecture, Technical Leadership and Full Stack Engineering

