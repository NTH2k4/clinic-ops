# Agent Lessons Learned

## Document Control

| Trường | Giá trị |
| --- | --- |
| Trạng thái | `active` |
| Đối tượng đọc chính | Product owner, AI coordinator, future implementation agents |
| Cập nhật lần cuối | 2026-09-02 |
| Phạm vi | Bài học từ quá trình dùng AI Agent/subagent để triển khai CareFlow |

## Mục Đích

Tài liệu này ghi lại bài học vận hành agent để cải thiện brief, plan, review và deploy trong các phase sau.

## Bài Học Chính

### LL-001: Documentation-first giảm lệch scope

Các phase lớn ổn hơn khi có plan trong `docs/04-planning/` trước khi sửa code. Agent cần biết source docs, file boundaries, verification commands và approval gate.

Hành động duy trì:

- Yêu cầu mới vào `change-requests.md`.
- Plan mới phải có file dự kiến sửa và verification rõ.
- Báo cáo hoàn tất phải dẫn docs/commit/test evidence.

### LL-002: Không để production deploy phụ thuộc vào giả định

Render auto-deploy từng không cập nhật đúng commit cho production. Deploy chỉ được coi là xong khi health commit và smoke test pass.

Hành động duy trì:

- Giữ `RENDER_DEPLOY_HOOK_URL`.
- Dùng manual deploy khi production còn serve commit cũ.
- Luôn chạy `scripts/production-smoke.mjs`.

### LL-003: Secret/token hygiene phải ghi rõ trong brief

Các flow auth/account reset dễ vô tình log token hoặc temporary password nếu brief không cấm rõ.

Hành động duy trì:

- Không ghi session token, temporary password hoặc dữ liệu bệnh nhân thật vào docs/log/test output.
- Review smoke script và test output trước khi ghi evidence.

### LL-004: UI tiếng Việt cần được kiểm tra như requirement

CareFlow hướng người dùng Việt Nam, nên user-facing copy phải thuần Việt. Demo/test data có thể giữ tiếng Anh khi chỉ phục vụ dev/test.

Hành động duy trì:

- Kiểm tra copy user-facing trong frontend review.
- Giữ raw enum/API id khi đó là contract kỹ thuật.

### LL-005: Subagent hiệu quả khi task nhỏ và có biên rõ

Task như API gate, Web gate, docs sync hoặc smoke verification dễ giao subagent. Task có quyết định product/security/deploy cần coordinator giữ và hỏi người dùng.

Hành động duy trì:

- Mỗi subagent chỉ nhận 2-4 tài liệu nguồn liên quan.
- Reviewer kiểm tra diff để bắt unrelated changes.
- Coordinator tổng hợp conflict và risk before merge.

### LL-006: Preview artifact cần được đặt đúng kỳ vọng

Ảnh hoặc HTML preview không phải implementation production. Nếu tạo preview ngoài route app, cần ghi rõ file path, cách tải và trạng thái chưa commit/chưa tích hợp.

Hành động duy trì:

- Preview UI nên nằm ở file dễ tìm như `homepage-preview.html` hoặc route preview được đặt tên rõ.
- Nếu chuyển thành feature thật, phải mở change request và cập nhật product/design docs trước.

## Mẫu Brief Tốt Cho Agent

Một brief nên có:

- Mục tiêu.
- Tài liệu nguồn.
- File được phép sửa.
- File không được sửa.
- Acceptance criteria.
- Verification commands.
- Quyết định commit/push/deploy.
- Dữ liệu không được đưa vào output.

## Bước Cải Thiện Tiếp Theo

- Bổ sung planning index trước khi dọn dẹp docs.
- Thêm rollback runbook chi tiết hơn cho deploy failure.
- Khi triển khai homepage public, tạo change request và cập nhật PRD/SRS/design trước code.
