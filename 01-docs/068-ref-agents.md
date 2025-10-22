# Repository Guidelines
DiagnosticPro pairs a Vite UI with an Express API on Cloud Run. Follow these checkpoints when contributing.

## Project Structure & Module Organization
- `02-src/frontend/` – React + TypeScript app; working source lives in `src/src`, UI assets in `public/`, build output in `dist/`.
- `02-src/backend/services/backend/` – Express entry point (`index.js`), PDF rendering helpers, and Stripe/Vertex AI handlers inside `handlers/` and `templates/`.
- `03-tests/` – Shared unit, integration, and Playwright suites; `e2e/smoke.spec.ts` runs the deployment smoke path.
- `04-assets/` – Shared imagery and sample payloads consumed by the app and tests.
- `05-scripts/` and `06-infrastructure/` – Deployment helpers and GCP configuration for Cloud Run, API Gateway, and Firebase.

## Build, Test, and Development Commands
```bash
cd 02-src/frontend && npm install
npm run dev        # Vite dev server
npm run build      # Production bundle
npm run lint       # ESLint
npm run test       # Jest UI suite
npm run test:coverage

cd ../backend/services/backend && npm install
npm run dev        # Nodemon API
npm start          # Production start
npm test           # Jest service suite

cd ../../frontend
npx playwright test ../03-tests/e2e --project=chromium
```

## Coding Style & Naming Conventions
- Run Prettier (2-space indent, trailing commas) plus ESLint before commits; CI enforces both.
- Components stay PascalCase, hooks follow `useThing.ts`, and shared helpers live in `lib/` or `utils/`; keep alias `@/`.
- Backend files stay camelCase with single quotes; log via `logStructured` and park helpers in `handlers/`.

## Testing Guidelines
- Frontend Jest watches `src/**/__tests__/` and `*.{spec,test}.tsx`; use `setupTests.ts` for shared mocks.
- Backend Jest accepts colocated `.test.js`; mock Firestore, Storage, and Stripe clients.
- Playwright smoke specs in `03-tests/e2e` must cover new routes; keep fixtures aligned.
- Target ≥80% statement coverage and attach the refreshed `coverage/` report to reviews.

## Commit & Pull Request Guidelines
- Use Conventional Commits (`feat:`, `fix:`, `docs:`); imperative mood, ≤72-char subject.
- PRs need a summary, linked issue, validation notes (`npm run test`, `npm run lint`, Playwright for UI changes), and UI screenshots.
- Refresh `CHANGELOG.md` and `deployment-docs/` whenever behaviour or infrastructure changes; note migrations in review descriptions.

## Security & Configuration Tips
- Store secrets in the provided `.env.example` templates and sync real values through Secret Manager; never push populated `.env` files.
- Run deployment helpers from `05-scripts/deploy/` with scoped service accounts and record manual overrides in `CLAUDE.md`.
