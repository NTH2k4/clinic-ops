# Production Demo Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Render Free + Neon Free demo deployment repeatable, smoke-testable and documented enough for a new operator to deploy, verify and recover CareFlow v1 without reading chat history.

**Architecture:** Keep production operations lightweight and repository-owned. Add a safe smoke script that validates deployed behavior through public APIs, harden the GitHub Actions Render workflow to optionally trigger Render through a secret deploy hook, and update runbooks with the exact manual and automated deployment paths. Render and Neon remain the only hosted infrastructure.

**Tech Stack:** GitHub Actions, Render Free Web Service, Neon PostgreSQL, Node.js 22, NestJS, React/Vite, Prisma, Bash/curl, JavaScript smoke scripts.

**Spec:** `docs/04-planning/careflow-v1-delivery-roadmap.md`, `docs/04-planning/careflow-v1-subagent-execution-plan.md`, `docs/04-planning/render-deployment-plan.md`, `docs/03-architecture/backend-runbook.md`, `docs/06-testing/acceptance-checklist.md`.

## Global Constraints

- Do not move off Render Free or Neon Free.
- Do not commit secrets, deploy hook URLs, session tokens, patient data or temporary passwords.
- Do not run destructive full seed against Render unless intentionally resetting the demo environment.
- Keep production smoke safe by default; any mutating smoke must use generated `@example.test` data and clean up or deactivate it.
- Keep GitHub Deployment records tied to the Render URL and deployed commit.
- Use exact commit health checks through `/api/v1/health` before marking deployment complete.
- Phase 4 must update docs before and after implementation, following the documentation-first workflow.

## Implementation Status

Status as of 2026-08-28: plan created after Phase 3 deployed complete on Render at `f6697049`.

Relevant production evidence:

- Render health returned `f66970492103620d021a9bd9041374b9e656d684`.
- Admin login smoke passed with `admin@careflow.local`; token was not recorded.
- Catalog/scheduling smoke passed after hosted demo baseline repair: services total `8`, doctors total `5`, specialties total `3`, doctor-4 schedule total `1` on `2026-08-26`, availability explanation mode returned `5` slots with `availabilityStatus`.
- Render auto-deploy is still unreliable because production did not move from `49a4ff2a` to `9b8e9799` until manual deploy. The current `Render Deployment` workflow records GitHub Deployment status and polls health; it does not trigger Render.

Render official docs note that each service has a secret deploy hook URL and a GET or POST request can trigger a deploy. Their GitHub Actions guidance stores this value as a repository secret named `RENDER_DEPLOY_HOOK_URL`.

References:

- Render Deploy Hooks: https://render.com/docs/deploy-hooks
- Render Deploys: https://render.com/docs/deploys

## File Structure

- Create: `scripts/production-smoke.mjs`
  - Owns read-only production smoke checks for health, login, catalog and scheduling availability.
- Modify: `.github/workflows/render-deployment.yml`
  - Optionally triggers Render through `secrets.RENDER_DEPLOY_HOOK_URL` before polling health.
- Modify: `docs/03-architecture/backend-runbook.md`
  - Adds operator commands for manual deploy, deploy hook, smoke and failure triage.
- Modify: `docs/04-planning/render-deployment-plan.md`
  - Documents GitHub variable/secret setup and the difference between manual deploy, auto deploy and deploy hook.
- Modify: `docs/06-testing/acceptance-checklist.md`
  - Records Phase 4 verification evidence.
- Modify: `docs/05-history/release-notes.md`
  - Records production demo operations scope, constraints and verification.
- Modify: `docs/05-history/changelog.md`
  - Records concise implementation history.
- Modify: `docs/04-planning/mvp-release-readiness.md`
  - Tracks Phase 4 status and next step.
- Modify: `docs/00-project/documentation-map.md`
  - Adds the Phase 4 plan to the document map.

## Task 1: Production Smoke Script

**Files:**
- Create: `scripts/production-smoke.mjs`
- Modify: `docs/03-architecture/backend-runbook.md`
- Modify: `docs/06-testing/acceptance-checklist.md`

**Interfaces:**
- Consumes: environment variable `RENDER_EXTERNAL_URL`.
- Consumes: optional environment variables `CAREFLOW_SMOKE_EMAIL` and `CAREFLOW_SMOKE_PASSWORD`; defaults to demo admin credentials.
- Produces: command `node scripts/production-smoke.mjs` that exits non-zero on failed smoke and prints only non-secret evidence.

- [x] **Step 1: Write failing smoke-script test by running the missing script**

```bash
RENDER_EXTERNAL_URL=https://clinic-ops.onrender.com node scripts/production-smoke.mjs
```

Expected: FAIL because `scripts/production-smoke.mjs` does not exist.

- [x] **Step 2: Implement read-only production smoke script**

Script behavior:

- Validate `RENDER_EXTERNAL_URL` is set.
- Fetch `/api/v1/health` and print `data.commit`.
- Login with smoke credentials, assert `currentUser.role=admin`, and never print `sessionToken`.
- Fetch `/services?pageSize=1`, `/doctors?pageSize=1`, `/specialties?pageSize=1` and assert totals are at least `1`.
- Fetch `/doctor-schedules?doctorId=doctor-4&from=2026-08-26&to=2026-08-26&pageSize=5` and assert total is at least `1`.
- Fetch `/availability/slots?serviceId=service-general&date=2026-08-26&doctorId=doctor-4&includeUnavailable=true&pageSize=5` and assert at least one slot has `availabilityStatus`.
- Print JSON evidence with paths, status codes and counts only.

- [x] **Step 3: Verify syntax and production smoke**

```bash
node --check scripts/production-smoke.mjs
RENDER_EXTERNAL_URL=https://clinic-ops.onrender.com node scripts/production-smoke.mjs
```

Expected: syntax pass and production smoke pass without logging token.

- [x] **Step 4: Commit**

```bash
git add scripts/production-smoke.mjs docs/03-architecture/backend-runbook.md docs/06-testing/acceptance-checklist.md
git commit -m "test: add production smoke script"
```

## Task 2: Render Deployment Workflow Hardening

**Files:**
- Modify: `.github/workflows/render-deployment.yml`
- Modify: `docs/04-planning/render-deployment-plan.md`
- Modify: `docs/03-architecture/backend-runbook.md`

**Interfaces:**
- Consumes: repository variable `RENDER_EXTERNAL_URL`.
- Consumes: optional repository secret `RENDER_DEPLOY_HOOK_URL`.
- Produces: workflow behavior that triggers Render via deploy hook when the secret exists, then polls `/api/v1/health` for `GITHUB_SHA`.

- [x] **Step 1: Add a local workflow assertion**

Use a shell check that fails before the workflow contains deploy hook support:

```bash
rg -n 'RENDER_DEPLOY_HOOK_URL|Trigger Render deploy' .github/workflows/render-deployment.yml
```

Expected: FAIL before implementation.

- [x] **Step 2: Add optional deploy hook trigger**

Add a step before `Wait for Render health`:

```yaml
      - name: Trigger Render deploy
        if: env.RENDER_EXTERNAL_URL != '' && env.RENDER_DEPLOY_HOOK_URL != ''
        env:
          RENDER_DEPLOY_HOOK_URL: ${{ secrets.RENDER_DEPLOY_HOOK_URL }}
        run: |
          set -euo pipefail
          curl --fail --silent --show-error --request POST "$RENDER_DEPLOY_HOOK_URL"
```

Also add job env:

```yaml
      RENDER_DEPLOY_HOOK_URL: ${{ secrets.RENDER_DEPLOY_HOOK_URL }}
```

Do not print the hook URL.

- [x] **Step 3: Verify workflow text and YAML-sensitive diff**

```bash
rg -n 'RENDER_DEPLOY_HOOK_URL|Trigger Render deploy' .github/workflows/render-deployment.yml
git diff --check
```

Expected: grep finds the hook support and diff hygiene passes.

- [x] **Step 4: Commit**

```bash
git add .github/workflows/render-deployment.yml docs/04-planning/render-deployment-plan.md docs/03-architecture/backend-runbook.md
git commit -m "ci: trigger render deploy from workflow"
```

## Task 3: Operations Runbook And Deployment Documentation

**Files:**
- Modify: `docs/03-architecture/backend-runbook.md`
- Modify: `docs/04-planning/render-deployment-plan.md`
- Modify: `docs/05-history/release-notes.md`
- Modify: `docs/05-history/changelog.md`
- Modify: `docs/04-planning/mvp-release-readiness.md`
- Modify: `docs/00-project/documentation-map.md`

**Interfaces:**
- Consumes: smoke script from Task 1.
- Consumes: deploy hook workflow behavior from Task 2.
- Produces: documented operator workflow for first deploy, routine deploy, manual fallback, failed health wait, demo baseline repair, rollback and smoke.

- [x] **Step 1: Update runbook with exact operator paths**

Document:

- Routine path: push to `main`, workflow triggers deploy hook if configured, health wait verifies commit.
- Manual fallback: Render Dashboard `Manual Deploy -> Deploy latest commit`.
- Failed health wait: compare `/api/v1/health` commit with `origin/main`, then manual deploy latest or verify GitHub App/deploy hook configuration.
- Demo data recovery: rely on hosted baseline repair; avoid destructive full seed.
- Smoke command: `RENDER_EXTERNAL_URL=https://clinic-ops.onrender.com node scripts/production-smoke.mjs`.

- [x] **Step 2: Update deployment plan with GitHub setup**

Document:

- Required variable: `RENDER_EXTERNAL_URL`.
- Optional but recommended secret: `RENDER_DEPLOY_HOOK_URL`.
- Deploy hook URL is secret and must be rotated if exposed.
- Manual deploy remains acceptable on Render Free.

- [x] **Step 3: Update release/readiness docs**

Record Phase 4 status, verification commands and free-tier constraints without introducing temporary status document names.

- [x] **Step 4: Verify docs**

```bash
rg -n 'RENDER_DEPLOY_HOOK_URL|production-smoke|Manual Deploy|Deploy latest commit' docs/03-architecture/backend-runbook.md docs/04-planning/render-deployment-plan.md
git diff --check
```

Expected: all key operations are documented and diff hygiene passes.

- [x] **Step 5: Commit**

```bash
git add docs/03-architecture/backend-runbook.md docs/04-planning/render-deployment-plan.md docs/05-history/release-notes.md docs/05-history/changelog.md docs/04-planning/mvp-release-readiness.md docs/00-project/documentation-map.md
git commit -m "docs: document production demo operations"
```

## Task 4: Final Verification And Deployment Closure

**Files:**
- Modify: `docs/06-testing/acceptance-checklist.md`
- Modify: `docs/05-history/release-notes.md`
- Modify: `docs/04-planning/mvp-release-readiness.md`

**Interfaces:**
- Consumes: `scripts/production-smoke.mjs`.
- Consumes: GitHub Actions results after push.
- Produces: Phase 4 deployed-complete evidence.

- [ ] **Step 1: Run local static checks**

```bash
node --check scripts/production-smoke.mjs
git diff --check
```

Expected: pass.

- [ ] **Step 2: Push after user approval**

```bash
git push origin main
```

Expected: push succeeds.

- [ ] **Step 3: Verify GitHub Actions and Render**

Check GitHub Actions for latest `main`:

- API CI: success if code paths changed.
- Web CI: success if web paths changed.
- Render Deployment: success if workflow path changed and deploy hook/manual deploy makes Render health match latest commit.

- [ ] **Step 4: Run production smoke**

```bash
RENDER_EXTERNAL_URL=https://clinic-ops.onrender.com node scripts/production-smoke.mjs
```

Expected: pass with health commit, admin role, catalog totals and scheduling availability evidence. Output must not include session token.

- [ ] **Step 5: Commit deployment evidence**

```bash
git add docs/06-testing/acceptance-checklist.md docs/05-history/release-notes.md docs/04-planning/mvp-release-readiness.md
git commit -m "docs: close production demo operations gate"
```

## Self-Review

- Spec coverage: roadmap Phase 4 goals map to Task 1 smoke script, Task 2 deployment automation, Task 3 runbook/deployment docs and Task 4 closure evidence.
- Placeholder scan: no placeholder marker or unnamed implementation step is intentionally left.
- Type consistency: `RENDER_EXTERNAL_URL`, `CAREFLOW_SMOKE_EMAIL`, `CAREFLOW_SMOKE_PASSWORD` and `RENDER_DEPLOY_HOOK_URL` are named consistently across tasks.
- Scope ruling: no paid infrastructure, no SaaS monitoring and no destructive production seed are included.
