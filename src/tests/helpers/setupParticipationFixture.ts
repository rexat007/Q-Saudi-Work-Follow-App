/** Minimum canonical participation for lifecycle tests; deliberately no Fleet, pricing or Google. */
export function setupParticipationFixture(projectId: string) {
  return {
    'carriers/SETUP_C': { carrierId: 'SETUP_C', nameAr: 'Carrier', commercialRegistrationNo: '1010123456', status: 'ACTIVE' },
    'materials/SETUP_M': { materialId: 'SETUP_M', nameAr: 'Material', code: 'SETUP', status: 'ACTIVE' },
    [`projects/${projectId}/carrier_memberships/SETUP_C`]: { projectId, carrierId: 'SETUP_C', status: 'ACTIVE' },
    [`projects/${projectId}/material_memberships/SETUP_M`]: { projectId, materialId: 'SETUP_M', status: 'ACTIVE' },
  };
}
