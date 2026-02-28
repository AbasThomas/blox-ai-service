# Blox

Blox is an AI-powered platform for creating portfolios, resumes/CVs, and cover letters with integrated optimization, collaboration, analytics, and subscription monetization.

## Stack
- Frontend: Next.js + TypeScript + Tailwind v3 + Zustand + PWA
- Backend: NestJS + TypeScript + Prisma
- Data: PostgreSQL + MongoDB + Redis
- AI: Transformers.js local inference with Hugging Face fallback
- Payments: Paystack checkout + webhooks

## Workspace apps
- `web`
- `api`
- `ai-service`
- `worker`
- `realtime`

## Quick start
1. `npm ci`
2. `cp .env.example .env`
3. `npm run docker:up`
4. `npm run prisma:generate`
5. `npm run prisma:migrate`
6. `npm run prisma:seed`
7. `npm run dev:all`

## Useful commands
- `npm run dev:web`
- `npm run dev:api`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run docker:ps`
- `npm run docker:logs`

## CI/CD
- CI workflow: `.github/workflows/ci.yml` (quality checks + Docker build validation)
- CD workflow: `.github/workflows/cd.yml` (builds and publishes images to GHCR on `main` and `v*` tags)

## Docs
- [Setup](docs/SETUP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [Glossary](docs/GLOSSARY.md)


