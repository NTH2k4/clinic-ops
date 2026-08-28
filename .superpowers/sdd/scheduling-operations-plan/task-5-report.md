# Task 5 Report: API-Mode Browser Regression

Date: 2026-08-28
Branch: `scheduling-operations`
Implementation commit: `7158031da9cfb7be4027203b99772fb9e0456a35`

## Files Changed

- `apps/web/e2e/api-careflow.spec.ts`
- `docs/06-testing/acceptance-checklist.md`
- `.superpowers/sdd/scheduling-operations-plan/task-5-report.md`

## Summary

- Added an API-mode Playwright regression proving admin schedule management state affects operations booking availability.
- The test logs in as admin, visits `/app/admin/schedules`, creates a `doctor-4` blocked schedule for `2026-08-26 11:30-12:00` through an authenticated Playwright request, then logs in as receptionist and verifies the operations appointment form renders `11:30 - Bác sĩ bị chặn lịch` as a disabled time option.
- Extracted a small E2E helper for authenticated API request headers and reused it in the existing doctor workflow setup.

## RED

Command:

```bash
cd apps/web
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run e2e:api -- --grep "schedule management"
```

Result: failed, 1/1 executed.

Observed failure:

- The browser rendered `<option disabled value="11:30">11:30 - Bác sĩ bị chặn lịch</option>`.
- Playwright `toBeDisabled()` still reported the `<option>` locator as enabled.

Follow-up: changed the test-only assertion to verify the option's `disabled` attribute directly.

## GREEN

Targeted command:

```bash
cd apps/web
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run e2e:api -- --grep "schedule management"
```

Result: pass, 1/1 browser test.

Full API-mode command:

```bash
cd apps/web
DATABASE_URL=postgresql://careflow:careflow@localhost:5432/careflow npm run e2e:api
```

Result: pass, 9/9 browser tests. API-mode teardown reseeded the database after the suite.

## Static Checks

- `npm run typecheck`: not run; Task 5 changed only Playwright test/docs/report files.
- `npm run lint`: not run; Task 5 changed only Playwright test/docs/report files.

## Deviations And Risks

- Used Playwright `request` API to create the blocked schedule instead of driving the schedule creation form. This avoids brittle date-picker/time-field automation while still visiting the admin schedule UI and asserting the receptionist booking UI reflects backend schedule state.
- Did not modify backend code.
- No push performed.
