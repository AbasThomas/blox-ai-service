# Integration Keys and Secrets (Frontend Providers)

This app surfaces 8 account integrations in the frontend:

- `linkedin` (OAuth)
- `github` (OAuth)
- `upwork` (OAuth)
- `figma` (OAuth)
- `fiverr` (manual fallback only)
- `behance` (manual fallback only)
- `dribbble` (manual fallback only)
- `coursera` (manual fallback only)

## Local environment fields

Set these in root `.env`:

- `APP_BASE_URL=http://localhost:4200`
- `API_BASE_URL=http://localhost:3333`
- `NEXT_PUBLIC_APP_BASE_URL=http://localhost:4200`
- `NEXT_PUBLIC_API_BASE_URL=http://localhost:3333`

OAuth credential fields:

- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `UPWORK_CLIENT_ID`
- `UPWORK_CLIENT_SECRET`
- `FIGMA_CLIENT_ID`
- `FIGMA_CLIENT_SECRET`

For local-only integration testing without external OAuth, set:

- `FORCE_LOCAL_INTEGRATIONS=true`

## Callback URLs to register

Use these exact redirect URIs in provider dashboards:

- `http://localhost:3333/v1/auth/oauth/linkedin/callback`
- `http://localhost:3333/v1/auth/oauth/github/callback`
- `http://localhost:3333/v1/auth/oauth/upwork/callback`
- `http://localhost:3333/v1/auth/oauth/figma/callback`

## Where to get keys and secrets

### LinkedIn

1. Create/open your app in LinkedIn Developer portal.
2. Add OAuth redirect URL: `http://localhost:3333/v1/auth/oauth/linkedin/callback`.
3. Copy Client ID and Client Secret into:
   - `LINKEDIN_CLIENT_ID`
   - `LINKEDIN_CLIENT_SECRET`

Official docs:
- https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow

### GitHub

1. Create an OAuth App in GitHub Developer Settings.
2. Set Authorization callback URL: `http://localhost:3333/v1/auth/oauth/github/callback`.
3. Copy Client ID and generate/store Client Secret in:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`

Official docs:
- https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app

### Upwork

1. Create/open your app in Upwork developer console.
2. Configure OAuth redirect URL: `http://localhost:3333/v1/auth/oauth/upwork/callback`.
3. Copy app credentials into:
   - `UPWORK_CLIENT_ID`
   - `UPWORK_CLIENT_SECRET`

Official docs:
- https://www.upwork.com/developer/documentation/graphql/api/docs/index.html

### Figma

1. Create/open a Figma OAuth app.
2. Add redirect URL: `http://localhost:3333/v1/auth/oauth/figma/callback`.
3. Copy OAuth credentials into:
   - `FIGMA_CLIENT_ID`
   - `FIGMA_CLIENT_SECRET`

Official docs:
- https://developers.figma.com/docs/rest-api/authentication/

### Fiverr, Behance, Dribbble, Coursera

No OAuth client key/secret is used by this app for these providers currently.
They run in manual/fallback mode in the current implementation.
