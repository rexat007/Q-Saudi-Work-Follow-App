import type { OperationalConfiguration } from '../types/operationalProfile';
import { resolveOperationalProfile } from './operationalProfileResolver';
import { OperationalReportTabRegistry, operationalTabIds, operationalTabMetadata } from './operationalReportTabRegistry';
import { MASTER_TABS, masterTabTitle } from './projectWorkspaceMasterContract';
export interface WorkspaceTabSpecification {
    key: string;
    title: string;
    purpose: 'REQUIRED_OPERATIONAL' | 'REQUIRED_REFERENCE' | 'REQUIRED_REPORTING' | 'REQUIRED_AUDIT';
    profile: string;
    schemaVersion: 1;
    ownership: {
        metadataKey: string;
        metadataValue: string;
        visibility: 'DOCUMENT';
    };
}
export function workspaceTabManifest(configuration: OperationalConfiguration): WorkspaceTabSpecification[] {
    const profile = resolveOperationalProfile(configuration), templateId = profile + '_V1';
    return [...operationalTabIds.map(tabId => { const m = operationalTabMetadata({ tabId, templateId }, 0); return { key: tabId, title: OperationalReportTabRegistry[tabId].title, profile, schemaVersion: 1 as const, purpose: tabId === 'AUDIT' ? 'REQUIRED_AUDIT' as const : tabId === 'TRIPS' || tabId === 'LIVE' ? 'REQUIRED_OPERATIONAL' as const : 'REQUIRED_REPORTING' as const, ownership: { metadataKey: m.metadataKey!, metadataValue: m.metadataValue!, visibility: 'DOCUMENT' as const } }; }), ...MASTER_TABS.map(t => ({ key: 'MASTER_' + t.key, title: masterTabTitle(t.key), purpose: 'REQUIRED_REFERENCE' as const, profile, schemaVersion: 1 as const, ownership: { metadataKey: 'qsaudi.workspace.master', metadataValue: JSON.stringify({ owner: 'QSAUDI_MASTER_PROJECTION', schema: 1, key: t.key }), visibility: 'DOCUMENT' as const } }))];
}
/** These remain live only for historical workbook/Script compatibility, not fresh profile authority. */
export const FRESH_DUAL_LEGACY_DISPOSITION = Object.fromEntries(['Loading Register', 'Offload Data', 'Offload Operations Audit', 'Daily Summary', 'Carrier Report Viewer', 'Carrier Daily Report', 'Dashboard'].map(title => [title, 'LEGACY_COMPATIBILITY_ONLY' as const]));
