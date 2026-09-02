# Kế Hoạch Hoàn Thiện Bộ Tài Liệu

> **Dành cho agent:** Khi biến plan này thành thay đổi code/docs lớn, dùng `superpowers:subagent-driven-development` hoặc `superpowers:executing-plans`. Các bước dùng checkbox (`- [ ]`) để theo dõi trạng thái.

**Mục tiêu:** Hoàn thiện bộ tài liệu CareFlow theo checklist triển khai dự án bằng AI Agent mà không xóa lịch sử implementation hiện có.

**Hướng thực hiện:** Bổ sung các tài liệu source of truth còn thiếu ở mức enterprise-lite: business requirements, product requirements, software requirements, approval gates, sequence flows, database ERD, test traceability và agent lessons. Giữ tài liệu v1 hiện có làm bằng chứng baseline và cập nhật documentation map/change logs để contributor tìm đúng nguồn nhanh.

**Công cụ/tài liệu:** Markdown, Mermaid diagrams, tài liệu CareFlow hiện có, reference từ dự án React/Vite/NestJS/Prisma/PostgreSQL.

**Nguồn yêu cầu:** Checklist triển khai dự án bằng AI Agent do người dùng cung cấp và bộ tài liệu mẫu tại `/opt/bot/tg-codex-bot-ttshieu/uploads/20260902-015348-cc1a014b/docs.zip`.

## Ràng Buộc Chung

- Không xóa hoặc archive planning files hiện có trong lượt này.
- Không sửa runtime code.
- Không dùng dữ liệu bệnh nhân thật.
- Giữ tài liệu hướng dự án/người dùng bằng tiếng Việt, giữ thuật ngữ kỹ thuật khi rõ nghĩa hơn.
- Mỗi tài liệu mới phải có tên file ổn định, chuyên nghiệp, có document control và mục đích source-of-truth rõ.
- Ghi nhận thay đổi tài liệu trong `change-requests.md`, `documentation-map.md` và `changelog.md`.

---

## Task 1: Tài Liệu Governance Dự Án

**Files:**

- Create: `docs/00-project/stakeholder-and-approval-matrix.md`
- Create: `docs/00-project/ai-agent-delivery-workflow.md`
- Modify: `docs/00-project/documentation-map.md`
- Modify: `docs/01-requirements/change-requests.md`

**Deliverable:** Scope dự án, approval gates, ranh giới agent, quy tắc dữ liệu nhạy cảm và tool access được ghi rõ.

- [x] Định nghĩa stakeholder và approval matrix.
- [x] Định nghĩa AI agent delivery workflow từ input tới deployment feedback.
- [x] Link tài liệu mới từ documentation map.
- [x] Thêm change request cho việc hoàn thiện tài liệu.

## Task 2: Tài Liệu Requirements Source

**Files:**

- Create: `docs/01-requirements/business-requirements.md`
- Create: `docs/01-requirements/product-requirements.md`
- Create: `docs/01-requirements/software-requirements-specification.md`

**Deliverable:** BRD, PRD và SRS tồn tại như source documents ổn định, được rút từ hành vi v1.

- [x] Tóm tắt business goals, scope, personas và business rules.
- [x] Ghi product requirements, user stories, acceptance criteria và prioritization.
- [x] Ghi software requirements theo domain, có ID để trace tới tests.

## Task 3: Architecture Diagrams Và Flow Documents

**Files:**

- Create: `docs/03-architecture/sequence-diagrams.md`
- Create: `docs/03-architecture/database-erd.md`

**Deliverable:** Core flows và database relationships có thể review mà không cần đọc implementation code.

- [x] Thêm sequence diagrams cho auth, booking, operations, doctor và admin flows.
- [x] Thêm Mermaid ERD bám theo `apps/api/prisma/schema.prisma`.
- [x] Ghi rõ khác biệt giữa ERD view và implementation details.

## Task 4: Test Và Learning Traceability

**Files:**

- Create: `docs/06-testing/test-case-traceability.md`
- Create: `docs/05-history/agent-lessons-learned.md`
- Modify: `docs/05-history/changelog.md`

**Deliverable:** Requirements, tests, acceptance evidence và AI-agent lessons có thể trace được.

- [x] Map requirement IDs chính tới unit, E2E, Playwright, smoke và acceptance gates.
- [x] Ghi các bài học agent/process lặp lại cho future briefs.
- [x] Ghi nhận việc hoàn thiện tài liệu trong changelog.

## Verification

Chạy sau khi cập nhật:

```bash
git diff --check
rg -n "TODO|TBD|FIXME|fill in details|implement later" docs README.md apps/api/README.md apps/web/README.md
git status --short
```

Kỳ vọng:

- `git diff --check` exit `0`.
- Placeholder scan chỉ match documentation standards hoặc intentional historical examples, không có unresolved placeholders.
- `git status --short` chỉ hiển thị các tài liệu thêm/cập nhật dự kiến và review artifact untracked đã tồn tại từ trước.
