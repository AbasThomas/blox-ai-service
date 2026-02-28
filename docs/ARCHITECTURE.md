# Blox Architecture

## Monorepo apps
- `web`: Next.js 14+ app router, Tailwind v3, Zustand, PWA.
- `api`: NestJS REST + GraphQL identity API.
- `ai-service`: NestJS service for local Transformers.js inference and HF fallback.
- `worker`: BullMQ processors for long-running jobs.
- `realtime`: Socket.IO collaboration service.

## Data
- PostgreSQL via Prisma: source of truth for users, subscriptions, assets, templates, audit logs.
- MongoDB: analytics events and heatmap traces.
- Redis: queues, cache, rate limits, presence.

## Key flows
1. Onboarding: auth -> integrations -> first asset generation.
2. Creation: import -> AI mapping -> editor -> preview -> publish.
3. Optimization: scanner -> duplicator -> critique -> health score.
4. Billing: tier gates -> checkout -> webhook renewal/cancellation/refund events.
5. Collaboration: workspace join -> realtime edit -> comments -> version history.

## Security
- JWT auth with refresh tokens and optional MFA.
- Helmet, throttling, strong secrets.
- AES-256 encryption strategy for sensitive fields at rest.
- Audit logs for auth/billing/admin actions.


