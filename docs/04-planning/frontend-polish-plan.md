# Frontend Polish Plan

## Kiểm Soát Tài Liệu

| Mục | Nội dung |
| --- | --- |
| Tên tài liệu | Frontend Polish Plan |
| Sản phẩm | CareFlow - Đặt lịch khám online |
| Ngày | 2026-08-25 |
| Trạng thái | chờ duyệt |
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

- Cải thiện service cards và specialty filter.
- Làm booking step hierarchy rõ hơn.
- Tăng clarity cho disabled slots và conflict/success state.
- Cải thiện appointment history tabs và cancel action.

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

- Queue groups cần phân biệt rõ confirmed, checked-in, in-progress, completed/cancelled.
- Calendar filters cần dễ thao tác hơn.
- Staff create appointment cần giảm cảm giác form dài bằng section layout tốt hơn.
- ConfirmDialog cần polish states và copy.

Verification:

- Operations tests.
- Playwright operations check-in.
- Manual check 768px và 1280px.

### Package P5: Admin Workspace Polish

Mục tiêu: làm admin dashboard/list đỡ sơ khai.

Phạm vi:

- Metric cards cần hierarchy và trend/summary text tốt hơn.
- Tables cần spacing, empty state và mobile cards rõ hơn.
- Mock-only forms cần nhìn giống form thật hơn, nhưng vẫn không persist backend.
- Audit log filters và notification reference action cần dễ hiểu hơn.

Verification:

- Admin tests.
- Auth/admin route guard tests.
- Manual check desktop 1280px và mobile 360px.

### Package P6: Responsive Và Accessibility QA

Mục tiêu: ghi nhận bằng chứng kiểm tra UI sau polish.

Phạm vi:

- Playwright screenshot hoặc smoke checks ở 360, 768, 1280 và 1440 nếu khả thi.
- Kiểm tra page-level horizontal overflow.
- Kiểm tra keyboard navigation cho login, role switcher, booking form, drawer/dialog và notification panel.
- Cập nhật README/docs với kết quả thật.

Verification:

- `npm test -- --run`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run e2e`
- Manual QA note hoặc screenshot evidence nếu có.

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
