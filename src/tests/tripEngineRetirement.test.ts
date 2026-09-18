import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { 
  navigationService, 
  DEVELOPER_TOOLS_REGISTRY, 
  NAV_ITEMS_REGISTRY,
  SYSTEM_ROLES 
} from '../services/navigation.service';
import { UserRole } from '../types/common';

describe('Phase 6 — TripEngine Production Surface Retirement Verification', () => {
  const rootDir = process.cwd();
  const appPath = path.join(rootDir, 'src/App.tsx');
  const navPath = path.join(rootDir, 'src/services/navigation.service.ts');
  const tripEngineViewPath = path.join(rootDir, 'src/components/TripEngineView.tsx');
  const loadingStationPath = path.join(rootDir, 'src/components/tripEngine/LoadingStation.tsx');
  const unloadingStationPath = path.join(rootDir, 'src/components/tripEngine/UnloadingStation.tsx');
  const tripEngineServicePath = path.join(rootDir, 'src/services/tripEngine.service.ts');
  const tripStateMachinePath = path.join(rootDir, 'src/services/tripStateMachine.service.ts');
  const loadingOperatorPath = path.join(rootDir, 'src/components/field/LoadingOperatorView.tsx');
  const unloadingOperatorPath = path.join(rootDir, 'src/components/field/UnloadingOperatorView.tsx');
  const fieldSupervisionPath = path.join(rootDir, 'src/components/field/FieldSupervisionView.tsx');
  const reportsEnginePath = path.join(rootDir, 'src/components/reports/ReportsEngineView.tsx');
  const operationsDashboardPath = path.join(rootDir, 'src/components/dashboard/OperationsDashboardView.tsx');
  const importCenterPath = path.join(rootDir, 'src/components/importCenter/ImportCenterView.tsx');
  const dataQualityPath = path.join(rootDir, 'src/components/dataQuality/DataQualityView.tsx');

  // 1. App.tsx has no production TripEngineView import
  it('1. App.tsx has no production TripEngineView import', () => {
    const appContent = fs.readFileSync(appPath, 'utf-8');
    expect(appContent).not.toMatch(/import\s+.*TripEngineView.*from/);
  });

  // 2. App.tsx has no TRIP_ENGINE render branch
  it('2. App.tsx has no TRIP_ENGINE render branch', () => {
    const appContent = fs.readFileSync(appPath, 'utf-8');
    expect(appContent).not.toContain("activeTab === 'TRIP_ENGINE'");
    expect(appContent).not.toContain('<TripEngineView');
  });

  // 3. navigation.service has no TRIP_ENGINE Developer Tools entry
  it('3. navigation.service has no TRIP_ENGINE Developer Tools entry', () => {
    const devItem = DEVELOPER_TOOLS_REGISTRY.find(item => item.id === 'TRIP_ENGINE');
    expect(devItem).toBeUndefined();

    const navItem = NAV_ITEMS_REGISTRY.find(item => item.id === 'TRIP_ENGINE');
    expect(navItem).toBeUndefined();
  });

  // 4. navigation authorization denies TRIP_ENGINE for SUPER_ADMIN
  it('4. navigation authorization denies TRIP_ENGINE for SUPER_ADMIN', () => {
    const isAuthorized = navigationService.isTabAuthorizedForRole('TRIP_ENGINE', 'SUPER_ADMIN');
    expect(isAuthorized).toBe(false);

    const devTools = navigationService.getAuthorizedDeveloperTools('SUPER_ADMIN');
    expect(devTools.some(t => t.id === 'TRIP_ENGINE')).toBe(false);

    const allTabs = navigationService.getAuthorizedTabs('SUPER_ADMIN');
    expect(allTabs.some(t => t.id === 'TRIP_ENGINE')).toBe(false);
  });

  // 5. navigation authorization denies TRIP_ENGINE for all other roles
  it('5. navigation authorization denies TRIP_ENGINE for all other roles', () => {
    SYSTEM_ROLES.forEach((role: UserRole) => {
      const isAuthorized = navigationService.isTabAuthorizedForRole('TRIP_ENGINE', role);
      expect(isAuthorized).toBe(false);
    });
  });

  // 6. TripEngineView.tsx still exists
  it('6. TripEngineView.tsx still exists as diagnostic/simulator source', () => {
    expect(fs.existsSync(tripEngineViewPath)).toBe(true);
    const content = fs.readFileSync(tripEngineViewPath, 'utf-8');
    expect(content.length).toBeGreaterThan(100);
  });

  // 7. LoadingStation.tsx still exists
  it('7. LoadingStation.tsx still exists as diagnostic/simulator source', () => {
    expect(fs.existsSync(loadingStationPath)).toBe(true);
  });

  // 8. UnloadingStation.tsx still exists
  it('8. UnloadingStation.tsx still exists as diagnostic/simulator source', () => {
    expect(fs.existsSync(unloadingStationPath)).toBe(true);
  });

  // 9. tripEngine.service.ts still exists
  it('9. tripEngine.service.ts still exists', () => {
    expect(fs.existsSync(tripEngineServicePath)).toBe(true);
  });

  // 10. tripStateMachine.service.ts still exists
  it('10. tripStateMachine.service.ts still exists', () => {
    expect(fs.existsSync(tripStateMachinePath)).toBe(true);
  });

  // 11. no production replacement TripEngine control is introduced
  it('11. no production replacement TripEngine control is introduced', () => {
    const appContent = fs.readFileSync(appPath, 'utf-8');
    expect(appContent).not.toContain('Trip Simulator');
    expect(appContent).not.toContain('Legacy Trip Engine');
    expect(appContent).not.toContain('FSM Simulator');
    expect(appContent).not.toContain('Loading Station simulator');
  });

  // 12. canonical LoadingOperator remains present
  it('12. canonical LoadingOperator remains present', () => {
    expect(fs.existsSync(loadingOperatorPath)).toBe(true);
    const content = fs.readFileSync(loadingOperatorPath, 'utf-8');
    expect(content).toContain('buildRelationshipContextFromCanonical');
  });

  // 13. canonical UnloadingOperator remains present
  it('13. canonical UnloadingOperator remains present', () => {
    expect(fs.existsSync(unloadingOperatorPath)).toBe(true);
    const content = fs.readFileSync(unloadingOperatorPath, 'utf-8');
    expect(content).toContain('UNLOADING_AUTHORIZED_ROLES');
    expect(content).toContain('handleCompleteUnloading');
  });

  // 14. FieldSupervision remains present
  it('14. FieldSupervision remains present', () => {
    expect(fs.existsSync(fieldSupervisionPath)).toBe(true);
  });

  // 15. Reports Engine remains present
  it('15. Reports Engine remains present', () => {
    expect(fs.existsSync(reportsEnginePath)).toBe(true);
  });

  // 16. Operations Dashboard remains present
  it('16. Operations Dashboard remains present', () => {
    expect(fs.existsSync(operationsDashboardPath)).toBe(true);
  });

  // 17. remaining TripEngine buildRelationshipContext calls classify as non-production
  it('17. remaining TripEngine buildRelationshipContext calls classify as non-production', () => {
    const teViewContent = fs.readFileSync(tripEngineViewPath, 'utf-8');
    const loadingStationContent = fs.readFileSync(loadingStationPath, 'utf-8');
    const teServiceContent = fs.readFileSync(tripEngineServicePath, 'utf-8');

    // They exist in source
    expect(teViewContent).toContain('buildRelationshipContext');
    expect(loadingStationContent).toContain('buildRelationshipContext');
    expect(teServiceContent).toContain('buildRelationshipContext');

    // But neither view is imported in App.tsx
    const appContent = fs.readFileSync(appPath, 'utf-8');
    expect(appContent).not.toContain('TripEngineView');
    expect(appContent).not.toContain('LoadingStation');
  });

  // 18. production-reachable buildRelationshipContext callers after retirement = 0
  it('18. production-reachable buildRelationshipContext callers after retirement = 0', () => {
    const appContent = fs.readFileSync(appPath, 'utf-8');
    // None of the files calling buildRelationshipContext are imported in App.tsx:
    // DataQualityView, TripEngineView, LoadingStation, UnloadingStation
    expect(appContent).not.toMatch(/import\s+.*DataQualityView/);
    expect(appContent).not.toMatch(/import\s+.*TripEngineView/);
    expect(appContent).not.toMatch(/import\s+.*LoadingStation/);
    expect(appContent).not.toMatch(/import\s+.*UnloadingStation/);
  });

  // 19. ImportCenter remains canonical and untouched
  it('19. ImportCenter remains canonical and untouched', () => {
    expect(fs.existsSync(importCenterPath)).toBe(true);
    const content = fs.readFileSync(importCenterPath, 'utf-8');
    expect(content).toContain('buildRelationshipContextFromCanonical');
    expect(content).not.toContain('DataQualityView');
  });

  // 20. DataQuality remains retired from production
  it('20. DataQuality remains retired from production', () => {
    expect(fs.existsSync(dataQualityPath)).toBe(true);
    const appContent = fs.readFileSync(appPath, 'utf-8');
    expect(appContent).not.toContain("activeTab === 'DATA_QUALITY'");
    expect(navigationService.isTabAuthorizedForRole('DATA_QUALITY', 'SUPER_ADMIN')).toBe(false);
  });
});
