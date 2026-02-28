# Blox Setup

## Prerequisites
- Node.js 20+
- npm 10+
- Docker Desktop

## Local boot
1. Copy `.env.example` to `.env` and fill secrets.
2. Start datastores: `npm run docker:up`.
3. Generate Prisma client: `npm run prisma:generate`.
4. Run migrations: `npm run prisma:migrate`.
5. Seed demo data: `npm run prisma:seed`.
6. Start all services: `npm run dev:all`.

## Docker notes
- Compose reads `.env` (not `.env.example`) for app containers.
- `NEXT_PUBLIC_API_BASE_URL` should be the API origin only (example: `http://localhost:3333`), without `/v1`.
- Internal container networking is preconfigured in `docker-compose.yml` for PostgreSQL, Redis, MongoDB, API, AI service, worker, realtime, and web.

## Services
- Web: `http://localhost:4200`
- API: `http://localhost:3333/v1`
- AI service: `http://localhost:3334/v1`
- Realtime service: `http://localhost:3335`

## Budget assumptions (~$400/month for ~50k users)
- Railway app services: ~$120
- Managed PostgreSQL: ~$80
- Redis: ~$40
- MongoDB: ~$60
- Object storage + CDN: ~$40
- Monitoring/logging baseline: ~$60

## Deployment targets
- Frontend: Vercel
- Backend/workers: Railway
- Storage: AWS S3 or Cloudflare R2
- CDN/SSL: Cloudflare

## CI/CD workflows
- `.github/workflows/ci.yml`: lint/test/build plus Docker image validation on PRs and main pushes.
- `.github/workflows/cd.yml`: GHCR image publish for `api`, `ai-service`, `worker`, `realtime`, and `web` on main and version tags.


