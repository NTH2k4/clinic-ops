# Frontend API Integration Plan

## Mục Tiêu

Phase 4 thay các service mock trong `apps/web` bằng CareFlow API tại `/api/v1` mà không đổi route-level UI hoặc TanStack Query consumer boundaries. Backend là source of truth cho auth, authorization, appointment conflict, status transition và audit log. API integration baseline đã hoàn thành cho v1 MVP flows; mock mode vẫn là default local runtime để giữ demo/prototype độc lập, còn Render production build dùng API mode same-origin.

Không thêm payment, insurance, prescription, telemedicine hoặc external notification provider vào API v1.

## Trạng Thái Hiện Tại

- Frontend API integration đã merge vào `main`.
- API-mode Playwright gate đã pass sau authorization hardening merge: 5/5 browser tests.
- Backend đã có persisted bearer sessions trong PostgreSQL với token hash, expiry và logout revocation; không còn là in-memory session store.
- Frontend vẫn cố ý giữ session token trong React provider state, không persist vào `localStorage`, `sessionStorage` hoặc IndexedDB.
- Các flow auth, catalog, patients, appointments, notifications và audit đã có API service boundary trong frontend; admin user administration và scheduling operations UI là các slice v1 sau, không thuộc plan này.

## Cấu Hình Và Chế Độ Dữ Liệu

Thêm các biến môi trường Vite sau:

```text
VITE_DATA_SOURCE=mock
VITE_API_BASE_URL=/api/v1
```

- `VITE_DATA_SOURCE=mock` là default và giữ nguyên fixtures, `mockStore`, role switcher demo và tất cả scripts hiện tại.
- `VITE_DATA_SOURCE=api` chọn API services cho toàn bộ feature đã được migrate. Không trộn mock read với API mutation trong cùng một workflow.
- `VITE_API_BASE_URL` chỉ được dùng khi data source là `api`; production phải trỏ đến backend cùng origin hoặc CORS đã được cấu hình rõ ràng.
- Test và Playwright chọn mode qua environment. Mock smoke hiện tại chạy với `mock`; API smoke dùng `api` và database seed tách biệt.

## Cấu Trúc API Client

Thêm `apps/web/src/lib/api/` với các module nhỏ:

```text
api/
  http.ts             # fetch wrapper, Authorization header, envelope parsing
  types.ts            # ApiSuccess, ApiError và pagination meta
  errors.ts           # ApiClientError theo error.code và fields
  auth.ts
  catalog.ts          # doctors, specialties, services
  patients.ts
  appointments.ts
  notifications.ts
  audit-events.ts
  mappers.ts          # API DTO sang types UI hiện có
```

`http.ts` nhận base URL và session token từ AuthProvider, gửi `Authorization: Bearer <token>`, parse `{ data, meta }`, và chuyển `{ error, meta }` thành `ApiClientError`. Error giữ `code`, `message`, `fields` và `requestId` để form hiển thị field error và telemetry có thể truyền request ID. `401 UNAUTHENTICATED` xóa session, clear TanStack Query cache và đưa người dùng về login; `403 FORBIDDEN` hiển thị trạng thái không được phép mà không retry.

`mappers.ts` là nơi duy nhất đổi tên/shape DTO nếu cần. Date-only luôn là ISO `yyyy-MM-dd`; datetime luôn là ISO 8601 có timezone. UI không tự tính `endAt`, status, audit event hoặc conflict result.

## Thay Thế Auth Session

1. Đổi `AuthProvider` từ `mockStore` sang `authApi.login`, `authApi.logout` và `authApi.me` khi `VITE_DATA_SOURCE=api`.
2. Giữ session token trong state của provider trong Phase 4 để tránh browser persistence. Backend persist bearer sessions dưới dạng token hash trong PostgreSQL với expiry/revocation, nhưng reload page vẫn đăng xuất ở frontend vì token không được lưu trong browser storage.
3. Sau login thành công, lưu `currentUser` và `linkedProfile`, sau đó invalidate query theo user. Tất cả role và ownership UI lấy từ response này, không từ role switcher.
4. `signOut` gọi `POST /auth/logout`, clear token và `queryClient.clear()`. Error login chỉ hiển thị message từ API, không lưu password hay token vào localStorage, sessionStorage hoặc IndexedDB.
5. Role switcher demo chỉ tồn tại trong mock mode; API mode không cung cấp cơ chế giả mạo role.

## Query Và Mutation Migration

Di chuyển từng feature sau service boundary hiện có, không để component/route gọi `fetch` trực tiếp:

| Feature | Thay mock service | Query/mutation va invalidation |
| --- | --- | --- |
| Auth | `AuthProvider` | Login, logout, me; clear cache khi logout. |
| Catalog | mock fixtures/selectors | `doctors`, `specialties`, `services`; key gồm filter, invalidate catalog sau admin change. |
| Patient | mock patient service/store | patient list/detail/create/update; invalidate patient và appointment keys liên quan. |
| Appointments | `appointmentService` | list/detail, create, reschedule, cancel, confirm, check-in, start, complete, no-show; invalidate appointment list/detail, dashboard và notification keys sau mutation. |
| Notifications | mock store | list, mark read, mark all read; cập nhật optimistic chỉ khi API error rollback được. |
| Audit | mock store | admin-only audit list theo filters; refetch sau appointment/admin mutation. |

Khi create appointment, frontend gửi `patientId`, `doctorId`, `serviceId`, `startAt`, reason và source; backend tự tính `endAt`, kiểm tra schedule/conflict, ghi audit, và đặt `requested` cho patient hoặc `confirmed` cho staff. Status buttons phải gọi transition endpoint phù hợp, sau đó render response của backend. Admin delete luôn gọi deactivate endpoint, không hard delete.

Trước khi migrate một page mới sang API mode, endpoint read và mutation cần thiết phải có trong backend và có E2E coverage. Các endpoint auth, availability, appointment list/detail/workflow transitions, patient list/detail/create/update, catalog administration, notifications, audit và doctor schedule backend APIs đã có implementation baseline. Các dependency còn lại cho v1 sau plan này là admin user/account lifecycle UI/API slice và scheduling operations UI cho quản lý working slots, blocked intervals và leave periods. Không che giấu gap bằng client-side conflict hoặc status validation.

## Playwright Regression Gates

Giữ các mock smoke hiện tại để bảo vệ prototype. Thêm API suite chạy với `VITE_DATA_SOURCE=api`, backend đang chạy và database seed cố định:

1. Login patient, tạo appointment, và assert status `requested`; retry một slot trùng và assert API error `APPOINTMENT_CONFLICT`.
2. Login receptionist, tạo appointment và assert `confirmed`, check-in appointment confirmed, và assert queue refetch.
3. Login doctor, start appointment checked-in, complete appointment in-progress, và assert terminal appointment không hiện action reschedule.
4. Login admin, deactivate catalog resource qua API và assert resource còn lịch sử nhưng không xuất hiện trong active workflow.
5. Assert unauthorized route chuyển về login, forbidden action không cập nhật UI, và notification read state được refetch.

CI API-mode setup phải migrate, seed và khởi động API bằng test `DATABASE_URL`; Playwright test data dùng seed ID ổn định và không chia sẻ state giữa test. Cả mock và API suite đều phải qua trước khi bỏ mock boundary của một feature.

## Trình Tự Thực Hiện

1. Đã thêm config switch, HTTP client, envelope/error types và auth API; default mock được giữ cho local runtime.
2. Đã migrate read-only catalog, patient và appointment workflows theo endpoint coverage backend.
3. Đã migrate notifications và audit, đồng thời thêm API Playwright gates cho các workflow chính.
4. Chưa chuyển local default sang `api`; chỉ Render production build dùng API mode same-origin. Không bỏ mock implementation trong một thay đổi lớn vì mock vẫn hữu ích cho prototype và regression coverage.
