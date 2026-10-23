# DOCUMENT AUTHORITY CONTRACT
## Precedence, Current State and Historical Evidence

Authority: `CURRENT_SUPPORTING`; current state is owned only by [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md).

## Authority order

1. **Current GitHub main** — actual code, architecture and package/config contents. Current closure evidence baseline: `f817fc8f053aeb2f5f1ecc63f456a939816b7301` (PR #29 merged). Phase 1 is VERIFIED / CLOSED; Phase 2 is NOT_STARTED pending owner activation, with no active implementation unit. Historical unit baselines remain historical evidence and must not be rewritten as current.
2. **Accepted reconstruction decisions represented in repository documents** — the current-state ledger, canonical decision/debt log, constitution, unit protocol, acceptance governance and accepted roadmap.
3. **Current active test/tooling contracts** — actual `package.json` commands, `vitest.config.ts`, canonical npm lockfile, and their supporting manifests/contracts. They describe execution and evidence; they do not override accepted product semantics with retired snapshots.
4. **Historical documentation** — prior Block/Phase reports, release scorecards, original design specifications and Studio artifacts. They preserve past claims/provenance and cannot establish current status by filename alone.

Browser/runtime/network observations remain evidence for the exact behavior observed. Static inspection, mocked tests, build, typecheck and manual review prove different things; none silently overrides the others or grants user acceptance.

## Single current authority and supporting documents

- [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md): current phase, active/next unit, accepted units and execution/debt routing.
- [05_DECISION_AND_DEBT_LOG.md](05_DECISION_AND_DEBT_LOG.md): canonical accepted decisions, debt classifications, owners and dispositions; it defers unit status to the ledger.
- [FOUNDATIONAL_PLAN_PHASE_0_TO_18.md](FOUNDATIONAL_PLAN_PHASE_0_TO_18.md): accepted sequence; [RECONSTRUCTION_PLAN.md](RECONSTRUCTION_PLAN.md): methodology.
- [ROOT_TOOLING_HYGIENE_CONTRACT.md](ROOT_TOOLING_HYGIENE_CONTRACT.md), [TOOLCHAIN_CONTRACT.md](TOOLCHAIN_CONTRACT.md), [TEST_TAXONOMY_AND_HARNESS_CONTRACT.md](TEST_TAXONOMY_AND_HARNESS_CONTRACT.md): supporting execution contracts, subordinate to the actual current package/config files.
- [PRODUCT_RECONSTRUCTION_ACCEPTANCE_GOVERNANCE.md](PRODUCT_RECONSTRUCTION_ACCEPTANCE_GOVERNANCE.md): product verification and explicit user-acceptance requirements.
- [DOCUMENTATION_AUTHORITY_REVIEW_P0_U5.md](DOCUMENTATION_AUTHORITY_REVIEW_P0_U5.md): exhaustive document classifications and P0-U5 review evidence; not a second state ledger.
- [CURRENT_CONVERSATION_HANDOFF_2026-10-23.md](CURRENT_CONVERSATION_HANDOFF_2026-10-23.md): current conversation-transfer snapshot and execution handoff; subordinate to GitHub main and the phase ledger, and not a competing state authority.

## Historical boundaries

`RELEASE.md`, `security_spec.md`, original `docs/*.md` design specifications and pre-existing `reports/**` documents are `HISTORICAL_RECORD` unless an explicit current decision promotes a bounded fact. Historical report bodies, including fixed key counts, deployment verdicts, old test expectations and former Phase/Block numbering, are evidence of their recorded period only. Historical JSON/catalog files consumed by tools/tests keep that bounded fixture role; it does not promote their narrative claims to current translation or release authority.

The eight `.aistudio/artifacts/brain/**` Markdown files are preserved historical planning snapshots. Their embedded state/decision copies are not live mirrors. `PHASE_0_READ_ONLY_AUDIT.md` is the dated bootstrap audit, not a current lockfile or harness report. Future architecture/distribution remains an unapproved proposal, not implemented architecture or next-unit authorization.

## Governance and publication

Never infer current code from old reports or conflate historical numbering with the reconstruction Phase 0–18 plan. Never alter production merely to satisfy an obsolete static assertion. Distinguish test/build success from product/browser acceptance and formal unit closure.

User acceptance and publication authorization are explicit gates. The user may publish manually or explicitly authorize an agent to publish the reviewed scope; no authorization is implied by a review-ready status. Independent post-push GitHub review remains required before closure. P0-U5 explicitly permits no commit, push or PR.

When `.git` is available, inspect it directly; when unavailable in Studio, the Sync UI may establish local pending-file scope, not remote code truth. Studio implementation reports remain claims requiring independent verification.
