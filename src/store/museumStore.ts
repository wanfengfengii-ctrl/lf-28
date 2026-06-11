export { useRoutePlanStore } from './routePlanStore';
export { useValidationImportStore } from './validationImportStore';
export { useDispatchAlertStore } from './dispatchAlertStore';
export { useResourceAllocationStore } from './resourceAllocationStore';
export { useUIStore } from './shared';

import { useRoutePlanStore } from './routePlanStore';
import { useValidationImportStore } from './validationImportStore';
import { useDispatchAlertStore } from './dispatchAlertStore';
import { useResourceAllocationStore } from './resourceAllocationStore';
import { useUIStore } from './shared';

import type {
  Hall,
  Exhibit,
  HallConnection,
  TourPlan,
  TourStop,
  StatsInfo,
  AudienceType,
  PlayOrderMode,
  ValidationCenterReport,
  ImportPreviewData,
  TimeSlot,
  HallCapacity,
  GuideResource,
  AlternativeRoute,
  CongestionAlert,
  DispatchExportData,
  DispatchRecord,
  ResourceOccupancySnapshot,
  AutoDispatchConfig,
  AlertProcessingStatus,
  ResourceType,
} from '@/types';

export interface MuseumState {
  halls: Hall[];
  exhibits: Exhibit[];
  connections: HallConnection[];
  plans: TourPlan[];
  timeSlots: TimeSlot[];
  hallCapacities: HallCapacity[];
  guideResources: GuideResource[];
  alternativeRoutes: AlternativeRoute[];
  congestionAlerts: CongestionAlert[];
  dispatchRecords: DispatchRecord[];
  resourceSnapshots: ResourceOccupancySnapshot[];
  autoDispatchConfig: AutoDispatchConfig;
  activePlanId: string | null;
  playingStopIndex: number | null;
  isPlaying: boolean;
  playOrderMode: PlayOrderMode;
  recommendedStops: TourStop[] | null;
  importPreview: ImportPreviewData | null;
  confirmModal: { open: boolean; title: string; message: string; onConfirm: () => void } | null;

  addHall: (hall: Omit<Hall, 'id'>) => void;
  updateHall: (id: string, updates: Partial<Hall>) => void;
  removeHall: (id: string) => void;

  addExhibit: (exhibit: Omit<Exhibit, 'id'>) => void;
  updateExhibit: (id: string, updates: Partial<Exhibit>) => void;
  removeExhibit: (id: string) => void;

  addConnection: (conn: Omit<HallConnection, 'id'>) => void;
  removeConnection: (id: string) => void;
  updateConnectionPriority: (id: string, priority: number) => void;

  createPlan: (name: string, audienceType: AudienceType) => void;
  deletePlan: (id: string) => void;
  duplicatePlan: (id: string) => void;
  setActivePlan: (id: string) => void;
  updatePlanName: (id: string, name: string) => void;
  updatePlanAudienceType: (id: string, audienceType: AudienceType) => void;

  addStopToPlan: (planId: string, exhibitId: string) => void;
  removeStopFromPlan: (planId: string, stopId: string) => void;
  reorderStops: (planId: string, stops: TourStop[]) => void;
  updateStopDuration: (planId: string, stopId: string, duration: number) => void;

  setPlayingStopIndex: (index: number | null) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;

  showConfirmModal: (title: string, message: string, onConfirm: () => void) => void;
  closeConfirmModal: () => void;

  setPlayOrderMode: (mode: PlayOrderMode) => void;
  generateAndApplyRecommendedRoute: () => boolean;
  generateRecommendedRouteOnly: () => TourStop[] | null;
  clearRecommendedRoute: () => void;
  getEffectiveStops: () => TourStop[];

  getStats: () => StatsInfo;
  getActivePlan: () => TourPlan | undefined;
  getValidationReport: () => ValidationCenterReport | null;

  setImportPreview: (preview: ImportPreviewData | null) => void;
  previewImportConfig: (json: string) => ImportPreviewData | null;
  confirmImportAndOverride: () => { success: boolean; errors: string[] };
  cancelImport: () => void;

  exportConfig: () => string;
  importConfig: (json: string) => { success: boolean; errors: string[] };

  addTimeSlot: (slot: Omit<TimeSlot, 'id'>) => void;
  updateTimeSlot: (id: string, updates: Partial<TimeSlot>) => void;
  removeTimeSlot: (id: string) => void;

  updateHallCapacity: (hallId: string, updates: Partial<HallCapacity>) => void;
  updateHallVisitors: (hallId: string, visitors: number) => void;

  addGuideResource: (resource: Omit<GuideResource, 'id'>) => void;
  updateGuideResource: (id: string, updates: Partial<GuideResource>) => void;
  removeGuideResource: (id: string) => void;
  assignResource: (resourceId: string, planId: string, timeSlotId: string) => void;
  unassignResource: (resourceId: string) => void;

  addAlternativeRoute: (route: Omit<AlternativeRoute, 'id' | 'createdAt'>) => void;
  updateAlternativeRoute: (id: string, updates: Partial<AlternativeRoute>) => void;
  removeAlternativeRoute: (id: string) => void;

  addCongestionAlert: (alert: Omit<CongestionAlert, 'id' | 'timestamp'>) => void;
  resolveCongestionAlert: (id: string) => void;
  removeCongestionAlert: (id: string) => void;
  updateAlertProcessingStatus: (id: string, status: AlertProcessingStatus) => void;
  setAlertRecommendedRoute: (alertId: string, routeId: string | null) => void;

  addDispatchRecord: (record: Omit<DispatchRecord, 'id' | 'timestamp'>) => DispatchRecord | null;
  removeDispatchRecord: (id: string) => void;

  addResourceSnapshot: (snapshot: Omit<ResourceOccupancySnapshot, 'id' | 'timestamp'>) => void;
  captureResourceSnapshot: (resourceType: ResourceType) => void;

  updateAutoDispatchConfig: (config: Partial<AutoDispatchConfig>) => void;

  checkAndGenerateCongestionAlerts: () => void;

  autoProcessAlert: (alertId: string) => boolean;
  recommendRouteForAlert: (alertId: string) => AlternativeRoute | null;
  autoDispatchResources: (alertId: string) => DispatchRecord[];
  executeAutoDispatchWorkflow: (alertId: string) => void;

  exportDispatchPlan: () => DispatchExportData;
}

export function getMuseumState(): MuseumState {
  const rp = useRoutePlanStore.getState();
  const vi = useValidationImportStore.getState();
  const da = useDispatchAlertStore.getState();
  const ra = useResourceAllocationStore.getState();
  const ui = useUIStore.getState();

  return {
    halls: rp.halls,
    exhibits: rp.exhibits,
    connections: rp.connections,
    plans: rp.plans,
    activePlanId: rp.activePlanId,
    playingStopIndex: rp.playingStopIndex,
    isPlaying: rp.isPlaying,
    playOrderMode: rp.playOrderMode,
    recommendedStops: rp.recommendedStops,

    importPreview: vi.importPreview,

    timeSlots: da.timeSlots,
    hallCapacities: da.hallCapacities,
    congestionAlerts: da.congestionAlerts,
    dispatchRecords: da.dispatchRecords,
    alternativeRoutes: da.alternativeRoutes,
    autoDispatchConfig: da.autoDispatchConfig,

    guideResources: ra.guideResources,
    resourceSnapshots: ra.resourceSnapshots,

    confirmModal: ui.confirmModal,

    addHall: rp.addHall,
    updateHall: rp.updateHall,
    removeHall: rp.removeHall,

    addExhibit: rp.addExhibit,
    updateExhibit: rp.updateExhibit,
    removeExhibit: rp.removeExhibit,

    addConnection: rp.addConnection,
    removeConnection: rp.removeConnection,
    updateConnectionPriority: rp.updateConnectionPriority,

    createPlan: rp.createPlan,
    deletePlan: rp.deletePlan,
    duplicatePlan: rp.duplicatePlan,
    setActivePlan: rp.setActivePlan,
    updatePlanName: rp.updatePlanName,
    updatePlanAudienceType: rp.updatePlanAudienceType,

    addStopToPlan: rp.addStopToPlan,
    removeStopFromPlan: rp.removeStopFromPlan,
    reorderStops: rp.reorderStops,
    updateStopDuration: rp.updateStopDuration,

    setPlayingStopIndex: rp.setPlayingStopIndex,
    setIsPlaying: rp.setIsPlaying,
    togglePlay: rp.togglePlay,

    showConfirmModal: ui.showConfirmModal,
    closeConfirmModal: ui.closeConfirmModal,

    setPlayOrderMode: rp.setPlayOrderMode,
    generateAndApplyRecommendedRoute: rp.generateAndApplyRecommendedRoute,
    generateRecommendedRouteOnly: rp.generateRecommendedRouteOnly,
    clearRecommendedRoute: rp.clearRecommendedRoute,
    getEffectiveStops: rp.getEffectiveStops,

    getStats: rp.getStats,
    getActivePlan: rp.getActivePlan,
    getValidationReport: rp.getValidationReport,

    setImportPreview: vi.setImportPreview,
    previewImportConfig: vi.previewImportConfig,
    confirmImportAndOverride: vi.confirmImportAndOverride,
    cancelImport: vi.cancelImport,

    exportConfig: vi.exportConfig,
    importConfig: vi.importConfig,

    addTimeSlot: da.addTimeSlot,
    updateTimeSlot: da.updateTimeSlot,
    removeTimeSlot: da.removeTimeSlot,

    updateHallCapacity: da.updateHallCapacity,
    updateHallVisitors: da.updateHallVisitors,

    addGuideResource: ra.addGuideResource,
    updateGuideResource: ra.updateGuideResource,
    removeGuideResource: ra.removeGuideResource,
    assignResource: ra.assignResource,
    unassignResource: ra.unassignResource,

    addAlternativeRoute: da.addAlternativeRoute,
    updateAlternativeRoute: da.updateAlternativeRoute,
    removeAlternativeRoute: da.removeAlternativeRoute,

    addCongestionAlert: da.addCongestionAlert,
    resolveCongestionAlert: da.resolveCongestionAlert,
    removeCongestionAlert: da.removeCongestionAlert,
    updateAlertProcessingStatus: da.updateAlertProcessingStatus,
    setAlertRecommendedRoute: da.setAlertRecommendedRoute,

    addDispatchRecord: da.addDispatchRecord,
    removeDispatchRecord: da.removeDispatchRecord,

    addResourceSnapshot: ra.addResourceSnapshot,
    captureResourceSnapshot: ra.captureResourceSnapshot,

    updateAutoDispatchConfig: da.updateAutoDispatchConfig,

    checkAndGenerateCongestionAlerts: da.checkAndGenerateCongestionAlerts,

    autoProcessAlert: da.autoProcessAlert,
    recommendRouteForAlert: da.recommendRouteForAlert,
    autoDispatchResources: da.autoDispatchResources,
    executeAutoDispatchWorkflow: da.executeAutoDispatchWorkflow,

    exportDispatchPlan: da.exportDispatchPlan,
  };
}
