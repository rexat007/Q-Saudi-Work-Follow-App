# Current UI4-CI1 foundation recovery

[CI1 local gates and original CI failure](ci1-recovery.json), [current 52-file inventory](exact-file-inventory.json), [CI1 raw red/green evidence and original 49-file backup](ci1-verification-raw.zip). Runtime 16/16, focused UI4 87/87, lint/build exit 0. Required remote CI remains PENDING in this pre-publication snapshot: HOLD until observed success on the exact new PR head. Original evidence below is retained historical state; source hashes in original RB1 records refer to pre-CI1 bytes. No historical failure is relabeled PASS.

# Current UI4-RB1 correction evidence

[RB1 final gates](rb1-recovery.json), [current exact inventory](exact-file-inventory.json), [RB1 raw evidence and before-byte backups](rb1-verification-raw.zip). Scope 49; export blocker verified resolved; owner source review only, publication HOLD. The pre-RB1 evidence below and source-contract.json are preserved historical snapshots. The original raw archive remains byte-identical.

# UI4 local owner-review evidence

No commit, staging, push or production operation. HEAD remains `800434f634fb7ea5099fc12e4ec064dfb05d6df2` on `ui/ui4-operational-reports-20261115`.

- [Commands/native exits](verification.json), [exact inventory](exact-file-inventory.json), [authority/worktree preservation](source-contract.json).
- [All 14 matched failure identities](failure-comparison.json). Baseline 310/324; final 382/396. Both native exits 1; aggregate **NOT PASS**. Twelve require explicit loopback; separately verified on emulators. Two unchanged Wizard/Outbox translation assertions remain.
- All 72 new unit cases pass. Final print/security/localization family 156/156, native exit 0. Final Edge 9/9, exit 0: AR/EN/UR at 390/768/1440, four profiles, all report families, actual CSV/XLSX downloads, print row/column equivalence, keyboard/focus, failed reads/recovery and scoped provider fixtures.
- Authenticated loopback baseline operational 14/14; initial candidate 16/17 (exit 1), including both unchanged UI3 journeys passing with 1002-Trip reporting. The new UI4 test assumed project selection remained on Reports; unchanged Sidebar enters Wizard. Following that route and real App/server gives 1/1, exit 0. Do not call the original 17-case aggregate PASS. Both owned runs have zero cleanup errors and no remaining listeners.
- [Historical attempts and causal limits](history.json). [Immutable raw verification archive](verification-raw.zip) retains failures/logs, commands, diagnostic selectors, ownership/cleanup and native artifacts. One-case diagnostics are not full-suite acceptance. Earlier native deadlines remain CAUSE_UNRESOLVED, not reproduced in final 9/9.
- [Inherited five-document patch](inherited-five-docs.patch), [preflight/allowlist](preflight.json). Original added lines remain in order.
- [Arabic mobile](screenshots/ar-mobile.png), [English desktop](screenshots/en-desktop.png), [Urdu tablet](screenshots/ur-tablet.png); print screenshots and six final page renders under `pdf-qa/`. Read-only PDF QA confirmed the old clipped columns are visible in complete bounded bands. No live-provider, physical-device or screen-reader acceptance.

[The phase ledger](../02_PHASE_LEDGER.md) alone owns current state. [UI4 implementation](../UI4_OPERATIONAL_REPORTS.md) records boundaries/debt. Existing shared XLSX metadata is Arabic; emulator runtime/ADC warnings are not Google/deployment acceptance. Recommendation: GO to owner source review with inherited debt; separate commit/publication authorization required.
