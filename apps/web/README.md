# CareFlow Web

CareFlow Web là frontend-first MVP cho quy trình đặt lịch khám, doctor workspace, operations workspace và admin views. App chạy hoàn toàn với `mock data`; không cần backend để phát triển, test hoặc demo.

## Requirements

- Node.js 22 trở lên
- npm hoặc yarn
- Không cần backend, database hay tài khoản dịch vụ ngoài

## Phát Triển

```bash
npm ci
npm run dev
```

Vite hiện URL local trong terminal. Để kiểm tra từ thiết bị khác trong cùng mạng:

```bash
npm run dev -- --host 0.0.0.0
```

## Mock API Và Đường Hướng API Thật

Fixtures khởi tạo nằm ở `src/mocks/fixtures.ts`; `src/mocks/mockStore.ts` tạo in-memory mutable store cho mỗi phiên chạy. Các mutation appointment đi qua `src/features/appointments/appointmentService.ts`, đóng vai trò mock API boundary.

Khi có backend, thay implementation của service boundary bằng API client (và chuyển fixtures/mock store thành test fixtures) mà không để route-level UI gọi HTTP trực tiếp. TanStack Query và feature components giữ nguyên consumer boundary.

## Auth Và Session

Đây là mock auth để demo theo role. Session chỉ được giữ trong React state, không có real authentication và không lưu password trong localStorage, sessionStorage, IndexedDB hay persisted mock state.

## Scripts

| Lệnh | Mục đích |
| --- | --- |
| `npm run dev` | Chạy Vite development server. |
| `npm test -- --run` | Chạy Vitest một lần. |
| `npm run typecheck` | Kiểm tra TypeScript project references. |
| `npm run lint` | Chạy ESLint. |
| `npm run build` | Typecheck và build production bundle. |
| `npm run e2e` | Chạy Playwright smoke tests và tự khởi động Vite server. |

## Responsive QA Và Verification

Playwright bao phủ patient booking ở viewport 360 x 800, doctor/operations flows ở desktop 1280 x 800, responsive overflow smoke ở 360, 768, 1280 và 1440, cùng keyboard smoke cho role switcher, notification panel và doctor detail drawer. Chạy đầy đủ trong thư mục này:

```bash
npm test -- --run
npm run typecheck
npm run lint
npm run build
npm run e2e
git diff --check
```

Automated smoke hiện kiểm tra page-level horizontal overflow ở các workspace chính:

- Patient ở 360 x 800.
- Operations ở 768 x 900.
- Doctor ở 1280 x 800.
- Admin ở 1440 x 900.

Manual responsive follow-up vẫn nên dùng `npm run dev -- --host 0.0.0.0` để xem visual polish thực tế trên thiết bị, đặc biệt text overlap trong button, card và status badge.

## Architecture

- [Frontend MVP spec](../../docs/02-product/frontend-mvp-spec.md)
- [Frontend design system](../../docs/03-architecture/frontend-design-system.md)
- [Frontend architecture](../../docs/03-architecture/frontend-architecture.md)
- [Frontend implementation plan](../../docs/04-planning/frontend-implementation-plan.md)
- [Acceptance checklist](../../docs/06-testing/acceptance-checklist.md)

## CI/CD

GitHub Actions dùng hai workflow:

- `Web CI`: chạy khi có Pull Request vào `main` hoặc push lên `main`, kiểm tra test, typecheck, lint, build, e2e và upload artifact `careflow-web-dist`.
- `Web Pages`: chạy khi `main` thay đổi hoặc chạy thủ công bằng `workflow_dispatch`, build với `mode github-pages` rồi deploy `apps/web/dist` lên GitHub Pages.

GitHub Pages cần bật source **GitHub Actions** trong repository settings. Khi deploy thành công, app có URL dạng:

```text
https://nth2k4.github.io/clinic-ops/
```
