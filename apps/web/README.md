# CareFlow Web

Frontend CareFlow là prototype dùng `mock data` cho workflow đặt lịch khám, doctor workspace, operations workspace và admin views.

## Lệnh Chạy

```bash
npm ci
npm run dev
npm test -- --run
npm run typecheck
npm run lint
npm run build
npm run e2e
```

## CI/CD

GitHub Actions dùng hai workflow:

- `Web CI`: chạy khi có Pull Request vào `main` hoặc push lên `main`, kiểm tra test, typecheck, lint, build, e2e và upload artifact `careflow-web-dist`.
- `Web Pages`: chạy khi `main` thay đổi hoặc chạy thủ công bằng `workflow_dispatch`, build với `mode github-pages` rồi deploy `apps/web/dist` lên GitHub Pages.

GitHub Pages cần bật source **GitHub Actions** trong repository settings. Khi deploy thành công, app có URL dạng:

```text
https://nth2k4.github.io/clinic-ops/
```
