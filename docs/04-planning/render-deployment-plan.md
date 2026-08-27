# Render Deployment Plan

## Goal

Deploy CareFlow on free infrastructure for demo and end-to-end validation: one Render Web Service serves the React frontend and NestJS API, while Neon provides PostgreSQL.

## Target Topology

- Render service: `clinic-ops`, plan `free`, region `singapore`.
- Runtime: Node.js 22.
- Database: Neon Free Postgres, provided to Render as `DATABASE_URL`.
- Public app URL: the Render `onrender.com` service URL.
- Frontend mode: API mode, same-origin, `VITE_API_BASE_URL=/api/v1`.
- GitHub Deployments environment: `render-free`.

## Why Single Render Web Service

Render Free Web Services can sleep after idle time. Serving the frontend from the same NestJS process avoids showing an already-loaded frontend while the backend is still waking. The first user may still wait during Render cold start, but the app and API become available together.

## Render Blueprint

The root `render.yaml` defines:

- `buildCommand`: installs API and web dependencies, builds the React API-mode bundle, generates Prisma Client, and builds NestJS.
- `preDeployCommand`: runs `npx prisma migrate deploy`.
- `initialDeployHook`: seeds demo data once with `ALLOW_DATABASE_SEED=true`.
- `startCommand`: runs `npm run start --prefix apps/api`.
- `healthCheckPath`: `/api/v1/health`.

## Required Render Environment Variables

| Variable        | Value                                                                  |
| --------------- | ---------------------------------------------------------------------- |
| `DATABASE_URL`  | Neon Postgres connection string. Set this in Render, do not commit it. |
| `NODE_VERSION`  | `22` from `render.yaml`.                                               |
| `SERVE_WEB_APP` | `true` from `render.yaml`.                                             |

Optional:

| Variable               | Value                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `WEB_DIST_DIR`         | Only needed if Render cannot auto-detect `apps/web/dist`.                             |
| `CORS_ALLOWED_ORIGINS` | Leave unset for the single-service Render app. Set only for split-origin deployments. |

## Required GitHub Repository Variable

Set this after Render creates the service:

| Variable              | Value                                                             |
| --------------------- | ----------------------------------------------------------------- |
| `RENDER_EXTERNAL_URL` | Render public URL, for example `https://clinic-ops.onrender.com`. |

The `Render Deployment` workflow uses this variable to create a GitHub Deployment record and attach the Render URL to the `render-free` environment. It polls `/api/v1/health` until the response `data.commit` matches the current GitHub SHA. Render provides this value through `RENDER_GIT_COMMIT`.

## First Deploy Steps

1. Create a Neon Free Postgres database.
2. Copy the Neon connection string.
3. In Render, create a Blueprint from this repository and `render.yaml`.
4. Fill `DATABASE_URL` when Render prompts for the unsynced variable.
5. Wait for the first deploy; Render runs migrations before start and seeds demo data once after the first successful deploy.
6. Copy the Render service URL.
7. In GitHub, set repository variable `RENDER_EXTERNAL_URL` to the Render service URL.
8. Run the `Render Deployment` workflow manually once if needed to register the URL in GitHub Deployments.

## Verification

Run against the deployed URL:

```bash
RENDER_EXTERNAL_URL=https://your-render-service.onrender.com

curl "$RENDER_EXTERNAL_URL/api/v1/health"
curl -X POST "$RENDER_EXTERNAL_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@careflow.local","password":"careflow-demo"}'
```

Then open the Render root URL and verify the app logs in with demo accounts.

## Known Free-Tier Constraints

- Render Free Web Services can cold start after idle time.
- In-memory sessions are lost when the Render process restarts.
- Neon Free has storage and compute limits.
- Do not use real patient data on this demo deployment.

## Next Hardening Work

- Replace in-memory demo sessions with durable auth.
- Add request logging and error logging.
- Add deployed Playwright smoke checks against the Render URL.
- Decide whether to keep GitHub Pages as a mock-only demo or retire it after Render is stable.
