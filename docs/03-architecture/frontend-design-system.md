# Frontend Design System

## Kiểm Soát Tài Liệu

| Mục | Nội dung |
| --- | --- |
| Tên tài liệu | Frontend Design System |
| Sản phẩm | CareFlow - Đặt lịch khám online |
| Phiên bản | 1.4 |
| Ngày | 2026-09-02 |
| Trạng thái | v1 accepted |
| Phạm vi | Design system as-built cho CareFlow v1 web app |
| Đối tượng đọc | Product owner, frontend developer, QA, agent contributors |

## Lịch Sử Phiên Bản

| Phiên bản | Ngày | Nội dung thay đổi |
| --- | --- | --- |
| 1.4 | 2026-09-02 | Bổ sung public homepage tại route `/` và làm rõ khác biệt giữa landing page public với authenticated app shell. |
| 1.3 | 2026-08-31 | Bổ sung account workspace dùng chung, sidebar logout placement, same-day booking cutoff và skeleton/shimmer loading states cho các màn dữ liệu chính. |
| 1.2 | 2026-08-28 | Chuẩn hóa tài liệu theo trạng thái CareFlow v1 accepted: auth entry, account administration, scheduling operations, production API mode và verification gates. |
| 1.1 | 2026-08-26 | Ghi nhận production-style visual refresh cho app shell, dashboard surfaces, metric cards, timeline cards, login surface và token thực tế trong `apps/web`. |
| 1.0 | 2026-08-25 | Bản design system đầu tiên cho frontend MVP. |

## Mục Đích

Tài liệu này định nghĩa ngôn ngữ giao diện, layout, quy tắc component, accessibility và responsive behavior cho CareFlow v1 web app. Mục tiêu là giữ patient portal, doctor workspace, operations workspace, admin workspace và auth/account screens nhất quán trong cả mock mode và API-backed production mode.

Design system này là source of truth cho implementation hiện có trong `apps/web`. Khi thêm feature sau v1, thay đổi token, component pattern hoặc responsive behavior phải cập nhật tài liệu này cùng pull request/commit liên quan.

## Tài Liệu Liên Quan

- `docs/00-project/documentation-standards.md`
- `docs/02-product/frontend-mvp-spec.md`
- `docs/02-product/appointment-states.md`
- `docs/02-product/screens.md`
- `docs/02-product/workflows.md`
- `docs/03-architecture/data-model.md`
- `docs/03-architecture/frontend-architecture.md`
- `docs/06-testing/acceptance-checklist.md`

## Nguyên Tắc Thiết Kế

### Ưu Tiên Vận Hành

Authenticated CareFlow là công cụ vận hành phòng khám, không phải landing page. Giao diện trong `/app/*` cần ưu tiên scan nhanh, thao tác lặp lại và giảm nhầm lẫn khi xử lý appointment.

Quy tắc:

- Không dùng hero section trong app shell.
- Không dùng decorative gradient/orb/background nặng.
- Dashboard dùng layout dày thông tin nhưng có tổ chức: metrics, queue, timeline, filter và table/list rõ ràng.
- Text mô tả chức năng chỉ dùng khi cần giải nghĩa domain state hoặc empty state, không dùng để quảng cáo tính năng.

### Public Homepage

Route `/` là ngoại lệ public-facing trước khi người dùng đăng nhập. Homepage được phép dùng hero ảnh thật, headline lớn và CTA marketing, nhưng vẫn phải giữ cảm giác y tế hiện đại, rõ ràng và không làm nhiễu đường vào `/login` hoặc `/register`.

Quy tắc:

- Hero dùng ảnh phòng khám/bác sĩ thật hoặc asset bitmap phù hợp, có overlay đủ tương phản.
- Hero text không đặt trong card; CTA chính dẫn tới `/register`, CTA phụ dẫn tới `/login` hoặc section nội dung.
- Section public nên giới thiệu chuyên khoa, bác sĩ tiêu biểu, quy trình đặt lịch và CTA cuối trang.
- Dữ liệu bác sĩ/chuyên khoa trên homepage là curated static content; catalog/API vẫn là source of truth cho authenticated booking flow.
- Không đưa thông tin y tế nhạy cảm, bệnh án, số điện thoại cá nhân hoặc claim điều trị chưa được xác minh vào homepage.

### Bình Tĩnh Và Chuyên Nghiệp

Visual style cần tạo cảm giác y tế hiện đại, sạch, chuyên nghiệp và ít nhiễu.

Quy tắc:

- Light theme là theme duy nhất trong MVP.
- Palette chính dùng xanh teal/blue ở mức tiết chế, kết hợp neutral background và accent phụ cho status.
- Tránh UI một màu. Status, alerts và role signals phải có nhiều hue chức năng khác nhau.
- Các bề mặt quan trọng cần độ tương phản rõ để dùng tốt trong môi trường phòng khám nhiều ánh sáng.

### Status Cần Có Text Và Tín Hiệu

Appointment status không được chỉ thể hiện bằng màu.

Quy tắc:

- Mỗi status badge phải có label text.
- Với status quan trọng hoặc action-critical, thêm icon từ `lucide-react`.
- Empty/loading/error/success state phải có text rõ và action tiếp theo nếu có.
- Disabled action cần nêu lý do bằng tooltip, helper text hoặc inline message khi phù hợp.

### Mobile Là Workflow Thực Sự

Mobile không chỉ là shrink desktop. Patient booking, appointment list và doctor day view phải dùng tốt trên điện thoại.

Quy tắc:

- Mobile ưu tiên list, stacked form và compact timeline.
- Không dùng table rộng cho mobile queue/calendar.
- Week schedule trên mobile phải chuyển thành day selector + list/timeline.
- Bottom or sticky action chỉ dùng cho primary action trong form dài, không che nội dung.

## Design Tokens

Tên token nên được map sang Tailwind config hoặc CSS variables khi scaffold frontend.

### Color Token

| Token | Hex | Cách dùng |
| --- | --- | --- |
| `color-bg` | `#F3F7F7` | Nền page |
| `color-surface` | `#FFFFFF` | Bề mặt nội dung chính |
| `color-surface-muted` | `#EDF5F4` | Vùng nhóm nhẹ, filter đang chọn |
| `color-border` | `#D4E2DF` | Border mặc định |
| `color-border-strong` | `#9FBAB5` | Border khi focus/active |
| `color-text` | `#142326` | Text chính |
| `color-text-muted` | `#52686D` | Text phụ |
| `color-text-subtle` | `#73858A` | Text metadata |
| `color-primary` | `#0F766E` | Action chính, nav active |
| `color-primary-hover` | `#0B5F59` | Hover cho action chính |
| `color-primary-soft` | `#DDF3F0` | Bề mặt primary ít nhấn mạnh |
| `color-accent` | `#2563EB` | Link, slot calendar đang chọn |
| `color-accent-soft` | `#DBEAFE` | Bề mặt accent ít nhấn mạnh |
| `color-danger` | `#B42318` | Cancel/destructive/error |
| `color-danger-soft` | `#FEE4E2` | Bề mặt danger ít nhấn mạnh |
| `color-warning` | `#B54708` | Conflict/no-show/warning |
| `color-warning-soft` | `#FEF0C7` | Bề mặt warning ít nhấn mạnh |
| `color-success` | `#027A48` | Completed/success |
| `color-success-soft` | `#D1FADF` | Bề mặt success ít nhấn mạnh |
| `color-info` | `#175CD3` | Requested/info |
| `color-info-soft` | `#D1E9FF` | Bề mặt info ít nhấn mạnh |

Ràng buộc sử dụng:

- Primary teal dùng cho action chính trong workflow, không dùng cho mọi heading hoặc icon.
- Accent blue dành cho link, slot calendar đang chọn và nhấn mạnh phụ.
- Action destructive phải dùng danger token và confirmation UI.
- Đăng xuất là destructive session action nên phải mở `ConfirmDialog` trước khi gọi logout thật.
- Text trên badge có màu phải đạt WCAG AA contrast.

### Token Cho Appointment Status

| Status | Visual token | Icon đề xuất | Ý nghĩa UI |
| --- | --- | --- | --- |
| `requested` | `color-info-soft` + `color-info` | `Clock3` | Patient request đang chờ staff xác nhận |
| `confirmed` | `color-primary-soft` + `color-primary` | `CalendarCheck` | Appointment đã lên lịch và sẵn sàng check-in |
| `checked_in` | `color-warning-soft` + `color-warning` | `UserCheck` | Patient đã đến và đang chờ |
| `in_progress` | `color-accent-soft` + `color-accent` | `Stethoscope` | Doctor đang khám cho patient |
| `completed` | `color-success-soft` + `color-success` | `CheckCircle2` | Appointment đã hoàn tất |
| `cancelled` | `color-danger-soft` + `color-danger` | `CircleX` | Appointment đã hủy |
| `no_show` | `#F2F4F7` + `#475467` | `AlertCircle` | Patient không đến |

### Token Cho Role

Role identity giúp người dùng định hướng nhưng không tạo theme riêng cho từng role.

| Role | Accent | Cách dùng |
| --- | --- | --- |
| Patient | `color-primary` | Booking flow, quick action ở patient home |
| Doctor | `color-accent` | Schedule, nhấn mạnh clinical queue |
| Receptionist/Nurse | `color-warning` | Operations queue và workload check-in |
| Admin | `#6941C6` | Định hướng cấu hình và audit |

Role accent có thể xuất hiện trong nav active state, avatar ring, label nhỏ hoặc section marker. Accent này không được ghi đè design system chung.

### Typography

Stack khuyến nghị:

```text
Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

Thang typography:

| Token | Size | Line height | Cách dùng |
| --- | --- | --- | --- |
| `text-xs` | `12px` | `16px` | Metadata, text phụ trong table |
| `text-sm` | `14px` | `20px` | Body mặc định, form helper, table cell |
| `text-md` | `16px` | `24px` | Body nhấn mạnh, form input |
| `text-lg` | `18px` | `28px` | Tiêu đề section |
| `text-xl` | `20px` | `30px` | Tiêu đề page trong app shell |
| `text-2xl` | `24px` | `32px` | Chỉ dùng cho tiêu đề dashboard cấp cao |

Quy tắc:

- Không scale font size theo viewport width.
- Letter spacing phải là `0`.
- Bề mặt app nên dùng `text-sm` và `text-md` theo mặc định.
- Không dùng typography cỡ hero trong authenticated app.

### Spacing Và Sizing

Dùng spacing base 4px.

| Token | Value | Cách dùng |
| --- | --- | --- |
| `space-1` | `4px` | Khoảng cách icon/text rất hẹp |
| `space-2` | `8px` | Khoảng cách trong button, compact row |
| `space-3` | `12px` | Khoảng cách giữa form field |
| `space-4` | `16px` | Padding card mobile, khoảng cách section |
| `space-5` | `20px` | Padding card desktop |
| `space-6` | `24px` | Khoảng cách section trong page |
| `space-8` | `32px` | Khoảng cách lớn giữa các vùng page |

Quy tắc sizing:

- Button height: `36px` compact, `40px` mặc định, `44px` cho mobile primary.
- Input height: `40px` desktop, `44px` mobile.
- Icon button: `36px` vuông trên desktop, `40px` vuông trên mobile.
- Left nav width: `240px` desktop; collapsed nav width: `72px` nếu có triển khai.
- Page max content width: `1440px`.

### Radius Và Shadow

| Token | Value | Cách dùng |
| --- | --- | --- |
| `radius-sm` | `4px` | Badge, compact field |
| `radius-md` | `6px` | Button, input |
| `radius-lg` | `8px` | Card, modal, drawer |

Quy tắc:

- Card phải giữ radius tối đa `8px`.
- Không lồng card trong card.
- Ưu tiên border, bề mặt trắng và tương phản background thay vì shadow nặng.
- Shadow nhẹ được dùng cho shell/card production refresh; shadow mạnh hơn chỉ dành cho dropdown, popover, modal, drawer và mobile bottom nav.
- Tailwind as-built dùng `shadow-panel` cho card/shell/action nổi nhẹ và `shadow-popover` cho overlay/dropdown/mobile nav.

### Focus Và Motion

Focus style:

- Outline `2px` dùng `color-accent`.
- `2px` outline offset.
- Focus phải nhìn thấy trên button, link, form control, tab, menu và appointment card có action.

Motion:

- Dùng transition `120ms-180ms` cho hover/focus/open state.
- Tránh entrance animation lớn trong màn hình vận hành.
- Tôn trọng `prefers-reduced-motion`.

Loading state:

- Dữ liệu dạng danh sách/lưới nên dùng skeleton shimmer trước khi render nội dung chính.
- Skeleton phải giữ kích thước gần với nội dung thật để tránh layout shift.
- Spinner text chỉ dùng cho trạng thái nhỏ hoặc inline; màn dữ liệu chính dùng `ShimmerList` hoặc `ShimmerGrid`.
- Skeleton phải có `role="status"` và label screen-reader tiếng Việt.

## Hệ Thống Layout

### App Shell

Shell desktop:

- Sidebar trái cho điều hướng chính theo role.
- Top bar cho role switcher, notifications và user identity.
- Nút đăng xuất nằm tách biệt ở cuối sidebar desktop hoặc cuối mobile nav; khi nhấn chỉ mở `ConfirmDialog` giữa màn hình và người dùng phải chọn "Đăng xuất khỏi hệ thống" trước khi session bị xóa.
- Notification popover phải đóng khi bấm nút đóng, chọn reference action hoặc nhấn ra ngoài popover.
- Nội dung chính dùng width có giới hạn và responsive grid.
- Sidebar expanded as-built dùng khoảng `256px`; collapsed dùng khoảng `80px`.
- Active nav dùng primary filled state để dễ scan hơn prototype outline state.
- App background dùng gradient tuyến tính rất nhẹ để tạo chiều sâu, không dùng orb/blob hoặc decorative illustration.

Shell mobile:

- Top app bar hiển thị brand compact, role switcher và notifications.
- Role switcher vẫn phải truy cập được nhưng không chiếm ưu tiên ở first screen.
- Primary nav dùng bottom navigation sticky, scroll ngang khi role có nhiều route.

Quy tắc:

- Role switcher là prototype tool và phải có độ ưu tiên thị giác thấp.
- Navigation label phải khớp mục đích route trong `frontend-mvp-spec.md`.
- Không ẩn action appointment quan trọng sau hơn một tầng menu.

### Layout Dashboard

Desktop:

- Dùng grid 12 cột.
- KPI strip ở trên cùng với 3-5 metrics.
- Vùng workflow chính chiếm 7-8 cột.
- Panel insight/activity phụ chiếm 4-5 cột.
- Mỗi dashboard role phải có header surface riêng: eyebrow, `h1`, supporting copy ngắn và primary action nếu có.
- KPI dùng `MetricCard` tone theo ý nghĩa vận hành, không dùng một tone cho toàn bộ dashboard.
- Workflow chính như operations queue hoặc doctor timeline nằm trong surface riêng để tách khỏi page background.

Mobile:

- KPI card chuyển thành horizontal scroll hoặc compact grid 2 cột.
- Queue, timeline và next appointment section xếp dọc.
- Giữ primary action gần section liên quan, không chỉ đặt ở cuối page.
- Header/action phải wrap trước khi đè lên badge hoặc button; badge status có thể xuống dòng dưới heading trên mobile.

### Forms

Form booking và create appointment nên dùng step-based layout khi có hơn bốn input nghiệp vụ.

Quy tắc:

- Patient booking flow dùng các bước rõ: service, doctor mode, slot, reason, review.
- Staff create appointment flow đặt patient search/create trước phần appointment detail.
- Validation message hiển thị dưới field.
- Vùng submit tóm tắt service, doctor, thời gian và status outcome đã chọn.
- Success state của patient-created appointment phải nói request đang chờ xác nhận.
- Success state của staff-created appointment phải nói appointment đã confirmed.

### List, Table Và Timeline

Desktop:

- Dùng table cho admin data và operations calendar khi viewport đủ rộng.
- Dùng card hoặc split list/detail cho queue và patient appointments.

Mobile:

- Thay table rộng bằng card.
- Dùng compact timeline cho doctor day và operations day schedule.
- Row action nên hiển thị bằng icon button hoặc command button ngắn, không chôn trong text dày.

Quy tắc:

- Mỗi list cần có loading, empty, error và filter-empty state.
- Sort appointments theo `startAt` trừ khi workflow cần group theo status.
- Metadata phải dễ scan: patient, doctor, service, room, time, status.

## Quy Tắc Component

### Buttons

Biến thể:

- `primary`: action chính của workflow.
- `secondary`: action thường, không phải primary.
- `ghost`: navigation/action ít nhấn mạnh.
- `danger`: cancel/destructive action.
- `icon`: tool action compact có tooltip.

Quy tắc:

- Dùng icon từ `lucide-react` trong button khi có icon rõ nghĩa.
- Không dùng text pill bo tròn để thay cho icon quen thuộc.
- Destructive action cần confirmation khi thay đổi appointment state.
- Disabled button cần nêu lý do khi điều kiện disable không hiển nhiên.

### Status Badge

Nội dung bắt buộc:

- Icon.
- Status label.
- Text tương đương cho accessibility.

Quy tắc:

- Màu badge phải map với appointment status token.
- Không dựa vào màu đơn thuần.
- Dùng label tiếng Việt nhất quán trong UI:
  - `requested`: `Chờ xác nhận`
  - `confirmed`: `Đã xác nhận`
  - `checked_in`: `Đã check-in`
  - `in_progress`: `Đang khám`
  - `completed`: `Hoàn tất`
  - `cancelled`: `Đã hủy`
  - `no_show`: `Không đến`

### Cards

Dùng card cho repeated item, appointment summary, KPI metric và nội dung modal/drawer.

Quy tắc:

- Không đặt card trong card.
- Card header nên vừa trong một hoặc hai dòng mà không đè lên action button.
- Appointment card nên chừa vùng ổn định cho status và time.
- Card có action phải có hover/focus state rõ.
- Metric cards có thể dùng tone `neutral`, `primary`, `accent`, `success`, `warning` hoặc `danger`; tone chỉ dùng để phân cấp và không thay thế label/helper text.
- Metric cards có thể hiển thị `trend` ngắn ở góc phải khi có so sánh đáng tin cậy; không tự tạo trend nếu dữ liệu không có.
- Appointment timeline card as-built dùng time block ổn định bên trái, content ở giữa và icon action bên phải.

### Filter Và Segment

Dùng segmented control cho option set nhỏ và loại trừ lẫn nhau, ví dụ group appointment status hoặc mode day/week.

Quy tắc:

- Search, filter và sort nên nằm phía trên list mà chúng tác động.
- Filter chip phải có affordance remove/reset rõ.
- Filter empty state phải nói không có kết quả khớp filter, không nói dữ liệu bị thiếu.

### Modal, Drawer Và Detail Panel

Appointment detail nên dùng:

- Drawer trên desktop khi mở từ list/calendar.
- Full-screen hoặc gần full-screen panel trên mobile.

Quy tắc:

- Action thay đổi state nằm ở panel footer hoặc fixed action area.
- Status history và audit event là section phụ.
- Completed appointment ở chế độ view-only, ngoại trừ action close/back.

### Notifications

Quy tắc:

- Notifications panel dùng timestamp, title, message và reference action.
- Unread state dùng indicator kèm text weight, không chỉ dùng màu.
- Empty state nên ngắn và trung tính.

### Date Fields

Quy tắc:

- Các field nhập ngày phải hiển thị định dạng Việt Nam `dd/MM/yyyy`, không phụ thuộc locale của trình duyệt.
- Date field dùng segment editing cho ngày, tháng và năm để người dùng sửa từng phần mà không cần xóa toàn bộ giá trị.
- Calendar popover phải dùng locale `vi-VN`; state nội bộ và mock API boundary vẫn dùng ISO `yyyy-MM-dd`.
- Ngày ngoài `min`/`max` hoặc không hợp lệ không được commit vào state nghiệp vụ.

## Hướng Dẫn Theo Màn Hình

### Sign In

- Dùng auth surface compact ở giữa màn hình, không dùng marketing page.
- Mock user có thể hiển thị dưới dạng row/card có thể chọn.
- Role và user identity phải nhìn thấy trước khi submit.
- API-mode error state không được tiết lộ password rule, token hoặc thông tin tồn tại tài khoản; mock-mode chỉ dùng demo role selection cho local prototype.
- Password fields trên login, registration và change-password dùng icon reveal/hide nằm trong chính textbox. Mỗi textbox giữ trạng thái hiển thị riêng để người dùng có thể kiểm tra từng ô nhập mà không làm thay đổi ô còn lại.
- Account page hiển thị thông tin cá nhân bằng input disabled mặc định; chỉ khi nhấn `Sửa thông tin` mới enable `Họ tên` và `Email`, kèm nút xác nhận/hủy.
- Account page không hiển thị `linkedProfile`/`Hồ sơ liên kết` cho người dùng cuối. Đây là định danh kỹ thuật phục vụ phân quyền backend, không phải định danh nghiệp vụ như CCCD.
- Change-password form trong Account page chỉ mount sau khi người dùng nhấn `Đổi mật khẩu`; form có current password, new password và confirm password, validate cùng policy với registration trước khi submit.

### Màn Hình Patient

- Patient home nhấn mạnh next appointment và booking action.
- Services screen dùng specialty filter và service list card.
- Booking cần có cảm giác được dẫn dắt, ít ma sát.
- Walk-in intake dùng cùng `ClinicDateField` cho ngày sinh để giữ định dạng nhập/chọn ngày `dd/MM/yyyy` nhất quán với các luồng đặt lịch khác.
- Doctor selection mặc định là `any available doctor`, đồng thời có option rõ để chọn doctor cụ thể.
- Appointment history tách upcoming, past và cancelled.

### Màn Hình Doctor

- Doctor dashboard nhấn mạnh tải khám hôm nay, waiting patients và next appointment.
- Day view là workflow chính; week view là overview.
- Appointment detail cần làm nổi bật reason, service, room, patient identity và status actions.
- Internal note UI giữ ở mức nhẹ và không gợi ý rằng MVP có full medical record.

### Màn Hình Operations

- Operations dashboard là workspace dày thông tin nhất.
- Queue group appointment state và hiển thị next action hợp lệ.
- Staff create appointment flow phải làm nổi bật patient search/create.
- Filter theo doctor, specialty và status nên có ở nơi chúng giảm nhiễu vận hành.

### Màn Hình Admin

- Admin screen tập trung vào cấu hình, không phải clinical workflow.
- Dùng table trên desktop cho doctors, services, specialties, staff và audit log.
- Form nên validate required field nhưng có thể giữ mock-only.
- Audit log cần dễ đọc và filter được trước khi thêm chart.

## Yêu Cầu Accessibility

Yêu cầu tối thiểu:

- WCAG AA contrast cho text và interactive control.
- Keyboard navigation cho nav, menu, form, filter, modal/drawer và appointment action.
- Focus state nhìn thấy trên mọi interactive element.
- Form field có label liên kết với control.
- Error message chỉ rõ field lỗi và action để khắc phục.
- Thông tin status và role phải có dạng text.
- Modal/drawer trap focus và restore focus khi đóng.
- Icon-only button có accessible label và tooltip nhìn thấy khi hover/focus.

## Breakpoint Responsive

Breakpoint Tailwind đề xuất:

| Breakpoint | Width | Behavior |
| --- | --- | --- |
| `sm` | `640px` | Mobile form rộng hơn và compact KPI card 2 cột |
| `md` | `768px` | Tablet layout, split list/detail khi hữu ích |
| `lg` | `1024px` | Desktop sidebar, dashboard grid, table view |
| `xl` | `1280px` | Dashboard rộng hơn và calendar dày thông tin hơn |

Quy tắc:

- Không có horizontal overflow ở `320px`, `375px`, `390px`, `768px`, `1024px` và `1440px`.
- Text trong button, badge, card và table cell phải wrap hoặc truncate có chủ đích.
- Calendar và week schedule phải đổi layout trước khi overflow.
- Primary mobile workflow phải dùng được mà không cần hover.

## Hướng Dẫn Implementation

### Mapping Tailwind

Implementation hiện có trong `apps/web` phải giữ mapping này:

- CSS variables for colors in `src/index.css` or equivalent.
- Tailwind theme extension cho color, radius, shadow và spacing token.
- Shared component đặt dưới `src/components`.
- Feature-specific component đặt dưới `src/features/<feature>`.

Shared components đề xuất:

- `AppShell`
- Dashboard header surface trong từng feature page; chỉ tách `PageHeader` khi duplication tăng rõ.
- `SidebarNav`
- `TopBar`
- `RoleSwitcher`
- `StatusBadge`
- `MetricCard`
- `AppointmentCard`
- `AppointmentTimeline`
- `DataTable`
- `EmptyState`
- `LoadingState`
- `ErrorState`
- `ConfirmDialog`
- `DetailDrawer`
- `SegmentedControl`
- `FilterBar`
- `FormField`

### Hướng Dẫn Asset

Màn hình app CareFlow không cần hình ảnh marketing trang trí. Nếu dùng visual asset, asset đó nên có mục đích thực tế:

- Avatar user/doctor có thể dùng initials hoặc profile photo đơn giản trong mock data.
- Hình ảnh service/specialty là tùy chọn và không được thay thế operational metadata.
- Icon nên lấy từ `lucide-react`.

### Hướng Dẫn Copy

UI copy nên dùng tiếng Việt ngắn gọn với domain term ổn định:

- Ưu tiên tiếng Việt cho navigation, heading, button, form label, empty/loading/error state và notification action.
- Chỉ giữ tiếng Anh cho mã kỹ thuật, API enum hoặc dữ liệu seed/backend khi đó là record nghiệp vụ/test data đang được hiển thị nguyên văn. Patient-facing catalog như dịch vụ và chuyên khoa phải dùng tiếng Việt; dữ liệu seed/dev khác có thể dùng tiếng Anh khi không phải nội dung phòng khám thật.
- Với user-facing audit table/filter, ưu tiên map action/entity id kỹ thuật sang nhãn tiếng Việt; raw id vẫn được giữ trong API payload, test fixture, log và docs kỹ thuật.
- Dùng `người dùng` khi hiển thị vai trò/account-facing `patient`; dùng `bệnh nhân` khi nói về hồ sơ hoặc nghiệp vụ khám tại quầy/phòng khám.
- Dùng `lịch hẹn`, `đặt lịch`, `check-in`, `hàng đợi`, `nhật ký kiểm toán`, `dịch vụ`, `bác sĩ`, `chuyên khoa`, `trạng thái` cho label hướng người dùng.
- Không gợi ý rằng MVP có medical record thật, prescription, payment, insurance hoặc telemedicine.

## Checklist Kiểm Tra

Trước khi xem frontend thay đổi sau v1 đạt yêu cầu visual:

- App shell render đúng trên desktop và mobile.
- Patient booking hoàn tất được trên mobile và không có horizontal overflow.
- Doctor day schedule dùng được trên mobile.
- Operations queue hiển thị status group và action hợp lệ rõ ràng.
- Admin table degrade thành card hoặc responsive list trên mobile.
- Status badge có text và icon, không chỉ dùng màu.
- Loading, empty, error, success và disabled state được triển khai cho key screen.
- Keyboard focus nhìn thấy và dùng được.
- Không có page section dùng marketing-style hero layout.
- Không có nested card hoặc background trang trí nặng.
- Visual refresh phải chạy qua `npm run typecheck`, `npm run lint`, `npm test -- --run`, `npm run build` và Playwright responsive/accessibility smoke trước khi xem là xong.

## Verification Commands

Chạy trong `apps/web` khi thay đổi layout, token, navigation, auth/account UI hoặc workflow screen:

```bash
npm test -- --run
npm run typecheck
npm run lint
npm run build
npm run e2e
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run e2e:api
```

`npm run e2e` bảo vệ mock-mode visual/workflow baseline. `npm run e2e:api` bảo vệ API-backed auth, account administration, scheduling và booking regression.

## Ngoài Phạm Vi

- Dark mode hoặc theme switcher.
- Full brand identity system.
- Marketing website hoặc public landing page.
- Full medical record UI.
- Prescription, insurance, payment hoặc telemedicine UI.
- Thay đổi authorization model ngoài account/session behavior đã có trong CareFlow v1.
