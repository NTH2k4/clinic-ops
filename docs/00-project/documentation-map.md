# Bản Đồ Tài Liệu

## Document Control

| Trường | Giá trị |
| --- | --- |
| Trạng thái | `active` |
| Đối tượng đọc chính | Product owner, senior engineer và agent tiếp tục triển khai |
| Cập nhật lần cuối | 2026-09-02 |
| Phạm vi | Source-of-truth map cho bộ tài liệu CareFlow v1 |

## Revision History

| Ngày | Nội dung thay đổi |
| --- | --- |
| 2026-09-02 | Bổ sung mapping enterprise-lite sau khi thêm stakeholder/approval matrix, AI agent workflow, BRD, PRD, SRS, sequence diagrams, database ERD, test traceability và agent lessons learned. |
| 2026-08-28 | Chuẩn hóa sau nghiệm thu v1: production/source-of-truth orientation, mapping enterprise-lite và giữ planning docs làm implementation records. |

Tài liệu này ghi rõ source of truth của CareFlow sau khi v1 đã được nghiệm thu, cách đọc bộ docs hiện có và phần nào chỉ nên bổ sung khi scope vượt quá v1.

CareFlow không copy nguyên bộ tài liệu mẫu. Dự án giữ bộ docs vừa đủ để vận hành sản phẩm thật trên Render/Neon, đồng thời để lại các implementation plan cũ như lịch sử quyết định và bằng chứng triển khai.

## Chuỗi Tài Liệu Tham Khảo

Bộ mẫu gợi ý chuỗi tài liệu:

```text
BRD -> PRD -> SRS -> ARCHITECTURE -> TECHNICAL-DESIGN -> UC-API-SPEC -> SEQUENCE -> Implementation
```

CareFlow áp dụng chuỗi nhẹ hơn và đã hoàn tất cho v1:

```text
Vision/Scope -> Stakeholders/Agent Workflow -> BRD/PRD/SRS -> Product Workflows -> Architecture/API/Data Model/ERD/Sequence -> Implementation Plans -> Verification -> Release Acceptance
```

## Mapping Với Tài Liệu Mẫu

| Tài liệu mẫu | Mục đích | Tài liệu CareFlow hiện tại | Trạng thái |
| --- | --- | --- | --- |
| Stakeholder/Approval | Người duyệt, approval gate, sensitive-data boundary | `docs/00-project/stakeholder-and-approval-matrix.md` | Có baseline |
| AI Agent Workflow | Quy trình agent từ input tới deploy/feedback | `docs/00-project/ai-agent-delivery-workflow.md` | Có baseline |
| BRD | Mục tiêu nghiệp vụ, stakeholder, scope, business rules | `docs/01-requirements/business-requirements.md`, `docs/00-project/vision.md`, `docs/00-project/scope.md` | Có BRD baseline |
| PRD | Product requirements, persona, user stories, acceptance criteria | `docs/01-requirements/product-requirements.md`, `docs/01-requirements/user-stories.md`, `docs/02-product/workflows.md`, `docs/02-product/frontend-mvp-spec.md` | Có PRD baseline |
| SRS | Software requirements chi tiết | `docs/01-requirements/software-requirements-specification.md`, `docs/01-requirements/v1-traceability-matrix.md`, `docs/02-product/workflows.md` | Có SRS baseline |
| ARCHITECTURE | Kiến trúc tổng thể | `docs/03-architecture/frontend-architecture.md`, `docs/03-architecture/backend-architecture.md`, `docs/03-architecture/data-model.md`, `docs/03-architecture/security-notes.md`, `docs/03-architecture/audit-data-governance.md` | Có frontend và backend baseline |
| TECHNICAL-DESIGN | Thiết kế kỹ thuật chi tiết | `docs/03-architecture/backend-architecture.md`, `docs/03-architecture/frontend-architecture.md`, `docs/04-planning/*-plan.md` | Có as-built architecture và implementation records |
| UC-API-SPEC | Use case và API specification | `docs/03-architecture/api-contract.md`, `docs/03-architecture/openapi.json` | Có markdown contract và OpenAPI baseline |
| SEQUENCE | Sequence cho flow chính | `docs/03-architecture/sequence-diagrams.md`, `docs/02-product/workflows.md`, `docs/02-product/appointment-states.md`, `docs/03-architecture/api-contract.md` | Có sequence baseline |
| DATABASE/ERD | Schema và quan hệ database | `docs/03-architecture/database-erd.md`, `docs/03-architecture/data-model.md`, `docs/03-architecture/database-schema.md` | Có schema reference và ERD Mermaid |
| Frontend DESIGN | Design tokens, layout, accessibility, responsive rules | `docs/03-architecture/frontend-design-system.md` | Có bản baseline |
| Frontend README | Setup, scripts, mock/API boundary, auth/session và verification | `apps/web/README.md` | Source of truth cho web runtime |
| Backend README | Setup, scripts, local database, seed accounts, API resources và verification | `apps/api/README.md` | Source of truth cho API runtime |
| Backend RUNBOOK | Operational checks for request IDs, database, migrations, seed guard and auth failures | `docs/03-architecture/backend-runbook.md` | Baseline |
| Backend AUDIT/DATA GOVERNANCE | Audit coverage, patient projection and sensitive log rules | `docs/03-architecture/audit-data-governance.md` | Baseline |
| MVP Release Readiness | Tổng quan release candidate, branch/commit, verification và deployment gate | `docs/04-planning/mvp-release-readiness.md` | Release candidate đã push/deploy; Render health/login smoke pass |
| MVP Release Completion | Kế hoạch subagent-driven để tích hợp authorization hardening, chạy full verification, cập nhật docs và chuẩn bị deploy | `docs/04-planning/mvp-release-completion-plan.md` | Hoàn thành; production smoke pass sau manual deploy latest commit |
| CareFlow V1 Delivery Roadmap | Roadmap từ MVP release candidate tới CareFlow v1 hoàn chỉnh trong phạm vi đã chốt | `docs/04-planning/careflow-v1-delivery-roadmap.md` | Đã duyệt hướng tổng thể; mỗi phase sau vẫn cần plan riêng |
| CareFlow V1 Subagent Execution | Kế hoạch điều phối workstream v1 bằng subagent-driven development | `docs/04-planning/careflow-v1-subagent-execution-plan.md` | Đã duyệt execution map; push/deploy vẫn cần gate riêng |
| CareFlow V1 Traceability Matrix | Link từng requirement v1 tới product docs, architecture/API docs, implementation plans và verification evidence | `docs/01-requirements/v1-traceability-matrix.md` | Accepted |
| CareFlow V1 Acceptance Package | Checklist cuối để người dùng duyệt release v1 mà không cần đọc chat history | `docs/06-testing/v1-acceptance-package.md` | Accepted |
| Test Traceability | Mapping requirement tới test/evidence | `docs/06-testing/test-case-traceability.md` | Có baseline |
| Agent Lessons Learned | Bài học brief/agent/subagent/deploy | `docs/05-history/agent-lessons-learned.md` | Có baseline |
| Documentation Completion | Kế hoạch bổ sung tài liệu trước cleanup | `docs/04-planning/documentation-completion-plan.md` | Complete |
| Account Administration | Kế hoạch Phase 2 cho auth/account lifecycle: patient registration, password change, admin reset/status actions và account UI | `docs/04-planning/account-administration-plan.md` | Deployed complete trên Render |
| Scheduling Operations | Kế hoạch Phase 3 cho schedule management UI, blocked/leave intervals và availability explanation | `docs/04-planning/scheduling-operations-plan.md` | Deployed complete trên Render |
| Production Demo Operations | Kế hoạch Phase 4 cho Render/Neon operations, smoke script, deploy hook hardening và runbook closure | `docs/04-planning/production-demo-operations-plan.md` | Deployed complete trên Render |
| V1 Documentation Closure | Kế hoạch Phase 5 cho traceability, acceptance package và release documentation closure | `docs/04-planning/v1-documentation-closure-plan.md` | Complete; accepted by product owner |

## Đánh Giá Sau Nghiệm Thu V1

### Source Of Truth Đã Ổn

- Có cấu trúc docs rõ theo nhóm project, requirements, product, architecture, planning, history và testing.
- Có stakeholder/approval matrix và AI agent delivery workflow để ghi rõ ai duyệt, việc nào cần approval, tool access và dữ liệu nhạy cảm không được đưa cho agent.
- Có policy tiếng Việt mặc định cho tài liệu hướng dự án/người dùng; tài liệu agent-only có thể dùng tiếng Anh khi tooling yêu cầu và phải có bản tổng quan tiếng Việt khi ảnh hưởng tới tiến độ.
- Có change requests, changelog và decision log.
- Có BRD/PRD/SRS baseline để map mục tiêu nghiệp vụ, yêu cầu sản phẩm và yêu cầu phần mềm theo bộ quy trình AI Agent.
- Có conceptual data model đủ tốt hơn bản nháp ban đầu.
- Có database ERD Mermaid để nhìn quan hệ chính mà không phụ thuộc ảnh tĩnh.
- Có sequence diagrams cho các luồng chính: đăng ký/đăng nhập, đặt lịch, xác nhận/check-in, bác sĩ khám, admin schedule và production smoke.
- Có appointment states và workflows cơ bản.
- Có frontend architecture direction.
- Có frontend MVP spec với personas, routes, screen specs, workflows, MoSCoW priority và acceptance criteria.
- Có frontend design system baseline cho design principles, tokens, layout, component rules, accessibility và responsive behavior.
- Có frontend implementation plan chi tiết được giữ làm lịch sử scaffold `apps/web` và triển khai frontend MVP theo task.
- Đã có frontend MVP chạy với mock data, README setup/verification và Playwright smoke coverage cho patient, doctor và operations workflows.
- Có frontend polish plan để gom UI/UX follow-up sau khi người dùng review bản MVP đầu tiên; Doctor Workspace đã polish phần điều hướng lịch ngày/tuần, App Shell đã polish sidebar/navigation, mobile navigation và TopBar notification panel, Patient Portal đã polish service browsing, booking clarity và appointment history, Operations Workspace đã polish automated scope cho queue/calendar/create appointment flow, Admin Workspace đã polish dashboard/forms/tables/audit filters ở automated scope, P6 đã bổ sung responsive/accessibility smoke ở 360/768/1280/1440.
- Có API contract v1 với conventions, response/error envelopes, auth/catalog/scheduling/appointment/audit/notification endpoints và OpenAPI machine-readable baseline.
- Có backend implementation plan cho Node.js/NestJS/Prisma/PostgreSQL theo từng package có test/verification.
- Có backend architecture reference mô tả module boundaries, request lifecycle, auth/RBAC, validation, appointment workflow, conflict engine, audit/notification boundary và testing gates.
- Có database schema reference cho Prisma/PostgreSQL tables, enums, indexes, seed dataset và schema change rules.
- Có backend README cho setup local, seed accounts, scripts, verification gate và CI.
- Có backend runbook baseline cho request correlation, database, migration, seed guard và auth failure checks.
- Có audit/data governance baseline cho audit coverage, patient projection và sensitive log rules.
- Có backend next steps plan bằng tiếng Anh để agent/subagent tiếp tục auth hardening, deployment, observability, audit/data governance và scheduling depth follow-up.
- Có tài liệu tổng quan mức độ sẵn sàng release bằng tiếng Việt tại `docs/04-planning/mvp-release-readiness.md`, dùng để trả lời trạng thái triển khai bằng dẫn chứng docs/branch/commit/verification.
- Có release candidate đã verified và deploy: authorization hardening đã tích hợp vào `main`, API/Web gates pass, Render health/login smoke pass và docs/release notes đã được đồng bộ.
- Có roadmap CareFlow v1 tại `docs/04-planning/careflow-v1-delivery-roadmap.md`, định nghĩa đích cuối cho v1 và các phase sau MVP release candidate.
- Có kế hoạch điều phối subagent-driven tại `docs/04-planning/careflow-v1-subagent-execution-plan.md`, chia các package v1 theo thứ tự triển khai và verification gate.
- Có kế hoạch Phase 2 tại `docs/04-planning/account-administration-plan.md`, ưu tiên authentication-first và đã deploy complete.
- Có kế hoạch Phase 3 tại `docs/04-planning/scheduling-operations-plan.md`, tập trung vào Scheduling Operations UI, blocked/leave intervals và availability explanation; Phase 3 đã deployed complete trên Render.
- Có kế hoạch Phase 4 tại `docs/04-planning/production-demo-operations-plan.md`, tập trung vào smoke script, deploy hook hardening và runbook vận hành demo; Phase 4 đã deployed complete trên Render.
- Có Phase 5 documentation closure gồm `docs/04-planning/v1-documentation-closure-plan.md`, `docs/01-requirements/v1-traceability-matrix.md` và `docs/06-testing/v1-acceptance-package.md` để người dùng duyệt v1 không cần đọc chat history.
- Có test-case traceability baseline để nối requirement area với unit, integration, E2E, production smoke và acceptance evidence.
- Có agent lessons learned để ghi lại bài học brief, subagent, review gate, deploy và production smoke cho các vòng sau.

### Còn Thiếu So Với Mẫu Nhưng Không Block V1

- Một số tài liệu cũ trong `docs/04-planning/` và `docs/superpowers/plans/` vẫn cần planning index để phân biệt source of truth, implementation record, superseded record và reference-only record.
- BRD/PRD/SRS/Sequence/ERD đã có baseline, nhưng chưa cần mở rộng thành bản enterprise dài như mẫu nếu scope vẫn là v1/demo.
- Test traceability hiện map theo requirement area; nếu dự án vào giai đoạn production thật có thể tách tới từng test case/spec file.
- Rollback runbook vẫn nên chi tiết hơn theo tình huống DB/API/Web failure nếu triển khai cho phòng khám thật.

## Khuyến Nghị Bước Tiếp Theo

Thứ tự nên làm tiếp:

1. Tạo planning index để phân loại plan nào còn active, plan nào là implementation record, plan nào đã superseded trước khi dọn dẹp tài liệu.
2. Tạo plan riêng cho V1.1 Real Clinic Readiness trước khi thêm feature hoặc refactor runtime.
3. Ghi mọi yêu cầu mới vào `docs/01-requirements/change-requests.md` trước khi triển khai, bao gồm homepage public.
4. Xin approval rõ trước khi push hoặc deploy thay đổi ảnh hưởng shared `main` hoặc production.
5. Duy trì OpenAPI spec đã checked-in khi endpoint behavior thay đổi.
