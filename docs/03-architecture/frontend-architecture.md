# Frontend Architecture

## Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query
- React Hook Form
- Zod
- lucide-react
- Vitest
- React Testing Library

## Định Hướng

Giai đoạn implementation đầu tiên là frontend-first. App cần dùng typed `mock data` và mock service functions phản ánh API contract sau này.

## Cấu Trúc Đề Xuất

```text
src/
  app/
  components/
  features/
    appointments/
    patients/
    doctors/
    services/
    dashboard/
    audit/
    auth/
  lib/
  mocks/
  routes/
  test/
  types/
```

## Nguyên Tắc

- Giữ các feature modules độc lập.
- Đặt mock APIs sau service boundaries.
- Dùng shared types cho data models.
- Tránh assumptions phụ thuộc backend cho đến khi API contract được duyệt.
- Xây UI dạng operational, dense và dễ scan thay vì marketing-style pages.
