# DOCUMENT AUTHORITY CONTRACT
## Precedence Hierarchy & Evidence Rules for Q-Saudi Reconstruction

### Document & Source Precedence Hierarchy

When evaluating system state, architecture, or code truth, the following strict precedence hierarchy applies (1 is highest authority):

```
1. CURRENT GITHUB MAIN
   └─ Authoritative code truth.

2. LIVE BROWSER / RUNTIME / NETWORK EVIDENCE
   └─ Authoritative runtime evidence.

3. docs/reconstruction/*
   └─ Current reconstruction architecture, decisions, phase state,
      governance, implementation protocol, and verification rules.

4. EXISTING docs/*
   └─ Architectural and reference material that may contain historical,
      legacy, or pre-reconstruction assumptions.

5. RELEASE.md AND HISTORICAL BLOCK / PHASE REPORTS
   └─ Historical evidence only unless explicitly promoted by a
      reconstruction decision.

6. GOOGLE AI STUDIO REPORTS
   └─ Implementation claims requiring independent verification.

7. GOOGLE AI STUDIO ARTIFACTS
   └─ Active planning/governance workspace, but not a replacement for GitHub code truth.
```

---

### Mandatory Governance Rules

1. **Never Infer Code State from Old Reports**: Never infer current code state from an old report or log file.
2. **Never Treat Historical Statements as Beta 2 Status**: Never treat an old "RELEASE READY" or "PRODUCTION READY" statement as current Beta 2 status.
3. **Historical Block vs Reconstruction Roadmap**: Never treat historical Block/Phase numbering as equivalent to the new Phase 0–18 reconstruction roadmap.
4. **No Code Edits for Obsolete Static Assertions**: Never modify production code merely to satisfy an obsolete source-text/static assertion.
5. **Tests/Build Alone Do Not Close a Phase**: Never call a phase or unit CLOSED because build or unit tests alone pass.
6. **No Fake Git Claims**: Never claim GitHub diff or status from local `.git` unless `.git` is actually present and verified.
7. **GitHub Sync UI Authority**: When `.git` is unavailable inside Google AI Studio, the Google AI Studio GitHub Sync UI is the authoritative unpushed-file scope evidence.
8. **Manual Push Execution**: The user performs git push manually.
9. **Independent Post-Push Review**: ChatGPT / independent auditor reviews the actual GitHub commit after push.
10. **Studio Reports Are Claims**: Studio reports are implementation claims, not source-of-truth evidence.
11. **Runtime vs Repository Separation**: Runtime evidence and repository evidence must never be conflated.
