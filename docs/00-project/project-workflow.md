# Project Workflow

## Documentation First

Requirements, product flows, technical decisions, and planning changes should be documented before code changes. This keeps implementation aligned with the approved MVP.

## Working Order

1. Write and approve MVP requirements.
2. Build frontend prototype with mock data.
3. Define API contract from validated UI workflows.
4. Implement backend and database.
5. Integrate frontend with backend.
6. Verify, polish, and prepare release notes.

## Change Control

Use `docs/01-requirements/change-requests.md` for any new requirement or scope change. A change request can be:

- `proposed`
- `approved`
- `rejected`
- `deferred`
- `implemented`

## Subagent Workflow

Subagent work should be split by clear product or technical boundary. Each package must include scope, files or modules expected, dependencies, acceptance criteria, and verification commands.
