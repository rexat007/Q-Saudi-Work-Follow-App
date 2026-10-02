/**
 * Roster Smart Import Layered Workflow Controller (Foundation C1)
 *
 * Provides a typed stage machine and transition guard for the 7-stage
 * Smart Import workflow in Q-Saudi Work Follow.
 *
 * CANONICAL STAGES:
 * 1. SOURCE_DISCOVERY      - استكشاف المصدر
 * 2. MAPPING_APPROVAL      - اعتماد ربط الأعمدة
 * 3. CARRIER_RESOLUTION    - مراجعة الناقلين
 * 4. MATERIAL_RESOLUTION   - مراجعة المواد
 * 5. DRIVER_TRUCK_RESOLUTION - مراجعة السائقين والشاحنات
 * 6. FINAL_REVIEW          - المراجعة النهائية
 * 7. COMMIT_RESULT         - التنفيذ والنتيجة
 */

export type RosterSmartImportStage =
  | 'SOURCE_DISCOVERY'
  | 'MAPPING_APPROVAL'
  | 'CARRIER_RESOLUTION'
  | 'MATERIAL_RESOLUTION'
  | 'DRIVER_TRUCK_RESOLUTION'
  | 'FINAL_REVIEW'
  | 'COMMIT_RESULT';

export interface RosterStageDefinition {
  stage: RosterSmartImportStage;
  stepNumber: number;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
}

export const ROSTER_SMART_IMPORT_STAGES: readonly RosterSmartImportStage[] = [
  'SOURCE_DISCOVERY',
  'MAPPING_APPROVAL',
  'CARRIER_RESOLUTION',
  'MATERIAL_RESOLUTION',
  'DRIVER_TRUCK_RESOLUTION',
  'FINAL_REVIEW',
  'COMMIT_RESULT',
] as const;

export const ROSTER_STAGE_DEFINITIONS: readonly RosterStageDefinition[] = [
  {
    stage: 'SOURCE_DISCOVERY',
    stepNumber: 1,
    labelAr: 'استكشاف المصدر',
    labelEn: 'Source Discovery',
    descriptionAr: 'اختيار وقراءة ملف سجل التشغيل واستكشاف أوراق العمل والأعمدة',
  },
  {
    stage: 'MAPPING_APPROVAL',
    stepNumber: 2,
    labelAr: 'اعتماد ربط الأعمدة',
    labelEn: 'Mapping Approval',
    descriptionAr: 'مطابقة وتخصيص واعتماد ربط أعمدة المصدر بالبيانات القياسية',
  },
  {
    stage: 'CARRIER_RESOLUTION',
    stepNumber: 3,
    labelAr: 'مراجعة الناقلين',
    labelEn: 'Carrier Resolution',
    descriptionAr: 'مطابقة وتعيين واعتماد الناقلين في المشروع',
  },
  {
    stage: 'MATERIAL_RESOLUTION',
    stepNumber: 4,
    labelAr: 'مراجعة المواد',
    labelEn: 'Material Resolution',
    descriptionAr: 'مطابقة وتعيين المواد المصرح بها للمشروع',
  },
  {
    stage: 'DRIVER_TRUCK_RESOLUTION',
    stepNumber: 5,
    labelAr: 'مراجعة السائقين والشاحنات',
    labelEn: 'Driver & Truck Resolution',
    descriptionAr: 'مطابقة وتخصيص السائقين وأرقام اللوحات',
  },
  {
    stage: 'FINAL_REVIEW',
    stepNumber: 6,
    labelAr: 'المراجعة النهائية',
    labelEn: 'Final Review',
    descriptionAr: 'الفحص الشامل لصفوف السجل والتحقق من اكتمال التعيينات',
  },
  {
    stage: 'COMMIT_RESULT',
    stepNumber: 7,
    labelAr: 'التنفيذ والنتيجة',
    labelEn: 'Commit Result',
    descriptionAr: 'حقن وتأكيد وحفظ بيانات الأسطول والتشغيل في المشروع',
  },
] as const;

export interface RosterWorkflowContext {
  hasSource: boolean;
  hasDiscovery: boolean;
  hasDetectedHeaders: boolean;
  isMappingApproved: boolean;
  hasImportBatch: boolean;
  isCommitAttemptedOrCompleted?: boolean;
}

export class RosterSmartImportWorkflowService {
  public static readonly STAGES = ROSTER_SMART_IMPORT_STAGES;
  public static readonly STAGE_DEFINITIONS = ROSTER_STAGE_DEFINITIONS;

  /**
   * Returns index of the stage (0-6).
   */
  public static getStageIndex(stage: RosterSmartImportStage): number {
    return ROSTER_SMART_IMPORT_STAGES.indexOf(stage);
  }

  /**
   * Returns definition metadata for a given stage.
   */
  public static getStageDefinition(stage: RosterSmartImportStage): RosterStageDefinition {
    const def = ROSTER_STAGE_DEFINITIONS.find((d) => d.stage === stage);
    if (!def) {
      throw new Error(`Unknown stage: ${stage}`);
    }
    return def;
  }

  /**
   * Checks if target stage can be entered given workflow context and current stage.
   */
  public static canEnterStage(
    targetStage: RosterSmartImportStage,
    context: RosterWorkflowContext,
    currentStage: RosterSmartImportStage = 'SOURCE_DISCOVERY'
  ): boolean {
    const targetIdx = this.getStageIndex(targetStage);
    const currentIdx = this.getStageIndex(currentStage);

    // Initial stage is always accessible
    if (targetStage === 'SOURCE_DISCOVERY') {
      return true;
    }

    // Cannot jump forward by more than 1 stage without intervening stage completion
    if (targetIdx > currentIdx + 1) {
      // Direct jump forward is illegal
      return false;
    }

    switch (targetStage) {
      case 'MAPPING_APPROVAL':
        return Boolean(context.hasSource && context.hasDiscovery && context.hasDetectedHeaders);

      case 'CARRIER_RESOLUTION':
        return Boolean(
          context.isMappingApproved &&
          context.hasImportBatch &&
          currentIdx >= 1 // Must have progressed through MAPPING_APPROVAL
        );

      case 'MATERIAL_RESOLUTION':
        return Boolean(
          context.hasImportBatch &&
          context.isMappingApproved &&
          currentIdx >= 2 // Must have reached CARRIER_RESOLUTION
        );

      case 'DRIVER_TRUCK_RESOLUTION':
        return Boolean(
          context.hasImportBatch &&
          context.isMappingApproved &&
          currentIdx >= 3 // Must have reached MATERIAL_RESOLUTION
        );

      case 'FINAL_REVIEW':
        return Boolean(
          context.hasImportBatch &&
          context.isMappingApproved &&
          currentIdx >= 4 // Must have reached DRIVER_TRUCK_RESOLUTION
        );

      case 'COMMIT_RESULT':
        return Boolean(
          context.hasImportBatch &&
          context.isCommitAttemptedOrCompleted &&
          currentIdx >= 5 // Must have reached FINAL_REVIEW
        );

      default:
        return false;
    }
  }

  /**
   * Throws an explicit error if stage entry prerequisites are not satisfied.
   */
  public static assertStagePrerequisites(
    targetStage: RosterSmartImportStage,
    context: RosterWorkflowContext,
    currentStage: RosterSmartImportStage = 'SOURCE_DISCOVERY'
  ): void {
    const targetIdx = this.getStageIndex(targetStage);
    const currentIdx = this.getStageIndex(currentStage);

    if (targetIdx > currentIdx + 1) {
      throw new Error(
        `ILLEGAL_STAGE_JUMP: Cannot jump directly from ${currentStage} to ${targetStage}. Stages must be resolved in sequence.`
      );
    }

    switch (targetStage) {
      case 'SOURCE_DISCOVERY':
        return;

      case 'MAPPING_APPROVAL':
        if (!context.hasSource) {
          throw new Error('PREREQUISITE_MISSING: Source file is required to enter MAPPING_APPROVAL');
        }
        if (!context.hasDiscovery) {
          throw new Error('PREREQUISITE_MISSING: Discovery result is required to enter MAPPING_APPROVAL');
        }
        if (!context.hasDetectedHeaders) {
          throw new Error('PREREQUISITE_MISSING: Detected headers are required to enter MAPPING_APPROVAL');
        }
        return;

      case 'CARRIER_RESOLUTION':
        if (!context.isMappingApproved) {
          throw new Error('PREREQUISITE_MISSING: Mapping must be explicitly approved to enter CARRIER_RESOLUTION');
        }
        if (!context.hasImportBatch) {
          throw new Error('PREREQUISITE_MISSING: Processed import batch is required to enter CARRIER_RESOLUTION');
        }
        return;

      case 'MATERIAL_RESOLUTION':
        if (!context.hasImportBatch) {
          throw new Error('PREREQUISITE_MISSING: Import batch required for MATERIAL_RESOLUTION');
        }
        if (currentIdx < 2) {
          throw new Error('PREREQUISITE_MISSING: CARRIER_RESOLUTION stage must be reached before MATERIAL_RESOLUTION');
        }
        return;

      case 'DRIVER_TRUCK_RESOLUTION':
        if (!context.hasImportBatch) {
          throw new Error('PREREQUISITE_MISSING: Import batch required for DRIVER_TRUCK_RESOLUTION');
        }
        if (currentIdx < 3) {
          throw new Error('PREREQUISITE_MISSING: MATERIAL_RESOLUTION stage must be reached before DRIVER_TRUCK_RESOLUTION');
        }
        return;

      case 'FINAL_REVIEW':
        if (!context.hasImportBatch) {
          throw new Error('PREREQUISITE_MISSING: Import batch required for FINAL_REVIEW');
        }
        if (currentIdx < 4) {
          throw new Error('PREREQUISITE_MISSING: DRIVER_TRUCK_RESOLUTION stage must be reached before FINAL_REVIEW');
        }
        return;

      case 'COMMIT_RESULT':
        if (!context.hasImportBatch) {
          throw new Error('PREREQUISITE_MISSING: Import batch required for COMMIT_RESULT');
        }
        if (!context.isCommitAttemptedOrCompleted) {
          throw new Error('PREREQUISITE_MISSING: Commit execution must be attempted/completed to enter COMMIT_RESULT');
        }
        return;
    }
  }

  /**
   * Returns the next linear stage or null if already at last stage.
   */
  public static getNextStage(
    currentStage: RosterSmartImportStage,
    context?: RosterWorkflowContext
  ): RosterSmartImportStage | null {
    const currentIndex = this.getStageIndex(currentStage);
    if (currentIndex < 0 || currentIndex >= ROSTER_SMART_IMPORT_STAGES.length - 1) {
      return null;
    }
    const next = ROSTER_SMART_IMPORT_STAGES[currentIndex + 1];
    if (context && !this.canEnterStage(next, context, currentStage)) {
      return null;
    }
    return next;
  }

  /**
   * Returns the previous linear stage or null if already at first stage.
   */
  public static getPreviousStage(currentStage: RosterSmartImportStage): RosterSmartImportStage | null {
    const currentIndex = this.getStageIndex(currentStage);
    if (currentIndex <= 0) {
      return null;
    }
    return ROSTER_SMART_IMPORT_STAGES[currentIndex - 1];
  }
}

export const rosterSmartImportWorkflowService = RosterSmartImportWorkflowService;
