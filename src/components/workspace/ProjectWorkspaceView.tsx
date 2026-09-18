import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Building2, 
  Truck, 
  Boxes, 
  CircleDollarSign, 
  Users, 
  FolderSync, 
  Save, 
  Plus, 
  CheckCircle, 
  AlertTriangle,
  Trash2,
  Lock,
  ChevronRight,
  Info
} from 'lucide-react';
import { ProjectEntity, CarrierEntity, MaterialEntity, PricingRuleEntity, ProjectCarrierRosterEntity, UserEntity } from '../../types/entities';
import { AuthUserContext } from '../../types/common';
import { projectService } from '../../services/project.service';
import { carrierRepository } from '../../repositories/carrier.repository';
import { materialRepository } from '../../repositories/material.repository';
import { pricingRuleRepository } from '../../repositories/pricingRule.repository';
import { projectCarrierRosterRepository } from '../../repositories/projectCarrierRoster.repository';
import { driverTruckIntakeService } from '../../services/driverTruckIntake.service';
import { userRepository } from '../../repositories/user.repository';
import { useI18n } from '../../i18n';

interface ProjectWorkspaceViewProps {
  projects: ProjectEntity[];
  selectedProjectId: string;
  activeWorkspaceTab: string;
  onSelectWorkspaceTab: (tab: string) => void;
  authContext: AuthUserContext;
}

export const ProjectWorkspaceView: React.FC<ProjectWorkspaceViewProps> = ({
  projects,
  selectedProjectId,
  activeWorkspaceTab,
  onSelectWorkspaceTab,
  authContext,
}) => {
  const { direction } = useI18n();
  const isRtl = direction === 'rtl';

  const project = projects.find(p => p.projectId === selectedProjectId);

  // Lists and Subscriptions
  const [carriers, setCarriers] = useState<CarrierEntity[]>([]);
  const [materials, setMaterials] = useState<MaterialEntity[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRuleEntity[]>([]);
  const [roster, setRoster] = useState<ProjectCarrierRosterEntity[]>([]);
  const [users, setUsers] = useState<UserEntity[]>([]);

  // Notification states
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Tab State forms
  // Project Info fields
  const [nameAr, setNameAr] = useState('');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'SETUP' | 'READY_FOR_REVIEW' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED' | 'PLANNING'>('ACTIVE');
  const [vatRate, setVatRate] = useState(15);
  const [zatcaTax, setZatcaTax] = useState('');
  const [addressAr, setAddressAr] = useState('');
  const [radius, setRadius] = useState(1000);
  const [requireTare, setRequireTare] = useState(true);
  const [tolerance, setTolerance] = useState(150);
  const [selfDispatch, setSelfDispatch] = useState(false);

  // New Carrier Form
  const [newCarrierName, setNewCarrierName] = useState('');
  const [newCarrierCr, setNewCarrierCr] = useState('');
  const [newCarrierTga, setNewCarrierTga] = useState('');
  const [newCarrierPhone, setNewCarrierPhone] = useState('');
  const [newCarrierEmail, setNewCarrierEmail] = useState('');

  // New Material Form
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialCode, setNewMaterialCode] = useState('');
  const [newMaterialUnit, setNewMaterialUnit] = useState<'TON' | 'M3' | 'TRIP'>('TON');

  // New Pricing Rule Form
  const [newPricingName, setNewPricingName] = useState('');
  const [newPricingModel, setNewPricingModel] = useState<'PER_TON' | 'PER_TRIP' | 'PER_KM' | 'FLAT_RATE'>('PER_TON');
  const [newPricingRate, setNewPricingRate] = useState(0);
  const [newPricingCarrierId, setNewPricingCarrierId] = useState('ALL');
  const [newPricingMaterialId, setNewPricingMaterialId] = useState('ALL_MATERIALS');
  const [newPricingVat, setNewPricingVat] = useState(true);

  // New Roster Form
  const [newRosterDriver, setNewRosterDriver] = useState('');
  const [newRosterPlate, setNewRosterPlate] = useState('');
  const [newRosterPhone, setNewRosterPhone] = useState('');
  const [newRosterResidency, setNewRosterResidency] = useState('');
  const [newRosterCarrier, setNewRosterCarrier] = useState('');
  const [newRosterMaterial, setNewRosterMaterial] = useState('');

  // New Access form
  const [selectedUserToAdd, setSelectedUserToAdd] = useState('');

  // Google Drive Config form
  const [driveRootFolder, setDriveRootFolder] = useState('');
  const [driveSpreadsheet, setDriveSpreadsheet] = useState('');

  // Sync details from Firebase
  useEffect(() => {
    if (!project) return;
    setNameAr(project.nameAr);
    setClientName(project.clientName);
    setDescription(project.description || '');
    setStatus(project.status);
    setVatRate(project.settings?.vatRatePercent ?? 15);
    setZatcaTax(project.settings?.zatcaTaxNumber || '');
    setAddressAr(project.location?.addressAr || '');
    setRadius(project.location?.geoFenceRadiusMeters || 1000);
    setRequireTare(project.settings?.requireTareOnExit ?? true);
    setTolerance(project.settings?.maxToleranceKg ?? 150);
    setSelfDispatch(project.settings?.allowDriverSelfDispatch ?? false);
    setDriveRootFolder(project.settings?.googleDriveProvisioning?.rootFolderName || '');
    setDriveSpreadsheet(project.settings?.googleDriveProvisioning?.spreadsheetTitle || '');
  }, [project]);

  // Subscribe to Project Subcollections
  useEffect(() => {
    if (!project) return;

    const unsubCarriers = carrierRepository.subscribeByProject(project.projectId, (data) => {
      setCarriers(data);
    });

    const unsubMaterials = materialRepository.subscribeByProject(project.projectId, (data) => {
      setMaterials(data);
    });

    const unsubPricing = pricingRuleRepository.subscribeByProject(project.projectId, (data) => {
      setPricingRules(data);
    });

    const unsubRoster = projectCarrierRosterRepository.subscribeByProject(project.projectId, (data) => {
      setRoster(data);
    });

    const unsubUsers = userRepository.subscribeToUsers((data) => {
      setUsers(data);
    });

    return () => {
      unsubCarriers();
      unsubMaterials();
      unsubPricing();
      unsubRoster();
      unsubUsers();
    };
  }, [project]);

  if (!project) {
    return (
      <div className="bg-[#121620] border-2 border-dashed border-white/10 p-12 text-center text-white/50 rounded-2xl font-mono">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-base font-bold text-white mb-2">
          {isRtl ? 'لم يتم تحديد مشروع نشط' : 'No Active Project Selected'}
        </h3>
        <p className="text-xs max-w-md mx-auto leading-relaxed">
          {isRtl 
            ? 'الرجاء اختيار أحد المشاريع من القائمة الجانبية أو إنشاء مشروع جديد لعرض وتعديل إعداداته التشغيلية.' 
            : 'Please select a project from the sidebar workspace explorer or create a new one to manage its configurations.'}
        </p>
      </div>
    );
  }

  // Clear notices helper
  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg(null);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg(null);
  };

  // 1. Save Project Info
  const handleSaveProjectInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await projectService.updateProject(project.projectId, {
        nameAr: nameAr.trim(),
        clientName: clientName.trim(),
        description: description.trim(),
        status,
        location: {
          ...project.location,
          addressAr: addressAr.trim(),
          geoFenceRadiusMeters: Number(radius),
        },
        settings: {
          ...project.settings,
          vatRatePercent: Number(vatRate),
          zatcaTaxNumber: zatcaTax.trim(),
          requireTareOnExit: requireTare,
          maxToleranceKg: Number(tolerance),
          allowDriverSelfDispatch: selfDispatch,
        }
      }, authContext);
      showSuccess(isRtl ? 'تم حفظ بيانات المشروع بنجاح' : 'Project details saved successfully');
    } catch (err: any) {
      showError(err.message || 'Error saving project details');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Add Carrier
  const handleAddCarrier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCarrierName.trim()) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const carrierId = `CAR-${Date.now().toString(36).toUpperCase()}`;
      await carrierRepository.create({
        carrierId,
        projectId: project.projectId,
        name: newCarrierName.trim(),
        normalizedName: newCarrierName.trim().toUpperCase(),
        companyNameAr: newCarrierName.trim(),
        status: 'ACTIVE',
        isActive: true,
        commercialRegistrationNo: newCarrierCr.trim() || '1010000000',
        transportLicenseNo: newCarrierTga.trim() || `TGA-${carrierId}`,
        contactPerson: {
          name: 'مسؤول الاتصال',
          phone: newCarrierPhone.trim() || '+966500000000',
          email: newCarrierEmail.trim() || 'carrier@q-saudi.sa',
        },
        createdBy: authContext.userId,
        updatedBy: authContext.userId,
      });
      setNewCarrierName('');
      setNewCarrierCr('');
      setNewCarrierTga('');
      setNewCarrierPhone('');
      setNewCarrierEmail('');
      showSuccess(isRtl ? 'تمت إضافة المقاول بنجاح' : 'Carrier added successfully');
    } catch (err: any) {
      showError(err.message || 'Error adding carrier');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Add Material
  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterialName.trim() || !newMaterialCode.trim()) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const materialId = `MAT-${Date.now().toString(36).toUpperCase()}`;
      await materialRepository.create({
        materialId,
        projectId: project.projectId,
        name: newMaterialName.trim(),
        normalizedName: newMaterialName.trim().toUpperCase(),
        nameAr: newMaterialName.trim(),
        code: newMaterialCode.trim().toUpperCase(),
        status: 'ACTIVE',
        isActive: true,
        unitOfMeasure: newMaterialUnit,
        createdBy: authContext.userId,
        updatedBy: authContext.userId,
      });
      setNewMaterialName('');
      setNewMaterialCode('');
      setNewMaterialUnit('TON');
      showSuccess(isRtl ? 'تمت إضافة المادة بنجاح' : 'Material added successfully');
    } catch (err: any) {
      showError(err.message || 'Error adding material');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Add Pricing Rule
  const handleAddPricingRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPricingName.trim() || newPricingRate <= 0) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const pricingRuleId = `PR-${project.projectId}-${Date.now().toString(36).toUpperCase()}`;
      await pricingRuleRepository.create({
        pricingRuleId,
        projectId: project.projectId,
        name: newPricingName.trim(),
        pricingModel: newPricingModel,
        baseRateSAR: Number(newPricingRate),
        currency: 'SAR',
        carrierId: newPricingCarrierId === 'ALL' ? undefined : newPricingCarrierId,
        materialId: newPricingMaterialId === 'ALL_MATERIALS' ? undefined : newPricingMaterialId,
        demurrageRatePerHourSAR: 50,
        freeTimeHours: 2,
        vatApplicable: newPricingVat,
        isActive: true,
        status: 'ACTIVE',
        createdBy: authContext.userId,
        updatedBy: authContext.userId,
      });
      setNewPricingName('');
      setNewPricingRate(0);
      setNewPricingCarrierId('ALL');
      setNewPricingMaterialId('ALL_MATERIALS');
      setNewPricingVat(true);
      showSuccess(isRtl ? 'تمت إضافة قاعدة التسعير بنجاح' : 'Pricing agreement added successfully');
    } catch (err: any) {
      showError(err.message || 'Error adding pricing rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Add Roster
  const handleAddRoster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRosterDriver.trim() || !newRosterPlate.trim() || !newRosterCarrier || !newRosterMaterial) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await driverTruckIntakeService.processSharedIntake({
        projectId: project.projectId,
        carrierId: newRosterCarrier,
        materialId: newRosterMaterial,
        driverName: newRosterDriver.trim(),
        plateNumber: newRosterPlate.trim().toUpperCase(),
        phone: newRosterPhone.trim() || undefined,
        residencyId: newRosterResidency.trim() || undefined,
      }, authContext);

      setNewRosterDriver('');
      setNewRosterPlate('');
      setNewRosterPhone('');
      setNewRosterResidency('');
      setNewRosterCarrier('');
      setNewRosterMaterial('');
      showSuccess(isRtl ? 'تم تسجيل وتوثيق السائق والشاحنة في اللائحة والسجلات المركزية بنجاح' : 'Driver and truck enrolled globally & in roster successfully');
    } catch (err: any) {
      showError(err.message || 'Error adding to roster');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Delete Roster Entry
  const handleDeleteRoster = async (rosterId: string) => {
    if (!confirm(isRtl ? 'هل أنت متأكد من حذف هذا السائق/الشاحنة من اللائحة؟' : 'Are you sure you want to remove this driver/truck?')) return;
    try {
      await projectCarrierRosterRepository.delete(project.projectId, rosterId);
      showSuccess(isRtl ? 'تم الحذف من اللائحة' : 'Removed from roster');
    } catch (err: any) {
      showError(err.message || 'Error removing roster entry');
    }
  };

  // 7. Add User Access
  const handleAddUserAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserToAdd) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const u = users.find(user => user.userId === selectedUserToAdd);
      if (u) {
        const assigned = u.assignedProjectIds || [];
        if (!assigned.includes(project.projectId)) {
          await userRepository.update(u.userId, {
            assignedProjectIds: [...assigned, project.projectId]
          }, authContext.userId);
        }
        showSuccess(isRtl ? 'تم منح الصلاحية بنجاح' : 'Access granted successfully');
      }
    } catch (err: any) {
      showError(err.message || 'Error granting user access');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 8. Remove User Access
  const handleRemoveUserAccess = async (userId: string) => {
    if (!confirm(isRtl ? 'هل تريد سحب صلاحية هذا المستخدم للمشروع؟' : 'Are you sure you want to revoke this user\'s access?')) return;
    try {
      const u = users.find(user => user.userId === userId);
      if (u) {
        const assigned = (u.assignedProjectIds || []).filter(pid => pid !== project.projectId);
        await userRepository.update(u.userId, {
          assignedProjectIds: assigned
        }, authContext.userId);
        showSuccess(isRtl ? 'تم سحب الصلاحية' : 'Access revoked');
      }
    } catch (err: any) {
      showError(err.message || 'Error revoking access');
    }
  };

  // 9. Save Google Drive Settings
  const handleSaveGoogleDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await projectService.updateProject(project.projectId, {
        settings: {
          ...project.settings,
          googleDriveProvisioning: {
            enabled: true,
            rootFolderName: driveRootFolder.trim(),
            spreadsheetTitle: driveSpreadsheet.trim(),
            status: 'PROVISIONED',
          }
        }
      }, authContext);
      showSuccess(isRtl ? 'تم تحديث إعدادات Google Drive بنجاح' : 'Google Drive settings updated successfully');
    } catch (err: any) {
      showError(err.message || 'Error saving Google Drive settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered users having access to active project
  const usersWithAccess = users.filter(u => u.assignedProjectIds?.includes(project.projectId) || u.role === 'SUPER_ADMIN');
  const usersNoAccess = users.filter(u => !u.assignedProjectIds?.includes(project.projectId) && u.role !== 'SUPER_ADMIN');

  return (
    <div className="space-y-6" dir={direction}>
      {/* Top Project Breadcrumb & Status */}
      <div className="bg-[#11141a] border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono">
        <div>
          <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
            <span>{isRtl ? 'المشاريع' : 'Projects'}</span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[#10b981]">#{project.projectCode || project.projectId}</span>
          </div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#10b981]" />
            <span>{project.nameAr}</span>
          </h2>
          <p className="text-xs text-white/40 mt-1 max-w-2xl leading-relaxed">
            {project.description || (isRtl ? 'لا يوجد وصف مضاف لهذا المشروع' : 'No description provided for this project')}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-white/40">{isRtl ? 'الحالة اللوجستية:' : 'LOGISTICS STATUS:'}</span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
            project.status === 'ACTIVE' ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'
          }`}>
            {project.status}
          </span>
        </div>
      </div>

      {/* Global Alerts inside workspace */}
      {successMsg && (
        <div id="workspace-success-alert" className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-xl flex items-center gap-3 text-emerald-300 font-mono text-xs">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div id="workspace-error-alert" className="p-4 bg-red-950/60 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-300 font-mono text-xs animate-shake">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Workspace Sub-tabs horizontal content navigator on page (synced with sidebar) */}
      <div className="flex border-b border-white/10 gap-1 overflow-x-auto [scrollbar-width:none]">
        {['data', 'carriers', 'drivers', 'materials', 'pricing', 'access', 'google'].map((tab) => {
          const isSelected = activeWorkspaceTab === tab;
          let label = '';
          switch (tab) {
            case 'data': label = isRtl ? 'البيانات' : 'Data'; break;
            case 'carriers': label = isRtl ? 'الناقلين' : 'Carriers'; break;
            case 'drivers': label = isRtl ? 'اللائحة' : 'Roster'; break;
            case 'materials': label = isRtl ? 'المواد' : 'Materials'; break;
            case 'pricing': label = isRtl ? 'التسعير' : 'Pricing'; break;
            case 'access': label = isRtl ? 'الصلاحيات' : 'Access'; break;
            case 'google': label = isRtl ? 'جوجل' : 'Google'; break;
          }
          return (
            <button
              key={tab}
              id={`workspace-tab-btn-${tab}`}
              onClick={() => onSelectWorkspaceTab(tab)}
              className={`px-4 py-2.5 font-mono text-xs font-bold transition-all border-b-2 whitespace-nowrap min-h-[44px] ${
                isSelected 
                  ? 'border-[#10b981] text-[#10b981]' 
                  : 'border-transparent text-white/50 hover:text-white'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Workspace Views Switcher */}
      <div className="bg-[#11141a] border border-white/10 rounded-2xl p-6 shadow-lg min-h-[400px]">
        {/* ==================== SUB-TAB 1: PROJECT DATA ==================== */}
        {activeWorkspaceTab === 'data' && (
          <form id="form-project-data" onSubmit={handleSaveProjectInfo} className="space-y-6 font-mono">
            <h3 className="text-sm font-black text-white pb-3 border-b border-white/5 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>{isRtl ? 'تعديل البيانات الأساسية للمشروع' : 'Modify Core Project Data'}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/50 block mb-1.5">{isRtl ? 'اسم المشروع (بالعربية)' : 'Project Name (Arabic)'}</label>
                <input
                  type="text"
                  required
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="w-full bg-[#0b0e12] border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#10b981]"
                />
              </div>

              <div>
                <label className="text-xs text-white/50 block mb-1.5">{isRtl ? 'اسم العميل / الجهة المالكة' : 'Client Name'}</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-[#0b0e12] border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#10b981]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-white/50 block mb-1.5">{isRtl ? 'وصف تفصيلي للمشروع' : 'Description'}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-[#0b0e12] border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#10b981]"
                />
              </div>

              <div>
                <label className="text-xs text-white/50 block mb-1.5">{isRtl ? 'الحالة اللوجستية' : 'Logistics Status'}</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-[#0b0e12] border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#10b981]"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PLANNING">PLANNING</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-white/50 block mb-1.5">{isRtl ? 'الرقم الضريبي ZATCA (15 رقم)' : 'ZATCA Tax ID (15 Digits)'}</label>
                <input
                  type="text"
                  required
                  maxLength={15}
                  value={zatcaTax}
                  onChange={(e) => setZatcaTax(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-[#0b0e12] border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#10b981]"
                />
              </div>

              <div>
                <label className="text-xs text-white/50 block mb-1.5">{isRtl ? 'معدل ضريبة القيمة المضافة (%)' : 'VAT Rate (%)'}</label>
                <input
                  type="number"
                  required
                  value={vatRate}
                  onChange={(e) => setVatRate(Number(e.target.value))}
                  className="w-full bg-[#0b0e12] border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#10b981]"
                />
              </div>

              <div>
                <label className="text-xs text-white/50 block mb-1.5">{isRtl ? 'نطاق السياج الجغرافي (متر)' : 'Geofence Radius (meters)'}</label>
                <input
                  type="number"
                  required
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full bg-[#0b0e12] border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#10b981]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-white/50 block mb-1.5">{isRtl ? 'موقع المشروع الجغرافي' : 'Location Address'}</label>
                <input
                  type="text"
                  required
                  value={addressAr}
                  onChange={(e) => setAddressAr(e.target.value)}
                  className="w-full bg-[#0b0e12] border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#10b981]"
                />
              </div>
            </div>

            {/* Industrial Policy Invariants */}
            <div className="pt-4 border-t border-white/5 space-y-4">
              <h4 className="text-xs font-black text-[#10b981] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>{isRtl ? 'السياسات الأمنية الحاكمة' : 'Governing Security Invariants'}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="flex items-center gap-3 bg-[#0b0e12] border border-white/5 rounded p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireTare}
                    onChange={(e) => setRequireTare(e.target.checked)}
                    className="rounded text-[#10b981] bg-black border-white/10 w-4 h-4 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs text-white font-bold block">{isRtl ? 'ميزان فارغ إلزامي' : 'Tare weighing mandatory'}</span>
                    <span className="text-[10px] text-white/40 block leading-tight">{isRtl ? 'يتطلب وزن الشاحنة فارغة عند المغادرة' : 'Mandatory tare weight on exit'}</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 bg-[#0b0e12] border border-white/5 rounded p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selfDispatch}
                    onChange={(e) => setSelfDispatch(e.target.checked)}
                    className="rounded text-[#10b981] bg-black border-white/10 w-4 h-4 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs text-white font-bold block">{isRtl ? 'الترحيل الذاتي للسائق' : 'Driver self-dispatch'}</span>
                    <span className="text-[10px] text-white/40 block leading-tight">{isRtl ? 'السماح للسائق بتدشين رحلة فارغة' : 'Allow drivers self dispatching'}</span>
                  </div>
                </label>

                <div className="bg-[#0b0e12] border border-white/5 rounded p-3">
                  <label className="text-[10px] text-white/40 block mb-1">{isRtl ? 'سقف تفاوت الوزن الأقصى (كجم)' : 'Max Net weight tolerance (kg)'}</label>
                  <input
                    type="number"
                    value={tolerance}
                    onChange={(e) => setTolerance(Number(e.target.value))}
                    className="w-full bg-black border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-end">
              <button
                type="submit"
                id="workspace-btn-save-project-data"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#10b981] text-[#0f1115] font-black text-xs hover:bg-[#10b981]/90 rounded-lg transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isRtl ? 'حفظ التعديلات' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ==================== SUB-TAB 2: CARRIERS ==================== */}
        {activeWorkspaceTab === 'carriers' && (
          <div className="space-y-6 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>{isRtl ? 'مقاولين وناقلي المشروع المعتمدين' : 'Authorized Project Carriers'}</span>
              </h3>
              <span className="text-xs text-white/40 bg-white/5 px-2.5 py-1 rounded-full">
                {carriers.length} {isRtl ? 'ناقلين مسجلين' : 'Carriers Registered'}
              </span>
            </div>

            {/* Carriers List */}
            {carriers.length === 0 ? (
              <div className="text-center py-10 bg-[#0b0e12] border border-white/5 rounded-xl text-white/40 italic text-xs">
                {isRtl ? 'لا يوجد ناقلين مسجلين لهذا المشروع.' : 'No carriers registered yet for this project.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {carriers.map(c => (
                  <div key={c.carrierId} className="bg-[#0b0e12] border border-white/10 rounded-xl p-4 space-y-3 relative hover:border-[#10b981]/30 transition-all">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">{c.name}</h4>
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-500/20">
                        {c.carrierId}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[11px] text-white/50 border-t border-white/5 pt-2">
                      <div>
                        <span className="block text-white/30 text-[9px]">CR NUMBER:</span>
                        <span className="font-bold text-white/80">{c.commercialRegistrationNo || '1010000000'}</span>
                      </div>
                      <div>
                        <span className="block text-white/30 text-[9px]">TGA LICENSE:</span>
                        <span className="font-bold text-white/80">{c.transportLicenseNo || 'TGA-123'}</span>
                      </div>
                      <div>
                        <span className="block text-white/30 text-[9px]">CONTACT PERSON:</span>
                        <span className="font-bold text-white/80 truncate block">{c.contactPerson?.name || 'Operations'}</span>
                      </div>
                      <div>
                        <span className="block text-white/30 text-[9px]">CONTACT PHONE:</span>
                        <span className="font-bold text-white/80 truncate block">{c.contactPerson?.phone || '+966500000000'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Enroll Carrier Sub-Form */}
            <form id="form-enroll-carrier" onSubmit={handleAddCarrier} className="bg-[#0b0e12] border border-white/5 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <span>{isRtl ? 'تسجيل وتفويض ناقل جديد' : 'Enroll and Authorize New Carrier'}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
                  <label className="text-[10px] text-white/40 block mb-1">{isRtl ? 'اسم شركة النقل (بالعربية):' : 'Carrier Name:'}</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: شركة نقليات السعدون"
                    value={newCarrierName}
                    onChange={(e) => setNewCarrierName(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-white/40 block mb-1">{isRtl ? 'السجل التجاري (10 أرقام):' : 'Commercial Registration (CR):'}</label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="1010000000"
                    value={newCarrierCr}
                    onChange={(e) => setNewCarrierCr(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-white/40 block mb-1">{isRtl ? 'رقم ترخيص هيئة النقل العام (TGA):' : 'TGA License Number:'}</label>
                  <input
                    type="text"
                    placeholder="TGA-5000"
                    value={newCarrierTga}
                    onChange={(e) => setNewCarrierTga(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-white/40 block mb-1">{isRtl ? 'رقم الهاتف:' : 'Contact Phone:'}</label>
                  <input
                    type="tel"
                    placeholder="+966500000000"
                    value={newCarrierPhone}
                    onChange={(e) => setNewCarrierPhone(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  id="workspace-btn-save-carrier"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-900 font-bold text-xs rounded transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'إضافة المقاول' : 'Register Carrier'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==================== SUB-TAB 3: DRIVERS & TRUCKS ROSTER ==================== */}
        {activeWorkspaceTab === 'drivers' && (
          <div className="space-y-6 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-cyan-400" />
                <span>{isRtl ? 'اللائحة التشغيلية للسائقين والشاحنات (Project Carrier Roster)' : 'Project Carrier Roster (Drivers & Trucks)'}</span>
              </h3>
              <span className="text-xs text-white/40 bg-white/5 px-2.5 py-1 rounded-full">
                {roster.length} {isRtl ? 'سائقين مسجلين باللائحة' : 'Drivers Registered'}
              </span>
            </div>

            {/* Roster Grid */}
            {roster.length === 0 ? (
              <div className="text-center py-10 bg-[#0b0e12] border border-white/5 rounded-xl text-white/40 italic text-xs">
                {isRtl ? 'لا يوجد سائقين/شاحنات مسجلين في اللائحة التشغيلية للمشروع.' : 'No drivers or trucks enrolled in project active roster.'}
              </div>
            ) : (
              <div className="overflow-x-auto border border-white/10 rounded-xl">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-[#0b0e12] text-white/50 border-b border-white/10">
                      <th className="p-3">{isRtl ? 'اسم السائق' : 'Driver Name'}</th>
                      <th className="p-3">{isRtl ? 'رقم اللوحة' : 'Plate Number'}</th>
                      <th className="p-3">{isRtl ? 'رقم الجوال' : 'Phone'}</th>
                      <th className="p-3">{isRtl ? 'رقم الإقامة' : 'Residency ID'}</th>
                      <th className="p-3">{isRtl ? 'الناقل' : 'Carrier'}</th>
                      <th className="p-3 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map(r => {
                      const carName = carriers.find(c => c.carrierId === r.carrierId)?.name || r.carrierId;
                      return (
                        <tr key={r.rosterId} className="border-b border-white/5 hover:bg-white/5 transition-all">
                          <td className="p-3 text-white font-bold">{r.driverName}</td>
                          <td className="p-3"><span className="px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-400 border border-cyan-500/10">{r.plateNumber}</span></td>
                          <td className="p-3 text-white/70">{r.phone}</td>
                          <td className="p-3 text-white/60">{r.residencyId || 'N/A'}</td>
                          <td className="p-3 text-white/60 truncate max-w-[140px]">{carName}</td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRoster(r.rosterId)}
                              className="p-1 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded transition-colors"
                              title="حذف من اللائحة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* New Roster Form */}
            <form id="form-enroll-roster" onSubmit={handleAddRoster} className="bg-[#0b0e12] border border-white/5 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-black text-cyan-400 flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <span>{isRtl ? 'تسجيل وتوثيق سائق وشاحنة جديدة' : 'Enroll New Driver & Truck in Roster'}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] text-white/40 block mb-1">{isRtl ? 'اسم السائق بالكامل:' : 'Driver Full Name:'}</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحمد الشريف"
                    value={newRosterDriver}
                    onChange={(e) => setNewRosterDriver(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-white/40 block mb-1">{isRtl ? 'رقم اللوحة (أ ب ج 1234):' : 'Plate Number (ABC 1234):'}</label>
                  <input
                    type="text"
                    required
                    placeholder="أ ب ج 1234"
                    value={newRosterPlate}
                    onChange={(e) => setNewRosterPlate(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-white/40 block mb-1">{isRtl ? 'رقم الهاتف:' : 'Driver Phone:'}</label>
                  <input
                    type="tel"
                    placeholder="+966500000000"
                    value={newRosterPhone}
                    onChange={(e) => setNewRosterPhone(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-white/40 block mb-1">{isRtl ? 'رقم الهوية الوطنية / الإقامة:' : 'National / Residency ID:'}</label>
                  <input
                    type="text"
                    placeholder="1000000000"
                    value={newRosterResidency}
                    onChange={(e) => setNewRosterResidency(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-white/40 block mb-1">{isRtl ? 'الناقل المتلفف:' : 'Associated Carrier:'}</label>
                  <select
                    required
                    value={newRosterCarrier}
                    onChange={(e) => setNewRosterCarrier(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-hidden"
                  >
                    <option value="">{isRtl ? 'اختر الناقل...' : 'Select Carrier...'}</option>
                    {carriers.map(c => (
                      <option key={c.carrierId} value={c.carrierId}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-white/40 block mb-1">{isRtl ? 'المادة المعتمدة الافتراضية:' : 'Primary Material:'}</label>
                  <select
                    required
                    value={newRosterMaterial}
                    onChange={(e) => setNewRosterMaterial(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-hidden"
                  >
                    <option value="">{isRtl ? 'اختر المادة...' : 'Select Material...'}</option>
                    {materials.map(m => (
                      <option key={m.materialId} value={m.materialId}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  id="workspace-btn-save-roster"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-[#0f1115] font-bold text-xs rounded transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'إدراج باللائحة' : 'Enroll Roster'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==================== SUB-TAB 4: APPROVED MATERIALS ==================== */}
        {activeWorkspaceTab === 'materials' && (
          <div className="space-y-6 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-orange-400" />
                <span>{isRtl ? 'المواد المعتمدة للمشروع' : 'Project Approved Materials'}</span>
              </h3>
              <span className="text-xs text-white/40 bg-white/5 px-2.5 py-1 rounded-full">
                {materials.length} {isRtl ? 'مواد معتمدة' : 'Materials Approved'}
              </span>
            </div>

            {/* Materials grid */}
            {materials.length === 0 ? (
              <div className="text-center py-10 bg-[#0b0e12] border border-white/5 rounded-xl text-white/40 italic text-xs">
                {isRtl ? 'لا يوجد مواد مضافة ومعتمدة لهذا المشروع.' : 'No materials approved yet for this project.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {materials.map(m => (
                  <div key={m.materialId} className="bg-[#0b0e12] border border-white/10 rounded-xl p-3 space-y-1 relative">
                    <span className="text-[8px] font-mono font-bold text-orange-400 bg-orange-950/30 px-1.5 py-0.5 rounded border border-orange-500/20 absolute top-2 right-2">
                      {m.code}
                    </span>
                    <h4 className="text-xs font-bold text-white pt-2">{m.name}</h4>
                    <p className="text-[10px] text-white/40">UOM: {m.unitOfMeasure}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add Material Form */}
            <form id="form-enroll-material" onSubmit={handleAddMaterial} className="bg-[#0b0e12] border border-white/5 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-black text-orange-400 flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <span>{isRtl ? 'اعتماد مادة توريد جديدة' : 'Approve New Supply Material'}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] text-white/40 block mb-1">{isRtl ? 'اسم المادة بالعربية:' : 'Material Name:'}</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: بحص مقاس 3/8"
                    value={newMaterialName}
                    onChange={(e) => setNewMaterialName(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-white/40 block mb-1">{isRtl ? 'رمز المادة (رمز فريد):' : 'Material Code:'}</label>
                  <input
                    type="text"
                    required
                    placeholder="AGG-38"
                    value={newMaterialCode}
                    onChange={(e) => setNewMaterialCode(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-white/40 block mb-1">{isRtl ? 'وحدة القياس:' : 'Unit of Measure:'}</label>
                  <select
                    value={newMaterialUnit}
                    onChange={(e) => setNewMaterialUnit(e.target.value as any)}
                    className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-hidden"
                  >
                    <option value="TON">TON (طن)</option>
                    <option value="M3">M3 (متر مكعب)</option>
                    <option value="TRIP">TRIP (بالرد)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  id="workspace-btn-save-material"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-stone-900 font-bold text-xs rounded transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'اعتماد المادة' : 'Approve Material'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==================== SUB-TAB 5: PRICING RULES ==================== */}
        {activeWorkspaceTab === 'pricing' && (
          <div className="space-y-6 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <CircleDollarSign className="w-4 h-4 text-emerald-400" />
                <span>{isRtl ? 'اتفاقيات أسعار النقل والتعرفة' : 'Pricing Agreements & Tariff rules'}</span>
              </h3>
              <span className="text-xs text-white/40 bg-white/5 px-2.5 py-1 rounded-full">
                {pricingRules.length} {isRtl ? 'قواعد تسعير' : 'Agreements Active'}
              </span>
            </div>

            {/* Pricing Rules list */}
            {pricingRules.length === 0 ? (
              <div className="text-center py-10 bg-[#0b0e12] border border-white/5 rounded-xl text-white/40 italic text-xs">
                {isRtl ? 'لا يوجد قواعد تسعير مضافة لهذا المشروع.' : 'No pricing rules/contracts configured yet for this project.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pricingRules.map(r => {
                  const car = carriers.find(c => c.carrierId === r.carrierId);
                  const mat = materials.find(m => m.materialId === r.materialId);
                  return (
                    <div key={r.pricingRuleId} className="bg-[#0b0e12] border border-white/10 rounded-xl p-4 space-y-3 relative">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-[10px] font-bold text-emerald-400 font-mono">
                          {r.pricingRuleId}
                        </span>
                        <span className="text-xs font-black text-white">
                          {r.baseRateSAR} SAR
                        </span>
                      </div>

                      <div className="text-xs space-y-1 text-white/70">
                        <div><span className="text-white/40">{isRtl ? 'الاتفاقية:' : 'Agreement:'}</span> <strong className="text-white">{r.name}</strong></div>
                        <div><span className="text-white/40">{isRtl ? 'المقاول:' : 'Carrier:'}</span> <strong className="text-stone-300">{car ? car.name : (isRtl ? 'عام (كل المقاولين)' : 'General (All)')}</strong></div>
                        <div><span className="text-white/40">{isRtl ? 'المادة المعتمدة:' : 'Material:'}</span> <strong className="text-stone-300">{mat ? mat.name : (isRtl ? 'عام (كل المواد)' : 'General (All)')}</strong></div>
                        <div><span className="text-white/40">{isRtl ? 'طريقة الحساب:' : 'Calculation Model:'}</span> <strong className="text-stone-300">{r.pricingModel}</strong></div>
                        <div><span className="text-white/40">{isRtl ? 'شامل الضريبة:' : 'VAT Applicable:'}</span> <strong className="text-stone-300">{r.vatApplicable ? (isRtl ? 'نعم (15%)' : 'Yes (15%)') : (isRtl ? 'لا' : 'No')}</strong></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Create Pricing Rule form */}
            <form id="form-enroll-pricing" onSubmit={handleAddPricingRule} className="bg-[#0b0e12] border border-white/5 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <span>{isRtl ? 'صياغة اتفاقية تسعير جديدة' : 'Formulate New Pricing Agreement'}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
                  <label className="text-[10px] text-white/40 block mb-1">{isRtl ? 'عنوان التعرفة / مسمى الاتفاقية:' : 'Pricing Title:'}</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: تعرفة بحص للمحجر الشمالي - بالطن"
                    value={newPricingName}
                    onChange={(e) => setNewPricingName(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-white/40 block mb-1">{isRtl ? 'المقاول المشمول:' : 'Applicable Carrier:'}</label>
                  <select
                    value={newPricingCarrierId}
                    onChange={(e) => setNewPricingCarrierId(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-hidden"
                  >
                    <option value="ALL">{isRtl ? 'عام (كل المقاولين)' : 'General (All)'}</option>
                    {carriers.map(c => (
                      <option key={c.carrierId} value={c.carrierId}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-white/40 block mb-1">{isRtl ? 'المادة المشمولة:' : 'Applicable Material:'}</label>
                  <select
                    value={newPricingMaterialId}
                    onChange={(e) => setNewPricingMaterialId(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-hidden"
                  >
                    <option value="ALL_MATERIALS">{isRtl ? 'عام (كل المواد)' : 'General (All)'}</option>
                    {materials.map(m => (
                      <option key={m.materialId} value={m.materialId}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-white/40 block mb-1">{isRtl ? 'طريقة حساب الأجرة:' : 'Pricing Model:'}</label>
                  <select
                    value={newPricingModel}
                    onChange={(e) => setNewPricingModel(e.target.value as any)}
                    className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-hidden"
                  >
                    <option value="PER_TON">PER_TON (بالطن المورد)</option>
                    <option value="PER_TRIP">PER_TRIP (بالرد/الرحلة)</option>
                    <option value="PER_KM">PER_KM (بالكيلومتر)</option>
                    <option value="FLAT_RATE">FLAT_RATE (مقطوعة ثابتة)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-white/40 block mb-1">{isRtl ? 'التعرفة الأساسية (ريال سعودي):' : 'Agreed Rate (SAR):'}</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newPricingRate}
                    onChange={(e) => setNewPricingRate(Number(e.target.value))}
                    className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <label className="flex items-center gap-2 mt-6 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPricingVat}
                    onChange={(e) => setNewPricingVat(e.target.checked)}
                    className="rounded text-[#10b981] bg-black border-white/10 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs text-white/70">{isRtl ? 'يخضع لضريبة القيمة المضافة (15%)' : 'VAT Subject (15%)'}</span>
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  id="workspace-btn-save-pricing"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-stone-900 font-bold text-xs rounded transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'إدراج بالتعرفة' : 'Formulate Rule'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==================== SUB-TAB 6: PROJECT ACCESS ==================== */}
        {activeWorkspaceTab === 'access' && (
          <div className="space-y-6 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>{isRtl ? 'إدارة صلاحيات مستخدمي وموظفي المشروع' : 'Project Access Control List'}</span>
              </h3>
              <span className="text-xs text-white/40 bg-white/5 px-2.5 py-1 rounded-full">
                {usersWithAccess.length} {isRtl ? 'مستخدمين مخولين' : 'Users Granted Access'}
              </span>
            </div>

            {/* Users list with access */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {usersWithAccess.map(u => (
                <div key={u.userId} className="bg-[#0b0e12] border border-white/10 rounded-xl p-4 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white">{u.fullName}</h4>
                    <span className="text-[10px] text-white/50">{u.email}</span>
                    <span className="block text-[9px] text-[#10b981] font-mono font-bold mt-1 uppercase tracking-wider">
                      ROLE: {u.role}
                    </span>
                  </div>

                  {/* Revoke option for non-superadmins */}
                  {u.role !== 'SUPER_ADMIN' && (
                    <button
                      type="button"
                      onClick={() => handleRemoveUserAccess(u.userId)}
                      className="p-1.5 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded transition-colors text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'سحب' : 'Revoke'}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Grant Access Form */}
            {usersNoAccess.length > 0 && (
              <form id="form-enroll-access" onSubmit={handleAddUserAccess} className="bg-[#0b0e12] border border-white/5 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-black text-purple-400 flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>{isRtl ? 'تخويل وتفويض مستخدم جديد للمشروع' : 'Grant New User Access'}</span>
                </h4>

                <div className="flex flex-col sm:flex-row items-end gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-white/40 block mb-1">{isRtl ? 'اختر مستخدم مسجل بالنظام:' : 'Select System User:'}</label>
                    <select
                      value={selectedUserToAdd}
                      onChange={(e) => setSelectedUserToAdd(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-hidden"
                    >
                      <option value="">{isRtl ? 'اختر مستخدم...' : 'Select User...'}</option>
                      {usersNoAccess.map(u => (
                        <option key={u.userId} value={u.userId}>
                          {u.fullName} ({u.role} - {u.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    id="workspace-btn-save-access"
                    disabled={isSubmitting || !selectedUserToAdd}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded transition-all cursor-pointer whitespace-nowrap"
                  >
                    {isRtl ? 'منح صلاحية الوصول' : 'Grant Access'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ==================== SUB-TAB 7: GOOGLE INTEGRATION ==================== */}
        {activeWorkspaceTab === 'google' && (
          <form id="form-project-google" onSubmit={handleSaveGoogleDrive} className="space-y-6 font-mono">
            <h3 className="text-sm font-black text-white pb-3 border-b border-white/5 flex items-center gap-2">
              <FolderSync className="w-4 h-4 text-[#4285F4]" />
              <span>{isRtl ? 'تكامل مستندات Google Drive وجداول البيانات' : 'Google Workspace Real-Time Sync'}</span>
            </h3>

            <div className="p-4 bg-[#4285F4]/10 border border-[#4285F4]/20 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#4285F4]" />
                <span>{isRtl ? 'مزامنة السحابة الإلزامية عبر OAuth 2.0' : 'Mandatory Cloud Sync Over OAuth 2.0'}</span>
              </div>
              <p className="text-white/70 leading-relaxed">
                {isRtl 
                  ? 'يتم إسقاط ومزامنة جميع معاملات الموازين وتذاكر الشحن وسندات السائقين بشكل تلقائي ولحظي في ملفات Google Sheets ومجلدات Google Drive.' 
                  : 'All weighbridge tickets, trips log, and carrier billing indexes are projected live into configured Google Drive structures.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/50 block mb-1.5">{isRtl ? 'اسم مجلد المشروع الرئيسي بـ Google Drive:' : 'Root Google Drive Folder Name:'}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q_SAUDI_NEOM_ARCH"
                  value={driveRootFolder}
                  onChange={(e) => setDriveRootFolder(e.target.value)}
                  className="w-full bg-[#0b0e12] border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#10b981]"
                />
              </div>

              <div>
                <label className="text-xs text-white/50 block mb-1.5">{isRtl ? 'عنوان جدول بيانات الرحلات الرئيسي (Google Sheets):' : 'Main Google Sheets Trips Index Title:'}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NEOM Logistics Master Log"
                  value={driveSpreadsheet}
                  onChange={(e) => setDriveSpreadsheet(e.target.value)}
                  className="w-full bg-[#0b0e12] border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#10b981]"
                />
              </div>

              <div>
                <span className="text-[10px] text-white/40 block mb-1">GOOGLE SPREADSHEET ID:</span>
                <span className="font-mono text-xs text-white/80 select-all p-2 bg-[#0b0e12] border border-white/5 rounded block truncate">
                  {project.settings?.googleSpreadsheetId || '1_X_MOCK_SHEET_ID_PROVISIONED'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-white/40 block mb-1">GOOGLE FOLDER ID:</span>
                <span className="font-mono text-xs text-white/80 select-all p-2 bg-[#0b0e12] border border-white/5 rounded block truncate">
                  {project.settings?.googleDriveFolderId || '1_X_MOCK_FOLDER_ID_PROVISIONED'}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-end">
              <button
                type="submit"
                id="workspace-btn-save-google"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isRtl ? 'حفظ ومزامنة مجلدات جوجل' : 'Save & Sync Google Folder'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
