# Quy Trình Triển Khai Với AI Agent

## Document Control

| Trường | Giá trị |
| --- | --- |
| Trạng thái | `active` |
| Đối tượng đọc chính | Product owner, AI coordinator, implementation agent |
| Cập nhật lần cuối | 2026-09-02 |
| Phạm vi | Quy trình chuẩn từ yêu cầu đến triển khai, kiểm thử, deploy và học lại cho CareFlow |

## Mục Đích

Tài liệu này chuẩn hóa cách dùng AI Agent trong CareFlow để giảm lệch scope, giảm đoán mò và giữ mọi quyết định traceable trong repo.

## Bước 0: Phạm Vi Và Ràng Buộc

Đầu vào bắt buộc:

- Mục tiêu thay đổi.
- Lý do nghiệp vụ hoặc kỹ thuật.
- Người duyệt.
- Dữ liệu không được đưa cho agent.
- Quyền commit/push/deploy.

Nguồn tài liệu:

- `docs/00-project/vision.md`
- `docs/00-project/scope.md`
- `docs/00-project/stakeholder-and-approval-matrix.md`
- `docs/01-requirements/change-requests.md`

## Bước 1: Input, Output, Stack Và Tool Access

Agent phải xác định:

- Input: yêu cầu người dùng, file đính kèm, docs nguồn, codebase.
- Output: docs, code, tests, release note hoặc deployment evidence.
- Stack: React/Vite/TypeScript/Tailwind, NestJS/Prisma/PostgreSQL, Render/Neon.
- Tool access: local filesystem, terminal, browser/test runner, MCP/GitNexus nếu available.

Không được dựa vào memory/chat khi có tài liệu hoặc source file thật để kiểm chứng.

## Bước 2: Tài Liệu Nghiệp Vụ Và Kỹ Thuật

Thứ tự source-of-truth ưu tiên:

```text
BRD -> PRD/FRD -> SRS -> Architecture -> Database -> API Contract -> Sequence -> Frontend Design -> Implementation Plan
```

CareFlow dùng bộ tài liệu tương ứng:

- `docs/01-requirements/business-requirements.md`
- `docs/01-requirements/product-requirements.md`
- `docs/01-requirements/software-requirements-specification.md`
- `docs/03-architecture/backend-architecture.md`
- `docs/03-architecture/frontend-architecture.md`
- `docs/03-architecture/database-schema.md`
- `docs/03-architecture/database-erd.md`
- `docs/03-architecture/api-contract.md`
- `docs/03-architecture/openapi.json`
- `docs/03-architecture/sequence-diagrams.md`
- `docs/03-architecture/frontend-design-system.md`

## Bước 3: Subagent-Driven Planning

Khi task đủ lớn, coordinator phải:

- Chia module theo biên rõ: API, web, tests, docs, deploy.
- Ghi dependency trước/sau.
- Ghi checkpoint duyệt.
- Chỉ giao cho subagent phần tài liệu và file cần thiết.
- Tự tổng hợp conflict và đẩy quyết định rủi ro cao cho người dùng.

Nguồn chính:

- `docs/04-planning/careflow-v1-subagent-execution-plan.md`
- Plan phase tương ứng trong `docs/04-planning/`

## Bước 4: Test

Test phải bám requirement và acceptance criteria:

- Unit test cho helper, validation, business rule.
- API E2E cho auth, RBAC, appointment, scheduling, audit.
- Playwright cho role workflow, mobile/desktop smoke và API-mode regression.
- Production smoke cho health, login, catalog, schedule và availability.

Nguồn chính:

- `docs/06-testing/test-strategy.md`
- `docs/06-testing/test-case-traceability.md`
- `docs/06-testing/acceptance-checklist.md`

## Bước 5: Review Và Duyệt

Trước khi merge/deploy:

- Review diff để tìm unrelated changes.
- Đối chiếu với requirement/source docs.
- Kiểm tra OpenAPI nếu đổi endpoint.
- Kiểm tra docs/changelog/change request.
- Chỉ push/deploy khi approval bao gồm hành động đó.

## Bước 6: Deploy

Deploy path chuẩn:

- GitHub `main`.
- GitHub Actions API/Web/Render Deployment.
- Render Free single service.
- Neon Free PostgreSQL.
- Production smoke bằng `scripts/production-smoke.mjs`.

Fallback:

- Nếu Render không nhận push event, dùng deploy hook hoặc Manual Deploy.
- Nếu health không khớp commit, không coi deploy là hoàn tất.
- Nếu smoke fail, không tiếp tục release; ghi failure, rollback/fallback và yêu cầu duyệt bước tiếp.

## Bước 7: Giám Sát Và Vòng Phản Hồi

Sau deploy:

- Kiểm tra health/login smoke.
- Theo dõi Render logs và API request ID khi có lỗi.
- Ghi bài học vào `docs/05-history/agent-lessons-learned.md`.
- Cập nhật brief/template nếu lỗi lặp lại do thiếu context hoặc acceptance criteria.

## Output Chuẩn Của Một Lượt Agent

Mỗi lượt triển khai nên báo:

- File đã sửa.
- Test/verification đã chạy.
- Kết quả pass/fail cụ thể.
- Rủi ro còn lại.
- Commit/push/deploy status nếu có.
