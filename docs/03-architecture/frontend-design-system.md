# Frontend Design System

## Document Control

| Mục | Nội dung |
| --- | --- |
| Tên tài liệu | Frontend Design System |
| Sản phẩm | CareFlow - Đặt lịch khám online |
| Phiên bản | 1.0 |
| Ngày | 2026-08-25 |
| Trạng thái | draft |
| Phạm vi | Design system cho frontend-first MVP |
| Đối tượng đọc | Product owner, frontend developer, QA, agent contributors |

## Revision History

| Phiên bản | Ngày | Nội dung thay đổi |
| --- | --- | --- |
| 1.0 | 2026-08-25 | Bản design system đầu tiên cho frontend MVP. |

## Mục Đích

Tài liệu này định nghĩa visual language, layout, component rules, accessibility và responsive behavior cho frontend MVP của CareFlow. Mục tiêu là giúp các màn hình patient, doctor, operations và admin có cùng một ngôn ngữ giao diện trước khi scaffold `apps/web`.

Design system này là baseline cho prototype dùng `mock data`. Khi backend hoặc brand guideline thật xuất hiện, tài liệu này có thể được cập nhật, nhưng frontend MVP không được tự ý thêm theme switcher hoặc nhiều visual theme.

## Tài Liệu Liên Quan

- `docs/00-project/documentation-standards.md`
- `docs/02-product/frontend-mvp-spec.md`
- `docs/02-product/appointment-states.md`
- `docs/02-product/screens.md`
- `docs/02-product/workflows.md`
- `docs/03-architecture/data-model.md`
- `docs/03-architecture/frontend-architecture.md`
- `docs/06-testing/acceptance-checklist.md`

## Design Principles

### Operational First

CareFlow là công cụ vận hành phòng khám, không phải landing page. Giao diện cần ưu tiên scan nhanh, thao tác lặp lại và giảm nhầm lẫn khi xử lý appointment.

Rules:

- Không dùng hero section trong app shell.
- Không dùng decorative gradient/orb/background nặng.
- Dashboard dùng dense but organized layout: metrics, queue, timeline, filters và tables/lists rõ ràng.
- Text mô tả chức năng chỉ dùng khi cần giải nghĩa domain state hoặc empty state, không dùng để quảng cáo tính năng.

### Clinical Calm

Visual style cần tạo cảm giác y tế hiện đại, sạch, chuyên nghiệp và ít nhiễu.

Rules:

- Light theme là theme duy nhất trong MVP.
- Palette chính dùng xanh teal/blue ở mức tiết chế, kết hợp neutral background và accent phụ cho status.
- Tránh UI một màu. Status, alerts và role signals phải có nhiều hue chức năng khác nhau.
- Các bề mặt quan trọng cần độ tương phản rõ để dùng tốt trong môi trường phòng khám nhiều ánh sáng.

### Status Is Text Plus Signal

Appointment status không được chỉ thể hiện bằng màu.

Rules:

- Mỗi status badge phải có label text.
- Với status quan trọng hoặc action-critical, thêm icon từ `lucide-react`.
- Empty/loading/error/success state phải có text rõ và action tiếp theo nếu có.
- Disabled action cần nêu lý do bằng tooltip, helper text hoặc inline message khi phù hợp.

### Mobile Is A Real Workflow

Mobile không chỉ là shrink desktop. Patient booking, appointment list và doctor day view phải dùng tốt trên điện thoại.

Rules:

- Mobile ưu tiên list, stacked form và compact timeline.
- Không dùng table rộng cho mobile queue/calendar.
- Week schedule trên mobile phải chuyển thành day selector + list/timeline.
- Bottom or sticky action chỉ dùng cho primary action trong form dài, không che nội dung.

## Design Tokens

Token names nên được map sang Tailwind config hoặc CSS variables khi scaffold frontend.

### Color Tokens

| Token | Hex | Use |
| --- | --- | --- |
| `color-bg` | `#F7FAFA` | Page background |
| `color-surface` | `#FFFFFF` | Main content surface |
| `color-surface-muted` | `#EEF6F5` | Subtle grouped region, selected filter |
| `color-border` | `#D7E3E1` | Default border |
| `color-border-strong` | `#AFC6C3` | Focused/active border |
| `color-text` | `#172326` | Primary text |
| `color-text-muted` | `#52666B` | Secondary text |
| `color-text-subtle` | `#73858A` | Metadata text |
| `color-primary` | `#0F766E` | Primary actions, active nav |
| `color-primary-hover` | `#0B5F59` | Primary hover |
| `color-primary-soft` | `#DDF3F0` | Primary low-emphasis surface |
| `color-accent` | `#2563EB` | Links, selected calendar slot |
| `color-accent-soft` | `#DBEAFE` | Accent low-emphasis surface |
| `color-danger` | `#B42318` | Cancel/destructive/error |
| `color-danger-soft` | `#FEE4E2` | Danger low-emphasis surface |
| `color-warning` | `#B54708` | Conflict/no-show/warning |
| `color-warning-soft` | `#FEF0C7` | Warning low-emphasis surface |
| `color-success` | `#027A48` | Completed/success |
| `color-success-soft` | `#D1FADF` | Success low-emphasis surface |
| `color-info` | `#175CD3` | Requested/info |
| `color-info-soft` | `#D1E9FF` | Info low-emphasis surface |

Usage constraints:

- Primary teal is for main workflow actions, not every heading or icon.
- Accent blue is reserved for links, selected calendar slots and secondary emphasis.
- Destructive actions must use danger tokens and confirmation UI.
- Text on colored badges must pass WCAG AA contrast.

### Appointment Status Tokens

| Status | Visual token | Icon suggestion | UI meaning |
| --- | --- | --- | --- |
| `requested` | `color-info-soft` + `color-info` | `Clock3` | Patient request waiting for staff confirmation |
| `confirmed` | `color-primary-soft` + `color-primary` | `CalendarCheck` | Appointment scheduled and ready for check-in |
| `checked_in` | `color-warning-soft` + `color-warning` | `UserCheck` | Patient arrived and waiting |
| `in_progress` | `color-accent-soft` + `color-accent` | `Stethoscope` | Doctor is seeing the patient |
| `completed` | `color-success-soft` + `color-success` | `CheckCircle2` | Appointment finished |
| `cancelled` | `color-danger-soft` + `color-danger` | `CircleX` | Appointment cancelled |
| `no_show` | `#F2F4F7` + `#475467` | `AlertCircle` | Patient did not arrive |

### Role Tokens

Role identity should help orientation but not create separate themes.

| Role | Accent | Use |
| --- | --- | --- |
| Patient | `color-primary` | Booking flow, patient home quick actions |
| Doctor | `color-accent` | Schedule, clinical queue emphasis |
| Receptionist/Nurse | `color-warning` | Operations queue and check-in workload |
| Admin | `#6941C6` | Configuration and audit orientation |

Role accents may appear in nav active state, avatar ring, small eyebrow label or section marker. They must not override the shared design system.

### Typography

Recommended stack:

```text
Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

Type scale:

| Token | Size | Line height | Use |
| --- | --- | --- | --- |
| `text-xs` | `12px` | `16px` | Metadata, table secondary text |
| `text-sm` | `14px` | `20px` | Default body, form helper, table cells |
| `text-md` | `16px` | `24px` | Emphasized body, form input |
| `text-lg` | `18px` | `28px` | Section title |
| `text-xl` | `20px` | `30px` | Page title in app shell |
| `text-2xl` | `24px` | `32px` | High-level dashboard title only |

Rules:

- Do not scale font size with viewport width.
- Letter spacing must be `0`.
- App surfaces should use `text-sm` and `text-md` by default.
- Hero-scale typography is not used inside the authenticated app.

### Spacing And Sizing

Use a 4px spacing base.

| Token | Value | Use |
| --- | --- | --- |
| `space-1` | `4px` | Tight icon/text gap |
| `space-2` | `8px` | Button gap, compact rows |
| `space-3` | `12px` | Form field gap |
| `space-4` | `16px` | Card padding mobile, section gap |
| `space-5` | `20px` | Card padding desktop |
| `space-6` | `24px` | Page section gap |
| `space-8` | `32px` | Major page gap |

Sizing rules:

- Button height: `36px` compact, `40px` default, `44px` mobile primary.
- Input height: `40px` desktop, `44px` mobile.
- Icon button: `36px` square desktop, `40px` square mobile.
- Left nav width: `240px` desktop; collapsed nav width: `72px` if implemented.
- Page max content width: `1440px`.

### Radius And Shadow

| Token | Value | Use |
| --- | --- | --- |
| `radius-sm` | `4px` | Badges, compact fields |
| `radius-md` | `6px` | Buttons, inputs |
| `radius-lg` | `8px` | Cards, modals, drawers |

Rules:

- Cards must stay at `8px` radius or less.
- Do not nest cards inside cards.
- Prefer border and background contrast over heavy shadow.
- Shadow is reserved for dropdowns, popovers, modals and drawers.

### Focus And Motion

Focus style:

- `2px` outline using `color-accent`.
- `2px` outline offset.
- Focus must be visible on buttons, links, form controls, tabs, menus and appointment cards with actions.

Motion:

- Use `120ms-180ms` transitions for hover/focus/open states.
- Avoid large entrance animations in operational screens.
- Respect `prefers-reduced-motion`.

## Layout System

### App Shell

Desktop shell:

- Left sidebar for primary role navigation.
- Top bar for page title, role switcher, notifications and user menu.
- Main content uses constrained width and responsive grid.

Mobile shell:

- Top app bar with current section and menu trigger.
- Role switcher should remain accessible but not dominate first screen.
- Primary nav can use drawer or bottom navigation for core role routes.

Rules:

- The role switcher is a prototype tool and must be visually secondary.
- Navigation labels should match route purpose from `frontend-mvp-spec.md`.
- Avoid hiding critical appointment actions behind more than one menu level.

### Dashboard Layout

Desktop:

- Use a 12-column grid.
- KPI strip at top with 3-5 metrics.
- Main workflow area takes 7-8 columns.
- Secondary insight/activity panel takes 4-5 columns.

Mobile:

- KPI cards become horizontal scroll or 2-column compact grid.
- Queue, timeline and next appointment sections stack vertically.
- Keep primary action near the relevant section, not only at page bottom.

### Forms

Booking and create appointment forms should use step-based layout when there are more than four meaningful inputs.

Rules:

- Patient booking flow uses clear steps: service, doctor mode, slot, reason, review.
- Staff create appointment flow includes patient search/create before appointment details.
- Validation messages appear under the field.
- Submit area summarizes selected service, doctor, time and status outcome.
- Patient-created appointment success must say the request is pending confirmation.
- Staff-created appointment success must say the appointment is confirmed.

### Lists, Tables And Timelines

Desktop:

- Use tables for admin data and operations calendar when the viewport supports it.
- Use cards or split list/detail for queue and patient appointments.

Mobile:

- Replace wide tables with cards.
- Use compact timeline for doctor day and operations day schedule.
- Row actions should be visible as icon buttons or short command buttons, not buried in dense text.

Rules:

- Every list needs loading, empty, error and filter-empty states.
- Sort appointments by `startAt` unless a workflow explicitly needs status grouping.
- Metadata should be scannable: patient, doctor, service, room, time, status.

## Component Rules

### Buttons

Variants:

- `primary`: main workflow action.
- `secondary`: normal non-primary action.
- `ghost`: low-emphasis navigation/action.
- `danger`: cancel/destructive action.
- `icon`: compact tool action with tooltip.

Rules:

- Use `lucide-react` icons inside buttons when a clear icon exists.
- Do not use rounded text pills as substitutes for familiar icons.
- Destructive actions require confirmation when they alter appointment state.
- Disabled buttons need a reason when the disabled condition is not obvious.

### Status Badge

Required content:

- Icon.
- Status label.
- Accessible text equivalent.

Rules:

- Badge color must map to appointment status tokens.
- Do not rely on color only.
- Use consistent Vietnamese labels in UI:
  - `requested`: `Chờ xác nhận`
  - `confirmed`: `Đã xác nhận`
  - `checked_in`: `Đã check-in`
  - `in_progress`: `Đang khám`
  - `completed`: `Hoàn tất`
  - `cancelled`: `Đã hủy`
  - `no_show`: `Không đến`

### Cards

Use cards for repeated items, appointment summaries, KPI metrics and modal/drawer content.

Rules:

- No card inside card.
- Card header should fit in one or two lines without overlapping action buttons.
- Appointment cards should reserve stable space for status and time.
- Cards with actions must have clear hover/focus states.

### Filters And Segments

Use segmented controls for small mutually exclusive option sets, for example appointment status groups or day/week mode.

Rules:

- Search, filters and sort should sit above the list they affect.
- Filter chips must have clear remove/reset affordance.
- Filter empty state should say no result matches filters, not that data is missing.

### Modal, Drawer And Detail Panel

Appointment detail should use:

- Drawer on desktop when opened from list/calendar.
- Full-screen or near full-screen panel on mobile.

Rules:

- State-changing actions stay in the panel footer or a fixed action area.
- Status history and audit events are secondary sections.
- Completed appointments are view-only except close/back actions.

### Notifications

Rules:

- Notifications panel uses timestamp, title, message and reference action.
- Unread state uses indicator plus text weight, not color only.
- Empty state should be short and neutral.

## Screen-Level Guidance

### Sign In

- Use a compact centered auth surface, not a marketing page.
- Mock users can be shown as selectable rows/cards.
- Role and user identity must be visible before submit.
- Error state should not mention real credential rules because auth is mocked.

### Patient Screens

- Patient home emphasizes next appointment and booking action.
- Services screen uses specialty filter and service list cards.
- Booking should feel guided and low-friction.
- Doctor selection defaults to `any available doctor`, with explicit option to pick a doctor.
- Appointment history separates upcoming, past and cancelled.

### Doctor Screens

- Doctor dashboard emphasizes today's load, waiting patients and next appointment.
- Day view is the primary workflow; week view is overview.
- Appointment detail should surface reason, service, room, patient identity and status actions.
- Internal note UI stays lightweight and should not imply full medical record support.

### Operations Screens

- Operations dashboard is the densest workspace.
- Queue groups appointment states and exposes valid next actions.
- Staff create appointment flow must make patient search/create prominent.
- Filters by doctor, specialty and status should be available where they reduce operational noise.

### Admin Screens

- Admin screens are configuration-focused, not clinical workflow screens.
- Use tables on desktop for doctors, services, specialties, staff and audit log.
- Forms should validate required fields but can stay mock-only.
- Audit log should be readable and filterable before adding charts.

## Accessibility Requirements

Minimum requirements:

- WCAG AA contrast for text and interactive controls.
- Keyboard navigation for nav, menus, forms, filters, modals/drawers and appointment actions.
- Visible focus state on every interactive element.
- Form fields have labels connected to controls.
- Error messages identify the field and the recovery action.
- Status and role information is available as text.
- Modal/drawer traps focus and restores focus on close.
- Icon-only buttons have accessible labels and visible tooltip on hover/focus.

## Responsive Breakpoints

Proposed Tailwind breakpoints:

| Breakpoint | Width | Behavior |
| --- | --- | --- |
| `sm` | `640px` | Wider mobile forms and two-column compact KPI cards |
| `md` | `768px` | Tablet layout, split list/detail where useful |
| `lg` | `1024px` | Desktop sidebar, dashboard grid, table views |
| `xl` | `1280px` | Wider dashboard and calendar density |

Rules:

- No horizontal overflow at `320px`, `375px`, `390px`, `768px`, `1024px` and `1440px`.
- Text inside buttons, badges, cards and table cells must wrap or truncate intentionally.
- Calendar and week schedule must switch layout before they overflow.
- Primary mobile workflows must be usable without hover.

## Implementation Guidance

### Tailwind Mapping

When scaffold `apps/web`, define:

- CSS variables for colors in `src/index.css` or equivalent.
- Tailwind theme extension for color, radius, shadow and spacing tokens.
- Shared components under `src/components`.
- Feature-specific components under `src/features/<feature>`.

Suggested shared components:

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

### Asset Guidance

CareFlow app screens do not need decorative marketing imagery. If visual assets are used, they should be practical:

- User/doctor avatars can use initials or simple profile photos in mock data.
- Service/specialty imagery is optional and should not replace operational metadata.
- Icons should come from `lucide-react`.

### Copy Guidance

UI copy should be concise Vietnamese with stable domain terms:

- Use `appointment`, `booking`, `check-in`, `queue`, `audit log` when those terms are clearer than forced translation.
- Use `lịch khám`, `dịch vụ`, `bác sĩ`, `bệnh nhân`, `chuyên khoa`, `trạng thái` for user-facing labels.
- Do not imply real medical records, prescriptions, payment, insurance or telemedicine in MVP UI.

## Verification Checklist

Before frontend MVP is considered visually acceptable:

- App shell renders correctly on desktop and mobile.
- Patient booking can be completed on mobile without horizontal overflow.
- Doctor day schedule is usable on mobile.
- Operations queue shows status groups and valid actions clearly.
- Admin tables degrade to cards or responsive lists on mobile.
- Status badges include text and icon, not only color.
- Loading, empty, error, success and disabled states are implemented for key screens.
- Keyboard focus is visible and usable.
- No page section uses marketing-style hero layout.
- No nested cards or heavy decorative backgrounds are introduced.

## Non-Goals

- Dark mode or theme switcher.
- Full brand identity system.
- Marketing website or public landing page.
- Full medical record UI.
- Prescription, insurance, payment or telemedicine UI.
- Production authorization UI beyond mock role/session behavior.
