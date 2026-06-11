import { create } from 'zustand';
import type {
  TimeSlot,
  HallCapacity,
  CongestionAlert,
  DispatchRecord,
  AlternativeRoute,
  AutoDispatchConfig,
  AlertProcessingStatus,
  DispatchExportData,
  ResourceType,
} from '@/types';
import {
  initialTimeSlots,
  initialHallCapacities,
  initialCongestionAlerts,
  initialDispatchRecords,
  initialAlternativeRoutes,
  initialAutoDispatchConfig,
} from '@/utils/mockData';
import { uid, loadStorageSlice, saveStorageSlice } from './shared';
import { useRoutePlanStore } from './routePlanStore';
import { useResourceAllocationStore } from './resourceAllocationStore';

const DISPATCH_ALERT_KEYS = [
  'timeSlots', 'hallCapacities', 'congestionAlerts',
  'dispatchRecords', 'alternativeRoutes', 'autoDispatchConfig',
] as const;

type DispatchAlertSlice = Pick<DispatchAlertState,
  'timeSlots' | 'hallCapacities' | 'congestionAlerts' |
  'dispatchRecords' | 'alternativeRoutes' | 'autoDispatchConfig'
>;

interface DispatchAlertState {
  timeSlots: TimeSlot[];
  hallCapacities: HallCapacity[];
  congestionAlerts: CongestionAlert[];
  dispatchRecords: DispatchRecord[];
  alternativeRoutes: AlternativeRoute[];
  autoDispatchConfig: AutoDispatchConfig;

  addTimeSlot: (slot: Omit<TimeSlot, 'id'>) => void;
  updateTimeSlot: (id: string, updates: Partial<TimeSlot>) => void;
  removeTimeSlot: (id: string) => void;

  updateHallCapacity: (hallId: string, updates: Partial<HallCapacity>) => void;
  updateHallVisitors: (hallId: string, visitors: number) => void;

  addCongestionAlert: (alert: Omit<CongestionAlert, 'id' | 'timestamp'>) => void;
  resolveCongestionAlert: (id: string) => void;
  removeCongestionAlert: (id: string) => void;
  updateAlertProcessingStatus: (id: string, status: AlertProcessingStatus) => void;
  setAlertRecommendedRoute: (alertId: string, routeId: string | null) => void;

  addDispatchRecord: (record: Omit<DispatchRecord, 'id' | 'timestamp'>) => DispatchRecord | null;
  removeDispatchRecord: (id: string) => void;

  addAlternativeRoute: (route: Omit<AlternativeRoute, 'id' | 'createdAt'>) => void;
  updateAlternativeRoute: (id: string, updates: Partial<AlternativeRoute>) => void;
  removeAlternativeRoute: (id: string) => void;

  updateAutoDispatchConfig: (config: Partial<AutoDispatchConfig>) => void;

  checkAndGenerateCongestionAlerts: () => void;

  autoProcessAlert: (alertId: string) => boolean;
  recommendRouteForAlert: (alertId: string) => AlternativeRoute | null;
  autoDispatchResources: (alertId: string) => DispatchRecord[];
  executeAutoDispatchWorkflow: (alertId: string) => void;

  exportDispatchPlan: () => DispatchExportData;
}

export const useDispatchAlertStore = create<DispatchAlertState>((set, get) => {
  const stored = loadStorageSlice<DispatchAlertSlice>([...DISPATCH_ALERT_KEYS]);
  const initial = stored || {
    timeSlots: initialTimeSlots,
    hallCapacities: initialHallCapacities,
    congestionAlerts: initialCongestionAlerts,
    dispatchRecords: initialDispatchRecords,
    alternativeRoutes: initialAlternativeRoutes,
    autoDispatchConfig: initialAutoDispatchConfig,
  };

  function persist(s: DispatchAlertState) {
    saveStorageSlice({
      timeSlots: s.timeSlots,
      hallCapacities: s.hallCapacities,
      congestionAlerts: s.congestionAlerts,
      dispatchRecords: s.dispatchRecords,
      alternativeRoutes: s.alternativeRoutes,
      autoDispatchConfig: s.autoDispatchConfig,
    });
  }

  return {
    ...initial,

    addTimeSlot: (slot) => {
      const newSlot: TimeSlot = { ...slot, id: uid() };
      set((s) => {
        const timeSlots = [...s.timeSlots, newSlot].sort((a, b) => a.startTime.localeCompare(b.startTime));
        persist({ ...s, timeSlots });
        return { timeSlots };
      });
    },
    updateTimeSlot: (id, updates) => {
      set((s) => {
        const timeSlots = s.timeSlots.map((t) => (t.id === id ? { ...t, ...updates } : t));
        persist({ ...s, timeSlots });
        return { timeSlots };
      });
    },
    removeTimeSlot: (id) => {
      set((s) => {
        const timeSlots = s.timeSlots.filter((t) => t.id !== id);
        persist({ ...s, timeSlots });
        return { timeSlots };
      });
      const { guideResources } = useResourceAllocationStore.getState();
      const updatedResources = guideResources.map((r) =>
        r.assignedTimeSlotId === id ? { ...r, assignedTimeSlotId: null, status: 'available' as const } : r
      );
      useResourceAllocationStore.setState({ guideResources: updatedResources });
    },

    updateHallCapacity: (hallId, updates) => {
      set((s) => {
        let hallCapacities = s.hallCapacities.map((h) =>
          h.hallId === hallId ? { ...h, ...updates } : h
        );
        if (!hallCapacities.some((h) => h.hallId === hallId)) {
          hallCapacities = [
            ...hallCapacities,
            { hallId, maxCapacity: 50, currentVisitors: 0, warningThreshold: 38, criticalThreshold: 45, status: 'normal', ...updates } as HallCapacity,
          ];
        }
        persist({ ...s, hallCapacities });
        return { hallCapacities };
      });
    },
    updateHallVisitors: (hallId, visitors) => {
      const s = get();
      const cap = s.hallCapacities.find((h) => h.hallId === hallId);
      if (!cap) {
        get().updateHallCapacity(hallId, { currentVisitors: visitors, status: 'normal' });
        return;
      }
      let status: HallCapacity['status'] = 'normal';
      if (visitors >= cap.criticalThreshold) status = 'critical';
      else if (visitors >= cap.warningThreshold) status = 'warning';
      set((state) => {
        const hallCapacities = state.hallCapacities.map((h) =>
          h.hallId === hallId ? { ...h, currentVisitors: visitors, status } : h
        );
        persist({ ...state, hallCapacities });
        return { hallCapacities };
      });
      get().checkAndGenerateCongestionAlerts();
    },

    addCongestionAlert: (alert) => {
      const newAlert: CongestionAlert = {
        ...alert,
        id: uid(),
        timestamp: Date.now(),
        processingStatus: alert.processingStatus || 'pending',
        recommendedRouteId: alert.recommendedRouteId || null,
        dispatchRecordIds: alert.dispatchRecordIds || [],
        processedAt: alert.processedAt || null,
        handledBy: alert.handledBy || null,
      };
      set((s) => {
        const congestionAlerts = [newAlert, ...s.congestionAlerts];
        persist({ ...s, congestionAlerts });
        return { congestionAlerts };
      });
      if (get().autoDispatchConfig.enabled) {
        const config = get().autoDispatchConfig;
        const shouldAutoProcess =
          (newAlert.level === 'critical' && config.autoTriggerCritical) ||
          (newAlert.level === 'warning' && config.autoTriggerWarning);
        if (shouldAutoProcess) {
          setTimeout(() => get().executeAutoDispatchWorkflow(newAlert.id), 100);
        }
      }
    },
    resolveCongestionAlert: (id) => {
      set((s) => {
        const congestionAlerts = s.congestionAlerts.map((a) =>
          a.id === id ? { ...a, resolved: true, processingStatus: 'resolved' as const, processedAt: Date.now() } : a
        );
        persist({ ...s, congestionAlerts });
        return { congestionAlerts };
      });
    },
    removeCongestionAlert: (id) => {
      set((s) => {
        const congestionAlerts = s.congestionAlerts.filter((a) => a.id !== id);
        persist({ ...s, congestionAlerts });
        return { congestionAlerts };
      });
    },
    updateAlertProcessingStatus: (id, status) => {
      set((s) => {
        const congestionAlerts = s.congestionAlerts.map((a) =>
          a.id === id ? { ...a, processingStatus: status, processedAt: status === 'resolved' ? Date.now() : a.processedAt } : a
        );
        persist({ ...s, congestionAlerts });
        return { congestionAlerts };
      });
    },
    setAlertRecommendedRoute: (alertId, routeId) => {
      set((s) => {
        const congestionAlerts = s.congestionAlerts.map((a) =>
          a.id === alertId ? { ...a, recommendedRouteId: routeId } : a
        );
        persist({ ...s, congestionAlerts });
        return { congestionAlerts };
      });
    },

    addDispatchRecord: (record) => {
      const newRecord: DispatchRecord = { ...record, id: uid(), timestamp: Date.now() };
      set((s) => {
        const dispatchRecords = [newRecord, ...s.dispatchRecords];
        let congestionAlerts = s.congestionAlerts;
        if (newRecord.alertId) {
          congestionAlerts = s.congestionAlerts.map((a) =>
            a.id === newRecord.alertId
              ? { ...a, dispatchRecordIds: [...a.dispatchRecordIds, newRecord.id] }
              : a
          );
        }
        persist({ ...s, dispatchRecords, congestionAlerts });
        return { dispatchRecords, congestionAlerts };
      });
      return newRecord;
    },
    removeDispatchRecord: (id) => {
      set((s) => {
        const dispatchRecords = s.dispatchRecords.filter((r) => r.id !== id);
        const congestionAlerts = s.congestionAlerts.map((a) => ({
          ...a,
          dispatchRecordIds: a.dispatchRecordIds.filter((rid) => rid !== id),
        }));
        persist({ ...s, dispatchRecords, congestionAlerts });
        return { dispatchRecords, congestionAlerts };
      });
    },

    addAlternativeRoute: (route) => {
      const newRoute: AlternativeRoute = { ...route, id: uid(), createdAt: Date.now() };
      set((s) => {
        const alternativeRoutes = [...s.alternativeRoutes, newRoute];
        persist({ ...s, alternativeRoutes });
        return { alternativeRoutes };
      });
    },
    updateAlternativeRoute: (id, updates) => {
      set((s) => {
        const alternativeRoutes = s.alternativeRoutes.map((r) =>
          r.id === id ? { ...r, ...updates } : r
        );
        persist({ ...s, alternativeRoutes });
        return { alternativeRoutes };
      });
    },
    removeAlternativeRoute: (id) => {
      set((s) => {
        const alternativeRoutes = s.alternativeRoutes.filter((r) => r.id !== id);
        persist({ ...s, alternativeRoutes });
        return { alternativeRoutes };
      });
    },

    updateAutoDispatchConfig: (config) => {
      set((s) => {
        const autoDispatchConfig = { ...s.autoDispatchConfig, ...config };
        persist({ ...s, autoDispatchConfig });
        return { autoDispatchConfig };
      });
    },

    checkAndGenerateCongestionAlerts: () => {
      const s = get();
      const { halls } = useRoutePlanStore.getState();
      const existingUnresolved = new Set(
        s.congestionAlerts.filter((a) => !a.resolved).map((a) => a.hallId)
      );
      for (const cap of s.hallCapacities) {
        const hall = halls.find((h) => h.id === cap.hallId);
        const hallName = hall?.name || '未知展厅';
        if (cap.status === 'critical' && !existingUnresolved.has(cap.hallId)) {
          get().addCongestionAlert({
            hallId: cap.hallId,
            level: 'critical',
            message: `${hallName}当前人数接近最大容纳量(${cap.currentVisitors}/${cap.maxCapacity})，存在严重拥堵风险`,
            resolved: false,
            suggestions: ['引导观众先参观其他展厅', '增加该区域志愿者', '启动替代导览路线'],
            processingStatus: 'pending',
            recommendedRouteId: null,
            dispatchRecordIds: [],
            processedAt: null,
            handledBy: null,
          });
        } else if (cap.status === 'warning' && !existingUnresolved.has(cap.hallId)) {
          get().addCongestionAlert({
            hallId: cap.hallId,
            level: 'warning',
            message: `${hallName}人流量较高(${cap.currentVisitors}/${cap.maxCapacity})，请关注后续变化`,
            resolved: false,
            suggestions: ['准备分流预案', '提醒讲解员控制参观节奏'],
            processingStatus: 'pending',
            recommendedRouteId: null,
            dispatchRecordIds: [],
            processedAt: null,
            handledBy: null,
          });
        }
      }
    },

    autoProcessAlert: (alertId) => {
      const s = get();
      const alert = s.congestionAlerts.find((a) => a.id === alertId);
      if (!alert || alert.resolved) return false;
      s.updateAlertProcessingStatus(alertId, 'auto_processing');
      try {
        if (s.autoDispatchConfig.autoRecommendRoute) {
          s.recommendRouteForAlert(alertId);
        }
        s.autoDispatchResources(alertId);
        const updated = s.congestionAlerts.find((a) => a.id === alertId);
        if (updated) {
          if (updated.recommendedRouteId && updated.dispatchRecordIds.length > 0) {
            s.updateAlertProcessingStatus(alertId, 'resources_dispatched');
          } else if (updated.recommendedRouteId) {
            s.updateAlertProcessingStatus(alertId, 'route_recommended');
          }
        }
        return true;
      } catch {
        s.updateAlertProcessingStatus(alertId, 'pending');
        return false;
      }
    },

    recommendRouteForAlert: (alertId) => {
      const s = get();
      const alert = s.congestionAlerts.find((a) => a.id === alertId);
      if (!alert) return null;
      const { exhibits, halls } = useRoutePlanStore.getState();
      const hallExhibitIds = exhibits
        .filter((e) => e.hallId === alert.hallId)
        .map((e) => e.id);
      const matchingRoutes = s.alternativeRoutes.filter((route) => {
        const routeExhibits = route.stopIds;
        const avoidsCongestedHall = !routeExhibits.some((id) => hallExhibitIds.includes(id));
        return avoidsCongestedHall;
      });
      if (matchingRoutes.length > 0) {
        const route = matchingRoutes[0];
        s.setAlertRecommendedRoute(alertId, route.id);
        s.addDispatchRecord({
          alertId,
          hallId: alert.hallId,
          actionType: 'recommend_route',
          resourceId: null,
          resourceType: null,
          routeId: route.id,
          timeSlotId: null,
          description: `${halls.find((h) => h.id === alert.hallId)?.name || '展厅'}拥堵，自动推荐替代路线"${route.name}"`,
          operator: 'system',
          result: 'success',
        });
        return route;
      }
      return null;
    },

    autoDispatchResources: (alertId) => {
      const s = get();
      const alert = s.congestionAlerts.find((a) => a.id === alertId);
      if (!alert) return [];
      const config = s.autoDispatchConfig;
      const cap = s.hallCapacities.find((c) => c.hallId === alert.hallId);
      const usagePercent = cap && cap.maxCapacity > 0 ? (cap.currentVisitors / cap.maxCapacity) * 100 : 0;
      const ongoingSlot = s.timeSlots.find((t) => t.status === 'ongoing');
      const timeSlotId = ongoingSlot?.id || s.timeSlots[0]?.id || null;
      const { plans, halls } = useRoutePlanStore.getState();
      const { guideResources, assignResource, captureResourceSnapshot } = useResourceAllocationStore.getState();
      const firstPlan = plans[0];
      const dispatched: DispatchRecord[] = [];

      if (config.autoAssignVolunteer && usagePercent >= config.volunteerDispatchThreshold) {
        const availableVolunteer = guideResources.find((r) => r.type === 'volunteer' && r.status === 'available');
        if (availableVolunteer && firstPlan && timeSlotId) {
          assignResource(availableVolunteer.id, firstPlan.id, timeSlotId);
          const record = s.addDispatchRecord({
            alertId,
            hallId: alert.hallId,
            actionType: 'auto_assign_volunteer',
            resourceId: availableVolunteer.id,
            resourceType: 'volunteer',
            routeId: null,
            timeSlotId,
            description: `${halls.find((h) => h.id === alert.hallId)?.name || '展厅'}拥堵，自动分配志愿者"${availableVolunteer.name}"前往支援`,
            operator: 'system',
            result: 'success',
          });
          if (record) dispatched.push(record);
          captureResourceSnapshot('volunteer');
        }
      }

      if (config.autoAssignGuide && usagePercent >= config.guideDispatchThreshold) {
        const availableGuide = guideResources.find((r) => r.type === 'guide' && r.status === 'available');
        if (availableGuide && firstPlan && timeSlotId) {
          assignResource(availableGuide.id, firstPlan.id, timeSlotId);
          const record = s.addDispatchRecord({
            alertId,
            hallId: alert.hallId,
            actionType: 'auto_assign_guide',
            resourceId: availableGuide.id,
            resourceType: 'guide',
            routeId: null,
            timeSlotId,
            description: `${halls.find((h) => h.id === alert.hallId)?.name || '展厅'}严重拥堵，自动调配讲解员"${availableGuide.name}"协助疏导`,
            operator: 'system',
            result: 'success',
          });
          if (record) dispatched.push(record);
          captureResourceSnapshot('guide');
        }
      }

      if (config.autoAssignAudioDevice && usagePercent >= config.audioDeviceDispatchThreshold) {
        const availableAudio = guideResources.find((r) => r.type === 'audio_device' && r.status === 'available');
        if (availableAudio && firstPlan && timeSlotId) {
          assignResource(availableAudio.id, firstPlan.id, timeSlotId);
          const record = s.addDispatchRecord({
            alertId,
            hallId: alert.hallId,
            actionType: 'auto_assign_audio',
            resourceId: availableAudio.id,
            resourceType: 'audio_device',
            routeId: null,
            timeSlotId,
            description: `${halls.find((h) => h.id === alert.hallId)?.name || '展厅'}人流集中，投放语音设备"${availableAudio.name}"支持自助导览`,
            operator: 'system',
            result: 'success',
          });
          if (record) dispatched.push(record);
          captureResourceSnapshot('audio_device');
        }
      }

      return dispatched;
    },

    executeAutoDispatchWorkflow: (alertId) => {
      const s = get();
      const { halls } = useRoutePlanStore.getState();
      const alert = s.congestionAlerts.find((a) => a.id === alertId);
      if (!alert || alert.resolved) return;
      s.addDispatchRecord({
        alertId,
        hallId: alert.hallId,
        actionType: 'auto_trigger',
        resourceId: null,
        resourceType: null,
        routeId: null,
        timeSlotId: null,
        description: `检测到${halls.find((h) => h.id === alert.hallId)?.name || '展厅'}${alert.level === 'critical' ? '严重拥堵' : '人流量预警'}，启动自动调度流程`,
        operator: 'system',
        result: 'success',
      });
      s.autoProcessAlert(alertId);
    },

    exportDispatchPlan: () => {
      const s = get();
      const { halls, plans } = useRoutePlanStore.getState();
      const { guideResources } = useResourceAllocationStore.getState();
      const totalExpectedVisitors = s.timeSlots.reduce((sum, t) => sum + t.expectedVisitors, 0);
      const totalActualVisitors = s.timeSlots.reduce((sum, t) => sum + t.actualVisitors, 0);
      const pendingAlerts = s.congestionAlerts.filter((a) => !a.resolved && (a.processingStatus === 'pending' || a.processingStatus === 'auto_processing')).length;
      const autoProcessedAlerts = s.congestionAlerts.filter((a) => a.handledBy === 'system').length;
      const resolvedAlerts = s.congestionAlerts.filter((a) => a.resolved).length;
      const totalDispatches = s.dispatchRecords.length;
      const autoDispatches = s.dispatchRecords.filter((r) => r.operator === 'system').length;
      return {
        exportedAt: Date.now(),
        date: new Date().toISOString().split('T')[0],
        timeSlots: s.timeSlots,
        hallCapacities: s.hallCapacities.map((c) => ({
          ...c,
          hallName: halls.find((h) => h.id === c.hallId)?.name || c.hallId,
        })),
        resources: guideResources,
        alternativeRoutes: s.alternativeRoutes,
        alerts: s.congestionAlerts,
        dispatchRecords: s.dispatchRecords,
        resourceSnapshots: useResourceAllocationStore.getState().resourceSnapshots,
        autoDispatchConfig: s.autoDispatchConfig,
        summary: {
          totalExpectedVisitors,
          totalActualVisitors,
          normalHalls: s.hallCapacities.filter((h) => h.status === 'normal').length,
          warningHalls: s.hallCapacities.filter((h) => h.status === 'warning').length,
          criticalHalls: s.hallCapacities.filter((h) => h.status === 'critical').length,
          availableResources: guideResources.filter((r) => r.status === 'available').length,
          activeAlerts: s.congestionAlerts.filter((a) => !a.resolved).length,
          pendingAlerts,
          autoProcessedAlerts,
          resolvedAlerts,
          totalDispatches,
          autoDispatches,
        },
      };
    },
  };
});
