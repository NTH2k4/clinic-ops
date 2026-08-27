# CareFlow V1 Subagent Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` for each approved implementation plan. This document is the delivery-level execution map; each phase produces or references its own detailed implementation plan before code changes.

**Goal:** Chia CareFlow v1 thành các workstream đủ rõ để triển khai bằng subagent-driven development, review từng package và cập nhật docs sau mỗi bước.

**Architecture:** Điều phối viên giữ roadmap, docs status và integration decisions. Mỗi subagent nhận một task package có scope hẹp, file boundaries rõ, verification commands cụ thể và báo cáo kết quả bằng commit hoặc failure note. Runtime implementation chỉ bắt đầu sau khi người dùng duyệt roadmap và plan của phase tương ứng.

**Tech Stack:** React, Vite, TypeScript, Playwright, NestJS, Prisma, PostgreSQL, GitHub Actions, Render Free Web Service, Neon Free Postgres.

**Spec:** `docs/04-planning/careflow-v1-delivery-roadmap.md`, `docs/04-planning/mvp-release-readiness.md`, `docs/04-planning/backend-next-steps.md`, `docs/00-project/documentation-standards.md`.

## Global Constraints

- Mỗi phase phải có implementation plan riêng trong `docs/04-planning/` trước khi sửa mã nguồn.
- Mỗi task phải cập nhật docs/status liên quan trước khi báo cáo hoàn tất.
- Không triển khai ngoài phạm vi CareFlow v1 đã ghi trong `docs/04-planning/careflow-v1-delivery-roadmap.md`.
- Không push hoặc deploy nếu approval của người dùng không bao gồm push/deploy.
- Không dùng dữ liệu bệnh nhân thật trên Render Free demo.
- Không thêm dependency hoặc service bên ngoài nếu không có quyết định riêng trong `docs/05-history/decision-log.md`.

---

## Execution Overview

Plan này không thay thế implementation plan chi tiết của từng phase. Nó định nghĩa thứ tự, ownership, review gates và expected artifacts để subagent-driven execution không bị rời rạc.

## Package 1: MVP Release Candidate Completion

**Plan:** `docs/04-planning/mvp-release-completion-plan.md`

**Objective:** Tích hợp authorization hardening, chạy full verification và đưa docs/release status về trạng thái release candidate.

**Subagent roles:**

- Integration implementer: merge branch, resolve conflicts nếu có, cập nhật release readiness.
- API verification implementer: chạy API gate, ghi kết quả.
- Web verification implementer: chạy Web gate, ghi kết quả.
- Docs sync implementer: đồng bộ changelog, release notes, acceptance checklist.
- Reviewer: kiểm tra diff, docs traceability và verification evidence.

**Exit gate:**

- `main` chứa commit release candidate.
- API/Web verification có evidence trong docs.
- Người dùng có thể đọc release readiness mà không cần chat history.

## Package 2: Account Administration Foundation

**Plan to create after Package 1:** `docs/04-planning/account-administration-plan.md`

**Objective:** Hoàn thiện account lifecycle tối thiểu cho v1.

**Subagent roles:**

- API implementer: user list, lock/unlock, activate/deactivate, reset password endpoints.
- Security implementer: password change flow, password validation, audit events.
- Web implementer: admin account management UI và self password change UI.
- Contract implementer: update API markdown/OpenAPI.
- Reviewer: verify no password/token persistence, role gates and audit coverage.

**Expected verification:**

```bash
cd apps/api
npm run typecheck
npm run lint
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run build
npm audit --audit-level=high

cd ../web
npm test -- --run
npm run typecheck
npm run lint
npm run build
npm run e2e
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run e2e:api
```

## Package 3: Scheduling Operations UI

**Plan to create after Package 2:** `docs/04-planning/scheduling-operations-plan.md`

**Objective:** Cho admin/operations staff quản lý schedules và giải thích availability dựa trên backend.

**Subagent roles:**

- API contract reviewer: xác nhận endpoint schedule/availability đủ cho UI.
- Web implementer: admin schedule management UI.
- Web implementer: operations availability explanation UI.
- Test implementer: API-mode Playwright for schedule changes and booking availability.
- Reviewer: verify conflict safety and no client-side-only scheduling rules.

**Expected verification:**

```bash
cd apps/api
npm run typecheck
npm run lint
npm test -- --runInBand
npm run test:e2e -- --runInBand

cd ../web
npm test -- --run
npm run typecheck
npm run lint
npm run build
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run e2e:api
```

## Package 4: Production Demo Operations

**Plan to create after Package 3:** `docs/04-planning/production-demo-operations-plan.md`

**Objective:** Chốt deploy/runbook/smoke verification cho Render Free + Neon Free.

**Subagent roles:**

- Deployment verifier: push/deploy flow, GitHub Actions, Render health.
- Runbook writer: update backend runbook and Render deployment plan.
- Smoke tester: health, login and booking command evidence.
- Reviewer: verify docs match real commands and constraints.

**Expected verification:**

```bash
curl --fail --silent --show-error "$RENDER_EXTERNAL_URL/api/v1/health"
curl --fail --silent --show-error -X POST "$RENDER_EXTERNAL_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@careflow.local","password":"careflow-demo"}'
```

## Package 5: V1 Documentation And Acceptance Closure

**Plan to create after Package 4:** `docs/04-planning/v1-documentation-closure-plan.md`

**Objective:** Đóng gói docs để người dùng duyệt CareFlow v1.

**Subagent roles:**

- Requirements reviewer: map MVP/v1 requirements to implemented behavior.
- Docs implementer: update documentation map, release notes and acceptance checklist.
- Test evidence reviewer: confirm local/CI/deploy verification status is recorded.
- Final reviewer: broad repo review for stale docs, contradictory status and missing links.

**Expected verification:**

```bash
git diff --check
rg -n "TODO|TBD|FIXME|fill in details|implement later" docs README.md apps/api/README.md apps/web/README.md
```

The placeholder scan may match documentation standards when those words are listed as forbidden examples. Those matches must be called out explicitly rather than treated as unresolved work.

## Coordination Rules

- The coordinator starts from the first incomplete package in this document.
- Before dispatching subagents, the coordinator reads the package plan and updates `docs/04-planning/mvp-release-readiness.md`.
- Each subagent task gets one implementation report and one review report.
- A task is not complete until its docs/status update is committed.
- Cross-package changes require a ruling in the relevant phase plan and a changelog entry.

## Review Gates

Every package must pass:

- Scope review against `careflow-v1-delivery-roadmap.md`.
- Diff review for unrelated changes.
- Verification evidence review.
- Docs traceability review.

The final v1 closure requires a broad review before the user is asked to accept the project as v1 complete.
