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
      entityType: 'TRIP_ADJUSTMENT',
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

    // Apply the adjustment and update trip financials
    const mergedAdj = { ...adj, ...updatedAdj } as SettlementAdjustmentEntity;
    const updatedTrip = this.recalculateTripWithAdjustment(trip, mergedAdj);

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
      entityType: 'TRIP_ADJUSTMENT',
      entityId: adjustmentId,
      action: 'APPROVE',
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
      entityType: 'TRIP_ADJUSTMENT',
      entityId: adjustmentId,
      action: 'REJECT',
      before: adj,
      after: mergedAdj,
    }, context);

    return mergedAdj;
  }

  /**
   * Recalculates trip financials given an approved settlement adjustment.
   */
  private recalculateTripWithAdjustment(trip: TripEntity, adjustment: SettlementAdjustmentEntity): TripEntity {
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

    if (adjustment.adjustmentType === 'RATE') {
      // Adjust pricing rate
      const originalRate = pricingSnapshot.agreedRate ?? pricingSnapshot.baseRateSAR ?? 0;
      const adjustedRate = originalRate + adjustment.amountOrRateAdjustment;
      pricingSnapshot.agreedRate = adjustedRate;

      const billableWeightKg = trip.weights?.billableWeightKg || trip.weights?.originNetKg || 0;
      const billableTons = billableWeightKg / 1000;
      const pricingType = pricingSnapshot.pricingType ?? (pricingSnapshot.pricingModel === 'PER_TRIP' ? 'PER_TRIP' : 'PER_TON');

      let baseAmount = 0;
      if (pricingType === 'PER_TON') {
        const settlementBase = Number(billableTons.toFixed(3));
        baseAmount = Number((settlementBase * adjustedRate).toFixed(2));
      } else {
        baseAmount = adjustedRate; // PER_TRIP
      }

      financials.baseAmountSAR = Math.round(baseAmount * 100) / 100;
      pricingSnapshot.settlementAmount = baseAmount;
    } else if (adjustment.adjustmentType === 'AMOUNT') {
      // Direct adjustment to baseAmount
      financials.baseAmountSAR = Math.round((financials.baseAmountSAR + adjustment.amountOrRateAdjustment) * 100) / 100;
    } else if (adjustment.adjustmentType === 'DEDUCTION') {
      // Direct deduction
      financials.deductionsAmountSAR = Math.round((financials.deductionsAmountSAR + adjustment.amountOrRateAdjustment) * 100) / 100;
    } else if (adjustment.adjustmentType === 'OTHER') {
      // Other additions to baseAmount
      financials.baseAmountSAR = Math.round((financials.baseAmountSAR + adjustment.amountOrRateAdjustment) * 100) / 100;
    }

    // Recompute subtotal, vat, and total
    const demurrage = financials.demurrageAmountSAR || 0;
    const deductions = financials.deductionsAmountSAR || 0;
    const subtotal = Math.max(0, financials.baseAmountSAR + demurrage - deductions);
    const vat = pricingSnapshot.vatApplicable ? Math.round(subtotal * 0.15 * 100) / 100 : 0;
    const total = subtotal + vat;

    financials.subtotalSAR = subtotal;
    financials.vatAmountSAR = vat;
    financials.totalAmountSAR = total;

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
