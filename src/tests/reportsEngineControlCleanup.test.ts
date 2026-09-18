import fs from 'fs';
import path from 'path';
import { 
  ReportCategory, 
  ReportType, 
  OPERATIONAL_REPORTS_METADATA, 
  PRICING_REPORTS_METADATA 
} from '../types/reports';

/**
 * FOCUSED REGRESSION SUITE: Reports Engine Production Control Cleanup
 * 
 * Verifies that developer diagnostic/test execution controls have been completely removed
 * from the production ReportsEngineView component while preserving all 15 business report types,
 * 4 categories, filter parameters, exports, and canonical subscriptions.
 */
function runControlCleanupTests() {
  console.log('🚀 Running Reports Engine Production Control Cleanup Test Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testId: string, description: string) {
    if (condition) {
      console.log(`✅ [${testId}] ${description}`);
      passed++;
    } else {
      console.error(`❌ [${testId}] ${description}`);
      failed++;
    }
  }

  const viewFilePath = path.join(process.cwd(), 'src/components/reports/ReportsEngineView.tsx');
  const viewCode = fs.readFileSync(viewFilePath, 'utf-8').toString();

  // 1. Absence of developer test execution in production view
  assert(
    !viewCode.includes('runReportsEngineTests'),
    'REP-CLEAN-01',
    'ReportsEngineView contains ZERO references to runReportsEngineTests'
  );

  assert(
    !viewCode.includes('btn-run-reports-tests'),
    'REP-CLEAN-02',
    'ReportsEngineView contains ZERO occurrences of btn-run-reports-tests'
  );

  assert(
    !viewCode.includes('isTestModalOpen'),
    'REP-CLEAN-03',
    'ReportsEngineView contains ZERO occurrences of developer test modal state (isTestModalOpen)'
  );

  assert(
    !viewCode.includes('Compliance Test Suite'),
    'REP-CLEAN-04',
    'ReportsEngineView contains ZERO developer compliance test modal markup'
  );

  // 2. Preservation of report categories and 15 report types
  const categories: ReportCategory[] = ['OPERATIONAL', 'WEIGHBRIDGE', 'PRICING', 'INGESTION'];
  categories.forEach(cat => {
    assert(
      viewCode.includes(`'${cat}'`),
      `REP-CLEAN-CAT-${cat}`,
      `Report category '${cat}' is preserved in ReportsEngineView`
    );
  });

  const operationalReportTypes = Object.keys(OPERATIONAL_REPORTS_METADATA);
  const pricingReportTypes = Object.keys(PRICING_REPORTS_METADATA);
  const totalReportTypesCount = operationalReportTypes.length + pricingReportTypes.length;

  assert(
    totalReportTypesCount === 16,
    'REP-CLEAN-05',
    `Exactly 16 canonical report types exist in metadata (found ${totalReportTypesCount})`
  );

  // 3. Preservation of business controls
  assert(
    viewCode.includes('handleExportCSV') && viewCode.includes('exportToCSV'),
    'REP-CLEAN-06',
    'CSV export action (exportToCSV) remains wired'
  );

  assert(
    viewCode.includes('handleExportXLSX') && viewCode.includes('exportToXLSX'),
    'REP-CLEAN-07',
    'XLSX export action (exportToXLSX) remains wired'
  );

  assert(
    viewCode.includes('PrintableReportModal') && viewCode.includes('isPrintModalOpen'),
    'REP-CLEAN-08',
    'Print PDF modal (PrintableReportModal) remains wired'
  );

  assert(
    viewCode.includes('handleResetFilters'),
    'REP-CLEAN-09',
    'Reset filters action (handleResetFilters) remains wired'
  );

  assert(
    viewCode.includes('tableSearch') && viewCode.includes('filteredRows'),
    'REP-CLEAN-10',
    'Reactive table search (tableSearch) remains wired'
  );

  assert(
    viewCode.includes('isMobileFiltersOpen'),
    'REP-CLEAN-11',
    'Mobile filters toggle state remains wired'
  );

  // 4. Preservation of canonical data subscriptions & authorization
  assert(
    viewCode.includes('tripRepository.subscribeByProject'),
    'REP-CLEAN-12',
    'Canonical trip subscription (tripRepository.subscribeByProject) is preserved'
  );

  assert(
    viewCode.includes('exceptionRepository.subscribeByProject'),
    'REP-CLEAN-13',
    'Canonical exception subscription (exceptionRepository.subscribeByProject) is preserved'
  );

  assert(
    viewCode.includes('useAuth()'),
    'REP-CLEAN-14',
    'Authentication context (useAuth) is preserved'
  );

  console.log('\n======================================================');
  console.log(`📊 Reports Engine Control Cleanup Test Results: ${passed}/${passed + failed} PASSED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runControlCleanupTests();
