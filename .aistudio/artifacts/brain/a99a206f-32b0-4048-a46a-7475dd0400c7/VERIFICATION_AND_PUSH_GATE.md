# VERIFICATION AND PUSH GATE

## Verification Tiers

To ensure complete production quality and prevent regressions, all code changes must pass through distinct verification tiers:

### 1. STATIC
- Source-text contract checks
- Regex/ast component structure assertions
- Mandatory interface constraint checks

### 2. UNIT
- Isolated Vitest unit tests for domain services, helpers, and pure utilities
- Fast execution (< 1s per suite)

### 3. INTEGRATION_MOCK
- Component render tests using React Testing Library
- Mocked server REST responses and mock Firestore adapters

### 4. EMULATOR
- Local Firebase Firestore and Auth emulator test runs
- Real security rules enforcement and compound query evaluation

### 5. LIVE_E2E
- Full end-to-end user journey tests across client and Express server
- Multi-step workflow validation (e.g. Project Setup -> Roster Import -> Dispatch -> Invoice)

### 6. MANUAL_UI
- Visual RTL Arabic layout review
- Touch-target responsiveness on mobile viewports
- Accessibility and contrast verification

### 7. TYPECHECK
- TypeScript compilation check: `./node_modules/.bin/tsc --noEmit --pretty false`
- Zero changed-scope TypeScript errors required

### 8. BUILD
- Production bundle generation: `npm run build`
- Vite frontend build + Esbuild server bundle (`dist/` and `server-dist/server.cjs`)
- Must complete with exit code 0

### 9. GITHUB_POST_PUSH
- Independent verification that pushed GitHub commit matches verified local state
- Workspace clean check

---

## Mandatory Invariant
> **CRITICAL RULE**: Passing automated unit tests and build alone NEVER automatically closes a phase or unit. A unit is CLOSED only after executing the complete 11-step Implementation Unit Protocol, completing scope review, obtaining explicit user approval, pushing to GitHub, and completing independent post-push verification.
