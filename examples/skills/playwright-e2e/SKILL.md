# Playwright Test Generation (Unit → API → E2E)

Generate and maintain tests for the Testing With Renata platform. Always classify changes on the test pyramid first — unit and API tests are preferred over E2E. Use `@playwright/cli` for AI-assisted browser interaction when E2E tests are needed.

## When to Use

Use this skill when:
- Source files are changed and tests need to be created or updated
- The user asks to "generate tests", "test the changes", or "add e2e tests"
- A bug is fixed and a regression test is needed

## Workflow

### Step 1: Evaluate Changes Against the Test Pyramid

```bash
git diff --name-only HEAD
```

**Always push tests to the lowest viable level.** Classify each changed file and decide where the test belongs BEFORE writing anything:

| Change type | Test level | Target folder | Examples |
|---|---|---|---|
| Validation schemas, pure logic, helpers | **Unit test** (Vitest) | `tests/unit/` | `lib/validations/*`, `lib/utils/*` |
| API route handlers (CRUD, auth, errors) | **API test** (Playwright `request`) | `tests/api/specs/` | `app/api/**` |
| UI rendering, navigation, multi-page flows | **E2E test** (Playwright browser) | `tests/e2e/specs/` | `app/**/page.tsx`, `components/**` |

#### Test Pyramid Gate — ask these questions:

1. **Can this be tested with a unit test?** (validation, schema, pure function) → Write a unit test. Stop.
2. **Can this be tested with an API call?** (route handler, CRUD logic, auth checks, error responses) → Write an API test. Stop.
3. **Does the value come from the browser interaction itself?** (rendering, navigation, form UX, multi-step flows, runtime errors) → Write an E2E test.

**E2E tests are expensive.** Only use them when the test's value depends on the browser: page rendering, user interaction, navigation flow, or catching runtime/console errors. If the same logic can be verified at the API or unit level, it MUST be tested there instead.

#### Thin E2E smoke tests

For pages that are mostly data-display with no meaningful interaction (lists, read-only views), a single smoke test is sufficient: navigate → heading visible → no network errors → no console errors.

### Step 2: Plan Tests

For each change, determine:
1. The correct test level (unit / API / E2E) based on the pyramid gate above
2. Which spec file it belongs to (domain-specific, never generic "regression" files)
3. Whether an existing POM or API helper covers the need, or a new one is required
4. Which assertions are needed (see Assertion Rules below)

**Present the plan to the user for approval before implementing, showing the pyramid classification.**

### Step 3: Generate Tests Using playwright-cli

Use `@playwright/cli` to interact with pages and generate role-based locator code:

```bash
# Launch and inspect a page
npx playwright-cli open http://localhost:3000/admin/workshops

# Take a snapshot to see element refs
npx playwright-cli snapshot

# Interact with elements
npx playwright-cli click <ref>
npx playwright-cli fill <ref> "value"
npx playwright-cli check <ref>
```

Each command outputs Playwright code with role-based locators. Assemble generated code into:
- **POM methods** (`tests/e2e/pages/*.page.ts`) — navigation + interaction
- **Spec files** (`tests/e2e/specs/*.spec.ts`) — test structure + assertions

### Step 4: Add Assertions

`playwright-cli` generates **actions only**, NOT assertions. The agent must add the right `expect()` calls based on the action context:

#### After navigation
```typescript
await expect(page).toHaveURL(expectedPattern);
await expect(page).toHaveTitle(expectedTitle); // if relevant
```

#### After page load / rendering
```typescript
await expect(locator).toBeVisible();
await expect(locator).toContainText(expected);
await expect(locator).not.toContainText("undefined"); // catch data-mapping bugs
```

#### After form interaction (fill, check, select)
```typescript
await expect(input).toHaveValue(expected);
await expect(checkbox).toBeChecked(); // or .not.toBeChecked()
```

#### After form submission
```typescript
// Success
await expect(page).toHaveURL(successRoute);
await expect(successMessage).toBeVisible();

// Error
await expect(page.getByRole("alert")).toBeVisible();
await expect(page.getByRole("alert")).toContainText(expectedError);
```

#### After destructive actions (delete, deactivate)
```typescript
await expect(locator).not.toBeVisible();
await expect(locator).toHaveCount(previousCount - 1);
```

#### For console/runtime errors (regression tests)
```typescript
page.on("pageerror", (err) => pageErrors.push(err));
// ... actions ...
expect(pageErrors).toHaveLength(0);
```

#### For lists / data display
```typescript
await expect(list).toHaveCount(expectedN);
// Loop and assert no broken data mapping
await expect(item).not.toContainText("undefined");
```

#### General rules
- Always use Playwright's auto-retrying `expect()` — never raw `isVisible()` checks
- Prefer `toBeVisible()` over `toHaveCount(1)` for single elements
- Prefer `toContainText()` over `toHaveText()` when only part of the text matters
- Never assert implementation details (CSS classes, internal state) — assert what the user sees

### Step 5: Run Tests

```bash
npx playwright test <spec-file> --project=desktop
npx playwright show-report
```

## Architecture Rules

### File Organization
```
platform/tests/
  setup/                        # JWT-based auth setup        → project: setup
    admin-auth.setup.ts
    learner-auth.setup.ts
  api/                                                         → project: api (no browser)
    requests/                   # API request helpers
      auth.api.ts
      workshops.api.ts
      users.api.ts
      feature-requests.api.ts
    specs/                      # API test specs (describe: "API: ...")
      *.spec.ts
  accessibility/                # A11Y specs (describe: "A11Y: ...")  → projects: mobile, tablet, desktop
    *.spec.ts
  e2e/                                                         → projects: mobile, tablet, desktop
    fixtures/
      admin.fixtures.ts
      learner.fixtures.ts
      common.fixtures.ts
      index.ts                  # re-exports merged fixture
    pages/                      # Page Object Models
      *.page.ts
    specs/                      # E2E test files (describe: "E2E: ...")
      *.spec.ts
```

### Playwright Projects

| Project | Scope | Browser |
|---|---|---|
| `setup` | `tests/setup/*.setup.ts` | none |
| `api` | `tests/api/specs/*.spec.ts` | none (API only) |
| `mobile` | E2E + A11Y specs | iPhone 14 |
| `tablet` | E2E + A11Y specs | iPad (gen 7) |
| `desktop` | E2E + A11Y specs | Desktop Chrome 1440×900 |

### Locator Priority
1. `getByRole()` — always preferred
2. `getByLabel()` — for form fields
3. `getByText()` — for content verification
4. `getByPlaceholder()` — for inputs without labels
5. `getByTestId()` — last resort

### Rules
- **One `test.describe()` per spec file** — exactly one top-level describe, all tests inside it
- **`test.describe()` prefix by type**: `"E2E: ..."`, `"API: ..."`, `"A11Y: ..."`, or `"Setup: ..."`
- **Hooks live outside the describe** — at most one each of `test.beforeAll`, `test.beforeEach`, `test.afterAll`, `test.afterEach`, declared above the describe in that order
- No locators in spec files — always use Page Object Models
- **POM locators in constructor** — all reusable locators must be declared as `private readonly` class fields and assigned in the constructor. Methods reference them via `this.*`. Exceptions: parameterized locators (selector depends on a method argument) and one-off chained/filtered locators derived from a constructor field may stay inline.
- No `test.skip` — if prerequisites are missing, the test should fail
- No `waitForTimeout` — use auto-retrying `expect()` or `waitForLoadState()`
- No XPath or complex CSS selectors — use `getBy*` + `.filter()`
- No generic "regression" or "bugfix" spec files — tests go in domain-specific files
- Import URL/API constants from `src/lib/routes.ts`
- Use `test.step()` for readability
- Auth is handled via `storageState` setup project — no manual login in admin tests
- If no good locator exists, fix the UI source (add `aria-label`, `role`, or `data-testid`)
- **No direct database access** — no Prisma imports, no raw SQL, no `mysql2`. All data (user IDs, emails, roles) comes from env vars. Use API request helpers (`tests/api/requests/*.api.ts`) to verify data through the running application.
- API spec files live in `tests/api/specs/` and import request helpers from `../requests/`
