# Documentation Standards

CareFlow documentation is written for both humans and agents. Each document must be clear enough to guide implementation, review and verification without relying on chat history.

## Goals

- Help human contributors understand product intent, scope, workflows and technical decisions.
- Give AI agents and subagents precise context so they change the right scope without guessing.
- Keep requirements, decisions, changes and open questions traceable.
- Provide the foundation for product specs, architecture, API contracts, implementation plans and testing.

## Language Policy

- New documentation should use English by default.
- Documentation written for AI agents or subagents must use English, especially implementation plans, work packages, review handoffs, verification instructions and architecture references.
- Human-facing documentation should also use English unless a specific product copy, user-facing screen label or stakeholder requirement needs Vietnamese.
- Existing Vietnamese documents can remain in place until they are materially updated. When a document is substantially revised, convert the touched document to English instead of extending the mixed-language surface.
- Do not mix languages for decoration. Use Vietnamese only where it is intentional user-facing product language or required business context.

## Quality Requirements

Important documents should include:

- Purpose.
- Scope.
- Primary audience.
- Current status such as `draft`, `approved` or `baseline`.
- Decisions that have been made.
- Open questions when something is unresolved.
- Acceptance criteria or verification notes when the document is used for implementation.
- Links to related documents.

## Agent Writing Rules

- State exactly which files, modules or scope may change when a document is used for implementation.
- State constraints that must not be violated.
- Avoid vague instructions such as "make it better", "improve handling" or "optimize" without concrete criteria.
- For workflows, include actor, precondition, main flow, alternate flow and expected result.
- For data models, include entity, field, relationship, enum and business rules.
- For UI specs, include screen scope, state, empty/loading/error state, responsive behavior and acceptance criteria.
- For implementation plans, use English task names, exact file paths, concrete verification commands and independently reviewable task boundaries.

## Change Control

- New requirements or scope changes must be recorded in `docs/01-requirements/change-requests.md`.
- Important technical decisions must be recorded in `docs/05-history/decision-log.md`.
- Completed changes must be recorded in `docs/05-history/changelog.md`.
- If a change makes another document stale, update the related document in the same change.

## Detail Level By Phase

### Frontend-First Phase

Documentation must be detailed enough for:

- Role-based navigation.
- Screen list.
- Appointment workflows.
- Mock data.
- Frontend state.
- Design system.
- Acceptance criteria.
- Verification commands.

Detailed ERD and backend schema decisions were intentionally deferred until the backend phase.

### Backend Phase

Documentation must cover:

- API contract.
- Backend architecture.
- Database schema.
- Security design.
- Error code convention.
- Transaction boundaries.
- Deployment and environment design.
- Agent-readable next-step plans.

## Definition Of Ready For Implementation

A work item should move to implementation only when it has:

- Clear scope.
- Relevant data model or API boundary.
- User flow or technical flow.
- Acceptance criteria.
- Constraints that must not be violated.
- Verification commands or checklist.

## Definition Of Done For Documentation

A documentation change is done when:

- It has no placeholder text such as `TODO`, `TBD` or `FIXME`.
- It does not contradict related documents.
- It is recorded in the changelog or change request log when it changes scope or decisions.
- It has a clear commit message when committed.
- If the repository is being synchronized with a remote, it is pushed after review.
