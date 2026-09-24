import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ImportProjectContextAdapter } from '../services/import/importProjectContext.adapter';
import { RelationshipContext } from '../types/dataQuality';

describe('BETA 2 — Unit 1: Canonical Import Context Convergence Suite', () => {
  const sampleRelContext: RelationshipContext = {
    projectId: 'PRJ-REAL-999',
    authorizedCarrierIds: ['CRR-REAL-01', 'CRR-REAL-02'],
    authorizedMaterialIds: ['MAT-AGG-01'],
    knownCarriers: [
      { carrierId: 'CRR-REAL-01', name: 'شركة النقل المعتمدة 1', status: 'ACTIVE' },
      { carrierId: 'CRR-REAL-02', name: 'مؤسسة الصحراء للخدمات', status: 'ACTIVE' },
      { carrierId: 'CRR-INACTIVE', name: 'شركة معطلة', status: 'INACTIVE' },
    ],
    knownTrucks: [
      { truckId: 'TRK-100', plate: '9988-ب د ر', carrierId: 'CRR-REAL-01', status: 'ACTIVE' },
      { truckId: 'TRK-200', plate: '7744-س ل م', carrierId: 'CRR-REAL-02', status: 'ACTIVE' },
      { truckId: 'TRK-300', plate: '1111-غ ي ر', carrierId: 'CRR-INACTIVE', status: 'INACTIVE' },
    ],
    knownDrivers: [
      { driverId: 'DRV-10', name: 'سالم الدوسري', idNumber: '1099887766', carrierId: 'CRR-REAL-01', phone: '0500000001', status: 'ACTIVE' },
      { driverId: 'DRV-20', name: 'فهد العتيبي', idNumber: '1088776655', carrierId: 'CRR-REAL-02', phone: '0500000002', status: 'ACTIVE' },
      { driverId: 'DRV-30', name: 'سائق غير مفعل', idNumber: '1077665544', carrierId: 'CRR-REAL-01', phone: '0500000003', status: 'INACTIVE' },
    ],
    knownMaterials: [
      { materialId: 'MAT-AGG-01', name: 'ركام بازلتي 20 ملم', code: 'AGG-20', status: 'ACTIVE' },
      { materialId: 'MAT-OLD-99', name: 'مادة قديمة متوقفة', code: 'OLD-99', status: 'INACTIVE' },
    ],
  };

  describe('1. ImportProjectContextAdapter Purity & Correctness', () => {
    it('1.1 maps canonical active carriers, preserving exact canonical IDs and names', () => {
      const known = ImportProjectContextAdapter.toPipelineKnownEntities(sampleRelContext);
      expect(known.carrierIds).toEqual(['CRR-REAL-01', 'CRR-REAL-02']);
      expect(known.carrierIds).not.toContain('CRR-INACTIVE');
      expect(known.carriers?.map((c) => c.carrierId)).toEqual(['CRR-REAL-01', 'CRR-REAL-02']);
    });

    it('1.2 maps canonical active trucks and truck-carrier affiliations', () => {
      const known = ImportProjectContextAdapter.toPipelineKnownEntities(sampleRelContext);
      expect(known.truckPlates).toEqual(['9988-ب د ر', '7744-س ل م']);
      expect(known.truckPlates).not.toContain('1111-غ ي ر');
      expect(known.truckCarrierMap).toEqual({
        '9988-ب د ر': 'CRR-REAL-01',
        '7744-س ل م': 'CRR-REAL-02',
      });
    });

    it('1.3 maps canonical active drivers and driver-carrier affiliations', () => {
      const known = ImportProjectContextAdapter.toPipelineKnownEntities(sampleRelContext);
      expect(known.driverIds).toEqual(['DRV-10', 'DRV-20']);
      expect(known.driverIds).not.toContain('DRV-30');
      expect(known.driverCarrierMap).toEqual({
        'DRV-10': 'CRR-REAL-01',
        'DRV-20': 'CRR-REAL-02',
      });
    });

    it('1.4 maps canonical active materials and material codes', () => {
      const known = ImportProjectContextAdapter.toPipelineKnownEntities(sampleRelContext);
      expect(known.materialCodes).toEqual(['AGG-20']);
      expect(known.materialCodes).not.toContain('OLD-99');
    });

    it('1.5 fails closed with empty knownEntities when relationship context is null', () => {
      const known = ImportProjectContextAdapter.toPipelineKnownEntities(null);
      expect(known.carrierIds).toEqual([]);
      expect(known.truckPlates).toEqual([]);
      expect(known.driverIds).toEqual([]);
      expect(known.materialCodes).toEqual([]);
      expect(known.truckCarrierMap).toEqual({});
      expect(known.driverCarrierMap).toEqual({});
    });

    it('1.6 createPipelineContext builds valid pipeline context with canonical project boundary', () => {
      const ctx = ImportProjectContextAdapter.createPipelineContext({
        relContext: sampleRelContext,
        projectId: 'FALLBACK-ID',
        userId: 'USR-TEST-01',
        userName: 'م. فحص النظام',
        role: 'PROJECT_ADMIN',
      });

      expect(ctx.projectId).toBe('PRJ-REAL-999');
      expect(ctx.userId).toBe('USR-TEST-01');
      expect(ctx.role).toBe('PROJECT_ADMIN');
      expect(ctx.knownEntities?.carrierIds).toEqual(['CRR-REAL-01', 'CRR-REAL-02']);
    });
  });

  describe('2. Elimination of Hardcoded Demo Contexts in Import Sections', () => {
    const cwd = process.cwd();
    const excelCsvContent = fs.readFileSync(path.join(cwd, 'src/components/importCenter/ExcelCsvImportSection.tsx'), 'utf8');
    const sheetsContent = fs.readFileSync(path.join(cwd, 'src/components/importCenter/GoogleSheetsImportSection.tsx'), 'utf8');
    const driveContent = fs.readFileSync(path.join(cwd, 'src/components/importCenter/GoogleDriveImportSection.tsx'), 'utf8');
    const wbContent = fs.readFileSync(path.join(cwd, 'src/components/importCenter/WeighbridgeImportSection.tsx'), 'utf8');
    const importCenterContent = fs.readFileSync(path.join(cwd, 'src/components/importCenter/ImportCenterView.tsx'), 'utf8');
    const resolutionContent = fs.readFileSync(path.join(cwd, 'src/components/importCenter/EntityResolutionSection.tsx'), 'utf8');

    it('2.1 ExcelCsvImportSection does not hardcode proj_riyadh_metro default', () => {
      expect(excelCsvContent).not.toContain("currentProjectId = 'proj_riyadh_metro'");
      expect(excelCsvContent).toContain('canonicalRelationshipContext');
      expect(excelCsvContent).toContain('ImportProjectContextAdapter');
    });

    it('2.2 GoogleDriveImportSection does not hardcode PRJ-NEOM-NORTH-01 default', () => {
      expect(driveContent).not.toContain("currentProjectId = 'PRJ-NEOM-NORTH-01'");
      expect(driveContent).toContain('canonicalRelationshipContext');
      expect(driveContent).toContain('ImportProjectContextAdapter');
    });

    it('2.3 WeighbridgeImportSection does not hardcode PRJ-NEOM-NORTH-01 default', () => {
      expect(wbContent).not.toContain("projectId = 'PRJ-NEOM-NORTH-01'");
      expect(wbContent).toContain('canonicalRelationshipContext');
      expect(wbContent).toContain('ImportProjectContextAdapter');
    });

    it('2.4 ImportCenterView passes selectedProjectId and canonicalRelationshipContext down to sections', () => {
      expect(importCenterContent).toContain('canonicalRelationshipContext={canonicalRelationshipContext}');
      expect(importCenterContent).not.toContain('<WeighbridgeImportSection projectId="PRJ-NEOM-NORTH-01" />');
      expect(importCenterContent).not.toContain('<GoogleSheetsImportSection projectId="PRJ-NEOM-NORTH-01" />');
    });

    it('2.5 EntityResolutionSection is explicitly classified as DEMO / NON-PRODUCTION RESOLUTION VIEW', () => {
      expect(resolutionContent).toContain('DEMO / NON-PRODUCTION RESOLUTION VIEW');
      expect(resolutionContent).toContain('NON-PRODUCTION');
    });
  });
});
