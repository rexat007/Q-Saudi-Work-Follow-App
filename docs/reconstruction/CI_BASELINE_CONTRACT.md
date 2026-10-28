# SECRET-FREE GITHUB CI BASELINE CONTRACT

Status: P0-U6 VERIFIED / CLOSED at merge `54f6d829c184a371e96c2812b08738c42280552b`, following owner-confirmed independent audit and corrected PR/main runtime verification. P0-U7 is VERIFIED / CLOSED by the explicit owner-approved Phase 0 governance freeze; TypeScript debt remains unresolved with accepted exit routing. Current state authority: [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md).

## Purpose and authority

This is a foundation-only CI contract on main baseline `2923108b1a635f5eed3b1e4d6d15d2c456246c08`. It does not certify complete product, root-test, Beta 2, deployment or release readiness. Implementation is limited to `.github/workflows/ci-foundation.yml` and the approved reconstruction documents; application, tests, package/lock, configuration and scripts remain unchanged.

## Workflow execution

- Workflow: `.github/workflows/ci-foundation.yml`.
- Triggers: `pull_request` targeting `main`, and `push` to `main` only.
- Runner: GitHub-hosted `ubuntu-24.04`.
- Project Node authority: Node 22 (`>=22 <23`); setup selects the current Node 22 release and verifies major 22.
- Project npm authority: `>=10 <11`, with canonical package-manager declaration `npm@10.9.8`. The job prints the supplied npm version and enforces major 10 before installation; it does not silently replace the package manager. Local verified versions are Node 22.23.3 / npm 10.9.8. The owner confirmed hosted verification; this closure record does not supply an exact hosted npm patch version.
- Official actions only, pinned to audited commits:
  - `actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803` (v6), `persist-credentials: false`.
  - `actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38` (v6).
- These actions' internal Node runtime is separate from project Node authority.
- No dependency cache: no cache action/input, and setup-node automatic package-manager caching is explicitly disabled with `package-manager-cache: false`.
- Workflow permissions: `contents: read` only. No write permission, custom token, PAT, secret reference, private environment loading, deployment credential, or repository/environment-secret setup is required. Automatic platform read identity is not a user-maintained secret.
- No `pull_request_target`, `workflow_run`, schedules, deployment/release triggers, third-party actions, artifacts, or deployment/release authority.

## Blocking foundation gate

The independent `required-foundation` job checks out, sets up Node, confirms versions and runs exactly:

```sh
npm ci --no-audit --no-fund
npm run build
npm run test:i18n-runtime
npm run test:auth-trust-boundary
```

A command failure fails the job. The final cleanliness guard runs with `always()`. Dependency installation requires registry access and normal dependency install hooks, but no live application credentials or Firestore/Google/Gemini/OAuth access. Build compiles the client and bundles the server without starting it. The selected existing tests check runtime translation resolution and mocked server authentication boundaries.

The job name expresses the intended foundation gate. This implementation does not change GitHub branch protection or select repository required checks.

## FULL_REPOSITORY_DEBT_OBSERVABILITY

A separate `typecheck-debt-observability` job performs its own checkout, toolchain confirmation and clean install, then executes unchanged `npm run lint` (`tsc --noEmit`) with id `typecheck`. It has no dependency relationship with foundation. Exactly this lint step uses `continue-on-error: true`; no job-level tolerance, shell suppression, diagnostic-count threshold or TypeScript scope narrowing is used. When lint exits nonzero, `steps.typecheck.outcome` remains `failure`, while its post-tolerance `conclusion` is `success`. The actual command failure and diagnostics remain in the step log.

An `always()` reporting step reads the pre-tolerance outcome and writes distinct TYPECHECK COMMAND RESULT and FOUNDATION CI RESULT statements to the summary. On failure it states that the command failed, TypeScript debt remains, this is intentionally non-blocking P0-U6 debt observability, lint did not PASS, and P0-U7 must reassess the debt (the unchanged runtime summary instruction; that reassessment is now recorded as completed in the canonical debt log). Foundation success is determined only by its independent job. The final `always()` mutation guard remains blocking and has no continue-on-error.

If the only failure is lint debt, the debt job is expected to conclude SUCCESS. When foundation, both mutation guards and all other steps succeed, the overall workflow is expected to conclude SUCCESS. This does NOT mean lint passed. Unexpected install, reporting, guard or foundation failures still fail the affected job and workflow. Branch-protection settings remain outside this implementation. The observed 445 diagnostics / exit 2 are dated evidence, never a permanent allowance. New diagnostics require investigation; The required P0-U7 reassessment is completed in the accepted exit audit; future diagnostic deltas still require investigation and explicit disposition.

The initial implementation was published as `4ac5769fb2d490b900114cc23dc0a4456944be25`. Owner-supplied GitHub runtime evidence reported Required foundation SUCCESS and Typecheck debt observability FAILURE, leaving the original workflow failed. That truthful but operationally misleading aggregate result prompted this approved step-level correction. The correction was subsequently published as `def3195f7c3661bd31744c348c6e2f01176b399d` and merged by `54f6d829c184a371e96c2812b08738c42280552b`. The owner confirmed independent audit, corrected PR runtime verification (both jobs SUCCESS), and post-merge main run #3 (both jobs and overall SUCCESS). These supersede the original pending-verification state; successful workflow conclusions do not mean lint passed.

## CURRENT_EXTERNAL_DEPENDENCY_BOUNDARY

`npm test` and `npm run verify:beta2` remain canonical full verification commands but are intentionally excluded from foundation CI. This is not test retirement or skipping/deleting tests. The audit traced client Firestore transactions through TripNumberGenerator into root and Beta tests; non-production fallback occurs after attempting the external transaction. Existing Firestore/proxy failures are external-dependent evidence, not proof of secret-free hosted success. Beta also short-circuits at nonzero lint.

No emulator, test migration, production workaround, service credential injection, package repair, codemod, development server, deployment or release command is introduced. No claim is made that full root npm test or Beta 2 currently passes in GitHub CI.

## Repository mutation invariant

Both jobs end with an `always()` cleanliness step. It checks unstaged tracked changes (`git diff --exit-code`), staged changes (`git diff --cached --exit-code`) and new unignored files (`git status --porcelain=v1 --untracked-files=all`). Any detected mutation fails the job. Ignored `node_modules`, `dist` and `server-dist` outputs are allowed. The guard does not repair or discard changes.

At the local implementation snapshot below, implementation files were intentional pending changes; verification compared package hashes and approved scope rather than claiming that uncommitted worktree was clean. Implementation has since been published and merged; the current closure update is documentation only.

## Local implementation evidence

Local verification on the baseline above used Node 22.23.3 / npm 10.9.8:

| Command | Exit | Result |
|---|---:|---|
| `npm ci --no-audit --no-fund` | 0 | 810 packages installed; package hashes unchanged; Git clean immediately afterward |
| `npm run build` | 0 | PASS; ignored build output only |
| `npm run test:i18n-runtime` | 0 | 16/16 PASS |
| `npm run test:auth-trust-boundary` | 0 | 23/23 PASS |
| `npm run lint` | 2 | FAIL / recorded debt, 445 diagnostics |

The complete diagnostic signatures match the accepted final-residual verification log: zero added / zero removed diagnostics. No P0-U6 diagnostic is introduced. This comparison uses that final source snapshot, not the older pre-remediation line-number snapshot. Full npm test and Beta 2 were not run.

The first install attempt failed creating `/home/agent/.npm/_cacache` (execution-environment cache-path failure). The authorized retry used only process-scoped `npm_config_cache=/tmp/qsaudi-npm-cache` and succeeded. This local override is not persisted in repository config or copied to the workflow. No package/lock remediation was performed. Sparse lockfile resolved/integrity metadata and generic credential-filename ignore hardening remain separately governed observations, not authorization to change either file here.

SHA-256 before and after successful install:

| File | Identical before / after |
|---|---|
| package.json | `5b0b085eca4e9a324cf3e8a911ed65e01ce39e7ea8750336aa5479db0ef0d468` |
| package-lock.json | `3e8d430adb5c492549dbd854ca8f8c7deed02fbbca6fd03996c9a41a416a54a8` |

Static review verifies the exact pins, read-only permissions, zero secret references, zero third-party actions, zero deployment/release steps, absent privileged triggers, separate debt job and both always-run guards. The owner-confirmed closure record establishes publication, owner review, independently audited merge `54f6d829c184a371e96c2812b08738c42280552b`, corrected PR verification and post-merge main run #3 verification. P0-U6 and P0-U7 are VERIFIED / CLOSED under their recorded owner decisions; Phase 0 is VERIFIED / CLOSED / FROZEN. Phase 1 was NOT_STARTED / ACTIVE with no assigned implementation unit at that historical exit snapshot; current continuation is defined only by the ledger. No new runtime verification is performed by this documentation update. The existing typecheck debt remains visible and unresolved after the accepted P0-U7 reassessment. The separate [Phase 0 Freeze Contract](PHASE_0_FREEZE_CONTRACT.md) records governance closure and phase activation, not lint PASS, debt waiver or full root/Beta acceptance. P0-U7 publication is MERGED / VERIFIED through PR #9 at `3b0fc03d27a4b663e85d330f581550c37d62999d`, as recorded in the canonical ledger; no CI behavior is changed by that documentation update.
