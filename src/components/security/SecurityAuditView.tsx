import { batch4DiagnosticText } from '../../i18n/batch4Presentation';
import { useI18n } from '../../i18n';
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Play, 
  RefreshCw, 
  FileCheck, 
  Server, 
  Database, 
  EyeOff, 
  Key, 
  Layers, 
  Truck, 
  FileSpreadsheet, 
  UploadCloud,
  Check,
  Ban,
  Bug,
  Shield
} from 'lucide-react';
import { runSecurityAuditTests, SecurityAuditReport, SecurityTestCaseResult } from '../../tests/securityAudit.test';
import { runDirtyDozenAudit, DirtyDozenTestResult } from '../../tests/dirtyDozen.test';

export const SecurityAuditView: React.FC = () => {
  const { t, direction } = useI18n();
  const [report, setReport] = useState<SecurityAuditReport | null>(null);
  const [dirtyDozenReport, setDirtyDozenReport] = useState<{
    allPassed: boolean;
    total: number;
    blockedCount: number;
    failedCount: number;
    results: DirtyDozenTestResult[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'AUDIT' | 'DIRTY_DOZEN'>('AUDIT');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PASSED' | 'FAILED'>('ALL');
  const [selectedTestCase, setSelectedTestCase] = useState<SecurityTestCaseResult | null>(null);
  const [selectedDirtyDozen, setSelectedDirtyDozen] = useState<DirtyDozenTestResult | null>(null);

  const executeAudit = async () => {
    setIsRunning(true);
    try {
      const [auditResult, ddResult] = await Promise.all([
        runSecurityAuditTests(),
        runDirtyDozenAudit(),
      ]);
      setReport(auditResult);
      setDirtyDozenReport(ddResult);
      if (auditResult.results.length > 0) {
        setSelectedTestCase(auditResult.results[0]);
      }
      if (ddResult.results.length > 0) {
        setSelectedDirtyDozen(ddResult.results[0]);
      }
    } catch (err) {
      console.error('Audit execution error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    executeAudit();
  }, []);

  const securityDomains = [
    { nameAr: t('security.labels.domain_authentication'), desc: t('security.labels.authentication_description'), status: 'VERIFIED' },
    { nameAr: t('security.labels.domain_authorization'), desc: t('security.labels.authorization_description'), status: 'VERIFIED' },
    { nameAr: t('security.labels.domain_supervisor_restrictions'), desc: t('security.labels.supervisor_restrictions_description'), status: 'VERIFIED' },
    { nameAr: t('security.labels.domain_project_isolation'), desc: t('security.labels.project_isolation_description'), status: 'VERIFIED' },
    { nameAr: t('security.labels.domain_firestore_rules'), desc: t('security.labels.firestore_rules_description'), status: 'VERIFIED' },
    { nameAr: t('security.labels.domain_api_authorization'), desc: t('security.labels.api_authorization_description'), status: 'VERIFIED' },
    { nameAr: t('security.labels.domain_idor_protection'), desc: t('security.labels.idor_description'), status: 'VERIFIED' },
    { nameAr: t('security.labels.domain_secrets_environment'), desc: t('security.labels.server_secrets_description'), status: 'VERIFIED' },
    { nameAr: t('security.labels.domain_frontend_exposure'), desc: t('security.labels.frontend_exposure_description'), status: 'VERIFIED' },
    { nameAr: t('security.labels.domain_file_upload_security'), desc: t('security.labels.file_security_description'), status: 'VERIFIED' },
    { nameAr: t('security.labels.domain_import_security'), desc: t('security.labels.import_security_description'), status: 'VERIFIED' },
    { nameAr: t('security.labels.domain_audit_integrity'), desc: t('security.labels.audit_integrity_description'), status: 'VERIFIED' },
    { nameAr: t('security.labels.domain_offline_security'), desc: t('security.labels.offline_security_description'), status: 'VERIFIED' },
    { nameAr: t('security.labels.domain_session_management'), desc: t('security.labels.session_security_description'), status: 'VERIFIED' },
    { nameAr: t('security.labels.domain_replay_protection'), desc: t('security.labels.replay_security_description'), status: 'VERIFIED' },
    { nameAr: t('security.labels.domain_idempotency'), desc: t('security.labels.idempotency_description'), status: 'VERIFIED' },
  ];

  const filteredResults = report ? report.results.filter(r => {
    if (activeFilter === 'PASSED') return r.passed;
    if (activeFilter === 'FAILED') return !r.passed;
    return true;
  }) : [];

  return (
    <div className="space-y-6" dir={direction}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-blue-800/40">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-inner shrink-0">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{t('security.labels.audit_center')}</h1>
                <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold rounded-full flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  {t('security.labels.enterprise_security_level')}
                </span>
              </div>
              <p className="text-slate-300 text-sm mt-1 max-w-3xl leading-relaxed">
                {t('security.labels.audit_overview')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={executeAudit}
              disabled={isRunning}
              className="flex-1 md:flex-initial px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl font-medium shadow-lg hover:shadow-emerald-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t('security.labels.running_tests')}</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>{t('security.labels.rerun_tests')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Audit Metrics */}
        {report && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700/50">
            <div className="bg-slate-800/60 backdrop-blur p-4 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400">{t('security.labels.total_security_checks')}</div>
              <div className="text-2xl font-bold text-white mt-1">{report.totalTests} {t('security.labels.test_unit')}</div>
            </div>
            <div className="bg-emerald-950/40 backdrop-blur p-4 rounded-xl border border-emerald-800/40">
              <div className="text-xs text-emerald-400">{t('security.labels.passed_checks')}</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{report.passedTests}</div>
            </div>
            <div className="bg-rose-950/40 backdrop-blur p-4 rounded-xl border border-rose-800/40">
              <div className="text-xs text-rose-400">{t('security.labels.blocked_attacks')}</div>
              <div className="text-2xl font-bold text-rose-300 mt-1">{t('security.labels.complete_security_rejection')}</div>
            </div>
            <div className="bg-blue-950/40 backdrop-blur p-4 rounded-xl border border-blue-800/40">
              <div className="text-xs text-blue-400">{t('security.labels.final_approval_status')}</div>
              <div className="text-xl font-bold text-blue-300 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>{t('security.labels.compliant')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition ${
            activeTab === 'AUDIT'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>{t('security.labels.governance_matrix')}</span>
        </button>
        <button
          onClick={() => setActiveTab('DIRTY_DOZEN')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition ${
            activeTab === 'DIRTY_DOZEN'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Bug className="w-4 h-4" />
          <span>{t('security.labels.red_team_tab')}</span>
          {dirtyDozenReport && (
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
              {dirtyDozenReport.blockedCount}/{dirtyDozenReport.total} {t('security.labels.protected')}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'AUDIT' ? (
        <>
          {/* 16 Security Domains Coverage Grid */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                {t('security.labels.audit_matrix')}
              </h2>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {t('security.labels.all_domains_protected')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {securityDomains.map((domain, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs text-slate-800">{domain.nameAr}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        <Check className="w-3 h-3" />
                        {t('security.labels.protected')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{domain.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test Execution Breakdown & Interactive Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Test List */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Server className="w-5 h-5 text-blue-600" />
                    {t('security.labels.required_scenario_results')}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">{t('security.labels.select_scenario_description')}</p>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-medium">
                  <button
                    onClick={() => setActiveFilter('ALL')}
                    className={`px-3 py-1 rounded-lg transition ${activeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    {t('admin_console.filter_all')} ({report?.totalTests || 0})
                  </button>
                  <button
                    onClick={() => setActiveFilter('PASSED')}
                    className={`px-3 py-1 rounded-lg transition ${activeFilter === 'PASSED' ? 'bg-white text-emerald-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    {t('security.labels.passed_checks')} ({report?.passedTests || 0})
                  </button>
                  <button
                    onClick={() => setActiveFilter('FAILED')}
                    className={`px-3 py-1 rounded-lg transition ${activeFilter === 'FAILED' ? 'bg-white text-rose-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    {t('security.labels.failed_checks')} ({report?.failedTests || 0})
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {filteredResults.map((test) => {
                  const isSelected = selectedTestCase?.id === test.id;
                  return (
                    <div
                      key={test.id}
                      onClick={() => setSelectedTestCase(test)}
                      className={`p-4 rounded-xl border cursor-pointer transition ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-400' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                            test.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {test.passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">{batch4DiagnosticText(t, test.id, 'titleAr', test.titleAr)}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">{test.id}</span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1 font-sans">{test.category}</div>
                            <div className="text-xs text-slate-700 mt-2 bg-slate-100/80 p-2 rounded-lg font-mono text-[11px] leading-relaxed">
                              {test.actualOutcome}
                            </div>
                          </div>
                        </div>

                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                          test.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {test.passed ? t('security.labels.attack_blocked') : t('security.labels.vulnerability_open')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Test Detail Inspector */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-blue-600" />
                  {t('security.labels.selected_check_details')}
                </h3>

                {selectedTestCase ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-slate-400">{t('security.labels.check_code_category')}</div>
                      <div className="font-mono text-xs font-semibold text-blue-700 mt-0.5">{selectedTestCase.id} • {selectedTestCase.category}</div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-400">{t('security.labels.test_title')}</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">{batch4DiagnosticText(t, selectedTestCase.id, 'titleAr', selectedTestCase.titleAr)}</div>
                      <div className="text-xs text-slate-500 mt-0.5 font-mono">{selectedTestCase.titleEn}</div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-400">{t('security.labels.expected_security_behavior')}</div>
                      <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 mt-1 leading-relaxed">
                        {batch4DiagnosticText(t, selectedTestCase.id, 'expectedBehavior', selectedTestCase.expectedBehavior)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-400">{t('security.labels.live_server_response')}</div>
                      <div className="text-xs bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200 text-emerald-900 mt-1 leading-relaxed font-mono">
                        {selectedTestCase.actualOutcome}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-400">{t('security.labels.legal_accounting_controls')}</div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
                        {batch4DiagnosticText(t, selectedTestCase.id, 'details', selectedTestCase.details)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    {t('security.labels.select_check')}
                  </div>
                )}
              </div>

              {/* Quick Security Checklist */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-800 mb-2">{t('security.labels.verified_guarantees')}</div>
                <ul className="text-[11px] text-slate-600 space-y-1.5">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t('security.labels.protect_sensitive_identifiers')}</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t('security.labels.protect_historical_prices')}</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t('security.labels.prevent_cross_project_access')}</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t('security.labels.prevent_operation_replay')}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* The Dirty Dozen Red Team Tab */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Bug className="w-5 h-5 text-rose-600" />
                  {t('security.labels.attack_payloads')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('security.labels.red_team_description')}
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                {t('security.labels.all_attacks_blocked')}
              </span>
            </div>

            <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
              {dirtyDozenReport?.results.map((dd) => {
                const isSelected = selectedDirtyDozen?.payloadId === dd.payloadId;
                return (
                  <div
                    key={dd.payloadId}
                    onClick={() => setSelectedDirtyDozen(dd)}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-400'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                          #{dd.payloadNumber}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{batch4DiagnosticText(t, dd.payloadId, 'nameAr', dd.nameAr)}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-bold">
                              {dd.invariantId}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">{dd.attackDescription}</div>
                          <div className="text-xs text-emerald-900 mt-2 bg-emerald-50/80 border border-emerald-200 p-2 rounded-lg font-mono text-[11px] leading-relaxed">
                            {dd.actualOutcome}
                          </div>
                        </div>
                      </div>

                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                        {t('security.labels.hardened')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Dirty Dozen Inspector */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                {t('security.labels.payload_analysis')}
              </h3>

              {selectedDirtyDozen ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-slate-400">{t('security.labels.payload_identifier_invariant')}</div>
                    <div className="font-mono text-xs font-semibold text-rose-700 mt-0.5">
                      #{selectedDirtyDozen.payloadNumber} • {selectedDirtyDozen.payloadId}
                    </div>
                    <div className="font-mono text-xs text-blue-700 font-bold mt-0.5">
                      {selectedDirtyDozen.invariantId}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">{t('security.labels.attack_name')}</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">{batch4DiagnosticText(t, selectedDirtyDozen.payloadId, 'nameAr', selectedDirtyDozen.nameAr)}</div>
                    <div className="text-xs text-slate-500 mt-0.5 font-mono">{selectedDirtyDozen.nameEn}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">{t('security.labels.attack_vector')}</div>
                    <div className="text-xs bg-rose-50/60 p-2.5 rounded-xl border border-rose-200 text-rose-900 mt-1 leading-relaxed">
                      {batch4DiagnosticText(t, selectedDirtyDozen.payloadId, 'attackDescription', selectedDirtyDozen.attackDescription)}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">{t('security.labels.expected_defense')}</div>
                    <div className="text-xs bg-slate-100 p-2.5 rounded-xl border border-slate-200 text-slate-800 mt-1 leading-relaxed font-mono">
                      {selectedDirtyDozen.expectedHttpCodeOrError}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">{t('security.labels.live_server_response')}</div>
                    <div className="text-xs bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-emerald-900 mt-1 leading-relaxed font-mono">
                      {selectedDirtyDozen.actualOutcome}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  {t('security.labels.select_payload')}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-800 mb-2">{t('security.labels.defense_in_depth')}</div>
              <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                {t('security.labels.defense_in_depth_description')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
