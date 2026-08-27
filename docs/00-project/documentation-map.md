# Bản Đồ Tài Liệu

Tài liệu này ghi rõ CareFlow đang học theo bộ tài liệu mẫu ở mức nào, phần nào đã có, phần nào chưa có và thứ tự nên bổ sung.

CareFlow không copy nguyên bộ mẫu. Dự án đang đi theo hướng frontend-first, nên tài liệu hiện tại là lightweight baseline trước; các tài liệu backend-heavy như SRS, API spec, sequence và ERD sẽ được bổ sung khi workflow frontend đã rõ.

## Chuỗi Tài Liệu Tham Khảo

Bộ mẫu gợi ý chuỗi tài liệu:

```text
BRD -> PRD -> SRS -> ARCHITECTURE -> TECHNICAL-DESIGN -> UC-API-SPEC -> SEQUENCE -> Implementation
```

CareFlow sẽ áp dụng theo thứ tự nhẹ hơn:

```text
Vision/Scope -> MVP Requirements -> Data Model -> Frontend MVP Spec -> Frontend Implementation Plan -> Frontend Prototype -> API Contract -> Backend SRS/Design
```

## Mapping Với Tài Liệu Mẫu

| Tài liệu mẫu | Mục đích | Tài liệu CareFlow hiện tại | Trạng thái |
| --- | --- | --- | --- |
| BRD | Mục tiêu nghiệp vụ, stakeholder, scope, business rules | `docs/00-project/vision.md`, `docs/00-project/scope.md`, `docs/01-requirements/mvp-requirements.md` | Có bản nhẹ |
| PRD | Product requirements, persona, user stories, acceptance criteria | `docs/01-requirements/mvp-requirements.md`, `docs/01-requirements/user-stories.md`, `docs/02-product/workflows.md`, `docs/02-product/frontend-mvp-spec.md` | Có frontend MVP spec |
| SRS | Software requirements chi tiết | Chưa có | Để sau khi frontend workflow rõ |
| ARCHITECTURE | Kiến trúc tổng thể | `docs/03-architecture/frontend-architecture.md`, `docs/03-architecture/backend-architecture.md`, `docs/03-architecture/data-model.md`, `docs/03-architecture/security-notes.md` | Có frontend và backend baseline |
| TECHNICAL-DESIGN | Thiết kế kỹ thuật chi tiết | `docs/04-planning/frontend-implementation-plan.md` | Có frontend implementation plan |
| UC-API-SPEC | Use case và API specification | `docs/03-architecture/api-contract.md` | Có draft rất nhẹ |
| SEQUENCE | Sequence cho flow chính | `docs/02-product/workflows.md`, `docs/02-product/appointment-states.md` | Có flow text, chưa có sequence chi tiết |
| DATABASE/ERD | Schema và quan hệ database | `docs/03-architecture/data-model.md`, `docs/03-architecture/database-schema.md` | Có conceptual model và schema reference |
| Frontend DESIGN | Design tokens, layout, accessibility, responsive rules | `docs/03-architecture/frontend-design-system.md` | Có bản baseline |
| Frontend README | Setup, scripts, mock API boundary, auth/session và verification | `apps/web/README.md` | Hoàn thành cho frontend MVP |
| Backend README | Setup, scripts, local database, seed accounts và verification | `apps/api/README.md` | Hoàn thành cho backend MVP |
| Backend RUNBOOK | Operational checks for request IDs, database, migrations, seed guard and auth failures | `docs/03-architecture/backend-runbook.md` | Baseline |

## Đánh Giá Hiện Tại

### Đã Ổn

- Có cấu trúc docs rõ theo nhóm project, requirements, product, architecture, planning, history và testing.
- Có policy mới dùng tiếng Anh mặc định cho tài liệu mới và tài liệu dành cho AI agent/subagent.
- Có change requests, changelog và decision log.
- Có conceptual data model đủ tốt hơn bản nháp ban đầu.
- Có appointment states và workflows cơ bản.
- Có frontend architecture direction.
- Có frontend MVP spec với personas, routes, screen specs, workflows, MoSCoW priority và acceptance criteria.
- Có frontend design system baseline cho design principles, tokens, layout, component rules, accessibility và responsive behavior.
- Có frontend implementation plan chi tiết để scaffold `apps/web` và triển khai frontend MVP theo task.
- Đã có frontend MVP chạy với mock data, README setup/verification và Playwright smoke coverage cho patient, doctor và operations workflows.
- Có frontend polish plan để gom UI/UX follow-up sau khi người dùng review bản MVP đầu tiên; Doctor Workspace đã polish phần điều hướng lịch ngày/tuần, App Shell đã polish sidebar/navigation, mobile navigation và TopBar notification panel, Patient Portal đã polish service browsing, booking clarity và appointment history, Operations Workspace đã polish automated scope cho queue/calendar/create appointment flow, Admin Workspace đã polish dashboard/forms/tables/audit filters ở automated scope, P6 đã bổ sung responsive/accessibility smoke ở 360/768/1280/1440.
- Có API contract v1 với conventions, response/error envelopes, auth/catalog/scheduling/appointment/audit/notification endpoints và plan riêng cho Phase 2 API contract.
- Có backend implementation plan cho Node.js/NestJS/Prisma/PostgreSQL theo từng package có test/verification.
- Có backend architecture reference mô tả module boundaries, request lifecycle, auth/RBAC, validation, appointment workflow, conflict engine, audit/notification boundary và testing gates.
- Có database schema reference cho Prisma/PostgreSQL tables, enums, indexes, seed dataset và schema change rules.
- Có backend README cho setup local, seed accounts, scripts, verification gate và CI.
- Có backend runbook baseline cho request correlation, database, migration, seed guard và auth failure checks.
- Có backend next steps plan bằng tiếng Anh để agent/subagent tiếp tục frontend API integration, OpenAPI, auth hardening, deployment, observability, audit/data governance và scheduling depth.

### Còn Thiếu So Với Mẫu

- Chưa có phần kiểm soát tài liệu và lịch sử phiên bản trong từng tài liệu quan trọng.
- Chưa có BRD/SRS chuẩn theo template riêng; frontend MVP spec hiện đóng vai trò PRD gọn cho phase đầu.
- Đã có persona chi tiết ở `docs/02-product/frontend-mvp-spec.md`, nhưng chưa có stakeholder matrix riêng.
- Đã có MoSCoW priority và acceptance criteria cho frontend MVP, nhưng chưa có trace đầy đủ theo từng requirement/user story.
- Chưa có traceability matrix.
- API contract v1 đã có response standard, error code convention và endpoint detail ở mức đủ để lập backend plan; chưa có OpenAPI machine-readable spec.
- Chưa có sequence diagram/spec cho các flow chính.
- Chưa có ERD dạng hình/diagram; hiện đã có database schema reference dạng text.

## Khuyến Nghị Bước Tiếp Theo

Thứ tự nên làm tiếp:

1. Integrate the verified `frontend-api-integration` branch or open a pull request for it.
2. Use `docs/04-planning/backend-next-steps.md` as the next backend-facing planning source.
3. Add a machine-readable OpenAPI spec after the integrated frontend/API workflow is stable.
4. Decide the production API hosting, PostgreSQL hosting and CORS model.
5. Add traceability matrix and SRS only when the product/API scope becomes larger than the current MVP.
