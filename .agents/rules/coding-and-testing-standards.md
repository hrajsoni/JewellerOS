# Coding, Testing & Verification Standards

## 1. Strict TypeScript Standards
- `noImplicitAny: true` is strictly enforced.
- Never cast domain models or business payloads to `any`.
- Define explicit interfaces and zod schemas for all API inputs and outputs.
- Keep domain types and Prisma database models aligned via explicit mapper functions.

---

## 2. Financial & Arithmetic Math Standards
- **Rule 1:** Import `Decimal` from `decimal.js` for all monetary, weight, purity, interest, and tax arithmetic.
- **Rule 2:** Avoid floating-point arithmetic. Never do `const val = weight * rate;`. Always do `new Decimal(weight).mul(rate).toDecimalPlaces(2)`.
- **Rule 3:** Rounding mode must be explicit: `Decimal.set({ rounding: Decimal.ROUND_HALF_UP })`.

---

## 3. Build & Runtime Environment Rules
- **Windows Turbopack Junction Workaround:** Due to the Next.js 16.4.6 Windows NTFS junction bug (`os error 5`), dev and build commands must always execute with Webpack:
  - `"dev": "next dev --webpack"`
  - `"build": "next build --webpack"`
- **Live Database Sandbox Rule:** The Neon PostgreSQL database is hosted on AWS US-East-2. Terminal commands requiring live DB network access must run with `BypassSandbox: true`.

---

## 4. Testing & Verification Requirements
- **Test Runner:** Node.js native test runner executed via `tsx`:
  `npm test` (alias for `tsx --test tests/**/*.test.ts`)
- **Pre-Commit Verification Chain:**
  1. `npx tsc --noEmit` -> 0 TypeScript compilation errors.
  2. `npm run lint` -> 0 ESLint errors.
  3. `npm test` -> 100% passing tests across all test suites.
  4. `npm run build` -> Clean Next.js Webpack compilation.
- **Never Break Passing Tests:** Any changes or additions must maintain existing test suite coverage and pass without regression.
