---
name: pre-pr-review
description: Review working-tree changes before opening a PR by checking all uncommitted changes (staged, unstaged, and untracked) for leftover artifacts, test freshness, dead code, and consistency risks.
---

# Pre-PR Change Review

Complements repository code-review skills by focusing on merge readiness before a PR exists.

## Scope

Always review these dimensions:

1. Leftover Artifacts
2. Test Freshness
3. Dead or Unused Code
4. Consistency Checks
5. Interface Conventions

This skill intentionally does not evaluate PR description quality or commit hygiene because no PR/commits are required yet.

## Input Mode

Accept:

- No argument (default mode)

This skill always reviews the current working tree.

## Source Resolution

1. Capture working-tree context from git:
   - `git status --short`
   - `git diff --name-only HEAD`
2. Resolve full review scope as:
   - staged changes (`git diff --staged`)
   - unstaged changes (`git diff`)
   - untracked files (`git ls-files --others --exclude-standard`)
3. Record: total changed files, staged/unstaged split, untracked count, and dominant directories.

## Diff Strategy

Primary analysis scope is all uncommitted changes:

- `git diff --staged` for staged hunks
- `git diff` for unstaged hunks
- full file reads for untracked files

When needed, use `git diff HEAD` as a consolidated view.

For large change sets, partition by subsystem/directory and review in this order:

1. API routes and auth/security-sensitive code
2. Shared runtime/library code
3. UI components and pages
4. Test files and test helpers

## Review Workflow

1. Gather metadata
   - file counts, directories, staged/unstaged/untracked split.
2. Load baseline criteria
   - read local guardrails and standards when available.
3. Run five review dimensions
   - use `references/review-dimensions.md` as the checklist.
4. Build findings
   - findings first, grouped by severity.
   - include file/symbol references and concrete remediation.
5. Produce verdict
   - `Ready to PR` or `Needs Cleanup`.

## Severity Rules

- **Critical**: correctness, security, data loss, or high-risk behavior change without meaningful tests.
- **Important**: high-confidence maintainability/regression risk that should be cleaned before opening PR.
- **Suggestion**: non-blocking improvements that strengthen quality.
- **Praise**: notable good practices worth keeping.

## Required Checks

### Leftover Artifacts

Scan changed hunks/new files for:

- `TODO`, `FIXME`, `HACK`, `XXX`
- commented-out code blocks
- `console.log`, `console.debug`, `debugger` (run intent check)
- `.only` / accidental `.skip`
- temporary placeholders, hardcoded secrets or private URLs

For added logs/debug code, classify explicitly:

- **Intentional diagnostics**:
  - behind env/debug gates, or
  - test-only diagnostics, or
  - justified with inline rationale.
- **Unjustified debug artifact**:
  - always-on runtime logs with no guard/rationale.

### Test Freshness

- Behavior changes should have corresponding test updates.
- New branches/error paths should be covered.
- Avoid assertion removals without replacement.
- Flag high-risk runtime changes with no test movement.

### Dead or Unused Code

- Unused imports/exports/symbols introduced by the changes.
- Obsolete references after refactors or renames.
- Stale flags/config/docs left after behavior changes.

### Consistency Checks

- Naming and structure align with nearby modules.
- Error handling follows repository patterns.
- New abstractions reuse existing utilities when possible.
- Auth, validation, and API contracts remain consistent.

### Interface Conventions

- All interfaces use the `I` prefix (e.g., `ICertificateEditFormProps`).
- Interfaces are in dedicated `*-types.ts` files, not in `.tsx` or test files.
- No duplicate or near-duplicate interfaces across the changed scope.
- See `.cursor/rules/interface-conventions.mdc` for full rules.

## Large Batch Behavior

This repository allows one PR containing a large feature pack. Do not recommend splitting solely due to size.

For large batches:

1. Partition review by subsystem so findings stay actionable.
2. Prioritize risk-heavy directories first.
3. Call out concentrated risk areas and targeted cleanup before PR creation.

## Output Format

Use this structure:

```markdown
# Pre-PR Review: <summary>

## Findings
- Critical: ...
- Important: ...
- Suggestion: ...
- Praise: ...

## Open Questions / Assumptions
- ...

## Leftover Artifacts
| File | Finding | Intentional? | Severity | Recommendation |
|------|---------|-------------|----------|----------------|

## Test Freshness
| Area | Observation | Risk | Recommendation |
|------|-------------|------|----------------|

## Dead or Unused Code
| File/Symbol | Observation | Recommendation |
|-------------|-------------|----------------|

## Consistency Checks
- ...

## Interface Conventions
| File | Finding | Severity | Recommendation |
|------|---------|----------|----------------|

## Verdict
Ready to PR | Needs Cleanup
```

## Report File Requirement (Mandatory)

Every run of this skill must create a Markdown report file on disk.

1. Create directory if missing: `temp/pre-pr-reviews/`
2. Write the full review report (using the output format above) to:
   - `temp/pre-pr-reviews/pre-pr-review-YYYYMMDD-HHMMSS.md`
3. Never skip file generation, even for quick or partial reviews.
4. In the final response, include:
   - verdict (`Ready to PR` or `Needs Cleanup`)
   - the saved report path
   - a short findings summary

## Validation Run

When asked to validate this skill:

1. Collect current working-tree scope.
2. Run all four dimensions.
3. Produce a complete report using the output format and save it as a `.md` file.
4. Include at least:
   - one artifact scan judgment
   - one test freshness judgment
   - one dead-code judgment
   - one consistency judgment
   - one interface conventions judgment
