export type ProjectSetupLayer =
  | 'FOUNDATION'
  | 'WORKSPACE'
  | 'MATERIALS'
  | 'CARRIERS'
  | 'ROSTER'
  | 'PRICING'
  | 'ACCESS'
  | 'REVIEW_ACTIVATION';

export interface ProjectSetupLayerMetadata {
  id: ProjectSetupLayer;
  ordinal: number;
  labelAr: string;
  labelEn: string;
}

export const PROJECT_SETUP_LAYERS: ProjectSetupLayerMetadata[] = [
  { id: 'FOUNDATION', ordinal: 1, labelAr: 'البيانات الأساسية وتكوين المشروع', labelEn: 'Project Foundation' },
  { id: 'WORKSPACE', ordinal: 2, labelAr: 'مساحة العمل ومزامنة قوقل', labelEn: 'Google Workspace' },
  { id: 'MATERIALS', ordinal: 3, labelAr: 'قائمة المواد المصرح بها', labelEn: 'Authorized Materials' },
  { id: 'CARRIERS', ordinal: 4, labelAr: 'الناقلون المعتمدون', labelEn: 'Authorized Carriers' },
  { id: 'ROSTER', ordinal: 5, labelAr: 'سجل تشغيل السائقين والشاحنات', labelEn: 'Operational Roster' },
  { id: 'PRICING', ordinal: 6, labelAr: 'قواعد الأسعار والتعرفة', labelEn: 'Pricing Rules' },
  { id: 'ACCESS', ordinal: 7, labelAr: 'إدارة وتصاريح المستخدمين', labelEn: 'Project Access' },
  { id: 'REVIEW_ACTIVATION', ordinal: 8, labelAr: 'مراجعة المتطلبات والتفعيل', labelEn: 'Readiness & Activation' },
];

export interface NavigationGateContext {
  projectId: string | null;
  materialsCount: number;
  carriersCount: number;
}

export function canEnterProjectSetupLayer(
  target: ProjectSetupLayer,
  context: NavigationGateContext
): { allowed: boolean; reason?: string } {
  if (!context.projectId) {
    if (target === 'FOUNDATION') {
      return { allowed: true };
    }
    return { allowed: false, reason: 'يجب إنشاء وحفظ المشروع أولاً للوصول إلى هذه الطبقة.' };
  }

  switch (target) {
    case 'FOUNDATION':
    case 'WORKSPACE':
    case 'MATERIALS':
    case 'CARRIERS':
    case 'ACCESS':
    case 'REVIEW_ACTIVATION':
      return { allowed: true };
    case 'ROSTER':
    case 'PRICING':
      if (context.materialsCount === 0 && context.carriersCount === 0) {
        return { allowed: false, reason: 'سجل تشغيل السائقين وقواعد الأسعار تتطلب مادة مصرحة واحدة وناقل واحد على الأقل.' };
      }
      if (context.materialsCount === 0) {
        return { allowed: false, reason: 'يلزم وجود مادة مصرح بها واحدة على الأقل.' };
      }
      if (context.carriersCount === 0) {
        return { allowed: false, reason: 'يلزم وجود ناقل معتمد واحد على الأقل.' };
      }
      return { allowed: true };
    default:
      return { allowed: false, reason: 'الطبقة المحددة غير صالحة.' };
  }
}
