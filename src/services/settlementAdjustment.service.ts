import { settlementAdjustmentRepository } from '../repositories/settlementAdjustment.repository';
import { tripRepository } from '../repositories/trip.repository';
import { SettlementAdjustmentEntity, TripEntity } from '../types/entities';
import { AuthUserContext } from '../types/common';
import { auditLogService } from './auditLog.service';

export class SettlementAdjustmentService {
  /**
   * Request a new financial adjustment for a trip.
   * Can be requested by site supervisors, finance auditors, project admins, or super admins.
   */
  async requestAdjustment(
    params: {
      projectId: string;
      tripId: string;
      adjustmentType: 'RATE' | 'AMOUNT' | 'DEDUCTION' | 'OTHER';
      amountOrRateAdjustment: number;
      reason: string;
    },
    context: AuthUserContext
  ): Promise<SettlementAdjustmentEntity> {
    const isSupervisor = context.role === 'SUPERVISOR' || 
                         context.role === 'SITE_SUPERVISOR' || 
                         context.role === 'DISPATCHER';
    const isAuthorizedRequester = isSupervisor || 
                                  context.role === 'FINANCE_AUDITOR' || 
                                  context.role === 'PROJECT_ADMIN' || 
                                  context.role === 'SUPER_ADMIN';

    if (!isAuthorizedRequester) {
      throw new Error('غير مصرح لك: تقديم طلبات تسوية مالي مقتصر فقط على المشرفين أو المدققين الماليين');
    }

    // Verify trip exists
    const trip = await tripRepository.findById(params.projectId, params.tripId);
    if (!trip) {
      throw new Error('الرحلة المحددة غير موجودة');
    }

    const adjustmentId = `ADJ-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newAdjustment: Omit<SettlementAdjustmentEntity, 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string } = {
      adjustmentId,
      tripId: params.tripId,
      tripNumber: trip.tripNumber || '',
      projectId: params.projectId,
      adjustmentType: params.adjustmentType,
      amountOrRateAdjustment: params.amountOrRateAdjustment,
      reason: params.reason,
      status: 'REQUEST',
      requestedBy: context.userId,
      requestedAt: new Date().toISOString(),
      createdBy: context.userId,
      updatedBy: context.userId,
    };

    await settlementAdjustmentRepository.create(newAdjustment);

    await auditLogService.recordLog({
      projectId: params.projectId,
      entityType: 'FINANCIAL_ADJUSTMENT',
      entityId: adjustmentId,
      action: 'CREATE',
      after: newAdjustment,
    }, context);

    return newAdjustment as SettlementAdjustmentEntity;
  }

  /**
   * Approve and apply a financial adjustment to a completed trip.
   * STRICT ENFORCEMENT: ONLY PROJECT_ADMIN, FINANCE_AUDITOR, or SUPER_ADMIN can approve.
   */
  async approveAdjustment(
    projectId: string,
    tripId: string,
    adjustmentId: string,
    context: AuthUserContext
  ): Promise<SettlementAdjustmentEntity> {
    const isAuthorizedApprover = context.role === 'PROJECT_ADMIN' || 
                                  context.role === 'FINANCE_AUDITOR' || 
                                  context.role === 'SUPER_ADMIN';

    if (!isAuthorizedApprover) {
      throw new Error('رفض أمني (RBAC): ليس لديك الصلاحية لاعتماد تعديل مالي للمشروع. هذا الإجراء مقتصر على مدير المشروع أو المدقق المالي');
    }

    // Fetch adjustment
    const adj = await settlementAdjustmentRepository.findById(projectId, tripId, adjustmentId);
    if (!adj) {
      throw new Error('طلب التعديل غير موجود');
    }

    if (adj.status !== 'REQUEST' && adj.status !== 'REVIEW') {
      throw new Error('لا يمكن اعتماد الطلب لأنه معالج مسبقاً');
    }

    // Fetch trip
    const trip = await tripRepository.findById(projectId, tripId);
    if (!trip) {
      throw new Error('الرحلة المرتبطة بالتعديل غير موجودة');
    }

    const updatedAdj: Partial<SettlementAdjustmentEntity> = {
      status: 'APPROVED',
      approvedBy: context.userId,
      approvedAt: new Date().toISOString(),
      auditReference: `AUDIT-ADJ-${Date.now()}`,
    };

    // Apply the adjustment and update trip financials using all trip adjustments
    const mergedAdj = { ...adj, ...updatedAdj } as SettlementAdjustmentEntity;

    const allAdjustments = await settlementAdjustmentRepository.listByTrip(projectId, tripId);
    const adjustedList = allAdjustments.map(a => a.adjustmentId === adjustmentId ? mergedAdj : a);
    if (!adjustedList.some(a => a.adjustmentId === adjustmentId)) {
      adjustedList.push(mergedAdj);
    }

    const updatedTrip = this.recalculateTripWithAdjustments(trip, adjustedList);

    // Persist trip financial updates
    await tripRepository.update(projectId, tripId, {
      financials: updatedTrip.financials,
      pricingSnapshot: updatedTrip.pricingSnapshot,
    }, context.userId);

    // Persist adjustment update
    mergedAdj.status = 'APPLIED'; // mark as applied after successful calculation and save
    await settlementAdjustmentRepository.update(projectId, tripId, adjustmentId, {
      ...updatedAdj,
      status: 'APPLIED',
    }, context.userId);

    await auditLogService.recordLog({
      projectId,
      entityType: 'FINANCIAL_ADJUSTMENT',
      entityId: adjustmentId,
      action: 'UPDATE',
      before: adj,
      after: mergedAdj,
    }, context);

    return mergedAdj;
  }

  /**
   * Reject a settlement adjustment.
   */
  async rejectAdjustment(
    projectId: string,
    tripId: string,
    adjustmentId: string,
    notes: string,
    context: AuthUserContext
  ): Promise<SettlementAdjustmentEntity> {
    const isAuthorizedApprover = context.role === 'PROJECT_ADMIN' || 
                                  context.role === 'FINANCE_AUDITOR' || 
                                  context.role === 'SUPER_ADMIN';

    if (!isAuthorizedApprover) {
      throw new Error('رفض أمني (RBAC): ليس لديك الصلاحية لرفض أو معالجة طلب تعديل مالي');
    }

    const adj = await settlementAdjustmentRepository.findById(projectId, tripId, adjustmentId);
    if (!adj) {
      throw new Error('طلب التعديل غير موجود');
    }

    if (adj.status !== 'REQUEST' && adj.status !== 'REVIEW') {
      throw new Error('لا يمكن رفض الطلب لأنه معالج مسبقاً');
    }

    const updatedAdj: Partial<SettlementAdjustmentEntity> = {
      status: 'REJECTED',
      notes,
      approvedBy: context.userId,
      approvedAt: new Date().toISOString(),
    };

    const mergedAdj = { ...adj, ...updatedAdj } as SettlementAdjustmentEntity;
    await settlementAdjustmentRepository.update(projectId, tripId, adjustmentId, updatedAdj, context.userId);

    await auditLogService.recordLog({
      projectId,
      entityType: 'FINANCIAL_ADJUSTMENT',
      entityId: adjustmentId,
      action: 'UPDATE',
      before: adj,
      after: mergedAdj,
    }, context);

    return mergedAdj;
  }

  /**
   * Recalculates trip financials given approved settlement adjustments.
   * Does not overwrite the original amounts in primary fields.
   */
  public recalculateTripWithAdjustments(trip: TripEntity, adjustments: SettlementAdjustmentEntity[]): TripEntity {
    const financials = { ...(trip.financials || {
      baseAmountSAR: 0,
      demurrageAmountSAR: 0,
      deductionsAmountSAR: 0,
      subtotalSAR: 0,
      vatAmountSAR: 0,
      totalAmountSAR: 0,
      currency: 'SAR',
      isFinalized: false,
    }) };

    const pricingSnapshot = { ...trip.pricingSnapshot };

    // Find all approved or applied adjustments
    const activeAdjustments = adjustments.filter(a => a.status === 'APPROVED' || a.status === 'APPLIED');

    let adjustmentsTotalAmountSAR = 0;
    for (const adj of activeAdjustments) {
      if (adj.adjustmentType === 'RATE') {
        const billableWeightKg = trip.weights?.billableWeightKg || trip.weights?.originNetKg || 0;
        const billableTons = billableWeightKg / 1000;
        const pricingType = pricingSnapshot.pricingType ?? (pricingSnapshot.pricingModel === 'PER_TRIP' ? 'PER_TRIP' : 'PER_TON');
        const multiplier = pricingType === 'PER_TON' ? billableTons : 1;
        adjustmentsTotalAmountSAR += adj.amountOrRateAdjustment * multiplier;
      } else if (adj.adjustmentType === 'AMOUNT' || adj.adjustmentType === 'OTHER') {
        adjustmentsTotalAmountSAR += adj.amountOrRateAdjustment;
      } else if (adj.adjustmentType === 'DEDUCTION') {
        adjustmentsTotalAmountSAR -= adj.amountOrRateAdjustment;
      }
    }

    adjustmentsTotalAmountSAR = Math.round(adjustmentsTotalAmountSAR * 100) / 100;

    // Preserve original values completely, calculate target values in controlled adjustment fields
    const finalBaseAmountSAR = Math.round((financials.baseAmountSAR + adjustmentsTotalAmountSAR) * 100) / 100;
    const finalSubtotalSAR = Math.max(0, Math.round((finalBaseAmountSAR + financials.demurrageAmountSAR - financials.deductionsAmountSAR) * 100) / 100);
    const finalVatAmountSAR = pricingSnapshot.vatApplicable ? Math.round(finalSubtotalSAR * 0.15 * 100) / 100 : 0;
    const finalTotalAmountSAR = Math.round((finalSubtotalSAR + finalVatAmountSAR) * 100) / 100;

    financials.adjustmentsTotalAmountSAR = adjustmentsTotalAmountSAR;
    financials.finalBaseAmountSAR = finalBaseAmountSAR;
    financials.finalSubtotalSAR = finalSubtotalSAR;
    financials.finalVatAmountSAR = finalVatAmountSAR;
    financials.finalTotalAmountSAR = finalTotalAmountSAR;

    return {
      ...trip,
      financials,
      pricingSnapshot,
    };
  }

  async getTripAdjustments(projectId: string, tripId: string): Promise<SettlementAdjustmentEntity[]> {
    return settlementAdjustmentRepository.listByTrip(projectId, tripId);
  }
}

export const settlementAdjustmentService = new SettlementAdjustmentService();
