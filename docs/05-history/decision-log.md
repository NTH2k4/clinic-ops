# Nhật Ký Quyết Định

## DEC-001: Xây Frontend Trước

Ngày: 2026-08-24

Quyết định: Xây frontend prototype trước với `mock data`, sau đó mới triển khai backend.

Lý do: Rủi ro lớn nhất ở giai đoạn đầu là độ rõ của product workflow. Frontend-first development giúp nhìn thấy appointment flow, role behavior và dashboard structure trước khi chốt backend schemas.

## DEC-002: Dùng React + Vite + TypeScript

Ngày: 2026-08-24

Quyết định: Dùng React, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, lucide-react, Vitest và React Testing Library cho frontend.

Lý do: Stack này phù hợp với ứng dụng vận hành nhiều dashboard, forms, validation, routing, server-state boundaries và frontend tests tập trung.

## DEC-003: Giữ Scope Y Tế Ở Mức Nhẹ

Ngày: 2026-08-24

Quyết định: Không đưa medical records đầy đủ, prescriptions, insurance, real payment, telemedicine hoặc external notifications vào MVP.

Lý do: Các tính năng này kéo theo độ phức tạp lớn về compliance, security và vận hành, vượt quá milestone sản phẩm đầu tiên.

## DEC-004: Dùng Tiếng Việt Cho Tài Liệu Hướng Dự Án

Ngày: 2026-08-24

Quyết định: Dùng tiếng Việt theo mặc định cho tài liệu hướng dự án vì CareFlow hướng đến người dùng Việt Nam. Giữ technical terms, framework names, API names và thuật ngữ chuyên ngành bằng tiếng Anh khi rõ nghĩa hơn dịch ép sang tiếng Việt.

Lý do: Tài liệu tiếng Việt giúp product intent, requirements và review conversations bám sát người dùng mục tiêu, đồng thời vẫn giữ độ chính xác kỹ thuật ở những nơi tiếng Anh là chuẩn.

## DEC-005: Viết Docs Cho Cả Người Và Agent

Ngày: 2026-08-24

Quyết định: Tài liệu CareFlow phải được viết như contract chung cho human contributors và agent contributors. Docs cần nêu rõ scope, quyết định, ràng buộc, acceptance criteria, verification notes và liên kết liên quan thay vì chỉ ghi chú ngắn.

Lý do: Dự án được phát triển theo quy trình nhiều bước, có thể dùng agent để đọc/sửa/triển khai. Docs chuyên nghiệp giúp giảm đoán mò, tránh lệch scope và làm cho review dễ kiểm chứng hơn.

## DEC-006: Chốt Open Questions Cho Frontend MVP

Ngày: 2026-08-25

Quyết định: Patient-created appointment mặc định là `requested`; staff-created appointment mặc định là `confirmed`; patient có thể chọn doctor cụ thể hoặc any available doctor; receptionist/nurse dùng chung operations workspace; theme switcher không nằm trong frontend MVP.

Lý do: Các quyết định này giảm scope và edge case cho MVP nhưng vẫn phản ánh vận hành thực tế của phòng khám. Frontend có thể tập trung vào booking flow, queue, dashboard và responsive UX trước khi mở rộng role separation hoặc theming.

## DEC-007: Backend Stack

Ngày: 2026-08-26

Quyết định: Dùng Node.js 22+, NestJS, TypeScript, Prisma và PostgreSQL cho backend CareFlow.

Lý do: NestJS phù hợp API contract-first, guard/interceptor/DTO validation và module boundaries theo domain như auth, catalog, appointments, audit và notifications. Prisma giúp schema/migration rõ ràng, TypeScript type-safe và dễ seed dữ liệu demo từ frontend mock dataset. PostgreSQL phù hợp dữ liệu quan hệ như appointments, schedules, audit events và transactional conflict validation.

## DEC-008: English-First Documentation For Agent Execution

Date: 2026-08-26

Decision: New documentation should use English by default. Documentation intended for AI agents or subagents, especially implementation plans, work packages, review handoffs, verification instructions and architecture references, must use English.

Reason: Agent and subagent execution is more reliable when task instructions, technical terms, file paths, commands and acceptance criteria are written in English. Existing Vietnamese documents can remain until they are materially updated, but new backend and planning references should not extend the mixed-language surface.

## DEC-009: Hoàn Tất MVP Release Trước Khi Mở Feature Mới

Ngày: 2026-08-27

Quyết định: Sau khi frontend và backend đều có baseline, bước tiếp theo là hoàn tất MVP release candidate thay vì mở thêm feature mới. Phạm vi release completion gồm tích hợp authorization hardening, chạy full local verification, cập nhật docs/status/release notes và chuẩn bị push/deploy nếu người dùng duyệt.

Lý do: Dự án hiện đã có frontend, backend, API integration, Render deployment path và authorization hardening trên branch riêng. Việc có giá trị nhất là đưa baseline này về trạng thái sạch, traceable và có thể deploy, rồi mới tiếp tục các slice lớn hơn như user administration, password reset hoặc schedule management UI.

## DEC-010: Chốt Đích CareFlow V1 Theo Hướng Production-Like Demo

Ngày: 2026-08-27

Quyết định: Đích cuối cho CareFlow v1 là một production-like demo có thể kiểm chứng end-to-end trên Render Free + Neon Free, bao gồm appointment operations, API-backed frontend, account administration foundation, scheduling operations UI, deploy/runbook và v1 acceptance closure. Các hạng mục EHR đầy đủ, prescription, insurance, payment, telemedicine, external notification provider, multi-branch và compliance certification không nằm trong v1.

Lý do: Người dùng cần kế hoạch rõ để đi đến kết quả cuối cùng nhưng vẫn không có ngân sách cho hạ tầng/dịch vụ trả phí. V1 nên tập trung hoàn thiện một sản phẩm demo vận hành được, traceable và có thể review, thay vì mở các mảng domain/compliance vượt quá khả năng hoàn thành trong scope hiện tại.
