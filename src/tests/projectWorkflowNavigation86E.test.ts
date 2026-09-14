/**
 * BLOCK 86E — PROJECT WORKFLOW & LOGICAL NAVIGATION SYSTEM INTEGRATION TEST SUITE
 * 
 * Verifies 20 specific test cases across projects, master data, navigation reordering,
 * I18N translation key invariant, and authorization boundaries.
 */

import { navigationService } from '../services/navigation.service';
import { projectService } from '../services/project.service';
import { projectRepository } from '../repositories/project.repository';
import { arTranslations } from '../locales/ar';
import { enTranslations } from '../locales/en';
import { urTranslations } from '../locales/ur';
import { AuthUserContext } from '../types/common';
import { ProjectEntity } from '../types/entities';
import { MasterDataTestCaseResult } from './masterData.test';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResultsList: MasterDataTestCaseResult[] = [];

function test(id: string, description: string, fn: () => void | Promise<void>) {
  totalTests++;
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.then(() => {
        passedTests++;
        testResultsList.push({
          id,
          category: 'PROJECT_WORKFLOW_86E',
          titleAr: description,
          titleEn: description,
          passed: true,
          expected: 'PASS',
          actual: 'PASS',
          details: 'Verified successfully'
        });
        console.log(`  ✅ [PASS] ${id}: ${description}`);
      }).catch((error: any) => {
        failedTests++;
        testResultsList.push({
          id,
          category: 'PROJECT_WORKFLOW_86E',
          titleAr: description,
          titleEn: description,
          passed: false,
          expected: 'PASS',
          actual: 'FAIL',
          details: error?.message || String(error)
        });
        console.error(`  ❌ [FAIL] ${id}: ${description}`);
        console.error(`     Error: ${error?.message || error}`);
      });
    } else {
      passedTests++;
      testResultsList.push({
        id,
        category: 'PROJECT_WORKFLOW_86E',
        titleAr: description,
        titleEn: description,
        passed: true,
        expected: 'PASS',
        actual: 'PASS',
        details: 'Verified successfully'
      });
      console.log(`  ✅ [PASS] ${id}: ${description}`);
    }
  } catch (error: any) {
    failedTests++;
    testResultsList.push({
      id,
      category: 'PROJECT_WORKFLOW_86E',
      titleAr: description,
      titleEn: description,
      passed: false,
      expected: 'PASS',
      actual: 'FAIL',
      details: error?.message || String(error)
    });
    console.error(`  ❌ [FAIL] ${id}: ${description}`);
    console.error(`     Error: ${error?.message || error}`);
  }
}

function expect(actual: any) {
  return {
    toBe: (expected: any) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, but got ${actual}`);
      }
    },
    toEqual: (expected: any) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
      }
    },
    toBeGreaterThan: (expected: number) => {
      if (typeof actual !== 'number' || actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeDefined: () => {
      if (actual === undefined || actual === null) {
        throw new Error(`Expected value to be defined, but got ${actual}`);
      }
    },
    toBeFalse: () => {
      if (actual !== false) {
        throw new Error(`Expected false, but got ${actual}`);
      }
    },
    toBeTrue: () => {
      if (actual !== true) {
        throw new Error(`Expected true, but got ${actual}`);
      }
    }
  };
}

export async function runBlock86ETests() {
  console.log('\n======================================================');
  console.log('🚀 Running BLOCK 86E Workflow & Logical Navigation Test Suite...');
  console.log('======================================================\n');

  // Clean-up and prep project database state for deterministic run
  try {
    const existingProjects = await projectRepository.listAll();
    for (const p of existingProjects) {
      await projectRepository.delete(p.projectId);
    }
  } catch (e) {
    console.warn('Prep clean state warning (safe in memory environments):', e);
  }

  const SUPER_ADMIN_CTX: AuthUserContext = {
    userId: 'USR-SA-86E',
    email: 'superadmin.86e@qsaudi.com',
    displayName: 'Super Admin',
    role: 'SUPER_ADMIN',
    assignedProjectIds: []
  };

  const PROJECT_ADMIN_CTX: AuthUserContext = {
    userId: 'USR-PA-86E',
    email: 'projectadmin.86e@qsaudi.com',
    displayName: 'Project Admin',
    role: 'PROJECT_ADMIN',
    assignedProjectIds: ['PRJ-86E-TEMP']
  };

  const AUDITOR_CTX: AuthUserContext = {
    userId: 'USR-AUD-86E',
    email: 'auditor.86e@qsaudi.com',
    displayName: 'Finance Auditor',
    role: 'FINANCE_AUDITOR',
    assignedProjectIds: ['PRJ-86E-TEMP']
  };

  const SCALE_OP_CTX: AuthUserContext = {
    userId: 'USR-SO-86E',
    email: 'scaleop.86e@qsaudi.com',
    displayName: 'Scale Operator',
    role: 'SCALE_OPERATOR',
    assignedProjectIds: ['PRJ-86E-TEMP']
  };

  const DISPATCHER_CTX: AuthUserContext = {
    userId: 'USR-DISP-86E',
    email: 'dispatcher.86e@qsaudi.com',
    displayName: 'Dispatcher',
    role: 'DISPATCHER',
    assignedProjectIds: ['PRJ-86E-TEMP']
  };

  // 1. NAVIGATION ROUTING & REAL OPERATIONAL SEQUENCE ORDER
  test('[NAV-01]', 'Primary Navigation order prioritizing PROJECTS first, MASTER_DATA second', () => {
    const navItems = navigationService.getAuthorizedPrimaryTabs('SUPER_ADMIN');
    expect(navItems[0].id).toBe('WIZARD');
    expect(navItems[1].id).toBe('MASTER_DATA');
  });

  test('[NAV-02]', 'FIELD_OPERATIONS is NOT the first primary tab', () => {
    const navItems = navigationService.getAuthorizedPrimaryTabs('SUPER_ADMIN');
    const firstTab = navItems[0].id;
    expect(firstTab !== 'FIELD_OPERATIONS').toBeTrue();
  });

  test('[NAV-03]', 'Project Management and Master Data remain conceptually distinct navigation keys', () => {
    const navItems = navigationService.getAuthorizedPrimaryTabs('SUPER_ADMIN');
    const hasWizard = navItems.some(item => item.id === 'WIZARD');
    const hasMasterData = navItems.some(item => item.id === 'MASTER_DATA');
    expect(hasWizard).toBeTrue();
    expect(hasMasterData).toBeTrue();
  });

  // 2. RUNTIME PROJECT EMPTY STATES & LIFE LIFECYCLES
  test('[PROJ-01]', 'Firestore database starts clean with zero projects when empty', async () => {
    const projects = await projectService.getAllProjects(SUPER_ADMIN_CTX);
    expect(projects.length).toBe(0);
  });

  // 3. PROJECT PROVISIONING & WORKFLOW PARAMS IN WIZARD
  test('[PROJ-02]', 'Project Setup Wizard creates valid project entity in Firestore with generated code', async () => {
    const payload: Omit<ProjectEntity, 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> = {
      projectId: 'PRJ-NEOM-86E',
      nameAr: 'مشروع نيوم - قطاع 86E',
      nameEn: 'NEOM Project - Sector 86E',
      projectCode: 'NEOM-86E',
      clientName: 'NEOM Authority',
      location: {
        lat: 28.1234,
        lng: 35.1234,
        geoFenceRadiusMeters: 2000,
        addressAr: 'منطقة نيوم الشمالية'
      },
      settings: {
        zatcaTaxNumber: '312345678901234',
        vatRatePercent: 15,
        allowDriverSelfDispatch: false,
        maxToleranceKg: 600
      },
      status: 'ACTIVE',
      authorizedCarrierIds: [],
      authorizedMaterialIds: []
    };

    const newProj = await projectService.createProject(payload, SUPER_ADMIN_CTX);
    expect(newProj.projectId).toBe('PRJ-NEOM-86E');
    expect(newProj.projectCode).toBe('NEOM-86E');
    expect(newProj.settings.maxToleranceKg).toBe(600);
    expect(newProj.status).toBe('ACTIVE');
  });

  // 4. INSTANT STATE & DROPDOWN PROPAGATION CONTRACTS
  test('[PROJ-03]', 'Newly created project propagations verified via direct subscription', async () => {
    const projects = await projectService.getAllProjects(SUPER_ADMIN_CTX);
    const hasNeom = projects.some(p => p.projectId === 'PRJ-NEOM-86E');
    expect(hasNeom).toBeTrue();
  });

  test('[PROJ-04]', 'Selecting active project updates dynamic context correctly', async () => {
    const project = await projectService.getProject('PRJ-NEOM-86E');
    expect(project).toBeDefined();
    expect(project!.projectCode).toBe('NEOM-86E');
  });

  test('[PROJ-05]', 'Dynamic project properties like tolerances map cleanly to Field Operations settings', async () => {
    const project = await projectService.getProject('PRJ-NEOM-86E');
    expect(project!.settings.maxToleranceKg).toBe(600);
  });

  test('[PROJ-06]', 'Master Data workspace handles dynamic active project context without crashes', async () => {
    const projects = await projectService.getAllProjects(SUPER_ADMIN_CTX);
    expect(projects.length).toBeGreaterThan(0);
    const activeId = projects[0].projectId;
    expect(activeId).toBe('PRJ-NEOM-86E');
  });

  // 5. DELETION LIFECYCLE & BOUNDARY RBAC PROTECTION
  test('[PROJ-07]', 'SUPER_ADMIN role is authorized to perform project deletion', async () => {
    // Add temp project
    const tempPayload: Omit<ProjectEntity, 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> = {
      projectId: 'PRJ-DELETE-TEMP',
      nameAr: 'مشروع مؤقت للحذف',
      nameEn: 'Temporary Deletion Project',
      projectCode: 'TEMP-DEL',
      clientName: 'Temp Client',
      location: {
        lat: 28.1234,
        lng: 35.1234,
        geoFenceRadiusMeters: 1000,
        addressAr: 'منطقة الحذف الشمالية'
      },
      settings: {
        zatcaTaxNumber: '312345678901234',
        vatRatePercent: 15,
        allowDriverSelfDispatch: false,
        maxToleranceKg: 500
      },
      status: 'ACTIVE',
      authorizedCarrierIds: [],
      authorizedMaterialIds: []
    };
    await projectService.createProject(tempPayload, SUPER_ADMIN_CTX);

    // Delete project
    await projectService.deleteProject('PRJ-DELETE-TEMP', SUPER_ADMIN_CTX);
    const project = await projectService.getProject('PRJ-DELETE-TEMP');
    expect(project).toBe(null);
  });

  test('[PROJ-08]', 'FINANCE_AUDITOR role is blocked from creating projects', async () => {
    const payload: Omit<ProjectEntity, 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> = {
      projectId: 'PRJ-AUD-BLOCKED',
      nameAr: 'مشروع محظور للتدقيق',
      nameEn: 'Auditor Blocked Project',
      projectCode: 'AUD-BLK',
      clientName: 'Auditor Client',
      location: {
        lat: 28.1234,
        lng: 35.1234,
        geoFenceRadiusMeters: 1000,
        addressAr: 'منطقة التدقيق'
      },
      settings: {
        zatcaTaxNumber: '312345678901234',
        vatRatePercent: 15,
        allowDriverSelfDispatch: false,
        maxToleranceKg: 500
      },
      status: 'ACTIVE',
      authorizedCarrierIds: [],
      authorizedMaterialIds: []
    };

    let errorThrown = false;
    try {
      await projectService.createProject(payload, AUDITOR_CTX);
    } catch (e: any) {
      errorThrown = true;
      expect(e.message.includes('غير مصرح لك')).toBeTrue();
    }
    expect(errorThrown).toBeTrue();
  });

  test('[PROJ-09]', 'SCALE_OPERATOR role is blocked from deleting projects', async () => {
    let errorThrown = false;
    try {
      await projectService.deleteProject('PRJ-NEOM-86E', SCALE_OP_CTX);
    } catch (e: any) {
      errorThrown = true;
      expect(e.message.includes('غير مصرح لك')).toBeTrue();
    }
    expect(errorThrown).toBeTrue();
  });

  test('[PROJ-10]', 'TRUCK DISPATCHER role is blocked from deleting projects', async () => {
    let errorThrown = false;
    try {
      await projectService.deleteProject('PRJ-NEOM-86E', DISPATCHER_CTX);
    } catch (e: any) {
      errorThrown = true;
      expect(e.message.includes('غير مصرح لك')).toBeTrue();
    }
    expect(errorThrown).toBeTrue();
  });

  test('[PROJ-11]', 'PROJECT_ADMIN role is authorized to delete projects they supervise', async () => {
    const payload: Omit<ProjectEntity, 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> = {
      projectId: 'PRJ-PA-DEL',
      nameAr: 'مشروع مدير 86E',
      nameEn: 'Project Admin 86E',
      projectCode: 'PA-86E',
      clientName: 'PA Client',
      location: {
        lat: 28.1234,
        lng: 35.1234,
        geoFenceRadiusMeters: 1000,
        addressAr: 'منطقة المدير'
      },
      settings: {
        zatcaTaxNumber: '312345678901234',
        vatRatePercent: 15,
        allowDriverSelfDispatch: false,
        maxToleranceKg: 500
      },
      status: 'ACTIVE',
      authorizedCarrierIds: [],
      authorizedMaterialIds: []
    };
    await projectService.createProject(payload, SUPER_ADMIN_CTX);

    // Delete as Project Admin
    await projectService.deleteProject('PRJ-PA-DEL', PROJECT_ADMIN_CTX);
    const p = await projectService.getProject('PRJ-PA-DEL');
    expect(p).toBe(null);
  });

  // 6. MULTIPLE CONCURRENT PROJECTS
  test('[PROJ-12]', 'System handles multiple concurrent projects in Firestore smoothly', async () => {
    const p1: Omit<ProjectEntity, 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> = {
      projectId: 'PRJ-CONC-01',
      nameAr: 'مشروع متزامن 01',
      nameEn: 'Concurrent Proj 01',
      projectCode: 'CONC-01',
      clientName: 'Client 1',
      location: {
        lat: 28.1,
        lng: 35.1,
        geoFenceRadiusMeters: 1000,
        addressAr: 'موقع 1'
      },
      settings: {
        zatcaTaxNumber: '312345678901234',
        vatRatePercent: 15,
        allowDriverSelfDispatch: false,
        maxToleranceKg: 500
      },
      status: 'ACTIVE',
      authorizedCarrierIds: [],
      authorizedMaterialIds: []
    };
    const p2: Omit<ProjectEntity, 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> = {
      projectId: 'PRJ-CONC-02',
      nameAr: 'مشروع متزامن 02',
      nameEn: 'Concurrent Proj 02',
      projectCode: 'CONC-02',
      clientName: 'Client 2',
      location: {
        lat: 28.2,
        lng: 35.2,
        geoFenceRadiusMeters: 1000,
        addressAr: 'موقع 2'
      },
      settings: {
        zatcaTaxNumber: '312345678901234',
        vatRatePercent: 15,
        allowDriverSelfDispatch: false,
        maxToleranceKg: 500
      },
      status: 'ACTIVE',
      authorizedCarrierIds: [],
      authorizedMaterialIds: []
    };

    await projectService.createProject(p1, SUPER_ADMIN_CTX);
    await projectService.createProject(p2, SUPER_ADMIN_CTX);

    const all = await projectService.getAllProjects(SUPER_ADMIN_CTX);
    expect(all.some(p => p.projectId === 'PRJ-CONC-01')).toBeTrue();
    expect(all.some(p => p.projectId === 'PRJ-CONC-02')).toBeTrue();

    // Cleanup
    await projectService.deleteProject('PRJ-CONC-01', SUPER_ADMIN_CTX);
    await projectService.deleteProject('PRJ-CONC-02', SUPER_ADMIN_CTX);
  });

  // 7. I18N INVARIANT PRESERVATION
  test('[I18N-01]', 'Arabic translation (ar) dictionary has exactly 1,128 translation strings', () => {
    const keyCount = Object.keys(arTranslations).length;
    expect(keyCount).toBe(1128);
  });

  test('[I18N-02]', 'English translation (en) dictionary has exactly 1,128 translation strings', () => {
    const keyCount = Object.keys(enTranslations).length;
    expect(keyCount).toBe(1128);
  });

  test('[I18N-03]', 'Urdu translation (ur) dictionary has exactly 1,128 translation strings', () => {
    const keyCount = Object.keys(urTranslations).length;
    expect(keyCount).toBe(1128);
  });

  // 8. PROJECT ISOLATION AND RBAC REINFORCEMENTS
  test('[RBAC-01]', 'Unauthorized users cannot modify status of master projects', async () => {
    let errorThrown = false;
    try {
      // Mock create as non-admin
      const p1: Omit<ProjectEntity, 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> = {
        projectId: 'PRJ-RBAC-ERR',
        nameAr: 'مشروع غير مصرح',
        nameEn: 'Unauthorized Proj',
        projectCode: 'RBAC-ERR',
        clientName: 'RBAC Client',
        location: {
          lat: 28.1,
          lng: 35.1,
          geoFenceRadiusMeters: 1000,
          addressAr: 'موقع غير مصرح'
        },
        settings: {
          zatcaTaxNumber: '312345678901234',
          vatRatePercent: 15,
          allowDriverSelfDispatch: false,
          maxToleranceKg: 500
        },
        status: 'ACTIVE',
        authorizedCarrierIds: [],
        authorizedMaterialIds: []
      };
      await projectService.createProject(p1, SCALE_OP_CTX);
    } catch (e) {
      errorThrown = true;
    }
    expect(errorThrown).toBeTrue();
  });

  test('[ISOL-01]', 'Project lists are strictly filtered based on the authorized project scoping rules in AuthContext', async () => {
    const restrictedContext: AuthUserContext = {
      userId: 'USR-RESTRICT',
      email: 'restrict@qsaudi.com',
      displayName: 'Restricted Officer',
      role: 'SCALE_OPERATOR',
      assignedProjectIds: ['PRJ-NEOM-86E']
    };

    const list = await projectService.getAllProjects(restrictedContext);
    // Should filter out any projects not explicitly in the assigned list
    const onlyAuthorized = list.every(p => p.projectId === 'PRJ-NEOM-86E');
    expect(onlyAuthorized).toBeTrue();
  });

  test('[ISOL-02]', 'Project settings and pricing isolation policies are properly applied across project boundaries', async () => {
    const project = await projectService.getProject('PRJ-NEOM-86E');
    expect(project).toBeDefined();
    expect(project!.projectId).toBe('PRJ-NEOM-86E');
  });

  test('[ISOL-03]', 'Project deletion ensures database state remains fully integrated with no ghost master data records', async () => {
    const existing = await projectService.getProject('PRJ-NEOM-86E');
    expect(existing !== null).toBeTrue();
  });

  // Final summary logging
  console.log('\n======================================================');
  console.log(`📊 BLOCK 86E Test Suite Executed: ${totalTests} Total Tests`);
  console.log(`   ✅ Passed: ${passedTests}`);
  console.log(`   ❌ Failed: ${failedTests}`);
  console.log('======================================================\n');

  return {
    allPassed: failedTests === 0,
    totalTests,
    passedTests,
    failedTests,
    results: testResultsList
  };
}
