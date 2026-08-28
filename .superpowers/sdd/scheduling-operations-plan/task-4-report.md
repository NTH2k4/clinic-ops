# Task 4 Report: Operations Availability Explanation UI

## Files Changed

- `apps/web/src/features/operations/CreateAppointmentPage.tsx`
- `apps/web/src/features/operations/operations.test.tsx`

## RED Summary

- Added `operations.test.tsx` coverage for API mode showing that an unavailable scheduling slot is visible in the staff booking time select, disabled, and labelled with its backend reason.
- Initial run failed for test harness module isolation (`useAuth must be used within an AuthProvider`); after importing the provider/render helper from the same reset module graph, the test failed for the expected product behavior:
  - `Unable to find role="option" and name "09:00 - Bác sĩ bị chặn lịch"`
  - The current UI still rendered the fixed `09:00` option without the scheduling reason.

## GREEN Summaries

- `CreateAppointmentPage.tsx` now enables `schedulingQueryOptions.availability({ serviceId, doctorId, date, includeUnavailable: true, page: 1, pageSize: 100 })` only in API mode after service, doctor and date are selected.
- API-mode time options are derived from returned availability slots. Unavailable slots render as disabled options with readable labels such as `09:00 - Bác sĩ bị chặn lịch`; available slots remain selectable by their `HH:mm` value.
- Submit gating now treats API-mode selections as valid only when the selected returned slot is available. Mock mode remains on the existing `appointmentTimes` plus `isDoctorAvailableForSlot` behavior.
- Added simple API-mode loading and error messages for the availability query.

## Verification

- `cd apps/web && npm test -- --run operations.test.tsx` passed: 19 tests.
- `cd apps/web && npm run typecheck` passed.
- `cd apps/web && npm run lint` passed.
- `git diff --check` passed.

## Commit SHA

- Implementation commit: `d59e68b09ca510926e00e6961bcef7afa9d75546`

## Deviations / Risks

- The API-mode UI test uses dynamic module/env mocking so the existing mock-mode operations tests remain stable in the same file.
- The report is committed separately from the implementation so it can record the implementation commit SHA without a self-referential SHA problem.
