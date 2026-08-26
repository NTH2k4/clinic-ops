# Frontend Polish Plan

## Kiểm Soát Tài Liệu

| Mục | Nội dung |
| --- | --- |
| Tên tài liệu | Frontend Polish Plan |
| Sản phẩm | CareFlow - Đặt lịch khám online |
| Ngày | 2026-08-25 |
| Trạng thái | đang triển khai |
| Phạm vi | UI/UX polish sau frontend MVP |
| Đối tượng đọc | Product owner, frontend developer, QA, agent contributors |

## Bối Cảnh

Frontend MVP đã có đủ các workspace chính: patient, doctor, operations và admin. GitHub Actions `Web CI` và `Web Pages` đã chạy thành công ở commit `caa64b3779939ba6b59ad730b6d620e7df7fef08`. GitHub Pages trả HTTP 200 tại `https://nth2k4.github.io/clinic-ops/`.

Người dùng đã xem qua bản deploy và đánh giá khởi đầu chấp nhận được, nhưng một số giao diện vẫn cần cải thiện. Tài liệu này gom các bước polish tiếp theo để tránh sửa UI cảm tính.

## Mục Tiêu

- Làm giao diện CareFlow chuyên nghiệp hơn mà không đổi lớn workflow đã có.
- Ưu tiên các vấn đề ảnh hưởng trực tiếp đến cảm giác sản phẩm thật: layout, spacing, hierarchy, table/card density, mobile ergonomics và trạng thái trống/lỗi.
- Giữ frontend-first mock architecture, chưa chuyển sang backend trong phase polish này.
- Không claim hoàn tất manual QA nếu chưa có bằng chứng kiểm tra.

## Phạm Vi Không Làm Trong Phase Này

- Không tích hợp backend thật.
- Không thêm authentication thật.
- Không thêm medical record đầy đủ, payment, insurance hoặc prescription.
- Không làm theme switcher.
- Không redesign toàn bộ brand từ đầu nếu không cần thiết.

## QA Baseline Hiện Có

Automated verification hiện đã có:

- Unit/component tests: `npm test -- --run`.
- TypeScript check: `npm run typecheck`.
- ESLint: `npm run lint`.
- Production build: `npm run build`.
- Playwright smoke: `npm run e2e`.

Browser smoke hiện cover:

- Patient booking ở mobile 360px.
- Doctor start/complete ở desktop 1280px.
- Operations check-in ở desktop 1280px.

Manual QA còn cần làm:

- Kiểm tra responsive ở 768px và 1440px.
- Kiểm tra text overlap trong button, card, status badge và table.
- Kiểm tra accessibility thực tế: keyboard focus, dialog close, tab order, aria labels.
- Kiểm tra visual hierarchy trên các dashboard lớn.

## Work Packages Đề Xuất

### Package P1: App Shell Và Navigation Polish

Mục tiêu: làm app shell có cảm giác sản phẩm thật hơn.

Phạm vi:

- Đã triển khai bước đầu: desktop sidebar có nút thu gọn/mở rộng, trạng thái `aria-expanded`, link vẫn accessible khi sidebar thu gọn và active navigation nổi bật hơn.
- Đã polish TopBar notification panel: header có summary số thông báo/chưa đọc, nút đóng dialog rõ ràng, unread item nổi bật hơn và reference action vẫn điều hướng theo vai trò.
- Đã polish mobile bottom navigation: sticky bottom, scroll ngang ổn hơn cho role nhiều mục, active navigation đồng bộ với sidebar.
- Tăng độ rõ của active navigation.
- Kiểm tra mobile bottom navigation với các role dài.
- Tinh chỉnh TopBar notification panel để dễ scan hơn.
- Đảm bảo header/sidebar không chiếm quá nhiều không gian trên màn nhỏ.

Verification:

- Auth routing tests không regress.
- Playwright patient mobile flow vẫn pass.
- Manual check 360px và 768px.

### Package P2: Patient Portal Polish

Mục tiêu: làm flow đặt lịch dễ hiểu hơn.

Phạm vi:

- Đã cải thiện service cards và specialty filter: summary số dịch vụ/chuyên khoa, filter group accessible, card có hierarchy rõ hơn và CTA đặt lịch theo từng dịch vụ.
- Đã làm booking step hierarchy rõ hơn: thêm progress cue trên form và review thời gian theo định dạng `ngày/tháng/năm`.
- Đã tăng clarity cho disabled slots và conflict/success state: helper text cho slot không khả dụng, conflict message thân thiện hơn và success state có next actions.
- Đã cải thiện appointment history tabs và cancel action: tab có count, summary theo nhóm lịch, cancel action có accessible name theo lịch hẹn và feedback sau khi hủy.

Verification:

- Patient tests.
- Playwright patient mobile booking.
- Manual check text không overflow ở 360px.

### Package P3: Doctor Workspace Polish

Mục tiêu: làm lịch bác sĩ và drawer chi tiết dễ scan hơn.

Phạm vi:

- Thêm điều hướng lịch ngày gồm nút ngày trước, hôm nay và ngày sau để bác sĩ không phải nhập date thủ công.
- Thêm điều hướng lịch tuần gồm nút tuần trước, tuần hiện tại và tuần sau.
- Hiển thị số tuần trong năm và khoảng ngày của tuần theo định dạng `ngày/tháng/năm`, ví dụ `Tuần 35, 24/08/2026 - 30/08/2026`.
- Giữ date input hiện có như fallback chính xác, nhưng copy/label hiển thị phải dùng định dạng Việt Nam `ngày/tháng/năm`.
- Tinh chỉnh timeline spacing và status density.
- Drawer chi tiết cần phân nhóm rõ patient, appointment, status history, audit events.
- Week schedule cần nhìn tốt hơn ở desktop mà không tạo horizontal overflow.

Verification:

- Doctor tests.
- Playwright doctor start/complete.
- Unit tests cho helper tính ngày kế tiếp, ngày trước, tuần kế tiếp, tuần trước và số tuần ISO.
- Manual check desktop 1280px và 1440px.

### Package P4: Operations Workspace Polish

Mục tiêu: làm queue/calendar giống công cụ vận hành hơn.

Phạm vi:

Automated scope đã hoàn thành:

- Làm rõ queue groups theo trạng thái confirmed, checked-in, in-progress, completed/cancelled bằng lane description, count summary và action accessible name cho hủy lịch.
- Polish calendar filters: filter group semantic, result summary, active filter chips, xóa từng filter chip và reset filters.
- Giảm cảm giác form dài trong staff create appointment bằng 3 section riêng: chọn bệnh nhân, chọn dịch vụ/bác sĩ và chọn thời gian.
- Polish ConfirmDialog copy/state cho hủy lịch operations với cancel label rõ hơn.

Verification:

- Operations tests.
- Playwright operations check-in.
- Manual check 768px và 1280px.

### Package P5: Admin Workspace Polish

Mục tiêu: làm admin dashboard/list đỡ sơ khai.

Phạm vi:

Automated scope đã hoàn thành:

- Metric cards có helper/summary text để giải thích ý nghĩa số liệu.
- Dashboard list sections có summary count cho dịch vụ phổ biến và workload bác sĩ.
- Doctors mock-only form có header, mô tả rõ chỉ cập nhật frontend state và count summary cho list.
- Doctors table/mobile cards được polish nhẹ spacing/header density.
- Audit log filters dùng fieldset semantic, có result summary và nút reset filter rõ ràng.
- Notification reference action đã được cover từ P1/P5 admin tests.

Verification:

- Admin tests.
- Auth/admin route guard tests.
- Manual check desktop 1280px và mobile 360px.

### Package P6: Responsive Và Accessibility QA

Mục tiêu: ghi nhận bằng chứng kiểm tra UI sau polish.

Phạm vi:

Automated scope đã hoàn thành:

- Thêm Playwright responsive smoke ở 360, 768, 1280 và 1440.
- Kiểm tra page-level horizontal overflow cho patient, operations, doctor và admin workspaces.
- Kiểm tra keyboard smoke cho role switcher, notification panel và doctor detail drawer.
- Sửa TopBar mobile để notification label thu gọn trên màn nhỏ, loại bỏ overflow ngang ở 360px.
- Cập nhật README/docs với kết quả thật.

Verification:

- `npm test -- --run`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run e2e`
- `npm run e2e` hiện chạy 9 tests, gồm responsive/accessibility smoke.
- Manual visual QA vẫn là follow-up nếu cần đánh giá thẩm mỹ chi tiết trên thiết bị thật.

## Thứ Tự Triển Khai Khuyến Nghị

1. P6 baseline responsive/accessibility QA nhẹ để chụp hiện trạng.
2. P1 app shell/navigation polish.
3. P3 doctor schedule navigation polish.
4. P2 patient portal polish.
5. P4 operations workspace polish.
6. P5 admin workspace polish.
7. P6 final responsive/accessibility QA sau polish.

Lý do: app shell ảnh hưởng mọi role; doctor schedule navigation là vấn đề thao tác trực tiếp đã được người dùng chỉ ra nên cần ưu tiên trước các phần polish rộng hơn.

## Quyết Định Cần Người Dùng Chốt

Trước khi sửa UI, cần chọn hướng polish chính:

1. **Polish theo thứ tự khuyến nghị**: app shell trước, rồi patient/operations, sau đó doctor/admin.
2. **Polish theo màn bạn thấy xấu nhất**: người dùng chỉ định màn nào cần sửa trước.
3. **Polish toàn diện một lượt bằng subagent-driven**: chia từng workspace cho subagent, nhanh hơn nhưng review nhiều hơn.

Khuyến nghị: chọn hướng 1 để giảm rủi ro và giữ thay đổi dễ review.

## Definition Of Done

- Có checklist polish được commit.
- Mỗi package có test/verification tương ứng.
- Không làm backend hoặc đổi workflow lớn nếu chưa có quyết định mới.
- Không claim manual responsive/accessibility pass nếu chưa chạy kiểm tra thật.
- Sau mỗi package, merge/push lên GitHub để GitHub Pages cập nhật cho người dùng xem.
