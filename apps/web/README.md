# CareFlow Web

CareFlow Web là React frontend cho CareFlow v1: patient portal, doctor workspace, operations workspace, admin views, auth entry và account administration. App hỗ trợ hai data source: `mock` cho local UI development và `api` cho production/API-mode regression.

## Requirements

- Node.js 22 trở lên
- npm hoặc yarn
- Backend local chỉ cần khi chạy API mode hoặc Playwright API regression.

## Phát Triển

```bash
npm ci
npm run dev
```

Vite hiện URL local trong terminal. Để kiểm tra từ thiết bị khác trong cùng mạng:

```bash
npm run dev -- --host 0.0.0.0
```

## Data Source Modes

Fixtures khởi tạo nằm ở `src/mocks/fixtures.ts`; `src/mocks/mockStore.ts` tạo in-memory mutable store cho mỗi phiên chạy. Các mutation appointment đi qua `src/features/appointments/appointmentService.ts`, đóng vai trò mock API boundary.

API mode đã được triển khai qua service boundaries trong `src/lib/api` và từng feature service. Route-level UI không gọi HTTP trực tiếp; TanStack Query và feature components dùng cùng consumer boundary ở cả mock/API mode.

API integration dùng `VITE_DATA_SOURCE=mock|api` và `VITE_API_BASE_URL=/api/v1`; `mock` là default local mode. Render production build dùng `api` same-origin, còn GitHub Pages dùng static mock-mode preview.

Các màn hình vận hành dùng timezone phòng khám `Asia/Ho_Chi_Minh` để xác định ngày mặc định. Mock và Playwright fixtures có thể đóng băng clock riêng trong test để giữ dữ liệu mẫu ổn định, nhưng runtime production không dùng ngày hard-code.

## Auth Và Session

Mock mode dùng mock auth để demo theo role. API mode dùng backend auth contract: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/change-password` và `POST /auth/logout`. Session token chỉ giữ trong memory; app không lưu password hoặc bearer token trong localStorage, sessionStorage, IndexedDB hay persisted mock state.

Sau khi đổi mật khẩu ở API mode, backend revoke session hiện có và frontend yêu cầu đăng nhập lại.

## Scripts

| Lệnh | Mục đích |
| --- | --- |
| `npm run dev` | Chạy Vite development server. |
| `npm test -- --run` | Chạy Vitest một lần. |
| `npm run typecheck` | Kiểm tra TypeScript project references. |
| `npm run lint` | Chạy ESLint. |
| `npm run build` | Typecheck và build production bundle. |
| `npm run e2e` | Chạy Playwright mock smoke tests và tự khởi động Vite server. |
| `DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run e2e:api` | Migrate/seed API local rồi chạy Playwright API regression tests. |

`npm run e2e` giữ mock mode là mặc định và không cần backend. `e2e:api` cần PostgreSQL local, dependencies đã cài trong `apps/api`, và `DATABASE_URL`; runner sẽ generate Prisma client, apply migrations, seed dữ liệu demo, khởi động API ở port 3000, rồi chạy Vite API mode ở port 4174. Vite proxy `/api/v1` tới API local để browser test dùng cùng origin. Render production build dùng API mode same-origin qua `VITE_DATA_SOURCE=api` và `VITE_API_BASE_URL=/api/v1`.

## Responsive QA Và Verification

Playwright bao phủ patient booking ở viewport 360 x 800, doctor/operations flows ở desktop 1280 x 800, responsive overflow smoke ở 360, 768, 1280 và 1440, cùng keyboard smoke cho role switcher, notification panel và doctor detail drawer. Chạy đầy đủ trong thư mục này:

```bash
npm test -- --run
npm run typecheck
npm run lint
npm run build
npm run e2e
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run e2e:api
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
- [API contract](../../docs/03-architecture/api-contract.md)
- [Acceptance checklist](../../docs/06-testing/acceptance-checklist.md)

## CI/CD

GitHub Actions dùng hai workflow:

- `Web CI`: chạy khi có Pull Request vào `main` hoặc push lên `main`, kiểm tra test, typecheck, lint, build, mock e2e, API-mode e2e với PostgreSQL service, và upload artifact `careflow-web-dist`.
- `Web Pages`: chạy khi `main` thay đổi hoặc chạy thủ công bằng `workflow_dispatch`, build với `mode github-pages` rồi deploy `apps/web/dist` lên GitHub Pages.
- `Render Deployment`: ghi deployment URL của single-service Render app vào GitHub Deployments khi repo variable `RENDER_EXTERNAL_URL` đã được set.

GitHub Pages cần bật source **GitHub Actions** trong repository settings. Khi deploy thành công, app có URL dạng:

```text
https://nth2k4.github.io/clinic-ops/
```

GitHub Pages build dùng Vite base `/clinic-ops/`. `AppProviders` truyền base này vào `BrowserRouter` dưới dạng basename để navigation nội bộ giữ đúng `/clinic-ops/app/...` thay vì rơi về domain root `/app/...`.
