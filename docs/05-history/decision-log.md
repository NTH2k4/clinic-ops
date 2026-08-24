# Decision Log

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
