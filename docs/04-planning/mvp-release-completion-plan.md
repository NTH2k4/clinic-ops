# Kế Hoạch Hoàn Tất MVP Release

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` để triển khai task-by-task sau khi người dùng duyệt toàn bộ tài liệu. Steps dùng checkbox (`- [ ]`) để theo dõi tiến độ.

**Goal:** Đưa CareFlow từ trạng thái frontend/backend baseline sang một MVP release candidate sạch: authorization hardening được tích hợp, full verification chạy lại, docs phản ánh đúng tiến độ và deployment path sẵn sàng kiểm chứng.

**Architecture:** Không mở thêm feature lớn trong vòng này. Công việc tập trung vào integration, verification, documentation traceability và release/deployment readiness. Frontend vẫn giữ mock mode là default local runtime; Render production build dùng API mode same-origin như đã ghi trong `render.yaml`.

**Tech Stack:** React, Vite, TypeScript, Playwright, NestJS, Prisma, PostgreSQL, GitHub Actions, Render Free Web Service, Neon Free Postgres.

**Spec:** `docs/04-planning/mvp-release-readiness.md`, `docs/04-planning/backend-next-steps.md`, `docs/04-planning/render-deployment-plan.md`, `docs/06-testing/acceptance-checklist.md`.

## Global Constraints

- Tất cả thay đổi triển khai mã nguồn phải cập nhật plan/status trong `docs/04-planning/`.
- Không thêm payment, insurance, prescription, telemedicine, external notification provider hoặc electronic health record đầy đủ vào MVP release này.
- Không dùng dữ liệu bệnh nhân thật trên Render Free demo.
- Không hard delete dữ liệu catalog/admin trong MVP; giữ deactivate/soft behavior đã có.
- Không lưu password hoặc bearer token trong `localStorage`, `sessionStorage`, IndexedDB hoặc persisted mock state.
- Không push, merge vào shared branch hoặc tạo deployment nếu chưa có approval rõ từ người dùng sau khi tài liệu này được duyệt.
- Verification phải dùng command thật và ghi kết quả vào docs trước khi báo hoàn thành.

---

## Phạm Vi Sau Khi Duyệt

Sau khi người dùng duyệt tài liệu, agent sẽ triển khai theo thứ tự:

1. Tích hợp branch `authorization-hardening` vào `main` theo hướng local merge trước.
2. Chạy full local verification cho API và Web.
3. Cập nhật docs tiến độ, checklist chấp nhận, changelog và release notes.
4. Chuẩn bị push/deploy gate. Nếu người dùng đã duyệt push/deploy trong cùng quyết định duyệt tài liệu, agent sẽ push `main` và theo dõi GitHub Actions/Render health trong khả năng credentials hiện có.

Ngoài phạm vi:

- Không xây admin user-management UI.
- Không thêm account lockout/password reset.
- Không thêm schedule management UI mới.
- Không chuyển OpenAPI sang code generation.
- Không đổi hạ tầng ngoài Render Free + Neon Free đã chốt.

## File Structure

- Modify: `docs/04-planning/mvp-release-readiness.md` để cập nhật trạng thái từng task khi chạy.
- Modify: `docs/04-planning/backend-next-steps.md` nếu trạng thái Workstream 6A hoặc release readiness thay đổi.
- Modify: `docs/06-testing/acceptance-checklist.md` để thêm release candidate checklist.
- Modify: `docs/05-history/changelog.md` để ghi nhận integration/verification/docs.
- Modify: `docs/05-history/release-notes.md` để ghi release candidate summary.
- Modify: `docs/05-history/decision-log.md` nếu chốt local merge/push/deploy path.
- No runtime files should change unless verification reveals a real defect.

## Task 1: Integration Baseline

**Files:**
- Modify: `docs/04-planning/mvp-release-readiness.md`
- Modify: `docs/05-history/decision-log.md`

**Interfaces:**
- Consumes: branch `authorization-hardening` with commits `e6ed2c18` and `8c41ecb9`.
- Produces: a clean `main` branch containing the authorization hardening and docs workflow commits.

- [ ] **Step 1: Record pre-merge state**

Run:

```bash
git worktree list --porcelain
git status --short --branch
git log --oneline --decorate -5
```

Expected: root worktree `clinic-ops` is on `main`; authorization worktree is on `authorization-hardening`.

- [ ] **Step 2: Switch to root `main` worktree**

Run from repository root worktree:

```bash
cd /home/codexproxy/Codex-ttshieu/clinic-ops
git status --short --branch
```

Expected: `main` is clean before merge.

- [ ] **Step 3: Merge authorization hardening locally**

Run:

```bash
git merge --no-ff authorization-hardening -m "merge: authorization hardening"
```

Expected: merge succeeds without conflict. If conflict occurs, stop implementation and record the exact conflicting files in `docs/04-planning/mvp-release-readiness.md`.

- [ ] **Step 4: Update release readiness docs**

Update `docs/04-planning/mvp-release-readiness.md`:

- Change Authorization matrix hardening from "chờ quyết định tích hợp" to "đã merge local vào main".
- Record the merge commit hash.
- Keep verification status as "chưa chạy lại sau merge" until Task 2 and Task 3 complete.

- [ ] **Step 5: Commit docs update if merge did not already include it**

Run:

```bash
git status --short
git add docs/04-planning/mvp-release-readiness.md docs/05-history/decision-log.md
git commit -m "docs: record authorization merge decision"
```

Expected: create a docs commit only if there are documentation changes after merge.

## Task 2: API Verification Gate

**Files:**
- Modify: `docs/04-planning/mvp-release-readiness.md`
- Modify: `docs/06-testing/acceptance-checklist.md`

**Interfaces:**
- Consumes: merged `main` from Task 1.
- Produces: verified API baseline or a documented failure with command output summary.

- [ ] **Step 1: Start local PostgreSQL**

Run from repository root:

```bash
docker compose up -d postgres
```

Expected: PostgreSQL container is running and accepts connections on port `5432`.

- [ ] **Step 2: Generate Prisma client**

Run:

```bash
cd apps/api
npm run prisma:generate
```

Expected: command exits `0`.

- [ ] **Step 3: Apply migrations**

Run:

```bash
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npx prisma migrate deploy
```

Expected: migrations apply cleanly or report that database is already in sync.

- [ ] **Step 4: Seed deterministic data**

Run:

```bash
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run prisma:seed
```

Expected: seed exits `0` and demo users remain available with password `careflow-demo`.

- [ ] **Step 5: Run API static gates**

Run:

```bash
npm run typecheck
npm run lint
```

Expected: both commands exit `0`.

- [ ] **Step 6: Run API tests**

Run:

```bash
npm test -- --runInBand
npm run test:e2e -- --runInBand
```

Expected: unit and E2E suites exit `0`.

- [ ] **Step 7: Run API build and audit**

Run:

```bash
npm run build
npm audit --audit-level=high
```

Expected: build exits `0`; audit reports no high-severity vulnerability.

- [ ] **Step 8: Record API verification result**

Update `docs/04-planning/mvp-release-readiness.md` and `docs/06-testing/acceptance-checklist.md` with:

- Commands executed.
- Pass/fail result.
- Test counts when visible from output.
- Any failure command and first actionable error if a failure occurs.

## Task 3: Web Verification Gate

**Files:**
- Modify: `docs/04-planning/mvp-release-readiness.md`
- Modify: `docs/06-testing/acceptance-checklist.md`

**Interfaces:**
- Consumes: merged `main` from Task 1 and local API dependencies from Task 2.
- Produces: verified frontend baseline in mock mode and API mode, or a documented failure.

- [ ] **Step 1: Install web dependencies if needed**

Run:

```bash
cd apps/web
npm ci
```

Expected: dependencies install cleanly. If `node_modules` is already current, `npm ci` still exits `0`.

- [ ] **Step 2: Ensure API dependencies are present for API-mode E2E**

Run:

```bash
npm ci --prefix ../api
```

Expected: dependencies install cleanly for API-mode Playwright runner.

- [ ] **Step 3: Run web unit and static gates**

Run:

```bash
npm test -- --run
npm run typecheck
npm run lint
```

Expected: all commands exit `0`.

- [ ] **Step 4: Build web app**

Run:

```bash
npm run build
```

Expected: TypeScript build and Vite production build exit `0`.

- [ ] **Step 5: Run mock-mode Playwright**

Run:

```bash
npm run e2e
```

Expected: Playwright mock smoke suite exits `0`.

- [ ] **Step 6: Run API-mode Playwright**

Run:

```bash
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run e2e:api
```

Expected: Playwright API-mode regression suite exits `0`.

- [ ] **Step 7: Record web verification result**

Update `docs/04-planning/mvp-release-readiness.md` and `docs/06-testing/acceptance-checklist.md` with:

- Commands executed.
- Pass/fail result.
- Browser suite result.
- Any failure command and first actionable error if a failure occurs.

## Task 4: Documentation And Release Notes Sync

**Files:**
- Modify: `docs/00-project/documentation-map.md`
- Modify: `docs/04-planning/mvp-release-readiness.md`
- Modify: `docs/04-planning/backend-next-steps.md`
- Modify: `docs/05-history/changelog.md`
- Modify: `docs/05-history/release-notes.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: verification results from Task 2 and Task 3.
- Produces: docs that describe the verified release candidate without relying on chat history.

- [ ] **Step 1: Update release readiness**

Update `docs/04-planning/mvp-release-readiness.md`:

- Mark Workstream 6A integrated if Task 1 merged successfully.
- Mark API verification status from Task 2.
- Mark Web verification status from Task 3.
- Set next step to push/deploy only if local verification passed.

- [ ] **Step 2: Update backend next steps**

Update `docs/04-planning/backend-next-steps.md`:

- Change Workstream 6A status from baseline implemented on branch to integrated on `main` if Task 1 merged.
- Keep Workstream 3 production auth/session open for account lockout/password reset only.
- Keep Workstream 7 scheduling UI as a later product slice.

- [ ] **Step 3: Update acceptance checklist**

Update `docs/06-testing/acceptance-checklist.md` with a "MVP Release Candidate" section:

- API verification gate.
- Web mock-mode gate.
- Web API-mode gate.
- Authorization boundary regression.
- Render health verification status.

- [ ] **Step 4: Update release notes**

Update `docs/05-history/release-notes.md` with:

- Full-stack MVP baseline summary.
- Auth/session and authorization hardening summary.
- Known free-tier constraints.
- Demo safety note: no real patient data.

- [ ] **Step 5: Update README if language/policy is stale**

Update `README.md` if it still states English-first documentation as the default. It should point to the Vietnamese-first documentation policy with technical English allowed where clearer.

- [ ] **Step 6: Commit docs sync**

Run:

```bash
git diff --check
git status --short
git add README.md docs/00-project/documentation-map.md docs/04-planning/mvp-release-readiness.md docs/04-planning/backend-next-steps.md docs/05-history/changelog.md docs/05-history/release-notes.md docs/06-testing/acceptance-checklist.md
git commit -m "docs: sync mvp release candidate status"
```

Expected: docs commit succeeds after diff check passes.

## Task 5: Push And Deployment Verification Gate

**Files:**
- Modify: `docs/04-planning/mvp-release-readiness.md`
- Modify: `docs/04-planning/render-deployment-plan.md`
- Modify: `docs/05-history/release-notes.md`

**Interfaces:**
- Consumes: verified local `main`.
- Produces: pushed `main` and deployment verification record, if external access is available and approved.

- [ ] **Step 1: Confirm local branch is clean**

Run:

```bash
git status --short --branch
git log --oneline --decorate -5
```

Expected: `main` is clean and contains the release candidate commits.

- [ ] **Step 2: Push `main` if approved**

Run only after approval covers push:

```bash
git push origin main
```

Expected: push succeeds. If credentials or branch protection block the push, record the failure and stop before retrying.

- [ ] **Step 3: Inspect GitHub Actions if available**

Run:

```bash
gh run list --branch main --limit 10
```

Expected: API CI, Web CI, Web Pages and Render Deployment are visible for the pushed commit when workflows trigger. If `gh` is not authenticated, record that limitation.

- [ ] **Step 4: Verify Render health if URL is available**

Run when `RENDER_EXTERNAL_URL` is known:

```bash
curl --fail --silent --show-error "$RENDER_EXTERNAL_URL/api/v1/health"
```

Expected: response includes a success envelope and `data.commit` matching the pushed commit after Render finishes deploy.

- [ ] **Step 5: Verify deployed login smoke if Render health passes**

Run:

```bash
curl --fail --silent --show-error -X POST "$RENDER_EXTERNAL_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@careflow.local","password":"careflow-demo"}'
```

Expected: response includes current admin user data and a bearer session token.

- [ ] **Step 6: Record deployment result**

Update `docs/04-planning/mvp-release-readiness.md`, `docs/04-planning/render-deployment-plan.md` and `docs/05-history/release-notes.md` with:

- Pushed commit hash.
- GitHub Actions result if available.
- Render health result if available.
- Any deployment blocker with exact command and error summary.

- [ ] **Step 7: Commit deployment documentation**

Run if docs changed:

```bash
git diff --check
git add docs/04-planning/mvp-release-readiness.md docs/04-planning/render-deployment-plan.md docs/05-history/release-notes.md
git commit -m "docs: record mvp deployment verification"
git push origin main
```

Expected: docs reflect the final deployment state.

## Subagent Execution Model

Sau khi người dùng duyệt tài liệu này, điều phối viên sẽ chạy `subagent-driven-development`:

- Task 1 dùng một implementer cho integration và docs state.
- Task 2 dùng một implementer chuyên API verification.
- Task 3 dùng một implementer chuyên Web verification.
- Task 4 dùng một implementer chuyên docs/release sync.
- Task 5 dùng một implementer cho push/deployment verification nếu approval và credentials cho phép.

Mỗi task phải có review riêng. Cuối plan phải có broad final review trước khi báo hoàn tất.

## Approval Gate

Người dùng duyệt tài liệu này là approval để:

- Tích hợp local branch `authorization-hardening` vào `main`.
- Chạy local verification đầy đủ.
- Cập nhật docs/release notes theo kết quả thật.

Push `main` và kiểm tra deployment chỉ thực hiện nếu câu duyệt của người dùng cũng cho phép push/deploy, hoặc người dùng xác nhận riêng sau Task 4.
