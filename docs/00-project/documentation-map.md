# Documentation Map

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
| ARCHITECTURE | Kiến trúc tổng thể | `docs/03-architecture/frontend-architecture.md`, `docs/03-architecture/data-model.md`, `docs/03-architecture/security-notes.md` | Có bản nhẹ |
| TECHNICAL-DESIGN | Thiết kế kỹ thuật chi tiết | Chưa có | Để sau implementation plan hoặc backend phase |
| UC-API-SPEC | Use case và API specification | `docs/03-architecture/api-contract.md` | Có draft rất nhẹ |
| SEQUENCE | Sequence cho flow chính | `docs/02-product/workflows.md`, `docs/02-product/appointment-states.md` | Có flow text, chưa có sequence chi tiết |
| DATABASE/ERD | Schema và quan hệ database | `docs/03-architecture/data-model.md` | Có conceptual model, chưa phải ERD |
| Frontend DESIGN | Design tokens, layout, accessibility, responsive rules | `docs/03-architecture/frontend-design-system.md` | Có bản baseline |
| Frontend README | Setup, scripts, proxy, verification | Chưa có vì chưa scaffold app | Sẽ tạo trong `apps/web/README.md` |

## Đánh Giá Hiện Tại

### Đã Ổn

- Có cấu trúc docs rõ theo nhóm project, requirements, product, architecture, planning, history và testing.
- Có policy dùng tiếng Việt cho tài liệu hướng dự án.
- Có change requests, changelog và decision log.
- Có conceptual data model đủ tốt hơn bản nháp ban đầu.
- Có appointment states và workflows cơ bản.
- Có frontend architecture direction.
- Có frontend MVP spec với personas, routes, screen specs, workflows, MoSCoW priority và acceptance criteria.
- Có frontend design system baseline cho design principles, tokens, layout, component rules, accessibility và responsive behavior.

### Còn Thiếu So Với Mẫu

- Chưa có `Document Control` và `Revision History` trong từng tài liệu quan trọng.
- Chưa có BRD/SRS chuẩn theo template riêng; frontend MVP spec hiện đóng vai trò PRD gọn cho phase đầu.
- Đã có persona chi tiết ở `docs/02-product/frontend-mvp-spec.md`, nhưng chưa có stakeholder matrix riêng.
- Đã có MoSCoW priority và acceptance criteria cho frontend MVP, nhưng chưa có trace đầy đủ theo từng requirement/user story.
- Chưa có traceability matrix.
- Chưa có API response standard, error code convention và endpoint detail.
- Chưa có sequence diagram/spec cho các flow chính.
- Chưa có ERD/backend database schema.

## Khuyến Nghị Bước Tiếp Theo

Thứ tự nên làm tiếp:

1. Viết `docs/04-planning/frontend-implementation-plan.md`.
2. Scaffold `apps/web`.
3. Sau khi frontend prototype ổn, viết API spec, sequence và backend design.
