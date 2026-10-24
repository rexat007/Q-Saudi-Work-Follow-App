# DOCUMENT AUTHORITY CONTRACT
## Precedence, Current State and Historical Evidence

Authority: `CURRENT_SUPPORTING`; current state is owned only by [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md).

## Authority order

1. **Current GitHub main** — actual code, architecture and package/config contents. Current Phase 2 activation evidence baseline: `747e86662b867aa5990f87fb0e60c79b077efb86` (PR #30 — Phase 1 closure merged). Phase 1 is VERIFIED / CLOSED; Phase 2 is IN_PROGRESS by explicit owner approval, governance only. No first unit is defined or implementation authorized; next action is PHASE_2_FIRST_UNIT_DEFINITION_AUDIT. Historical unit baselines remain historical evidence and must not be rewritten as current.
2. **Accepted reconstruction decisions represented in repository documents** — the current-state ledger, canonical decision/debt log, constitution, unit protocol, acceptance governance and accepted roadmap.
3. **Current active test/tooling contracts** — actual `package.json` commands, `vitest.config.ts`, canonical npm lockfile, and their supporting manifests/contracts. They describe execution and evidence; they do not override accepted product semantics with retired snapshots.
4. **Historical documentation** — prior Block/Phase reports, release scorecards, original design specifications and Studio artifacts. They preserve past claims/provenance and cannot establish current status by filename alone.

Browser/runtime/network observations remain evidence for the exact behavior observed. Static inspection, mocked tests, build, typecheck and manual review prove different things; none silently overrides the others or grants user acceptance.

## Single current authority and supporting documents

- [02_PHASE_LEDGER.md](02_PHASE_LEDGER.md): current phase, active/next unit, accepted units and execution/debt routing.
- [05_DECISION_AND_DEBT_LOG.md](05_DECISION_AND_DEBT_LOG.md): canonical accepted decisions, debt classifications, owners and dispositions; it defers unit status to the ledger.
- [FOUNDATIONAL_PLAN_PHASE_0_TO_18.md](FOUNDATIONAL_PLAN_PHASE_0_TO_18.md): accepted phase sequence; [RECONSTRUCTION_PLAN.md](RECONSTRUCTION_PLAN.md): reconstruction classification framework.
- [STREAMLINED_RECONSTRUCTION_EXECUTION_METHOD.md](STREAMLINED_RECONSTRUCTION_EXECUTION_METHOD.md): current execution-method authority for audit sizing, batch sizing, verification proportionality, publication consolidation and documentation cadence.
- [ROOT_TOOLING_HYGIENE_CONTRACT.md](ROOT_TOOLING_HYGIENE_CONTRACT.md), [TOOLCHAIN_CONTRACT.md](TOOLCHAIN_CONTRACT.md), [TEST_TAXONOMY_AND_HARNESS_CONTRACT.md](TEST_TAXONOMY_AND_HARNESS_CONTRACT.md): supporting execution contracts, subordinate to the actual current package/config files.
- [PRODUCT_RECONSTRUCTION_ACCEPTANCE_GOVERNANCE.md](PRODUCT_RECONSTRUCTION_ACCEPTANCE_GOVERNANCE.md): product verification and explicit user-acceptance requirements.
- [DOCUMENTATION_AUTHORITY_REVIEW_P0_U5.md](DOCUMENTATION_AUTHORITY_REVIEW_P0_U5.md): exhaustive document classifications and P0-U5 review evidence; not a second state ledger.
- [CURRENT_CONVERSATION_HANDOFF_2026-10-23.md](CURRENT_CONVERSATION_HANDOFF_2026-10-23.md): current conversation-transfer snapshot and execution handoff; subordinate to GitHub main and the phase ledger, and not a competing state authority.

## Historical boundaries

`RELEASE.md`, `security_spec.md`, original `docs/*.md` design specifications and pre-existing `reports/**` documents are `HISTORICAL_RECORD` unless an explicit current decision promotes a bounded fact. Historical report bodies, including fixed key counts, deployment verdicts, old test expectations and former Phase/Block numbering, are evidence of their recorded period only. Historical JSON/catalog files consumed by tools/tests keep that bounded fixture role; it does not promote their narrative claims to current translation or release authority.

The eight `.aistudio/artifacts/brain/**` Markdown files are preserved historical planning snapshots. Their embedded state/decision copies are not live mirrors. `PHASE_0_READ_ONLY_AUDIT.md` is the dated bootstrap audit, not a current lockfile or harness report. Future architecture/distribution remains an unapproved proposal, not implemented architecture or next-unit authorization.

## Governance and publication

Never infer current code from old reports or conflate historical numbering with the reconstruction Phase 0–18 plan. Never alter production merely to satisfy an obsolete static assertion. Distinguish test/build success from product/browser acceptance and formal unit closure.

User acceptance remains explicit where product/owner acceptance is required, and owner merge remains manual unless explicitly changed. Under the current streamlined method, commit + push + PR may be one publication step after scope review; the normal independent GitHub gate is a single post-merge verification. Separate pre-PR publication audits are reserved for cases where risk materially justifies them. Historical unit-specific rules remain evidence of their period and do not override the current execution method.

When `.git` is available, inspect it directly; when unavailable in Studio, the Sync UI may establish local pending-file scope, not remote code truth. Studio implementation reports remain claims requiring independent verification.
