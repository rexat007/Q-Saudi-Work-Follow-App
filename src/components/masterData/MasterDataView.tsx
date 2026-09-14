import React, { useState, useEffect } from 'react';
import {
  Building2,
  Truck,
  UserCheck,
  Layers,
  ShieldAlert,
  ShieldCheck,
  Search,
  Plus,
  RefreshCw,
  Power,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Filter,
  Eye,
  Info,
  ArrowRightLeft,
  ArrowDownToLine,
  FileSpreadsheet,
  Upload,
  Globe,
  HelpCircle
} from 'lucide-react';
import { masterDataService, ProjectMasterDataOverview, MasterEntityType, TripUsageResult } from '../../services/masterData.service';
import { DriverTruckPipelineService } from '../../services/import/driverTruckPipeline.service';
import { projectRepository } from '../../repositories/project.repository';
import { carrierRepository } from '../../repositories/carrier.repository';
import { materialRepository } from '../../repositories/material.repository';
import { truckRepository } from '../../repositories/truck.repository';
import { driverRepository } from '../../repositories/driver.repository';
import { tripRepository } from '../../repositories/trip.repository';
import { CarrierEntity, MaterialEntity, TruckEntity, DriverEntity, ProjectEntity } from '../../types/entities';
import { normalizeName, normalizePlate, normalizePhone, normalizeIdNumber, normalizeCode, normalizeArabicText } from '../../utils/normalization';
import { runMasterDataTests, MasterDataTestCaseResult } from '../../tests/masterData.test';
import { useAuth } from '../../firebase/authContext';
import { adminConsoleService } from '../../services/adminConsole.service';
import { DEFAULT_PROJECTS, DEFAULT_CARRIERS, DEFAULT_MATERIALS, DEFAULT_TRUCKS, DEFAULT_DRIVERS, buildDefaultOverview } from '../../data/defaultMasterData';
import { useI18n } from '../../i18n';


const MOCK_AUTH_CONTEXT = {
  userId: 'USR-ADMIN-01',
  role: 'PROJECT_ADMIN' as const,
  email: 'admin@q-saudi.sa',
  displayName: 'مدير العمليات اللوجستية',
};

export const MasterDataView: React.FC = () => {
  const { t } = useI18n();
  const { user, isAuthReady, signInWithGoogle } = useAuth();
  const [projects, setProjects] = useState<ProjectEntity[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [activeModule, setActiveModule] = useState<'CARRIERS' | 'MATERIALS' | 'TRUCKS' | 'DRIVERS' | 'TESTS' | 'IMPORT_DT'>('CARRIERS');
  const [overview, setOverview] = useState<ProjectMasterDataOverview | null>(null);
  
  // --- Drivers & Trucks Import state ---
  const [importCarrierId, setImportCarrierId] = useState<string>('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSheetsUrl, setImportSheetsUrl] = useState<string>('');
  const [importBatch, setImportBatch] = useState<any | null>(null);
  const [importProcessing, setImportProcessing] = useState<boolean>(false);
  const [importCommitting, setImportCommitting] = useState<boolean>(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const [importErrorMessage, setImportErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [carrierFilter, setCarrierFilter] = useState<string>('ALL');

  // In-memory demo data state (for unauthenticated preview mode)
  const [localCarriers, setLocalCarriers] = useState<CarrierEntity[]>(() => adminConsoleService.getCarriers());
  const [localMaterials, setLocalMaterials] = useState<MaterialEntity[]>(() => adminConsoleService.getMaterials());
  const [localTrucks, setLocalTrucks] = useState<TruckEntity[]>(() => adminConsoleService.getTrucks());
  const [localDrivers, setLocalDrivers] = useState<DriverEntity[]>(() => adminConsoleService.getDrivers());

  // Automated Tests State
  const [testResults, setTestResults] = useState<{
    allPassed: boolean;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    results: MasterDataTestCaseResult[];
  } | null>(null);
  const [testingRunning, setTestingRunning] = useState<boolean>(false);

  const handleExecuteTests = async () => {
    if (!user) {
      setActionNotice({
        type: 'error',
        message: t('other.messages.txt_197fc5'),
      });
      return;
    }
    setTestingRunning(true);
    try {
      const res = await runMasterDataTests();
      setTestResults(res);
    } catch (err: any) {
      console.error(err);
      setActionNotice({
        type: 'error',
        message: `فشلت الفحوصات: ${err.message || String(err)}`,
      });
    } finally {
      setTestingRunning(false);
    }
  };

  // Deletion guard modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    entityType: MasterEntityType;
    entityId: string;
    entityTitle: string;
    checking: boolean;
    usageResult: TripUsageResult | null;
    error: string | null;
    success: string | null;
  }>({
    isOpen: false,
    entityType: 'CARRIER',
    entityId: '',
    entityTitle: '',
    checking: false,
    usageResult: null,
    error: null,
    success: null,
  });

  // Create Modal state
  const [createModal, setCreateModal] = useState<{
    isOpen: boolean;
    entityType: MasterEntityType;
  }>({
    isOpen: false,
    entityType: 'CARRIER',
  });

  // Form states
  const [newCarrier, setNewCarrier] = useState({ carrierId: '', name: '', crNo: '1010000000', phone: '+966500000001' });
  const [newMaterial, setNewMaterial] = useState({ materialId: '', name: '', code: 'AGG-01', uom: 'TON' as 'TON' | 'M3' | 'TRIP' });
  const [newTruck, setNewTruck] = useState({ truckId: '', plate: '', carrierId: '', tareKg: 14000, grossKg: 45000 });
  const [newDriver, setNewDriver] = useState({ driverId: '', name: '', phone: '0501234567', idNumber: '1087654321', carrierId: '' });
  const [actionNotice, setActionNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Initialize sample data: Firestore if authenticated, local demo state if unauthenticated
  useEffect(() => {
    async function initData() {
      if (!isAuthReady) return;
      setLoading(true);

      // Safe demo mode when unauthenticated (avoids permission errors)
      if (!user) {
        const liveProjects = adminConsoleService.getProjects();
        setProjects(liveProjects);
        if (liveProjects.length > 0) {
          const defaultProjId = liveProjects[0].projectId;
          setSelectedProjectId(defaultProjId);
          setOverview(buildDefaultOverview(defaultProjId, localCarriers, localMaterials, localTrucks, localDrivers));
        } else {
          setSelectedProjectId('');
          setOverview(null);
        }
        setLoading(false);
        return;
      }

      // Authenticated mode: load from live Firestore
      try {
        const pList = await projectRepository.listAll();
        // BLOCK 82D: In clean normal runtime, do not automatically seed synthetic projects/data into Firestore.
        setProjects(pList || []);
        if (pList && pList.length > 0) {
          setSelectedProjectId(pList[0].projectId);
        } else {
          setSelectedProjectId('');
          setOverview(null);
        }
      } catch (err: any) {
        console.warn('Live Firestore synchronization issue, using runtime fallback:', err);
        const liveProjects = adminConsoleService.getProjects();
        setProjects(liveProjects);
        if (liveProjects.length > 0) {
          const defaultProjId = liveProjects[0].projectId;
          setSelectedProjectId(defaultProjId);
          setOverview(buildDefaultOverview(defaultProjId, localCarriers, localMaterials, localTrucks, localDrivers));
        } else {
          setSelectedProjectId('');
          setOverview(null);
        }
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, [user, isAuthReady]);

  // Refresh current project overview
  const refreshOverview = async (pId: string) => {
    if (!pId) return;
    if (!user) {
      setOverview(buildDefaultOverview(pId, localCarriers, localMaterials, localTrucks, localDrivers));
      return;
    }
    try {
      const ov = await masterDataService.getProjectMasterData(pId);
      setOverview(ov);
    } catch (err: any) {
      console.warn('Failed to load project master data from Firestore, using local overview:', err);
      setOverview(buildDefaultOverview(pId, localCarriers, localMaterials, localTrucks, localDrivers));
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      refreshOverview(selectedProjectId);
    }
  }, [selectedProjectId]);

  // Handle status toggle (ACTIVE <-> INACTIVE)
  const handleToggleStatus = async (entityType: MasterEntityType, entityId: string, currentStatus: 'ACTIVE' | 'INACTIVE') => {
    if (!selectedProjectId) return;
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const isAct = newStatus === 'ACTIVE';

    if (!user) {
      let updatedCarriers = localCarriers;
      let updatedMaterials = localMaterials;
      let updatedTrucks = localTrucks;
      let updatedDrivers = localDrivers;

      if (entityType === 'CARRIER') {
        updatedCarriers = localCarriers.map(c => c.carrierId === entityId ? { ...c, status: newStatus, isActive: isAct } : c);
        setLocalCarriers(updatedCarriers);
      } else if (entityType === 'MATERIAL') {
        updatedMaterials = localMaterials.map(m => m.materialId === entityId ? { ...m, status: newStatus, isActive: isAct } : m);
        setLocalMaterials(updatedMaterials);
      } else if (entityType === 'TRUCK') {
        updatedTrucks = localTrucks.map(t => t.truckId === entityId ? { ...t, status: newStatus, isActive: isAct } : t);
        setLocalTrucks(updatedTrucks);
      } else if (entityType === 'DRIVER') {
        updatedDrivers = localDrivers.map(d => d.driverId === entityId ? { ...d, status: newStatus, isActive: isAct } : d);
        setLocalDrivers(updatedDrivers);
      }

      setOverview(buildDefaultOverview(selectedProjectId, updatedCarriers, updatedMaterials, updatedTrucks, updatedDrivers));
      setActionNotice({
        type: 'success',
        message: `تم تحديث حالة السجل (${entityId}) بنجاح إلى [${newStatus}] (محلياً في وضع المعاينة).`,
      });
      return;
    }

    try {
      await masterDataService.setEntityStatus(selectedProjectId, entityType, entityId, newStatus, MOCK_AUTH_CONTEXT);
      setActionNotice({
        type: 'success',
        message: `تم تحديث حالة السجل (${entityId}) بنجاح إلى [${newStatus}].`,
      });
      await refreshOverview(selectedProjectId);
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err.message || 'فشل تحديث الحالة',
      });
    }
  };

  // Open deletion guard modal
  const handleAttemptDelete = async (entityType: MasterEntityType, entityId: string, title: string) => {
    setDeleteModal({
      isOpen: true,
      entityType,
      entityId,
      entityTitle: title,
      checking: true,
      usageResult: null,
      error: null,
      success: null,
    });

    if (!user) {
      // Local safety check: TRK-9871, DRV-101, CAR-ALMAJDOUIE, MAT-AGG-01 are used in historical trip
      const isHistorical = ['CAR-ALMAJDOUIE', 'TRK-9871', 'DRV-101', 'MAT-AGG-01'].includes(entityId);
      setTimeout(() => {
        setDeleteModal(prev => ({
          ...prev,
          checking: false,
          usageResult: {
            isUsed: isHistorical,
            count: isHistorical ? 1 : 0,
            tripNumbers: isHistorical ? ['TRP-2026-00088'] : [],
          },
        }));
      }, 200);
      return;
    }

    try {
      const usage = await masterDataService.checkTripUsage(selectedProjectId, entityType, entityId);
      setDeleteModal(prev => ({
        ...prev,
        checking: false,
        usageResult: usage,
      }));
    } catch (err: any) {
      setDeleteModal(prev => ({
        ...prev,
        checking: false,
        error: err.message,
      }));
    }
  };

  // Confirm soft delete (setting INACTIVE)
  const handleConfirmSoftDelete = async () => {
    if (!deleteModal.entityId || !selectedProjectId) return;

    if (!user) {
      const entityId = deleteModal.entityId;
      const entityType = deleteModal.entityType;
      let updatedCarriers = localCarriers;
      let updatedMaterials = localMaterials;
      let updatedTrucks = localTrucks;
      let updatedDrivers = localDrivers;

      if (entityType === 'CARRIER') {
        updatedCarriers = localCarriers.map(c => c.carrierId === entityId ? { ...c, status: 'INACTIVE' as const, isActive: false } : c);
        setLocalCarriers(updatedCarriers);
      } else if (entityType === 'MATERIAL') {
        updatedMaterials = localMaterials.map(m => m.materialId === entityId ? { ...m, status: 'INACTIVE' as const, isActive: false } : m);
        setLocalMaterials(updatedMaterials);
      } else if (entityType === 'TRUCK') {
        updatedTrucks = localTrucks.map(t => t.truckId === entityId ? { ...t, status: 'INACTIVE' as const, isActive: false } : t);
        setLocalTrucks(updatedTrucks);
      } else if (entityType === 'DRIVER') {
        updatedDrivers = localDrivers.map(d => d.driverId === entityId ? { ...d, status: 'INACTIVE' as const, isActive: false } : d);
        setLocalDrivers(updatedDrivers);
      }

      setOverview(buildDefaultOverview(selectedProjectId, updatedCarriers, updatedMaterials, updatedTrucks, updatedDrivers));
      setDeleteModal(prev => ({
        ...prev,
        success: t('other.status.success_2'),
      }));
      setTimeout(() => {
        setDeleteModal(prev => ({ ...prev, isOpen: false }));
      }, 1500);
      return;
    }

    try {
      const res = await masterDataService.deleteMasterEntity(
        selectedProjectId,
        deleteModal.entityType,
        deleteModal.entityId,
        MOCK_AUTH_CONTEXT
      );
      setDeleteModal(prev => ({
        ...prev,
        success: res.message,
      }));
      await refreshOverview(selectedProjectId);
      setTimeout(() => {
        setDeleteModal(prev => ({ ...prev, isOpen: false }));
      }, 1800);
    } catch (err: any) {
      setDeleteModal(prev => ({
        ...prev,
        error: err.message,
      }));
    }
  };

  // Authorization toggle for Carrier
  const handleToggleCarrierAuth = async (carrierId: string, currentAuth: boolean) => {
    if (!selectedProjectId) return;

    if (!user) {
      setProjects(prev => prev.map(p => {
        if (p.projectId !== selectedProjectId) return p;
        const currentList = p.authorizedCarrierIds || [];
        const nextList = currentAuth ? currentList.filter(id => id !== carrierId) : [...currentList, carrierId];
        return { ...p, authorizedCarrierIds: nextList };
      }));
      setActionNotice({
        type: 'success',
        message: !currentAuth 
          ? `تم تصريح الناقل (${carrierId}) للعمل في هذا المشروع (وضع المعاينة).`
          : `تم إلغاء تصريح الناقل (${carrierId}) من هذا المشروع (وضع المعاينة).`,
      });
      return;
    }

    try {
      await masterDataService.toggleCarrierAuthorization(selectedProjectId, carrierId, !currentAuth, MOCK_AUTH_CONTEXT);
      setActionNotice({
        type: 'success',
        message: !currentAuth 
          ? `تم تصريح الناقل (${carrierId}) للعمل في هذا المشروع.`
          : `تم إلغاء تصريح الناقل (${carrierId}) من هذا المشروع.`,
      });
      await refreshOverview(selectedProjectId);
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message });
    }
  };

  // Authorization toggle for Material
  const handleToggleMaterialAuth = async (materialId: string, currentAuth: boolean) => {
    if (!selectedProjectId) return;

    if (!user) {
      setProjects(prev => prev.map(p => {
        if (p.projectId !== selectedProjectId) return p;
        const currentList = p.authorizedMaterialIds || [];
        const nextList = currentAuth ? currentList.filter(id => id !== materialId) : [...currentList, materialId];
        return { ...p, authorizedMaterialIds: nextList };
      }));
      setActionNotice({
        type: 'success',
        message: !currentAuth 
          ? `تم اعتماد توريد المادة (${materialId}) في هذا المشروع (وضع المعاينة).`
          : `تم حظر توريد المادة (${materialId}) من هذا المشروع (وضع المعاينة).`,
      });
      return;
    }

    try {
      await masterDataService.toggleMaterialAuthorization(selectedProjectId, materialId, !currentAuth, MOCK_AUTH_CONTEXT);
      setActionNotice({
        type: 'success',
        message: !currentAuth 
          ? `تم اعتماد توريد المادة (${materialId}) في هذا المشروع.`
          : `تم حظر توريد المادة (${materialId}) من هذا المشروع.`,
      });
      await refreshOverview(selectedProjectId);
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message });
    }
  };

  // Create Entity
  const handleCreateCarrier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !newCarrier.carrierId || !newCarrier.name) return;

    const carrierEntity: CarrierEntity = {
      carrierId: newCarrier.carrierId.trim().toUpperCase(),
      projectId: selectedProjectId,
      name: newCarrier.name.trim(),
      normalizedName: normalizeName(newCarrier.name.trim()),
      status: 'ACTIVE',
      companyNameAr: newCarrier.name.trim(),
      commercialRegistrationNo: newCarrier.crNo,
      isActive: true,
      createdAt: new Date(),
      createdBy: MOCK_AUTH_CONTEXT.userId,
      updatedAt: new Date(),
      updatedBy: MOCK_AUTH_CONTEXT.userId,
    };

    if (!user) {
      const updated = [carrierEntity, ...localCarriers];
      setLocalCarriers(updated);
      setCreateModal({ isOpen: false, entityType: 'CARRIER' });
      setNewCarrier({ carrierId: '', name: '', crNo: '1010000000', phone: '+966500000001' });
      setOverview(buildDefaultOverview(selectedProjectId, updated, localMaterials, localTrucks, localDrivers));
      setActionNotice({ type: 'success', message: 'تم إضافة الناقل بنجاح مع التطبيع التلقائي للاسم (محلياً).' });
      return;
    }

    try {
      await carrierRepository.create(carrierEntity);
      setCreateModal({ isOpen: false, entityType: 'CARRIER' });
      setNewCarrier({ carrierId: '', name: '', crNo: '1010000000', phone: '+966500000001' });
      setActionNotice({ type: 'success', message: 'تم إضافة الناقل بنجاح مع التطبيع التلقائي للاسم.' });
      await refreshOverview(selectedProjectId);
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message });
    }
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !newMaterial.materialId || !newMaterial.name) return;

    const matEntity: MaterialEntity = {
      materialId: newMaterial.materialId.trim().toUpperCase(),
      projectId: selectedProjectId,
      name: newMaterial.name.trim(),
      normalizedName: normalizeName(newMaterial.name.trim()),
      code: normalizeCode(newMaterial.code),
      status: 'ACTIVE',
      unitOfMeasure: newMaterial.uom,
      isActive: true,
      createdAt: new Date(),
      createdBy: MOCK_AUTH_CONTEXT.userId,
      updatedAt: new Date(),
      updatedBy: MOCK_AUTH_CONTEXT.userId,
    };

    if (!user) {
      const updated = [matEntity, ...localMaterials];
      setLocalMaterials(updated);
      setCreateModal({ isOpen: false, entityType: 'MATERIAL' });
      setNewMaterial({ materialId: '', name: '', code: 'AGG-02', uom: 'TON' });
      setOverview(buildDefaultOverview(selectedProjectId, localCarriers, updated, localTrucks, localDrivers));
      setActionNotice({ type: 'success', message: 'تم إضافة المادة بنجاح وتطبيع الرمز والاسم (محلياً).' });
      return;
    }

    try {
      await materialRepository.create(matEntity);
      setCreateModal({ isOpen: false, entityType: 'MATERIAL' });
      setNewMaterial({ materialId: '', name: '', code: 'AGG-02', uom: 'TON' });
      setActionNotice({ type: 'success', message: 'تم إضافة المادة بنجاح وتطبيع الرمز والاسم.' });
      await refreshOverview(selectedProjectId);
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message });
    }
  };

  const handleCreateTruck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !newTruck.truckId || !newTruck.plate || !newTruck.carrierId) return;

    const truckEntity: TruckEntity = {
      truckId: newTruck.truckId.trim().toUpperCase(),
      projectId: selectedProjectId,
      carrierId: newTruck.carrierId,
      plate: newTruck.plate.trim(),
      normalizedPlate: normalizePlate(newTruck.plate.trim()),
      plateNumberAr: newTruck.plate.trim(),
      status: 'ACTIVE',
      tareWeightKg: Number(newTruck.tareKg),
      maxGrossWeightKg: Number(newTruck.grossKg),
      legalPayloadLimitKg: Math.max(0, Number(newTruck.grossKg) - Number(newTruck.tareKg)),
      isActive: true,
      createdAt: new Date(),
      createdBy: MOCK_AUTH_CONTEXT.userId,
      updatedAt: new Date(),
      updatedBy: MOCK_AUTH_CONTEXT.userId,
    };

    if (!user) {
      const updated = [truckEntity, ...localTrucks];
      setLocalTrucks(updated);
      setCreateModal({ isOpen: false, entityType: 'TRUCK' });
      setNewTruck({ truckId: '', plate: '', carrierId: '', tareKg: 14000, grossKg: 45000 });
      setOverview(buildDefaultOverview(selectedProjectId, localCarriers, localMaterials, updated, localDrivers));
      setActionNotice({ type: 'success', message: t('other.messages.truckCarrier') });
      return;
    }

    try {
      await truckRepository.create(truckEntity);
      setCreateModal({ isOpen: false, entityType: 'TRUCK' });
      setNewTruck({ truckId: '', plate: '', carrierId: '', tareKg: 14000, grossKg: 45000 });
      setActionNotice({ type: 'success', message: t('other.messages.truckCarrier_2') });
      await refreshOverview(selectedProjectId);
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message });
    }
  };

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !newDriver.driverId || !newDriver.name || !newDriver.carrierId) return;

    const driverEntity: DriverEntity = {
      driverId: newDriver.driverId.trim().toUpperCase(),
      projectId: selectedProjectId,
      carrierId: newDriver.carrierId,
      name: newDriver.name.trim(),
      normalizedName: normalizeName(newDriver.name.trim()),
      fullNameAr: newDriver.name.trim(),
      phone: normalizePhone(newDriver.phone),
      idNumber: normalizeIdNumber(newDriver.idNumber),
      nationalOrIqamaId: normalizeIdNumber(newDriver.idNumber),
      status: 'ACTIVE',
      isActive: true,
      createdAt: new Date(),
      createdBy: MOCK_AUTH_CONTEXT.userId,
      updatedAt: new Date(),
      updatedBy: MOCK_AUTH_CONTEXT.userId,
    };

    if (!user) {
      const updated = [driverEntity, ...localDrivers];
      setLocalDrivers(updated);
      setCreateModal({ isOpen: false, entityType: 'DRIVER' });
      setNewDriver({ driverId: '', name: '', phone: '0501234567', idNumber: '1087654321', carrierId: '' });
      setOverview(buildDefaultOverview(selectedProjectId, localCarriers, localMaterials, localTrucks, updated));
      setActionNotice({ type: 'success', message: t('other.messages.driverCarrier') });
      return;
    }

    try {
      await driverRepository.create(driverEntity);
      setCreateModal({ isOpen: false, entityType: 'DRIVER' });
      setNewDriver({ driverId: '', name: '', phone: '0501234567', idNumber: '1087654321', carrierId: '' });
      setActionNotice({ type: 'success', message: t('other.messages.driverCarrier_2') });
      await refreshOverview(selectedProjectId);
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message });
    }
  };

  // --- Drivers & Trucks Import Logic ---
  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    await processImport(file, null);
  };

  const processImport = async (file: File | null, customData: any[][] | null) => {
    if (!selectedProjectId) {
      setImportErrorMessage('يرجى اختيار المشروع أولاً قبل البدء بالاستيراد.');
      return;
    }
    if (!importCarrierId) {
      setImportErrorMessage('يرجى اختيار الناقل المستهدف للملف المراد استيراده للتحقق من علاقات الانتماء وتجنب الأخطاء.');
      return;
    }
    setImportProcessing(true);
    setImportErrorMessage(null);
    setImportSuccessMessage(null);
    setImportBatch(null);

    try {
      let rawData: any;
      let fileName = 'excel_or_csv_import';

      if (customData) {
        rawData = customData;
        fileName = 'google_sheets_data.xlsx';
      } else if (file) {
        fileName = file.name;
        rawData = await file.arrayBuffer();
      } else {
        throw new Error('لم يتم توفير ملف أو مصفوفة بيانات صالحة.');
      }

      const pipelineContext = {
        projectId: selectedProjectId,
        userId: user?.uid || MOCK_AUTH_CONTEXT.userId,
        userName: user?.displayName || MOCK_AUTH_CONTEXT.displayName,
        role: (user as any)?.role || MOCK_AUTH_CONTEXT.role,
        operationId: `OP-IMPORT-${Date.now()}`,
        knownEntities: {
          carriers: overview?.allCarriers || [],
          trucks: overview?.allTrucks || [],
          drivers: overview?.allDrivers || []
        }
      };

      const batch = await DriverTruckPipelineService.processFileToReview(
        rawData,
        fileName,
        file ? file.size : 1024,
        file ? file.type : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        pipelineContext
      );

      setImportBatch(batch);
    } catch (err: any) {
      console.error(err);
      setImportErrorMessage(err.message || 'فشلت معالجة وتحليل السجلات المدخلة.');
    } finally {
      setImportProcessing(false);
    }
  };

  const handleCommitImport = async () => {
    if (!importBatch) return;
    setImportCommitting(true);
    setImportErrorMessage(null);
    setImportSuccessMessage(null);

    try {
      const pipelineContext = {
        projectId: selectedProjectId,
        userId: user?.uid || MOCK_AUTH_CONTEXT.userId,
        userName: user?.displayName || MOCK_AUTH_CONTEXT.displayName,
        role: (user as any)?.role || MOCK_AUTH_CONTEXT.role,
        operationId: `OP-COMMIT-${Date.now()}`,
        knownEntities: {
          carriers: overview?.allCarriers || [],
          trucks: overview?.allTrucks || [],
          drivers: overview?.allDrivers || []
        }
      };

      const { result: commitResult } = await DriverTruckPipelineService.commitBatch(importBatch, pipelineContext);
      if (commitResult.success) {
        setImportSuccessMessage(`تم تفعيل السجلات المستوردة بنجاح! تم إنشاء وتفعيل ${commitResult.committedRows} سائق وشاحنة وتدوين سجلات التدقيق بنجاح.`);
        setImportBatch(null);
        setImportFile(null);
        setImportSheetsUrl('');
        await refreshOverview(selectedProjectId);
      } else {
        throw new Error(commitResult.error || 'فشلت كتابة السجلات في بيئة تشغيل Firestore.');
      }
    } catch (err: any) {
      setImportErrorMessage(err.message || 'حدث خطأ غير متوقع أثناء حفظ الكيانات.');
    } finally {
      setImportCommitting(false);
    }
  };

  const loadPerfectTemplate = () => {
    const targetCarrier = overview?.allCarriers.find(c => c.carrierId === importCarrierId);
    const carrierName = targetCarrier?.name || targetCarrier?.companyNameAr || 'أرامكو السعودية';
    const data = [
      ['اسم السائق', 'رقم الجوال', 'رقم الهوية', 'رقم اللوحة', 'الناقل'],
      ['سلطان القحطاني', '0509998887', '1044433322', 'ر س م 1 2 3 4', carrierName],
      ['تركي الشمري', '0554433221', '1099988877', 'أ ب ج 9 9 9 9', carrierName]
    ];
    processImport(null, data);
  };

  const loadConflictTemplate = () => {
    const data = [
      ['اسم السائق', 'رقم الجوال', 'رقم الهوية', 'رقم اللوحة', 'الناقل'],
      ['أحمد الحربي', '0501234567', '1023456789', 'أ ب ج 1 2 3 4', 'أرامكو السعودية'], // Existing exact resolution
      ['بسام المطيري', '0566666666', '1099988877', 'أ ب ج 9 9 9 9', 'ناقل غير مصرح به'] // Carrier scoping conflict / mismatch
    ];
    processImport(null, data);
  };

  // Filter helper with Arabic normalization
  const normalizedQuery = normalizeArabicText(searchQuery);

  const filterEntity = (name: string, normalizedName?: string, id?: string, extra?: string) => {
    if (!searchQuery.trim()) return true;
    const targetNorm = normalizedName || normalizeArabicText(name);
    const idMatch = id ? id.toLowerCase().includes(searchQuery.toLowerCase()) : false;
    const textMatch = targetNorm.includes(normalizedQuery);
    const extraMatch = extra ? normalizeArabicText(extra).includes(normalizedQuery) : false;
    return idMatch || textMatch || extraMatch;
  };

  const currentProject = projects.find(p => p.projectId === selectedProjectId);
  const authCarrierIds = new Set(currentProject?.authorizedCarrierIds || overview?.authorizedCarriers.map(c => c.carrierId) || []);
  const authMaterialIds = new Set(currentProject?.authorizedMaterialIds || overview?.authorizedMaterials.map(m => m.materialId) || []);

  return (
    <div className="space-y-6">
      {!user && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950">
          <div className="flex items-start sm:items-center gap-3">
            <span className="p-2 rounded-lg bg-amber-500/20 text-amber-800 shrink-0">
              <Info className="w-5 h-5" />
            </span>
            <div>
              <p className="text-sm font-bold">{t("other.labels.txt_486bf8")}</p>
              <p className="text-xs text-amber-900/80">
                {t("other.labels.txt_4e4d76")}</p>
            </div>
          </div>
          <button
            onClick={signInWithGoogle}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold transition-colors shrink-0 shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{t("other.labels.txt_1e1bdf")}</span>
          </button>
        </div>
      )}

      {/* Top Banner & Project Scope Selector */}
      <div className="bg-white border border-stone-200/80 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-amber-500/10 text-amber-700">
                <Building2 className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-stone-900">
                {t("other.labels.txt_7f7eb1")}</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                {t("other.labels.projects_5")}</span>
            </div>
            <p className="text-sm text-stone-600">
              إدارة النواقل، المواد، الشاحنات، والسائقين مع حظر الحذف الفعلي (Hard Delete)، والحفاظ على النزاهة التاريخية، والربط الدقيق للعلاقات (Truck → Carrier و Driver → Carrier).
            </p>
          </div>

          {/* Project Selector */}
          <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-lg p-2 shrink-0">
            <span className="text-xs font-semibold text-stone-600">{t("other.status.projectActive")}</span>
            <select
              id="masterdata-project-select"
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="bg-white border border-stone-300 text-stone-900 text-xs font-bold rounded-md px-3 py-1.5 focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
            >
              {projects.length === 0 ? (
                <option value="">-- لا توجد مشاريع مسجلة --</option>
              ) : (
                projects.map(p => (
                  <option key={p.projectId} value={p.projectId}>
                    {p.nameAr} ({p.projectId})
                  </option>
                ))
              )}
            </select>
            <button
              onClick={() => refreshOverview(selectedProjectId)}
              title={t("other.labels.refresh_2")}
              className="p-1.5 hover:bg-stone-200 rounded text-stone-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Policy Notice */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-stone-100 text-xs text-stone-700">
          <div className="flex items-start gap-2 bg-amber-50/70 border border-amber-200/60 p-2.5 rounded-lg">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-900">{t("other.labels.delete")}</span>
              <p className="text-amber-800 mt-0.5">{t("other.labels.txt_714016")}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-emerald-50/70 border border-emerald-200/60 p-2.5 rounded-lg">
            <Power className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-900">{t("other.labels.txt_207857")}</span>
              <p className="text-emerald-800 mt-0.5">{t("other.labels.delete_2")}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-blue-50/70 border border-blue-200/60 p-2.5 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-blue-900">{t("other.labels.materials_5")}</span>
              <p className="text-blue-800 mt-0.5">{t("other.labels.materialsTrucks")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Notice Alert */}
      {actionNotice && (
        <div className={`p-3 rounded-lg flex items-center justify-between text-xs font-medium border ${
          actionNotice.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{actionNotice.message}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-stone-400 hover:text-stone-700 font-bold px-1.5">
            ✕
          </button>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="bg-white border border-stone-200/80 rounded-xl p-12 text-center shadow-xs">
          <Building2 className="w-12 h-12 text-stone-300 mx-auto mb-3 stroke-[1.5]" />
          <h3 className="text-base font-bold text-stone-900 mb-1">لا توجد مشاريع مسجلة في بيئة التشغيل</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto mb-4">
            النظام يعمل في بيئة تشغيل نظيفة خالية من المشاريع والبيانات الافتراضية. يمكنك إنشاء مشروع جديد من لوحة الإدارة لربط وإدارة البيانات الأساسية.
          </p>
          <button
            onClick={() => setCreateModal({ isOpen: true, entityType: 'CARRIER' })}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة كيان جديد (إعداد البيانات)</span>
          </button>
        </div>
      ) : (
        <>
      {/* Module Selector & Controls */}
      <div className="bg-white border border-stone-200/80 rounded-xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100 pb-3">
          {/* Module Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              id="module-carriers-btn"
              onClick={() => setActiveModule('CARRIERS')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                activeModule === 'CARRIERS'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200/70'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>{t("other.labels.carriers_4")}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                activeModule === 'CARRIERS' ? 'bg-amber-700 text-white' : 'bg-stone-200 text-stone-700'
              }`}>
                {overview?.allCarriers.length || 0}
              </span>
            </button>

            <button
              id="module-materials-btn"
              onClick={() => setActiveModule('MATERIALS')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                activeModule === 'MATERIALS'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200/70'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>المواد (Materials)</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                activeModule === 'MATERIALS' ? 'bg-amber-700 text-white' : 'bg-stone-200 text-stone-700'
              }`}>
                {overview?.allMaterials.length || 0}
              </span>
            </button>

            <button
              id="module-trucks-btn"
              onClick={() => setActiveModule('TRUCKS')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                activeModule === 'TRUCKS'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200/70'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>الشاحنات (Trucks)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                Truck → Carrier
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                activeModule === 'TRUCKS' ? 'bg-amber-700 text-white' : 'bg-stone-200 text-stone-700'
              }`}>
                {overview?.allTrucks.length || 0}
              </span>
            </button>

            <button
              id="module-drivers-btn"
              onClick={() => setActiveModule('DRIVERS')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                activeModule === 'DRIVERS'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200/70'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>{t("other.labels.drivers_5")}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                Driver → Carrier
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                activeModule === 'DRIVERS' ? 'bg-amber-700 text-white' : 'bg-stone-200 text-stone-700'
              }`}>
                {overview?.allDrivers.length || 0}
              </span>
            </button>

            <button
              id="module-tests-btn"
              onClick={() => {
                setActiveModule('TESTS');
                if (!testResults && !testingRunning) {
                  handleExecuteTests();
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                activeModule === 'TESTS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200/70'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t("other.labels.txt_35c4cc")}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                activeModule === 'TESTS' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800 font-bold'
              }`}>
                9 اختبارات
              </span>
            </button>

            <button
              id="module-import-btn"
              onClick={() => {
                setActiveModule('IMPORT_DT');
                if (overview && overview.allCarriers.length > 0 && !importCarrierId) {
                  setImportCarrierId(overview.allCarriers[0].carrierId);
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                activeModule === 'IMPORT_DT'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200/70'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>استيراد السائقين والشاحنات (Import)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 font-bold">
                Unified Pipeline
              </span>
            </button>
          </div>

          {/* Add New Button */}
          {activeModule !== 'IMPORT_DT' && activeModule !== 'TESTS' && (
            <button
              id="add-master-entity-btn"
              onClick={() => setCreateModal({ isOpen: true, entityType: activeModule.slice(0, -1) as MasterEntityType })}
              className="flex items-center gap-1.5 px-3 py-2 bg-stone-900 text-amber-400 hover:bg-stone-800 rounded-lg text-xs font-bold transition-colors shrink-0 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>
                {activeModule === 'CARRIERS' && 'إضافة ناقل جديد'}
                {activeModule === 'MATERIALS' && 'إضافة مادة جديدة'}
                {activeModule === 'TRUCKS' && 'تسجيل شاحنة جديدة'}
                {activeModule === 'DRIVERS' && 'تسجيل سائق جديد'}
              </span>
            </button>
          )}
        </div>

        {/* Search and Filters Bar */}
        {activeModule !== 'TESTS' && activeModule !== 'IMPORT_DT' && (
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            {/* Search Box with Arabic Normalization Support */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute right-3 rtl:right-3 ltr:left-3 ltr:right-auto top-2.5" />
              <input
                type="text"
                placeholder="البحث الذكي بالتطبيع العربي (الهمزات، التاء المربوطة، الأرقام، اللوحات)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-9 rtl:pr-9 rtl:pl-3 ltr:pl-9 ltr:pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 placeholder-stone-400 focus:bg-white focus:outline-hidden focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-stone-500 font-semibold">الحالة:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="bg-stone-50 border border-stone-200 text-xs font-medium rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-amber-500"
              >
                <option value="ALL">{t("other.labels.txt_2ed1b5")}</option>
                <option value="ACTIVE">{t("other.status.txt_671eeb")}</option>
                <option value="INACTIVE">{t("other.labels.txt_f4c520")}</option>
              </select>
            </div>

            {/* Carrier Filter for Trucks and Drivers */}
            {(activeModule === 'TRUCKS' || activeModule === 'DRIVERS') && overview && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-stone-500 font-semibold">الناقل:</span>
                <select
                  value={carrierFilter}
                  onChange={e => setCarrierFilter(e.target.value)}
                  className="bg-stone-50 border border-stone-200 text-xs font-medium rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-amber-500"
                >
                  <option value="ALL">{t("other.labels.txt_6b093a")}</option>
                  {overview.allCarriers.map(c => (
                    <option key={c.carrierId} value={c.carrierId}>
                      {c.name || c.companyNameAr}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Module Content Table */}
      <div className="bg-white border border-stone-200/80 rounded-xl overflow-hidden shadow-xs">
        {/* CARRIERS TABLE */}
        {activeModule === 'CARRIERS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right rtl:text-right ltr:text-left text-xs">
              <thead className="bg-stone-100/70 border-b border-stone-200 text-stone-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">{t("other.labels.carrier_3")}</th>
                  <th className="py-3 px-4">اسم الناقل (الاسم المطبّع)</th>
                  <th className="py-3 px-4">السجل التجاري</th>
                  <th className="py-3 px-4">{t("other.labels.project_4")}</th>
                  <th className="py-3 px-4">{t("other.labels.carrier_4")}</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800 font-medium">
                {overview?.allCarriers
                  .filter(c => statusFilter === 'ALL' || c.status === statusFilter)
                  .filter(c => filterEntity(c.name || c.companyNameAr || '', c.normalizedName, c.carrierId, c.commercialRegistrationNo))
                  .map(carrier => {
                    const isAuthorized = authCarrierIds.has(carrier.carrierId);
                    const isActive = carrier.status === 'ACTIVE';
                    return (
                      <tr key={carrier.carrierId} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-stone-900">
                          {carrier.carrierId}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-900">{carrier.name || carrier.companyNameAr}</div>
                          <div className="text-[11px] text-stone-400 font-mono">
                            تطبيع البحث: {carrier.normalizedName || normalizeName(carrier.name || carrier.companyNameAr || '')}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-stone-600">
                          {carrier.commercialRegistrationNo || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleCarrierAuth(carrier.carrierId, isAuthorized)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                              isAuthorized
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                                : 'bg-stone-100 text-stone-500 border border-stone-200 hover:bg-stone-200'
                            }`}
                            title={t("other.labels.carrierProject_2")}
                          >
                            {isAuthorized ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                <span>{t("other.labels.project_5")}</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5 text-stone-400" />
                                <span>غير مصرح</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-stone-100 text-stone-500 border border-stone-300'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                            {carrier.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleToggleStatus('CARRIER', carrier.carrierId, carrier.status)}
                              className={`p-1.5 rounded transition-colors ${
                                isActive ? 'hover:bg-amber-100 text-amber-700' : 'hover:bg-emerald-100 text-emerald-700'
                              }`}
                              title={isActive ? 'تعطيل الناقل (تحويل إلى INACTIVE)' : 'تفعيل الناقل (تحويل إلى ACTIVE)'}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAttemptDelete('CARRIER', carrier.carrierId, carrier.name || carrier.companyNameAr || carrier.carrierId)}
                              className="p-1.5 hover:bg-rose-100 rounded text-rose-700 transition-colors"
                              title={t("other.labels.deleteCarrierTrips")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                {(!overview || overview.allCarriers.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Info className="w-6 h-6 text-stone-400" />
                        <span>لا توجد سجلات ناقلين لهذا المشروع</span>
                        <button
                          onClick={() => setCreateModal({ isOpen: true, entityType: 'CARRIER' })}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة ناقل جديد</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* MATERIALS TABLE */}
        {activeModule === 'MATERIALS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right rtl:text-right ltr:text-left text-xs">
              <thead className="bg-stone-100/70 border-b border-stone-200 text-stone-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">{t("other.labels.material_4")}</th>
                  <th className="py-3 px-4">رمز المادة (Code)</th>
                  <th className="py-3 px-4">اسم المادة (الاسم المطبّع)</th>
                  <th className="py-3 px-4">وحدة القياس</th>
                  <th className="py-3 px-4">{t("other.labels.project_6")}</th>
                  <th className="py-3 px-4">{t("other.labels.material_6")}</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800 font-medium">
                {overview?.allMaterials
                  .filter(m => statusFilter === 'ALL' || m.status === statusFilter)
                  .filter(m => filterEntity(m.name || m.nameAr || '', m.normalizedName, m.materialId, m.code))
                  .map(mat => {
                    const isAuthorized = authMaterialIds.has(mat.materialId);
                    const isActive = mat.status === 'ACTIVE';
                    return (
                      <tr key={mat.materialId} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-stone-900">
                          {mat.materialId}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-700">
                          {mat.code}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-900">{mat.name || mat.nameAr}</div>
                          <div className="text-[11px] text-stone-400 font-mono">
                            تطبيع البحث: {mat.normalizedName || normalizeName(mat.name || mat.nameAr || '')}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-stone-600">
                          {mat.unitOfMeasure === 'TON' ? 'طن (TON)' : mat.unitOfMeasure === 'M3' ? 'متر مكعب (M3)' : 'بالرد (TRIP)'}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleMaterialAuth(mat.materialId, isAuthorized)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                              isAuthorized
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                                : 'bg-stone-100 text-stone-500 border border-stone-200 hover:bg-stone-200'
                            }`}
                            title={t("other.labels.materialProject_3")}
                          >
                            {isAuthorized ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                <span>{t("other.labels.project_5")}</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5 text-stone-400" />
                                <span>غير مصرح</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-stone-100 text-stone-500 border border-stone-300'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                            {mat.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleToggleStatus('MATERIAL', mat.materialId, mat.status)}
                              className={`p-1.5 rounded transition-colors ${
                                isActive ? 'hover:bg-amber-100 text-amber-700' : 'hover:bg-emerald-100 text-emerald-700'
                              }`}
                              title={isActive ? 'تعطيل المادة (تحويل إلى INACTIVE)' : 'تفعيل المادة (تحويل إلى ACTIVE)'}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAttemptDelete('MATERIAL', mat.materialId, mat.name || mat.nameAr || mat.materialId)}
                              className="p-1.5 hover:bg-rose-100 rounded text-rose-700 transition-colors"
                              title={t("other.labels.deleteMaterialTrips")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* TRUCKS TABLE (Truck -> Carrier) */}
        {activeModule === 'TRUCKS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right rtl:text-right ltr:text-left text-xs">
              <thead className="bg-stone-100/70 border-b border-stone-200 text-stone-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">{t("other.labels.truck")}</th>
                  <th className="py-3 px-4">رقم اللوحة (اللوحة المطبّعة)</th>
                  <th className="py-3 px-4">{t("other.labels.carrier_7")}</th>
                  <th className="py-3 px-4">{t("other.labels.txt_3aa747")}</th>
                  <th className="py-3 px-4">{t("other.labels.truck_2")}</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800 font-medium">
                {overview?.allTrucks
                  .filter(t => statusFilter === 'ALL' || t.status === statusFilter)
                  .filter(t => carrierFilter === 'ALL' || t.carrierId === carrierFilter)
                  .filter(t => filterEntity(t.plate || t.plateNumberAr || '', t.normalizedPlate, t.truckId, t.carrierId))
                  .map(truck => {
                    const carrier = overview.allCarriers.find(c => c.carrierId === truck.carrierId);
                    const isCarrierAuthorized = authCarrierIds.has(truck.carrierId);
                    const isActive = truck.status === 'ACTIVE';
                    return (
                      <tr key={truck.truckId} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-stone-900">
                          {truck.truckId}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-900">{truck.plate || truck.plateNumberAr}</div>
                          <div className="text-[11px] text-stone-400 font-mono">
                            تطبيع: {truck.normalizedPlate || normalizePlate(truck.plate || truck.plateNumberAr || '')}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-900">{carrier?.name || carrier?.companyNameAr || truck.carrierId}</span>
                            {isCarrierAuthorized ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">{t("other.labels.txt_36b6da")}</span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 font-bold">{t("other.labels.txt_66cfae")}</span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-stone-400">{truck.carrierId}</div>
                        </td>
                        <td className="py-3 px-4 text-stone-600 font-mono">
                          <div>فارغ: {truck.tareWeightKg?.toLocaleString()} كجم</div>
                          <div className="text-stone-400">إجمالي: {truck.maxGrossWeightKg?.toLocaleString()} كجم</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-stone-100 text-stone-500 border border-stone-300'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                            {truck.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleToggleStatus('TRUCK', truck.truckId, truck.status)}
                              className={`p-1.5 rounded transition-colors ${
                                isActive ? 'hover:bg-amber-100 text-amber-700' : 'hover:bg-emerald-100 text-emerald-700'
                              }`}
                              title={isActive ? 'تعطيل الشاحنة (تحويل إلى INACTIVE)' : 'تفعيل الشاحنة (تحويل إلى ACTIVE)'}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAttemptDelete('TRUCK', truck.truckId, truck.plate || truck.plateNumberAr || truck.truckId)}
                              className="p-1.5 hover:bg-rose-100 rounded text-rose-700 transition-colors"
                              title={t("other.labels.deleteTruckTrips")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* DRIVERS TABLE (Driver -> Carrier) */}
        {activeModule === 'DRIVERS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right rtl:text-right ltr:text-left text-xs">
              <thead className="bg-stone-100/70 border-b border-stone-200 text-stone-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">{t("other.labels.driver_2")}</th>
                  <th className="py-3 px-4">اسم السائق (الاسم المطبّع)</th>
                  <th className="py-3 px-4">{t("other.labels.txt_618712")}</th>
                  <th className="py-3 px-4">رقم الجوال</th>
                  <th className="py-3 px-4">{t("other.labels.carrier_8")}</th>
                  <th className="py-3 px-4">{t("other.labels.driver_3")}</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800 font-medium">
                {overview?.allDrivers
                  .filter(d => statusFilter === 'ALL' || d.status === statusFilter)
                  .filter(d => carrierFilter === 'ALL' || d.carrierId === carrierFilter)
                  .filter(d => filterEntity(d.name || d.fullNameAr || '', d.normalizedName, d.driverId, d.idNumber || d.nationalOrIqamaId))
                  .map(driver => {
                    const carrier = overview.allCarriers.find(c => c.carrierId === driver.carrierId);
                    const isCarrierAuthorized = authCarrierIds.has(driver.carrierId);
                    const isActive = driver.status === 'ACTIVE';
                    return (
                      <tr key={driver.driverId} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-stone-900">
                          {driver.driverId}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-900">{driver.name || driver.fullNameAr}</div>
                          <div className="text-[11px] text-stone-400 font-mono">
                            تطبيع: {driver.normalizedName || normalizeName(driver.name || driver.fullNameAr || '')}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-stone-700">
                          {driver.idNumber || driver.nationalOrIqamaId}
                        </td>
                        <td className="py-3 px-4 font-mono text-stone-700" dir="ltr">
                          {driver.phone}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-900">{carrier?.name || carrier?.companyNameAr || driver.carrierId}</span>
                            {isCarrierAuthorized ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">{t("other.labels.txt_36b6da")}</span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 font-bold">{t("other.labels.txt_66cfae")}</span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-stone-400">{driver.carrierId}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-stone-100 text-stone-500 border border-stone-300'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                            {driver.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleToggleStatus('DRIVER', driver.driverId, driver.status)}
                              className={`p-1.5 rounded transition-colors ${
                                isActive ? 'hover:bg-amber-100 text-amber-700' : 'hover:bg-emerald-100 text-emerald-700'
                              }`}
                              title={isActive ? 'تعطيل السائق (تحويل إلى INACTIVE)' : 'تفعيل السائق (تحويل إلى ACTIVE)'}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAttemptDelete('DRIVER', driver.driverId, driver.name || driver.fullNameAr || driver.driverId)}
                              className="p-1.5 hover:bg-rose-100 rounded text-rose-700 transition-colors"
                              title={t("other.labels.deleteDriverTrips")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* AUTOMATED TESTS VIEW */}
        {activeModule === 'TESTS' && (
          <div className="p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-stone-50 border border-stone-200/80 p-4 rounded-xl">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>{t("other.labels.txt_47f763")}</span>
                </h3>
                <p className="text-xs text-stone-600 mt-1">
                  {t("other.labels.delete_3")}</p>
              </div>

              <button
                id="rerun-tests-btn"
                onClick={handleExecuteTests}
                disabled={testingRunning}
                className="flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-amber-400 text-xs font-bold rounded-lg transition-colors shadow-xs shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${testingRunning ? 'animate-spin' : ''}`} />
                <span>{testingRunning ? 'جارٍ التشغيل...' : 'إعادة تشغيل الاختبارات'}</span>
              </button>
            </div>

            {/* Test Summary Cards */}
            {testResults && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="bg-stone-50 border border-stone-200 p-3 rounded-lg text-center">
                  <div className="text-xl font-black text-stone-900">{testResults.totalTests}</div>
                  <div className="text-[11px] font-semibold text-stone-500">إجمالي الفحوصات</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-center">
                  <div className="text-xl font-black text-emerald-700">{testResults.passedTests}</div>
                  <div className="text-[11px] font-semibold text-emerald-800">{t("other.labels.txt_5c9a61")}</div>
                </div>
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-center">
                  <div className="text-xl font-black text-rose-700">{testResults.failedTests}</div>
                  <div className="text-[11px] font-semibold text-rose-800">{t("other.labels.txt_ebe0e2")}</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-center">
                  <div className="text-xl font-black text-amber-700">{t("other.labels.enterprise")}</div>
                  <div className="text-[11px] font-semibold text-amber-800">{t("other.labels.txt_394b13")}</div>
                </div>
              </div>
            )}

            {/* Tests List */}
            {testingRunning ? (
              <div className="p-8 text-center text-xs text-stone-600 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
                <span>{t("other.labels.txt_71317d")}</span>
              </div>
            ) : testResults ? (
              <div className="space-y-2.5">
                {testResults.results.map((res, idx) => (
                  <div
                    key={res.id}
                    className="p-3.5 bg-stone-50/70 border border-stone-200/80 rounded-lg flex flex-col md:flex-row md:items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-500">{res.id}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-200 text-stone-700">
                          {res.category}
                        </span>
                        <span className="font-bold text-stone-900">{res.titleAr}</span>
                      </div>
                      <div className="text-[11px] text-stone-500 font-mono" dir="ltr">
                        {res.titleEn}
                      </div>
                      <p className="text-[11px] text-stone-600 pt-0.5">{res.details}</p>
                      <div className="text-[11px] text-stone-500 pt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <span>
                          <strong className="text-stone-700">المتوقع:</strong> {String(res.expected)}
                        </span>
                        <span>
                          <strong className="text-stone-700">الفعلي:</strong> {String(res.actual)}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 pt-1">
                      {res.passed ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-full text-xs font-black">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span>ناجح (PASSED)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 border border-rose-300 text-rose-900 rounded-full text-xs font-black">
                          <AlertTriangle className="w-4 h-4 text-rose-700" />
                          <span>{t("other.labels.txt_592f64")}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-stone-500">
                {t("other.labels.txt_674f3e")}</div>
            )}
          </div>
        )}

        {/* DRIVERS & TRUCKS IMPORT VIEW (Unified Import Pipeline) */}
        {activeModule === 'IMPORT_DT' && (
          <div className="p-6 space-y-6 text-right" dir="rtl">
            <div className="bg-stone-50 border border-stone-200/80 p-5 rounded-xl space-y-2">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-600" />
                <span>منصة استيراد بيانات السائقين والشاحنات الموحدة (Smart Unified Import Pipeline)</span>
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                تتيح لك هذه المنصة استيراد قوائم السائقين والشاحنات التابعة للناقلين بمرونة بالغة. يمر الملف عبر نظام فحص مطابقة متعدد المراحل (10-Stage Pipeline) يشمل التطبيع التلقائي لأسماء السائقين واللوحات السعودية، والتحقق الذكي من تطابق العلاقات والناقلين المصرح لهم بالمشروع وتجنب التكرار.
              </p>
            </div>

            {/* Step 1: Scope Selection & Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-stone-200 p-4 rounded-xl space-y-3">
                <label className="block text-xs font-bold text-stone-700">
                  1. الناقل المستهدف (Target Carrier Context) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={importCarrierId}
                  onChange={(e) => {
                    setImportCarrierId(e.target.value);
                    setImportBatch(null);
                    setImportSuccessMessage(null);
                    setImportErrorMessage(null);
                  }}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs font-semibold focus:outline-hidden focus:border-amber-500"
                >
                  <option value="">-- اختر الناقل المستهدف --</option>
                  {overview?.allCarriers.map(c => (
                    <option key={c.carrierId} value={c.carrierId}>
                      {c.name || c.companyNameAr} ({c.carrierId})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-stone-500 leading-normal">
                  يجب تحديد الناقل المستهدف مسبقاً. سيقوم محرك فحص العلاقات والتحقق الذكي بمطابقة حقل الناقل المذكور في الملف بالناقل المحدد لضمان حماية الحدود وعزل البيانات لكل مشروع وناقل.
                </p>
              </div>

              <div className="bg-white border border-stone-200 p-4 rounded-xl space-y-3 flex flex-col justify-between">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-2">
                    2. خيارات التجربة والـ Sandbox (Sandbox Quick Test)
                  </label>
                  <p className="text-[11px] text-stone-500 leading-relaxed mb-3">
                    لتجربة المنصة فوراً بدون رفع ملفات فعلية، يمكنك بنقرة واحدة تحميل عينات برمجية مسبقة الفحص والتحقق من الاستجابة التلقائية للأخطاء والتعارضات ومستويات الدقة:
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={loadPerfectTemplate}
                    disabled={!importCarrierId || importProcessing || importCommitting}
                    className="flex-1 min-w-[140px] px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200 transition-colors disabled:opacity-50"
                  >
                    🚀 تحميل ملف سليم (100% ناجح)
                  </button>
                  <button
                    type="button"
                    onClick={loadConflictTemplate}
                    disabled={!importCarrierId || importProcessing || importCommitting}
                    className="flex-1 min-w-[140px] px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-xs font-bold border border-rose-200 transition-colors disabled:opacity-50"
                  >
                    ⚠️ تحميل ملف يحتوي على تعارضات
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2: Source File / Sheet Upload */}
            <div className="bg-white border border-stone-200 p-5 rounded-xl space-y-4">
              <label className="block text-xs font-bold text-stone-800">
                3. رفع الملف أو الرابط (Upload Sources: Excel, CSV or Google Sheets)
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Drag-n-Drop File Input */}
                <div className="border-2 border-dashed border-stone-200 hover:border-amber-500 rounded-xl p-6 text-center cursor-pointer transition-colors relative">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleImportFileChange}
                    disabled={!importCarrierId || importProcessing || importCommitting}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <FileSpreadsheet className="w-10 h-10 text-stone-400 mx-auto mb-2" />
                  <span className="block text-xs font-bold text-stone-700">
                    {importFile ? importFile.name : 'اسحب وأسقط ملف Excel / CSV هنا، أو انقر للتصفح'}
                  </span>
                  <span className="block text-[10px] text-stone-400 mt-1">
                    الملفات المدعومة: Excel (.xlsx, .xls) أو ملفات CSV المجدولة
                  </span>
                </div>

                {/* Google Sheets Text input */}
                <div className="border border-stone-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-stone-500" />
                      <span>رابط Google Sheets أو لصق البيانات المباشرة</span>
                    </span>
                    <input
                      type="text"
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      value={importSheetsUrl}
                      onChange={(e) => setImportSheetsUrl(e.target.value)}
                      disabled={!importCarrierId || importProcessing || importCommitting}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs font-mono focus:outline-hidden focus:border-amber-500 disabled:opacity-50"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!importSheetsUrl.trim()) return;
                      // Simulating fetching rows
                      const data = [
                        ['اسم السائق', 'رقم الجوال', 'رقم الهوية', 'رقم اللوحة', 'الناقل'],
                        ['فواز الشمري', '0543322110', '1055566677', 'ب ب ب 5 5 5 5', 'أرامكو السعودية']
                      ];
                      processImport(null, data);
                    }}
                    disabled={!importCarrierId || !importSheetsUrl.trim() || importProcessing || importCommitting}
                    className="w-full py-2 bg-stone-950 hover:bg-stone-800 text-amber-400 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    استرداد ومعالجة خلايا Google Sheets
                  </button>
                </div>
              </div>
            </div>

            {/* Processing and Status Banners */}
            {importProcessing && (
              <div className="p-8 text-center bg-stone-50 border border-stone-200 rounded-xl flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 text-amber-600 animate-spin" />
                <div className="text-xs font-bold text-stone-800">يجري فحص وتحليل السجلات ومطابقة الكيانات الذكية...</div>
                <div className="text-[10px] text-stone-500">مراحل الفحص: التفكيك ➔ التطبيع ➔ فحص العلاقات ➔ الكشف عن التكرار</div>
              </div>
            )}

            {importCommitting && (
              <div className="p-8 text-center bg-stone-50 border border-stone-200 rounded-xl flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                <div className="text-xs font-bold text-emerald-800">يجري حفظ وتفعيل الكيانات وتدوين سجلات التدقيق في Firestore...</div>
                <div className="text-[10px] text-emerald-500">يرجى عدم إغلاق الصفحة أثناء المعالجة الآمنة للعملية المجمعة.</div>
              </div>
            )}

            {importSuccessMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-start gap-3 text-xs leading-relaxed">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-emerald-950">نجح الاستيراد والاعتماد والربط المباشر!</div>
                  <div className="mt-1">{importSuccessMessage}</div>
                </div>
              </div>
            )}

            {importErrorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl flex items-start gap-3 text-xs leading-relaxed">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-rose-950">تنبيه فحص وضمان دقة البيانات:</div>
                  <div className="mt-1">{importErrorMessage}</div>
                </div>
              </div>
            )}

            {/* Step 3: Batch Preview & Smart Resolution Tables */}
            {importBatch && (
              <div className="space-y-4">
                <div className="bg-amber-50/50 border border-amber-200/80 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-stone-900 block mb-0.5">معاينة فحص الدفعة قبل الاعتماد (Pre-commit Review Invariant)</span>
                    <span className="text-[11px] text-stone-500 block">الملف: <strong className="font-mono">{importBatch.filename}</strong> | المعرف اللوجستي: <strong className="font-mono">{importBatch.batchId}</strong></span>
                  </div>
                  <div className="flex flex-wrap gap-2 font-mono font-bold text-[11px]">
                    <span className="px-2 py-1 bg-stone-100 border border-stone-300 rounded text-stone-800">
                      الإجمالي: {importBatch.summary.totalRows}
                    </span>
                    <span className="px-2 py-1 bg-emerald-100 border border-emerald-300 rounded text-emerald-800">
                      السليمة: {importBatch.summary.validRows}
                    </span>
                    <span className="px-2 py-1 bg-amber-100 border border-amber-300 rounded text-amber-800">
                      تنبيهات: {importBatch.summary.warningRows}
                    </span>
                    <span className="px-2 py-1 bg-rose-100 border border-rose-300 rounded text-rose-800">
                      الحرجة (الكتل الممنوعة): {importBatch.summary.criticalRows}
                    </span>
                  </div>
                </div>

                {/* Conflict Banner if Critical Errors Present */}
                {importBatch.summary.criticalRows > 0 && (
                  <div className="p-4 bg-rose-100 border border-rose-300 text-rose-900 rounded-xl flex items-start gap-3 text-xs leading-relaxed">
                    <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <div className="font-black text-rose-950">الملف يحتوي على أخطاء حرجة تعوق الاستيراد الآمن!</div>
                      <p className="mt-1">
                        تمنع لوائح ضمان الجودة ترحيل الدفعة طالما تحتوي على صفوف محظورة (مشار إليها باللون الأحمر أدناه) مثل لوحات الشاحنات المكررة، أرقام الهوية المكررة، أو تعارضات الحدود مع الناقلين الخارجيين. يرجى تعديل الملف وإعادة المحاولة.
                      </p>
                    </div>
                  </div>
                )}

                {/* Rows Table */}
                <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold">
                        <tr>
                          <th className="py-2.5 px-3 w-10">السطر</th>
                          <th className="py-2.5 px-3">الاسم المطبّع (تطبيع)</th>
                          <th className="py-2.5 px-3">رقم الجوال</th>
                          <th className="py-2.5 px-3">رقم الهوية</th>
                          <th className="py-2.5 px-3">اللوحة السعودية (تطبيع)</th>
                          <th className="py-2.5 px-3">الناقل المقروء</th>
                          <th className="py-2.5 px-3">مطابقة الكيانات (Smart Match)</th>
                          <th className="py-2.5 px-3 text-center">حالة الفحص</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-stone-800">
                        {importBatch.rows.map((row: any, idx: number) => {
                          const isCritical = row.status === 'ERROR' && row.errorSeverity === 'CRITICAL';
                          const isWarning = row.status === 'WARNING';
                          const isSuccess = row.status === 'VALID';
                          
                          return (
                            <tr
                              key={idx}
                              className={`hover:bg-stone-50/50 transition-colors ${
                                isCritical ? 'bg-rose-50/40 hover:bg-rose-50/60' : isWarning ? 'bg-amber-50/30 hover:bg-amber-50/50' : ''
                              }`}
                            >
                              <td className="py-3 px-3 font-mono font-bold text-stone-400">
                                {row.rowNum}
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-bold text-stone-900">{row.driverName || '—'}</div>
                                {row.driverName && (
                                  <div className="text-[10px] text-stone-400 font-mono">
                                    {normalizeArabicText(row.driverName)}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-3 font-mono text-[11px] text-stone-600" dir="ltr">
                                {row.driverPhone || '—'}
                              </td>
                              <td className="py-3 px-3 font-mono text-[11px] text-stone-600">
                                {row.driverIdNumber || '—'}
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-bold text-stone-800">{row.truckPlate || '—'}</div>
                                {row.truckPlate && (
                                  <div className="text-[10px] text-stone-400 font-mono">
                                    {normalizePlate(row.truckPlate)}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <span className="font-medium text-stone-800">{row.carrierName || '—'}</span>
                              </td>
                              <td className="py-3 px-3">
                                <div className="space-y-1">
                                  {/* Driver Match */}
                                  {row.entityResolution?.driver && (
                                    <div className="flex items-center gap-1.5 text-[11px]">
                                      <span className="font-semibold text-stone-500">السائق:</span>
                                      {row.entityResolution.driver.matchType === 'EXACT' && (
                                        <span className="text-emerald-700 font-bold bg-emerald-100/70 px-1 py-0.5 rounded text-[10px]">دقيق 100% ➔ {row.entityResolution.driver.matchedId}</span>
                                      )}
                                      {row.entityResolution.driver.matchType === 'FUZZY' && (
                                        <span className="text-amber-700 font-bold bg-amber-100/70 px-1 py-0.5 rounded text-[10px]">تقريبي {Math.round(row.entityResolution.driver.confidence * 100)}% ➔ {row.entityResolution.driver.matchedId}</span>
                                      )}
                                      {row.entityResolution.driver.matchType === 'NONE' && (
                                        <span className="text-blue-700 font-bold bg-blue-50 px-1 py-0.5 rounded text-[10px]">سائق جديد سيُسجل</span>
                                      )}
                                    </div>
                                  )}
                                  {/* Truck Match */}
                                  {row.entityResolution?.truck && (
                                    <div className="flex items-center gap-1.5 text-[11px]">
                                      <span className="font-semibold text-stone-500">الشاحنة:</span>
                                      {row.entityResolution.truck.matchType === 'EXACT' && (
                                        <span className="text-emerald-700 font-bold bg-emerald-100/70 px-1 py-0.5 rounded text-[10px]">دقيق 100% ➔ {row.entityResolution.truck.matchedId}</span>
                                      )}
                                      {row.entityResolution.truck.matchType === 'FUZZY' && (
                                        <span className="text-amber-700 font-bold bg-amber-100/70 px-1 py-0.5 rounded text-[10px]">تقريبي {Math.round(row.entityResolution.truck.confidence * 100)}% ➔ {row.entityResolution.truck.matchedId}</span>
                                      )}
                                      {row.entityResolution.truck.matchType === 'NONE' && (
                                        <span className="text-blue-700 font-bold bg-blue-50 px-1 py-0.5 rounded text-[10px]">شاحنة جديدة ستُسجل</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center">
                                {isSuccess && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    جاهز للاستيراد
                                  </span>
                                )}
                                {isWarning && (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                      تنبيه مطابقة
                                    </span>
                                    <div className="text-[10px] text-amber-700 leading-tight max-w-[150px] mx-auto font-medium">
                                      {row.validationErrors?.join(', ')}
                                    </div>
                                  </div>
                                )}
                                {isCritical && (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                      مرفوض (كتلة)
                                    </span>
                                    <div className="text-[10px] text-rose-700 leading-tight max-w-[150px] mx-auto font-black">
                                      {row.validationErrors?.join(', ')}
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Final Commit Controls */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setImportBatch(null);
                      setImportFile(null);
                      setImportSheetsUrl('');
                    }}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold transition-colors"
                  >
                    إلغاء وإعادة الرفع
                  </button>
                  <button
                    type="button"
                    onClick={handleCommitImport}
                    disabled={importBatch.summary.criticalRows > 0 || importCommitting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-400 rounded-lg text-xs font-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>اعتماد واستيراد السجلات السليمة في Firestore</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DELETION GUARD MODAL (Prohibits Hard Delete of used Master Data) */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full border border-stone-200 shadow-xl overflow-hidden text-right" dir="rtl">
            <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span>فحص النزاهة التاريخية وسياسة منع الحذف (Trip Usage Guard)</span>
              </div>
              <button
                onClick={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-xs text-stone-700">
                أنت تحاول حذف السجل: <span className="font-bold text-stone-900">{deleteModal.entityTitle}</span> ({deleteModal.entityId})
              </div>

              {deleteModal.checking ? (
                <div className="p-4 text-center text-xs text-stone-600 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                  <span>{t("other.labels.trips_4")}</span>
                </div>
              ) : deleteModal.usageResult?.isUsed ? (
                <div className="space-y-3">
                  <div className="p-3 bg-rose-100/70 border border-rose-300 rounded-lg text-rose-900 text-xs space-y-2">
                    <div className="font-bold flex items-center gap-1.5 text-rose-950">
                      <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                      <span>{t("other.labels.delete_5")}</span>
                    </div>
                    <p>
                      {t("other.labels.txt_73dcb9")}<span className="font-bold">{deleteModal.usageResult.count} رحلة سابقة</span> {t("other.labels.txt_67f664")}</p>
                    <div className="bg-white/80 p-2 rounded border border-rose-200 font-mono text-[11px] text-rose-800">
                      أرقام الرحلات: {deleteModal.usageResult.tripNumbers.slice(0, 5).join('، ')}
                      {deleteModal.usageResult.tripNumbers.length > 5 && ' ...'}
                    </div>
                    <p className="text-[11px] text-rose-800">
                      {t("other.labels.delete_6")}</p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-900">
                    <span className="font-bold">{t("other.labels.txt_4755d8")}</span>
                    <p className="mt-1">
                      {t("other.labels.txt_63748e")}<span className="font-bold bg-amber-200 px-1 py-0.5 rounded">INACTIVE</span> لمنع إدراجه في أي رحلات جديدة، مع صون السجلات التاريخية للرحلات السابقة.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs space-y-2">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{t("other.labels.txt_f87929")}</span>
                  </div>
                  <p className="text-emerald-800">
                    {t("other.labels.txt_7bb941")}</p>
                </div>
              )}

              {deleteModal.error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg font-medium">
                  {deleteModal.error}
                </div>
              )}

              {deleteModal.success && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-medium">
                  {deleteModal.success}
                </div>
              )}
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-1.5 text-xs font-bold text-stone-600 hover:bg-stone-200 rounded-lg transition-colors"
              >
                {t("shared.actions.cancel")}</button>
              <button
                onClick={handleConfirmSoftDelete}
                disabled={deleteModal.checking || !!deleteModal.success}
                className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shadow-xs"
              >
                {t("other.labels.txt_34897c")}</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE ENTITY MODAL */}
      {createModal.isOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full border border-stone-200 shadow-xl overflow-hidden text-right" dir="rtl">
            <div className="p-4 bg-stone-900 text-amber-400 font-bold text-sm flex items-center justify-between">
              <span>
                {createModal.entityType === 'CARRIER' && 'تسجيل ناقل جديد'}
                {createModal.entityType === 'MATERIAL' && 'إضافة مادة جديدة'}
                {createModal.entityType === 'TRUCK' && 'تسجيل شاحنة جديدة (Truck → Carrier)'}
                {createModal.entityType === 'DRIVER' && 'تسجيل سائق جديد (Driver → Carrier)'}
              </span>
              <button
                onClick={() => setCreateModal({ isOpen: false, entityType: 'CARRIER' })}
                className="text-stone-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Carrier Form */}
            {createModal.entityType === 'CARRIER' && (
              <form onSubmit={handleCreateCarrier} className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">معرّف الناقل (Carrier ID):</label>
                  <input
                    type="text"
                    required
                    placeholder="CAR-ALSAFA"
                    value={newCarrier.carrierId}
                    onChange={e => setNewCarrier({ ...newCarrier, carrierId: e.target.value })}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">اسم شركة النقل بالعربية:</label>
                  <input
                    type="text"
                    required
                    placeholder="شركة الصفا للنقل والتخليص"
                    value={newCarrier.name}
                    onChange={e => setNewCarrier({ ...newCarrier, name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md"
                  />
                  {newCarrier.name && (
                    <div className="text-[11px] text-stone-500 mt-1 font-mono">
                      الاسم المطبّع (normalizedName): {normalizeName(newCarrier.name)}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">{t("other.labels.txt_68f9e8")}</label>
                  <input
                    type="text"
                    required
                    pattern="[0-9]{10}"
                    value={newCarrier.crNo}
                    onChange={e => setNewCarrier({ ...newCarrier, crNo: e.target.value })}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateModal({ isOpen: false, entityType: 'CARRIER' })}
                    className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded"
                  >
                    {t("shared.actions.cancel")}</button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded"
                  >
                    {t("other.labels.saveCarrier")}</button>
                </div>
              </form>
            )}

            {/* Material Form */}
            {createModal.entityType === 'MATERIAL' && (
              <form onSubmit={handleCreateMaterial} className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">{t("other.labels.material_9")}</label>
                  <input
                    type="text"
                    required
                    placeholder="MAT-GRAVEL-01"
                    value={newMaterial.materialId}
                    onChange={e => setNewMaterial({ ...newMaterial, materialId: e.target.value })}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">رمز المادة (Code):</label>
                  <input
                    type="text"
                    required
                    placeholder="GRV-01"
                    value={newMaterial.code}
                    onChange={e => setNewMaterial({ ...newMaterial, code: e.target.value })}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">اسم المادة بالعربية:</label>
                  <input
                    type="text"
                    required
                    placeholder="حصى وادي طبيعي مقاس 2 بوصة"
                    value={newMaterial.name}
                    onChange={e => setNewMaterial({ ...newMaterial, name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md"
                  />
                  {newMaterial.name && (
                    <div className="text-[11px] text-stone-500 mt-1 font-mono">
                      الاسم المطبّع: {normalizeName(newMaterial.name)}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">{t("other.labels.txt_109c7a")}</label>
                  <select
                    value={newMaterial.uom}
                    onChange={e => setNewMaterial({ ...newMaterial, uom: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md"
                  >
                    <option value="TON">طن (TON)</option>
                    <option value="M3">متر مكعب (M3)</option>
                    <option value="TRIP">{t("other.labels.txt_3fb9ae")}</option>
                  </select>
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateModal({ isOpen: false, entityType: 'MATERIAL' })}
                    className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded"
                  >
                    {t("shared.actions.cancel")}</button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded"
                  >
                    {t("other.labels.saveMaterial")}</button>
                </div>
              </form>
            )}

            {/* Truck Form (Truck -> Carrier) */}
            {createModal.entityType === 'TRUCK' && (
              <form onSubmit={handleCreateTruck} className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">الناقل التابع له (Truck → Carrier):</label>
                  <select
                    required
                    value={newTruck.carrierId}
                    onChange={e => setNewTruck({ ...newTruck, carrierId: e.target.value })}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-bold"
                  >
                    <option value="">{t("other.labels.carrier_10")}</option>
                    {overview?.allCarriers.map(c => (
                      <option key={c.carrierId} value={c.carrierId}>
                        {c.name || c.companyNameAr} ({c.carrierId})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">{t("other.labels.truck_5")}</label>
                  <input
                    type="text"
                    required
                    placeholder="TRK-4421"
                    value={newTruck.truckId}
                    onChange={e => setNewTruck({ ...newTruck, truckId: e.target.value })}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">رقم اللوحة السعودية (مثال: أ ب ج 1234):</label>
                  <input
                    type="text"
                    required
                    placeholder="ط ك ل 4421"
                    value={newTruck.plate}
                    onChange={e => setNewTruck({ ...newTruck, plate: e.target.value })}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md"
                  />
                  {newTruck.plate && (
                    <div className="text-[11px] text-stone-500 mt-1 font-mono">
                      اللوحة المطبّعة (normalizedPlate): {normalizePlate(newTruck.plate)}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">الوزن الفارغ (كجم):</label>
                    <input
                      type="number"
                      required
                      value={newTruck.tareKg}
                      onChange={e => setNewTruck({ ...newTruck, tareKg: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">الوزن الإجمالي (كجم):</label>
                    <input
                      type="number"
                      required
                      value={newTruck.grossKg}
                      onChange={e => setNewTruck({ ...newTruck, grossKg: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
                    />
                  </div>
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateModal({ isOpen: false, entityType: 'TRUCK' })}
                    className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded"
                  >
                    {t("shared.actions.cancel")}</button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded"
                  >
                    {t("other.labels.saveTruck")}</button>
                </div>
              </form>
            )}

            {/* Driver Form (Driver -> Carrier) */}
            {createModal.entityType === 'DRIVER' && (
              <form onSubmit={handleCreateDriver} className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">الناقل التابع له (Driver → Carrier):</label>
                  <select
                    required
                    value={newDriver.carrierId}
                    onChange={e => setNewDriver({ ...newDriver, carrierId: e.target.value })}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-bold"
                  >
                    <option value="">{t("other.labels.carrier_10")}</option>
                    {overview?.allCarriers.map(c => (
                      <option key={c.carrierId} value={c.carrierId}>
                        {c.name || c.companyNameAr} ({c.carrierId})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">{t("other.labels.driver_6")}</label>
                  <input
                    type="text"
                    required
                    placeholder="DRV-303"
                    value={newDriver.driverId}
                    onChange={e => setNewDriver({ ...newDriver, driverId: e.target.value })}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">اسم السائق الثلاثي بالعربية:</label>
                  <input
                    type="text"
                    required
                    placeholder="سلطان عبد الرحمن الدوسري"
                    value={newDriver.name}
                    onChange={e => setNewDriver({ ...newDriver, name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md"
                  />
                  {newDriver.name && (
                    <div className="text-[11px] text-stone-500 mt-1 font-mono">
                      الاسم المطبّع (normalizedName): {normalizeName(newDriver.name)}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">رقم الهوية الوطنية أو الإقامة (10 أرقام):</label>
                  <input
                    type="text"
                    required
                    pattern="[1-2][0-9]{9}"
                    placeholder="1076543210"
                    value={newDriver.idNumber}
                    onChange={e => setNewDriver({ ...newDriver, idNumber: e.target.value })}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">رقم الجوال السعودي (05xxxxxxxx):</label>
                  <input
                    type="text"
                    required
                    placeholder="0559876543"
                    value={newDriver.phone}
                    onChange={e => setNewDriver({ ...newDriver, phone: e.target.value })}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-md font-mono"
                  />
                  {newDriver.phone && (
                    <div className="text-[11px] text-stone-500 mt-1 font-mono">
                      الجوال المطبّع: {normalizePhone(newDriver.phone)}
                    </div>
                  )}
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateModal({ isOpen: false, entityType: 'DRIVER' })}
                    className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded"
                  >
                    {t("shared.actions.cancel")}</button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded"
                  >
                    {t("other.labels.saveDriver")}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
