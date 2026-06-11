import { create } from 'zustand';
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
  RouteConfig,
} from '@/types';
import { initialHalls, initialExhibits, initialConnections, initialPlans } from '@/utils/mockData';
import {
  computeStats,
  validateImportConfig,
  generateRecommendedRoute,
  generateValidationCenterReport,
  generateImportPreviewData,
} from '@/utils/validation';

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const STORAGE_KEY = 'museum-guide-config';

function loadFromStorage(): { halls: Hall[]; exhibits: Exhibit[]; connections: HallConnection[]; plans: TourPlan[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore parse errors
  }
  return null;
}

function saveToStorage(state: MuseumState) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        halls: state.halls,
        exhibits: state.exhibits,
        connections: state.connections,
        plans: state.plans,
      })
    );
  } catch {
    // ignore storage errors
  }
}

interface MuseumState {
  halls: Hall[];
  exhibits: Exhibit[];
  connections: HallConnection[];
  plans: TourPlan[];
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
}

export const useMuseumStore = create<MuseumState>((set, get) => {
  const stored = loadFromStorage();
  const initial = stored || {
    halls: initialHalls,
    exhibits: initialExhibits,
    connections: initialConnections,
    plans: initialPlans,
  };

  return {
    ...initial,
    activePlanId: initial.plans[0]?.id || null,
    playingStopIndex: null,
    isPlaying: false,
    playOrderMode: 'edit',
    recommendedStops: null,
    importPreview: null,
    confirmModal: null,

    addHall: (hall) => {
      const newHall: Hall = { ...hall, id: uid() };
      set((s) => {
        const halls = [...s.halls, newHall];
        saveToStorage({ ...s, halls });
        return { halls };
      });
    },
    updateHall: (id, updates) => {
      set((s) => {
        const halls = s.halls.map((h) => (h.id === id ? { ...h, ...updates } : h));
        saveToStorage({ ...s, halls });
        return { halls };
      });
    },
    removeHall: (id) => {
      set((s) => {
        const halls = s.halls.filter((h) => h.id !== id);
        const exhibits = s.exhibits.filter((e) => e.hallId !== id);
        const connections = s.connections.filter(
          (c) => c.fromHallId !== id && c.toHallId !== id
        );
        const plans = s.plans.map((p) => ({
          ...p,
          stops: p.stops.filter((st) => !exhibits.some((e) => e.id === st.exhibitId)),
        }));
        saveToStorage({ ...s, halls, exhibits, connections, plans });
        return { halls, exhibits, connections, plans };
      });
    },

    addExhibit: (exhibit) => {
      const newExhibit: Exhibit = { ...exhibit, id: uid() };
      set((s) => {
        const exhibits = [...s.exhibits, newExhibit];
        saveToStorage({ ...s, exhibits });
        return { exhibits };
      });
    },
    updateExhibit: (id, updates) => {
      set((s) => {
        const exhibits = s.exhibits.map((e) => (e.id === id ? { ...e, ...updates } : e));
        saveToStorage({ ...s, exhibits });
        return { exhibits };
      });
    },
    removeExhibit: (id) => {
      const state = get();
      const referencedPlans = state.plans.filter((p) =>
        p.stops.some((s) => s.exhibitId === id)
      );
      if (referencedPlans.length > 0) {
        const names = referencedPlans.map((p) => p.name).join('、');
        get().showConfirmModal(
          '删除展品',
          `该展品已被方案"${names}"引用，确定要删除吗？删除后相关方案中的停靠点也将移除。`,
          () => {
            set((s) => {
              const exhibits = s.exhibits.filter((e) => e.id !== id);
              const plans = s.plans.map((p) => ({
                ...p,
                stops: p.stops.filter((st) => st.exhibitId !== id),
              }));
              saveToStorage({ ...s, exhibits, plans });
              return { exhibits, plans, confirmModal: null };
            });
          }
        );
      } else {
        set((s) => {
          const exhibits = s.exhibits.filter((e) => e.id !== id);
          saveToStorage({ ...s, exhibits });
          return { exhibits };
        });
      }
    },

    addConnection: (conn) => {
      const newConn: HallConnection = { ...conn, id: uid() };
      set((s) => {
        const connections = [...s.connections, newConn];
        saveToStorage({ ...s, connections });
        return { connections };
      });
    },
    removeConnection: (id) => {
      set((s) => {
        const connections = s.connections.filter((c) => c.id !== id);
        saveToStorage({ ...s, connections });
        return { connections };
      });
    },
    updateConnectionPriority: (id, priority) => {
      set((s) => {
        const connections = s.connections.map((c) =>
          c.id === id ? { ...c, priority } : c
        );
        saveToStorage({ ...s, connections });
        return { connections };
      });
    },

    createPlan: (name, audienceType) => {
      const newPlan: TourPlan = {
        id: uid(),
        name,
        audienceType,
        stops: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      set((s) => {
        const plans = [...s.plans, newPlan];
        saveToStorage({ ...s, plans });
        return { plans, activePlanId: newPlan.id, recommendedStops: null, playOrderMode: 'edit' };
      });
    },
    deletePlan: (id) => {
      set((s) => {
        const plans = s.plans.filter((p) => p.id !== id);
        const activePlanId = s.activePlanId === id ? (plans[0]?.id || null) : s.activePlanId;
        saveToStorage({ ...s, plans, activePlanId });
        return {
          plans,
          activePlanId,
          recommendedStops: s.activePlanId === id ? null : s.recommendedStops,
          playOrderMode: s.activePlanId === id ? 'edit' : s.playOrderMode,
        };
      });
    },
    duplicatePlan: (id) => {
      const state = get();
      const source = state.plans.find((p) => p.id === id);
      if (!source) return;
      const newPlan: TourPlan = {
        ...source,
        id: uid(),
        name: `${source.name} (副本)`,
        stops: source.stops.map((s) => ({ ...s, id: uid() })),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      set((s) => {
        const plans = [...s.plans, newPlan];
        saveToStorage({ ...s, plans });
        return { plans, activePlanId: newPlan.id, recommendedStops: null, playOrderMode: 'edit' };
      });
    },
    setActivePlan: (id) => {
      set({
        activePlanId: id,
        playingStopIndex: null,
        isPlaying: false,
        recommendedStops: null,
        playOrderMode: 'edit',
      });
    },
    updatePlanName: (id, name) => {
      set((s) => {
        const plans = s.plans.map((p) =>
          p.id === id ? { ...p, name, updatedAt: Date.now() } : p
        );
        saveToStorage({ ...s, plans });
        return { plans };
      });
    },
    updatePlanAudienceType: (id, audienceType) => {
      set((s) => {
        const plans = s.plans.map((p) =>
          p.id === id ? { ...p, audienceType, updatedAt: Date.now() } : p
        );
        saveToStorage({ ...s, plans });
        return { plans };
      });
    },

    addStopToPlan: (planId, exhibitId) => {
      const state = get();
      const plan = state.plans.find((p) => p.id === planId);
      const exhibit = state.exhibits.find((e) => e.id === exhibitId);

      if (!plan || !exhibit) return;

      if (plan.stops.some((s) => s.exhibitId === exhibitId)) {
        return;
      }

      if (plan.stops.length > 0) {
        const lastStop = plan.stops[plan.stops.length - 1];
        const lastExhibit = state.exhibits.find((e) => e.id === lastStop.exhibitId);
        if (lastExhibit && lastExhibit.hallId !== exhibit.hallId) {
          const connected = state.connections.some(
            (c) =>
              (c.fromHallId === lastExhibit.hallId && c.toHallId === exhibit.hallId) ||
              (c.fromHallId === exhibit.hallId && c.toHallId === lastExhibit.hallId)
          );
          if (!connected) {
            get().showConfirmModal(
              '路线不连通',
              `从"${lastExhibit.name}"到"${exhibit.name}"的展厅之间没有直接连接，确定要添加吗？`,
              () => {
                set((s) => {
                  const plans = s.plans.map((p) => {
                    if (p.id !== planId) return p;
                    const ex = s.exhibits.find((e) => e.id === exhibitId);
                    const newStop: TourStop = {
                      id: uid(),
                      exhibitId,
                      order: p.stops.length + 1,
                      duration: ex?.defaultDuration || 120,
                    };
                    return { ...p, stops: [...p.stops, newStop], updatedAt: Date.now() };
                  });
                  saveToStorage({ ...s, plans });
                  return { plans, confirmModal: null, recommendedStops: null };
                });
              }
            );
            return;
          }
        }
      }

      set((s) => {
        const plans = s.plans.map((p) => {
          if (p.id !== planId) return p;
          const ex = s.exhibits.find((e) => e.id === exhibitId);
          const newStop: TourStop = {
            id: uid(),
            exhibitId,
            order: p.stops.length + 1,
            duration: ex?.defaultDuration || 120,
          };
          return { ...p, stops: [...p.stops, newStop], updatedAt: Date.now() };
        });
        saveToStorage({ ...s, plans });
        return { plans, recommendedStops: null };
      });
    },
    removeStopFromPlan: (planId, stopId) => {
      set((s) => {
        const plans = s.plans.map((p) => {
          if (p.id !== planId) return p;
          const stops = p.stops
            .filter((st) => st.id !== stopId)
            .map((st, i) => ({ ...st, order: i + 1 }));
          return { ...p, stops, updatedAt: Date.now() };
        });
        saveToStorage({ ...s, plans });
        return { plans, recommendedStops: null };
      });
    },
    reorderStops: (planId, stops) => {
      set((s) => {
        const plans = s.plans.map((p) => {
          if (p.id !== planId) return p;
          const reordered = stops.map((st, i) => ({ ...st, order: i + 1 }));
          return { ...p, stops: reordered, updatedAt: Date.now() };
        });
        saveToStorage({ ...s, plans });
        return { plans, recommendedStops: null };
      });
    },
    updateStopDuration: (planId, stopId, duration) => {
      if (duration <= 0) return;
      set((s) => {
        const plans = s.plans.map((p) => {
          if (p.id !== planId) return p;
          const stops = p.stops.map((st) =>
            st.id === stopId ? { ...st, duration } : st
          );
          return { ...p, stops, updatedAt: Date.now() };
        });
        saveToStorage({ ...s, plans });
        return { plans };
      });
    },

    setPlayingStopIndex: (index) => set({ playingStopIndex: index }),
    setIsPlaying: (playing) => set({ isPlaying: playing }),
    togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

    showConfirmModal: (title, message, onConfirm) =>
      set({ confirmModal: { open: true, title, message, onConfirm } }),
    closeConfirmModal: () => set({ confirmModal: null }),

    setPlayOrderMode: (mode) => {
      const s = get();
      if (mode === 'recommended' && !s.recommendedStops) {
        const recommended = s.generateRecommendedRouteOnly();
        set({ playOrderMode: mode, recommendedStops: recommended });
      } else {
        set({ playOrderMode: mode });
      }
    },
    generateAndApplyRecommendedRoute: () => {
      const s = get();
      const plan = s.plans.find((p) => p.id === s.activePlanId);
      if (!plan || plan.stops.length < 2) return false;

      const recommended = generateRecommendedRoute(
        plan.stops,
        s.exhibits,
        s.connections
      );

      set((state) => {
        const plans = state.plans.map((p) => {
          if (p.id !== state.activePlanId) return p;
          const reordered = recommended.map((st, i) => ({ ...st, order: i + 1 }));
          return { ...p, stops: reordered, updatedAt: Date.now() };
        });
        saveToStorage({ ...state, plans });
        return {
          plans,
          recommendedStops: null,
          playOrderMode: 'edit',
        };
      });
      return true;
    },
    generateRecommendedRouteOnly: () => {
      const s = get();
      const plan = s.plans.find((p) => p.id === s.activePlanId);
      if (!plan || plan.stops.length < 2) return null;
      return generateRecommendedRoute(plan.stops, s.exhibits, s.connections);
    },
    clearRecommendedRoute: () => set({ recommendedStops: null, playOrderMode: 'edit' }),
    getEffectiveStops: () => {
      const s = get();
      const plan = s.plans.find((p) => p.id === s.activePlanId);
      if (!plan) return [];
      if (s.playOrderMode === 'recommended' && s.recommendedStops) {
        return s.recommendedStops;
      }
      return plan.stops;
    },

    getStats: () => {
      const s = get();
      const plan = s.plans.find((p) => p.id === s.activePlanId);
      if (!plan) return { totalDuration: 0, duplicateExhibits: [], jumpPoints: [], repeatedPaths: [] };
      return computeStats(plan, s.exhibits, s.halls, s.connections);
    },
    getActivePlan: () => {
      const s = get();
      return s.plans.find((p) => p.id === s.activePlanId);
    },
    getValidationReport: () => {
      const s = get();
      const plan = s.plans.find((p) => p.id === s.activePlanId);
      if (!plan) return null;
      return generateValidationCenterReport(plan, s.exhibits, s.halls, s.connections);
    },

    setImportPreview: (preview) => set({ importPreview: preview }),
    previewImportConfig: (json) => {
      try {
        const config = JSON.parse(json);
        const baseValid = validateImportConfig(config);
        if (!baseValid.valid && baseValid.errors.some((e) =>
          e.includes('缺少展厅') || e.includes('缺少展品') || e.includes('缺少连接') || e.includes('缺少方案')
        )) {
          return null;
        }
        const preview = generateImportPreviewData(config as RouteConfig, json);
        set({ importPreview: preview });
        return preview;
      } catch {
        return null;
      }
    },
    confirmImportAndOverride: () => {
      const s = get();
      const preview = s.importPreview;
      if (!preview) {
        return { success: false, errors: ['没有待确认的导入预览数据'] };
      }
      const hasCritical = preview.planValidationReports.some((r) => r.report.hasCriticalIssues);
      const hasBaseErrors = !preview.validation.valid;
      if (hasBaseErrors || hasCritical) {
        return { success: false, errors: ['存在严重校验问题，无法导入，请修正后再试'] };
      }
      const c = preview.config;
      set((state) => {
        const newState = {
          halls: c.halls,
          exhibits: c.exhibits,
          connections: c.connections,
          plans: c.plans,
          activePlanId: c.plans[0]?.id || null,
          importPreview: null,
          recommendedStops: null,
          playOrderMode: 'edit' as PlayOrderMode,
        };
        saveToStorage({ ...state, ...newState });
        return newState;
      });
      return { success: true, errors: [] };
    },
    cancelImport: () => set({ importPreview: null }),

    exportConfig: () => {
      const s = get();
      return JSON.stringify(
        { halls: s.halls, exhibits: s.exhibits, connections: s.connections, plans: s.plans },
        null,
        2
      );
    },
    importConfig: (json) => {
      try {
        const config = JSON.parse(json);
        const result = validateImportConfig(config);
        if (!result.valid) {
          return { success: false, errors: result.errors };
        }
        const c = config as { halls: Hall[]; exhibits: Exhibit[]; connections: HallConnection[]; plans: TourPlan[] };
        set((s) => {
          const newState = {
            halls: c.halls,
            exhibits: c.exhibits,
            connections: c.connections,
            plans: c.plans,
            activePlanId: c.plans[0]?.id || null,
          };
          saveToStorage({ ...s, ...newState });
          return newState;
        });
        return { success: true, errors: [] };
      } catch {
        return { success: false, errors: ['JSON 格式解析失败'] };
      }
    },
  };
});
