# Ahlam Golden: project case study

## Business scope
Connect enquiries and bookings with guest operations, receipts, receivables, expenses and reporting. A booking reference ties operational and financial records together.

## Documented product stack
- React 19, TypeScript and Next.js for the web interface and server routes.
- Node.js application runtime and PostgreSQL 18 as the authoritative data store.
- Server-side validation, authorization, database transactions and audit writes.
- HTTP-only, PostgreSQL-backed sessions and role permissions.
- DigitalOcean VPS deployment using Nginx and systemd, with database and upload backups.

## Engineering responsibilities demonstrated by the design
- Keep operational and financial records consistent across services.
- Enforce permissions at pages, mutations and exports rather than only hiding navigation.
- Protect posted accounting records through reversal rather than silent edits.
- Preserve database constraints and transaction boundaries around shared state.
- Keep secrets and database access on the server.
- Separate app availability from recovery: back up data and uploaded files.

These descriptions summarize the project's documentation. They are not performance metrics, proof of deployment or a claim that this demo implements the complete product.

## What the public code demonstrates
A small vertical slice: synthetic room inventory → validated stay quote → confirmed booking → operations list. Its concurrency protection comes from a PostgreSQL exclusion constraint, not a browser availability check. Request-reference uniqueness resolves duplicate submission.

The public code was independently written for this portfolio. No production database, customer records, credentials, deployment keys or proprietary application source are included.

