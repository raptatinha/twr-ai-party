# Pre-PR Review Dimensions

Use this reference while executing `pre-pr-review`.

## 1) Leftover Artifacts

### Must scan in changed scope

- `TODO`, `FIXME`, `HACK`, `XXX`
- `console.log`, `console.debug`, `debugger`
- `it.only`, `describe.only`, `test.only`
- broad skip usage (`it.skip`, `describe.skip`, metadata skips)
- commented-out logic blocks
- placeholder constants, temporary values, and local test URLs

### Triage guidance

- Focus on staged, unstaged, and untracked files in the working tree.
- Ignore historical artifacts outside current changed scope.
- Escalate when artifact impacts runtime behavior, observability quality, or test reliability.

### Console log intentionality check

For each added `console.*` or `debugger`, classify:

- **Intentional diagnostics** if it is:
  - behind env/debug guards, or
  - in test/CI-only paths, or
  - clearly justified inline.
- **Unjustified debug artifact** if it is:
  - always-on in normal runtime with no rationale.

Report explicitly:

- `Intentional diagnostics` -> Suggestion or Praise
- `Unjustified debug artifact` -> Important (Critical if it exposes sensitive data)

## 2) Test Freshness

### Coverage alignment checks

- Behavior changes have corresponding test updates.
- New branches/filters/path guards include branch-focused assertions.
- Error paths and edge cases are represented.
- Renamed fields/routes/contracts are reflected in tests and fixtures.

### Anti-patterns

- Assertion removal without replacement.
- Tests weakened to avoid failures (over-mocking, broad skips).
- Snapshot churn without explanation.

### Severity guidance

- **Important**: behavior changed with little/no relevant test movement.
- **Critical**: high-risk auth/runtime logic changed with no effective tests.

## 3) Dead or Unused Code

### Static hygiene

- Added imports that are never used.
- Symbols removed in one area but still referenced elsewhere.
- Feature/config leftovers after refactors.
- Deprecated paths kept without justification.

### Refactor checks

- Renamed symbols are propagated consistently.
- Temporary compatibility shims are justified and documented.
- Docs/config/scripts match code-level changes where applicable.

### Severity guidance

- **Critical** only when dead paths can break runtime behavior.
- Otherwise mark **Important** for maintainability debt before PR.

## 4) Consistency Checks

### Codebase alignment

- Naming conventions match adjacent modules.
- Error handling follows local project patterns.
- Validation and API response styles remain consistent.
- Existing utilities are reused instead of introducing near-duplicates.

### Runtime and operational consistency

- Logging format/verbosity remains coherent.
- Defaults/fallback behavior stays predictable.
- Permission/auth checks are consistent across similar routes.

## 5) Interface Conventions

### Naming

- All interface names must start with the `I` prefix (e.g., `ICertificateEditFormProps`).
- Flag any interface missing the prefix as **Important**.

### Placement

- Interfaces must live in dedicated `*-types.ts` files.
- Flag interfaces defined inside `.tsx` files as **Important**.
- Flag interfaces defined inside test files (`.spec.ts`, `.page.ts`, `.fixtures.ts`, `.setup.ts`, `.api.ts`) as **Important**.
- Interfaces in service/utility `.ts` files are acceptable only when small, tightly coupled to one function, and not reused elsewhere — otherwise flag as **Suggestion**.

### Deduplication

- Scan for interfaces with overlapping field shapes across the changed scope.
- Flag near-duplicate interfaces as **Important** with a recommendation to extract a shared base.

### Severity guidance

- **Important**: missing `I` prefix, interface in `.tsx`/test file, or duplicate interface.
- **Suggestion**: interface in a utility `.ts` that could be extracted to a `*-types.ts` file.

## Cross-Dimension Extras

Apply when relevant:

- **Security posture**: no sensitive values added to logs, config, or frontend output.
- **Blast radius clarity**: key affected areas are identified for focused manual verification.
- **Operational readiness**: fast-fail and observability patterns are preserved.
- **Documentation sync**: developer docs are updated when behavior or conventions changed.

## Finding Templates

Use concise, evidence-based language:

- **Problem**: What is wrong.
- **Impact**: Why it matters.
- **Recommendation**: Specific fix.

Example:

- Problem: auth guard behavior changed in route handlers, but tests were not updated.
- Impact: regressions in role-based access may go unnoticed until production.
- Recommendation: add API tests for allowed and denied role paths before opening PR.
