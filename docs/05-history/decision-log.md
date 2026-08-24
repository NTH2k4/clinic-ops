# Decision Log

## DEC-001: Build Frontend First

Date: 2026-08-24

Decision: Build the frontend prototype first with mock data before backend implementation.

Reason: The highest early risk is product workflow clarity. Frontend-first development makes appointment flow, role behavior, and dashboard structure visible before committing to backend schemas.

## DEC-002: Use React + Vite + TypeScript

Date: 2026-08-24

Decision: Use React, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, lucide-react, Vitest, and React Testing Library for the frontend.

Reason: This stack fits a dashboard-heavy operational application with forms, validation, routing, server-state boundaries, and focused frontend tests.

## DEC-003: Keep Medical Scope Lightweight

Date: 2026-08-24

Decision: Do not include full medical records, prescriptions, insurance, real payment, telemedicine, or external notifications in the MVP.

Reason: These features introduce significant compliance, security, and operational complexity beyond the first product milestone.
