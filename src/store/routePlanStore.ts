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
} from '@/types';
import { initialHalls, initialExhibits, initialConnections, initialPlans } from '@/utils/mockData';
import {
  computeStats,
  generateRecommendedRoute,
  generateValidationCenterReport,
} from '@/utils/validation';
import { uid, loadStorageSlice, saveStorageSlice } from './shared';
import { useUIStore } from './shared';

const ROUTE_PLAN_KEYS = [
  'halls', 'exhibits', 'connections', 'plans',
] as const;

type RoutePlanSlice = Pick<RoutePlanState, 'halls' | 'exhibits' | 'connections' | 'plans'>;

interface RoutePlanState {
  halls: Hall[];
  exhibits: Exhibit[];
  connections: HallConnection[];
  plans: TourPlan[];
  activePlanId: string | null;
  playingStopIndex: number | null;
  isPlaying: boolean;
  playOrderMode: PlayOrderMode;
  recommendedStops: TourStop[] | null;

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

  setPlayOrderMode: (mode: PlayOrderMode) => void;
  generateAndApplyRecommendedRoute: () => boolean;
  generateRecommendedRouteOnly: () => TourStop[] | null;
  clearRecommendedRoute: () => void;
  getEffectiveStops: () => TourStop[];

  getStats: () => StatsInfo;
  getActivePlan: () => TourPlan | undefined;
  getValidationReport: () => ValidationCenterReport | null;

  importOverride: (halls: Hall[], exhibits: Exhibit[], connections: HallConnection[], plans: TourPlan[]) => void;
}

export const useRoutePlanStore = create<RoutePlanState>((set, get) => {
  const stored = loadStorageSlice<RoutePlanSlice>([...ROUTE_PLAN_KEYS]);
  const initial = stored || {
    halls: initialHalls,
    exhibits: initialExhibits,
    connections: initialConnections,
    plans: initialPlans,
  };

  function persist(s: RoutePlanState) {
    saveStorageSlice({
      halls: s.halls,
      exhibits: s.exhibits,
      connections: s.connections,
      plans: s.plans,
      activePlanId: s.activePlanId,
    });
  }

  return {
    ...initial,
    activePlanId: initial.plans[0]?.id || null,
    playingStopIndex: null,
    isPlaying: false,
    playOrderMode: 'edit',
    recommendedStops: null,

    addHall: (hall) => {
      const newHall: Hall = { ...hall, id: uid() };
      set((s) => {
        const halls = [...s.halls, newHall];
        persist({ ...s, halls });
        return { halls };
      });
    },
    updateHall: (id, updates) => {
      set((s) => {
        const halls = s.halls.map((h) => (h.id === id ? { ...h, ...updates } : h));
        persist({ ...s, halls });
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
        persist({ ...s, halls, exhibits, connections, plans });
        return { halls, exhibits, connections, plans };
      });
    },

    addExhibit: (exhibit) => {
      const newExhibit: Exhibit = { ...exhibit, id: uid() };
      set((s) => {
        const exhibits = [...s.exhibits, newExhibit];
        persist({ ...s, exhibits });
        return { exhibits };
      });
    },
    updateExhibit: (id, updates) => {
      set((s) => {
        const exhibits = s.exhibits.map((e) => (e.id === id ? { ...e, ...updates } : e));
        persist({ ...s, exhibits });
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
        useUIStore.getState().showConfirmModal(
          '删除展品',
          `该展品已被方案"${names}"引用，确定要删除吗？删除后相关方案中的停靠点也将移除。`,
          () => {
            set((s) => {
              const exhibits = s.exhibits.filter((e) => e.id !== id);
              const plans = s.plans.map((p) => ({
                ...p,
                stops: p.stops.filter((st) => st.exhibitId !== id),
              }));
              persist({ ...s, exhibits, plans });
              return { exhibits, plans };
            });
            useUIStore.getState().closeConfirmModal();
          }
        );
      } else {
        set((s) => {
          const exhibits = s.exhibits.filter((e) => e.id !== id);
          persist({ ...s, exhibits });
          return { exhibits };
        });
      }
    },

    addConnection: (conn) => {
      const newConn: HallConnection = { ...conn, id: uid() };
      set((s) => {
        const connections = [...s.connections, newConn];
        persist({ ...s, connections });
        return { connections };
      });
    },
    removeConnection: (id) => {
      set((s) => {
        const connections = s.connections.filter((c) => c.id !== id);
        persist({ ...s, connections });
        return { connections };
      });
    },
    updateConnectionPriority: (id, priority) => {
      set((s) => {
        const connections = s.connections.map((c) =>
          c.id === id ? { ...c, priority } : c
        );
        persist({ ...s, connections });
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
        persist({ ...s, plans });
        return { plans, activePlanId: newPlan.id, recommendedStops: null, playOrderMode: 'edit' };
      });
    },
    deletePlan: (id) => {
      set((s) => {
        const plans = s.plans.filter((p) => p.id !== id);
        const activePlanId = s.activePlanId === id ? (plans[0]?.id || null) : s.activePlanId;
        persist({ ...s, plans, activePlanId });
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
        persist({ ...s, plans });
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
      const s = get();
      saveStorageSlice({ activePlanId: s.activePlanId });
    },
    updatePlanName: (id, name) => {
      set((s) => {
        const plans = s.plans.map((p) =>
          p.id === id ? { ...p, name, updatedAt: Date.now() } : p
        );
        persist({ ...s, plans });
        return { plans };
      });
    },
    updatePlanAudienceType: (id, audienceType) => {
      set((s) => {
        const plans = s.plans.map((p) =>
          p.id === id ? { ...p, audienceType, updatedAt: Date.now() } : p
        );
        persist({ ...s, plans });
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
            useUIStore.getState().showConfirmModal(
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
                  persist({ ...s, plans });
                  return { plans, recommendedStops: null };
                });
                useUIStore.getState().closeConfirmModal();
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
        persist({ ...s, plans });
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
        persist({ ...s, plans });
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
        persist({ ...s, plans });
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
        persist({ ...s, plans });
        return { plans };
      });
    },

    setPlayingStopIndex: (index) => set({ playingStopIndex: index }),
    setIsPlaying: (playing) => set({ isPlaying: playing }),
    togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

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
        persist({ ...state, plans });
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

    importOverride: (halls, exhibits, connections, plans) => {
      set({
        halls,
        exhibits,
        connections,
        plans,
        activePlanId: plans[0]?.id || null,
        recommendedStops: null,
        playOrderMode: 'edit',
      });
      const s = get();
      saveStorageSlice({
        halls: s.halls,
        exhibits: s.exhibits,
        connections: s.connections,
        plans: s.plans,
        activePlanId: s.activePlanId,
      });
    },
  };
});
