# ACTIVE TEST MANIFEST
## Q-Saudi Work Follow Reconstruction — Phase 0 (Unit P0-U3B)

Total Active Test Files: 67

This manifest enumerates all 67 test files currently referenced by `package.json` test scripts (`npm test`, `verify:beta2`, and dedicated `test:*` scripts).

| # | Repository Path | Package Script Reachability | Execution Mechanism | Proposed Taxonomy | Environment Class | Migration Disposition | TSC Status | Reliable Failure |
|---|---|---|---|---|---|---|---|---|
| 1 | `src/tests/authGatewayPermissionUxBlock87.test.ts` | `test:auth-gateway-87, test` | `TSX_CUSTOM` | `SERVER_CONTRACT` | `PURE_LOGIC` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 2 | `src/tests/block102OperationalAccessSmartRoster.test.ts` | `test:block102, test` | `TSX_CUSTOM` | `UNIT` | `PURE_LOGIC` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 3 | `src/tests/canonicalImportContextConvergence.test.ts` | `verify:beta2` | `VITEST` | `UNIT` | `FILESYSTEM` | `KEEP_VITEST` | `CLEAN` | `YES` |
| 4 | `src/tests/canonicalTripDispatchAuthority.test.ts` | `test:canonical-dispatch, verify:beta2` | `VITEST` | `SERVER_CONTRACT` | `FILESYSTEM` | `KEEP_VITEST` | `CLEAN` | `YES` |
| 5 | `src/tests/dataCleanupBlock82.test.ts` | `test:data-cleanup-82, test` | `VITEST` | `UI_DOM` | `FIREBASE_MOCK` | `KEEP_VITEST` | `CLEAN` | `YES` |
| 6 | `src/tests/driverTruckIntakeP602A.test.ts` | `verify:beta2` | `VITEST` | `SERVER_CONTRACT` | `FIREBASE_MOCK` | `KEEP_VITEST` | `CLEAN` | `YES` |
| 7 | `src/tests/driverViewConvergenceP603.test.ts` | `verify:beta2` | `VITEST` | `INTEGRATION_MOCK` | `FIREBASE_MOCK` | `KEEP_VITEST` | `CLEAN` | `YES` |
| 8 | `src/tests/excelCsvImport.test.ts` | `test` | `TSX_CUSTOM` | `UNIT` | `FIREBASE_MOCK` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 9 | `src/tests/fieldLoadingUnloadingBlock77.test.ts` | `test:field-ops-77, test` | `TSX_CUSTOM` | `STATIC_GOVERNANCE` | `FILESYSTEM` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 10 | `src/tests/fieldReportsCentralDashboardBlock80.test.ts` | `test:reports-dashboard-80, test` | `TSX_CUSTOM` | `UNIT` | `PURE_LOGIC` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 11 | `src/tests/fieldSupervisionConvergenceP604.test.ts` | `verify:beta2` | `VITEST` | `INTEGRATION_MOCK` | `FIREBASE_MOCK` | `KEEP_VITEST` | `CLEAN` | `YES` |
| 12 | `src/tests/finalUiArchitectureBlock76.test.ts` | `test:uiux-arch-76, test` | `TSX_CUSTOM` | `STATIC_GOVERNANCE` | `FILESYSTEM` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 13 | `src/tests/firebaseProjectConfiguration85A.test.ts` | `test:firebase-config-85a, test` | `TSX_CUSTOM` | `UNIT` | `FIREBASE_MOCK` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 14 | `src/tests/humanReviewApplicationBlock70Corrected.test.ts` | `test:i18n-application-70, test` | `TSX_CUSTOM` | `STATIC_GOVERNANCE` | `FILESYSTEM` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 15 | `src/tests/humanReviewApprovalBlock69.test.ts` | `test:i18n-approval-69, test` | `TSX_CUSTOM` | `STATIC_GOVERNANCE` | `FILESYSTEM` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 16 | `src/tests/humanReviewDecisionBlock68.test.ts` | `test:i18n-decision-68, test` | `TSX_CUSTOM` | `STATIC_GOVERNANCE` | `FILESYSTEM` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 17 | `src/tests/humanReviewGovernanceBlock67.test.ts` | `test:i18n-governance-67, test` | `TSX_CUSTOM` | `STATIC_GOVERNANCE` | `FILESYSTEM` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 18 | `src/tests/humanReviewReconciliationBlock69A.test.ts` | `test:i18n-reconciliation-69a, test` | `TSX_CUSTOM` | `STATIC_GOVERNANCE` | `FILESYSTEM` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 19 | `src/tests/i18nCatalog.test.ts` | `test` | `TSX_CUSTOM` | `SERVER_CONTRACT` | `SERVER_CONTEXT` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 20 | `src/tests/i18nCodemod.test.ts` | `test:i18n-codemod, test` | `TSX_CUSTOM` | `STATIC_GOVERNANCE` | `SERVER_CONTEXT` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 21 | `src/tests/i18nFoundation.test.ts` | `test` | `TSX_CUSTOM` | `UNIT` | `PURE_LOGIC` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 22 | `src/tests/i18nGenerationBlock54b.test.ts` | `test:i18n-gen-54b, test` | `TSX_CUSTOM` | `STATIC_GOVERNANCE` | `FILESYSTEM` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 23 | `src/tests/i18nRecoveryBlock54a.test.ts` | `test:i18n-recovery, test` | `TSX_CUSTOM` | `STATIC_GOVERNANCE` | `FILESYSTEM` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 24 | `src/tests/i18nTranslationCatalog.test.ts` | `test` | `TSX_CUSTOM` | `STATIC_GOVERNANCE` | `FILESYSTEM` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 25 | `src/tests/i18nTranslationGeneration.test.ts` | `test:i18n-gen, test` | `TSX_CUSTOM` | `STATIC_GOVERNANCE` | `FILESYSTEM` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 26 | `src/tests/materialAuthorityP602B2.test.ts` | `verify:beta2` | `VITEST` | `UNIT` | `PURE_LOGIC` | `KEEP_VITEST` | `CLEAN` | `YES` |
| 27 | `src/tests/projectActivationServerAuthority.test.ts` | `verify:beta2` | `VITEST` | `UNIT` | `FIREBASE_MOCK` | `KEEP_VITEST` | `CLEAN` | `YES` |
| 28 | `src/tests/projectCarrierFleetAffiliationFoundation.test.ts` | `verify:beta2` | `VITEST` | `UNIT` | `FIREBASE_MOCK` | `KEEP_VITEST` | `CLEAN` | `YES` |
| 29 | `src/tests/projectCentricOperationsBlock87.test.ts` | `test:project-centric-87, test` | `TSX_CUSTOM` | `SERVER_CONTRACT` | `PURE_LOGIC` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 30 | `src/tests/projectDriverTruckAssignmentFoundation.test.ts` | `verify:beta2` | `VITEST` | `UNIT` | `FILESYSTEM` | `KEEP_VITEST` | `CLEAN` | `YES` |
| 31 | `src/tests/projectFleetReadModelAdminReadContext.test.ts` | `verify:beta2` | `VITEST` | `SERVER_CONTRACT` | `PURE_LOGIC` | `KEEP_VITEST` | `CLEAN` | `YES` |
| 32 | `src/tests/projectFleetReadModelFoundation.test.ts` | `verify:beta2` | `VITEST` | `UNIT` | `FIREBASE_MOCK` | `KEEP_VITEST` | `CLEAN` | `YES` |
| 33 | `src/tests/projectFormDateUx86F.test.ts` | `test:project-form-date-ux-86f, test` | `TSX_CUSTOM` | `UNIT` | `PURE_LOGIC` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 34 | `src/tests/projectLifecycleServerAuthority.test.ts` | `verify:beta2` | `VITEST` | `SERVER_CONTRACT` | `SERVER_CONTEXT` | `KEEP_VITEST` | `CLEAN` | `YES` |
| 35 | `src/tests/projectMaterialCarrierServerAuthorityConvergence.test.ts` | `verify:beta2` | `VITEST` | `SERVER_CONTRACT` | `SERVER_CONTEXT` | `KEEP_VITEST` | `CLEAN` | `YES` |
| 36 | `src/tests/projectMembershipFoundation.test.ts` | `verify:beta2` | `VITEST` | `UNIT` | `FIREBASE_MOCK` | `KEEP_VITEST` | `CLEAN` | `YES` |
| 37 | `src/tests/projectMutabilityPolicy.test.ts` | `verify:beta2` | `VITEST` | `SERVER_CONTRACT` | `SERVER_CONTEXT` | `KEEP_VITEST` | `CLEAN` | `YES` |
| 38 | `src/tests/projectPricingServerAuthority.test.ts` | `verify:beta2` | `VITEST` | `SERVER_CONTRACT` | `SERVER_CONTEXT` | `KEEP_VITEST` | `CLEAN` | `YES` |
| 39 | `src/tests/projectReadinessAdminReadContext.test.ts` | `verify:beta2` | `VITEST` | `UNIT` | `PURE_LOGIC` | `KEEP_VITEST` | `CLEAN` | `YES` |
| 40 | `src/tests/projectTruckMaterialAllocationFoundation.test.ts` | `verify:beta2` | `VITEST` | `UNIT` | `FIREBASE_MOCK` | `KEEP_VITEST` | `CLEAN` | `YES` |
| 41 | `src/tests/qualityExpansionBlock58.test.ts` | `test:i18n-quality-expansion, test` | `TSX_CUSTOM` | `STATIC_GOVERNANCE` | `FILESYSTEM` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 42 | `src/tests/qualityExpansionBlock59.test.ts` | `test:i18n-quality-expansion-59, test` | `TSX_CUSTOM` | `STATIC_GOVERNANCE` | `FIREBASE_MOCK` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 43 | `src/tests/qualityExpansionBlock62.test.ts` | `test:i18n-quality-expansion-62, test` | `TSX_CUSTOM` | `UNIT` | `FILESYSTEM` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 44 | `src/tests/qualityExpansionBlock63.test.ts` | `test:i18n-quality-expansion-63, test` | `TSX_CUSTOM` | `UNIT` | `FIREBASE_MOCK` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 45 | `src/tests/qualityExpansionBlock64.test.ts` | `test:i18n-quality-expansion-64, test` | `TSX_CUSTOM` | `UNIT` | `FIREBASE_MOCK` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 46 | `src/tests/qualityExpansionBlock65.test.ts` | `test:i18n-quality-expansion-65, test` | `TSX_CUSTOM` | `STATIC_GOVERNANCE` | `FIREBASE_MOCK` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 47 | `src/tests/qualityExpansionBlock66.test.ts` | `test:i18n-quality-expansion-66, test` | `TSX_CUSTOM` | `UNIT` | `FILESYSTEM` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 48 | `src/tests/qualityPilotBlock57.test.ts` | `test:i18n-quality-pilot, test` | `VITEST` | `UNIT` | `PURE_LOGIC` | `KEEP_VITEST` | `CLEAN` | `YES` |
| 49 | `src/tests/qualityTranslationBlock61.test.ts` | `test:i18n-quality-p1-61, test` | `TSX_CUSTOM` | `UNIT` | `FILESYSTEM` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 50 | `src/tests/roleBasedNavigationSystemAssemblyBlock81.test.ts` | `test:nav-assembly-81, test` | `TSX_CUSTOM` | `SERVER_CONTRACT` | `FIREBASE_MOCK` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 51 | `src/tests/runtimeDefaultDataElimination92A.test.ts` | `test:runtime-data-92a, test` | `VITEST` | `UNIT` | `PURE_LOGIC` | `KEEP_VITEST` | `CLEAN` | `YES` |
| 52 | `src/tests/runtimeEmptyStateBlock82B.test.ts` | `test:runtime-empty-82b, test` | `VITEST` | `UNIT` | `PURE_LOGIC` | `KEEP_VITEST` | `CLEAN` | `YES` |
| 53 | `src/tests/runtimeKeyAudit.test.ts` | `test:i18n-runtime, test` | `TSX_CUSTOM` | `STATIC_GOVERNANCE` | `FILESYSTEM` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 54 | `src/tests/runtimeProjectMasterDataEmptyStateBlock82D.test.ts` | `test:runtime-project-empty-82d, test` | `VITEST` | `UNIT` | `PURE_LOGIC` | `KEEP_VITEST` | `CLEAN` | `YES` |
| 55 | `src/tests/runtimeSmokeBlock55.test.ts` | `test:i18n-smoke, test` | `TSX_CUSTOM` | `STATIC_GOVERNANCE` | `FILESYSTEM` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 56 | `src/tests/secureAuthenticationAccountApprovalBlock86B.test.ts` | `test:auth-approval-86b, test` | `TSX_CUSTOM` | `SERVER_CONTRACT` | `SERVER_CONTEXT` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 57 | `src/tests/secureTripNumberingOffline89B.test.ts` | `test:secure-trip-89b` | `TSX_CUSTOM` | `SERVER_CONTRACT` | `FIREBASE_MOCK` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 58 | `src/tests/serverAuthenticationTrustBoundary.test.ts` | `test:auth-trust-boundary` | `TSX_CUSTOM` | `SERVER_CONTRACT` | `SERVER_CONTEXT` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 59 | `src/tests/sidebarProjectWorkspaceBlock88.test.ts` | `test:sidebar-project-workspace-block88, test` | `TSX_CUSTOM` | `UNIT` | `FIREBASE_MOCK` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 60 | `src/tests/switcherAndQualityBlock56.test.ts` | `test:i18n-switcher-quality, test` | `TSX_CUSTOM` | `STATIC_GOVERNANCE` | `FILESYSTEM` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 61 | `src/tests/translationQualityFixesBlock84A.test.ts` | `test:translation-fixes-84a, test` | `VITEST` | `UNIT` | `PURE_LOGIC` | `KEEP_VITEST` | `CLEAN` | `YES` |
| 62 | `src/tests/uiuxAuditBlock72.test.ts` | `test:uiux-audit-72, test` | `TSX_CUSTOM` | `STATIC_GOVERNANCE` | `FILESYSTEM` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 63 | `src/tests/uiuxFixesBlock83A.test.ts` | `test:uiux-fixes-83a, test` | `TSX_CUSTOM` | `STATIC_GOVERNANCE` | `FILESYSTEM` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 64 | `src/tests/uiuxP1FixesBlock73.test.ts` | `test:uiux-p1-73, test` | `TSX_CUSTOM` | `STATIC_GOVERNANCE` | `FILESYSTEM` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 65 | `src/tests/uiuxP2FixesBlock74.test.ts` | `test:uiux-p2-74, test` | `TSX_CUSTOM` | `STATIC_GOVERNANCE` | `FIREBASE_MOCK` | `MIGRATE_TO_VITEST` | `CLEAN` | `YES` |
| 66 | `src/tests/uiuxP3FixesBlock75.test.ts` | `test:uiux-p3-75, test` | `TSX_CUSTOM` | `STATIC_GOVERNANCE` | `FILESYSTEM` | `MIGRATE_TO_VITEST` | `HAS_TEST_DEBT` | `YES` |
| 67 | `src/tests/workspaceCanonicalReadConvergence.test.ts` | `test:workspace-canonical-reads, verify:beta2` | `VITEST` | `SERVER_CONTRACT` | `PURE_LOGIC` | `KEEP_VITEST` | `CLEAN` | `YES` |
