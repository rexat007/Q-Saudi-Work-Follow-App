import { ProjectSetupWizardData } from '../../types/wizard';

export const EMPTY_WIZARD_DATA: ProjectSetupWizardData = {
  projectInfo: {
    projectCode: '',
    projectName: '',
    clientName: '',
    description: '',
    status: 'ACTIVE',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    defaultSettings: {
      currency: 'SAR',
      vatRatePercent: 15,
      zatcaTaxNumber: '',
      requireTareOnExit: true,
      maxToleranceKg: 500,
      allowDriverSelfDispatch: false,
      addressAr: '',
      geoFenceRadiusMeters: 1000,
    },
  },
  materials: [],
  carriers: [],
  pricingRules: [],
  userAccess: [],
  googleDrive: {
    enabled: false,
    folderId: '',
    folderName: '',
    spreadsheetId: '',
    spreadsheetName: '',
    autoSyncEnabled: false,
    syncIntervalMinutes: 15,
  },
};
