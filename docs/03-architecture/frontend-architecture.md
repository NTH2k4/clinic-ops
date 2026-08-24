# Frontend Architecture

## Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query
- React Hook Form
- Zod
- lucide-react
- Vitest
- React Testing Library

## Direction

The first implementation phase is frontend-first. The app should use typed mock data and mock service functions that mirror the future API contract.

## Suggested Structure

```text
src/
  app/
  components/
  features/
    appointments/
    patients/
    doctors/
    services/
    dashboard/
    audit/
    auth/
  lib/
  mocks/
  routes/
  test/
  types/
```

## Principles

- Keep feature modules independent.
- Keep mock APIs behind service boundaries.
- Use shared types for data models.
- Avoid backend-specific assumptions until the API contract is approved.
- Build dense, operational UI rather than marketing-style pages.
