# Frontend Design System

## Kiểm Soát Tài Liệu

| Mục | Nội dung |
| --- | --- |
| Tên tài liệu | Frontend Design System |
| Sản phẩm | CareFlow - Đặt lịch khám online |
| Phiên bản | 1.0 |
| Ngày | 2026-08-25 |
| Trạng thái | draft |
| Phạm vi | Design system cho frontend-first MVP |
| Đối tượng đọc | Product owner, frontend developer, QA, agent contributors |

## Lịch Sử Phiên Bản

| Phiên bản | Ngày | Nội dung thay đổi |
| --- | --- | --- |
| 1.0 | 2026-08-25 | Bản design system đầu tiên cho frontend MVP. |

## Mục Đích

Tài liệu này định nghĩa ngôn ngữ giao diện, layout, quy tắc component, accessibility và responsive behavior cho frontend MVP của CareFlow. Mục tiêu là giúp các màn hình patient, doctor, operations và admin có cùng một ngôn ngữ giao diện trước khi scaffold `apps/web`.

Design system này là baseline cho prototype dùng `mock data`. Khi backend hoặc brand guideline thật xuất hiện, tài liệu này có thể được cập nhật, nhưng frontend MVP không được tự ý thêm theme switcher hoặc nhiều theme giao diện.

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

CareFlow là công cụ vận hành phòng khám, không phải landing page. Giao diện cần ưu tiên scan nhanh, thao tác lặp lại và giảm nhầm lẫn khi xử lý appointment.

Quy tắc:

- Không dùng hero section trong app shell.
- Không dùng decorative gradient/orb/background nặng.
- Dashboard dùng layout dày thông tin nhưng có tổ chức: metrics, queue, timeline, filter và table/list rõ ràng.
- Text mô tả chức năng chỉ dùng khi cần giải nghĩa domain state hoặc empty state, không dùng để quảng cáo tính năng.

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
| `color-bg` | `#F7FAFA` | Nền page |
| `color-surface` | `#FFFFFF` | Bề mặt nội dung chính |
| `color-surface-muted` | `#EEF6F5` | Vùng nhóm nhẹ, filter đang chọn |
| `color-border` | `#D7E3E1` | Border mặc định |
| `color-border-strong` | `#AFC6C3` | Border khi focus/active |
| `color-text` | `#172326` | Text chính |
| `color-text-muted` | `#52666B` | Text phụ |
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
- Ưu tiên border và tương phản background thay vì shadow nặng.
- Shadow chỉ dành cho dropdown, popover, modal và drawer.

### Focus Và Motion

Focus style:

- Outline `2px` dùng `color-accent`.
- `2px` outline offset.
- Focus phải nhìn thấy trên button, link, form control, tab, menu và appointment card có action.

Motion:

- Dùng transition `120ms-180ms` cho hover/focus/open state.
- Tránh entrance animation lớn trong màn hình vận hành.
- Tôn trọng `prefers-reduced-motion`.

## Hệ Thống Layout

### App Shell

Shell desktop:

- Sidebar trái cho điều hướng chính theo role.
- Top bar cho page title, role switcher, notifications và user menu.
- Nội dung chính dùng width có giới hạn và responsive grid.

Shell mobile:

- Top app bar hiển thị section hiện tại và menu trigger.
- Role switcher vẫn phải truy cập được nhưng không chiếm ưu tiên ở first screen.
- Primary nav có thể dùng drawer hoặc bottom navigation cho các route chính của role.

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

Mobile:

- KPI card chuyển thành horizontal scroll hoặc compact grid 2 cột.
- Queue, timeline và next appointment section xếp dọc.
- Giữ primary action gần section liên quan, không chỉ đặt ở cuối page.

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

## Hướng Dẫn Theo Màn Hình

### Sign In

- Dùng auth surface compact ở giữa màn hình, không dùng marketing page.
- Mock user có thể hiển thị dưới dạng row/card có thể chọn.
- Role và user identity phải nhìn thấy trước khi submit.
- Error state không nên nhắc đến credential rule thật vì auth đang mock.

### Màn Hình Patient

- Patient home nhấn mạnh next appointment và booking action.
- Services screen dùng specialty filter và service list card.
- Booking cần có cảm giác được dẫn dắt, ít ma sát.
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

Khi scaffold `apps/web`, định nghĩa:

- CSS variables for colors in `src/index.css` or equivalent.
- Tailwind theme extension cho color, radius, shadow và spacing token.
- Shared component đặt dưới `src/components`.
- Feature-specific component đặt dưới `src/features/<feature>`.

Shared components đề xuất:

- `AppShell`
- `PageHeader`
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

- Dùng `appointment`, `booking`, `check-in`, `queue`, `audit log` khi các thuật ngữ đó rõ hơn dịch ép.
- Dùng `lịch khám`, `dịch vụ`, `bác sĩ`, `bệnh nhân`, `chuyên khoa`, `trạng thái` cho label hướng người dùng.
- Không gợi ý rằng MVP có medical record thật, prescription, payment, insurance hoặc telemedicine.

## Checklist Kiểm Tra

Trước khi xem frontend MVP đạt yêu cầu visual:

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

## Ngoài Phạm Vi

- Dark mode hoặc theme switcher.
- Full brand identity system.
- Marketing website hoặc public landing page.
- Full medical record UI.
- Prescription, insurance, payment hoặc telemedicine UI.
- Production authorization UI ngoài mock role/session behavior.
