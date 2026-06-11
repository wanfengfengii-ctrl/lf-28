import { create } from 'zustand';
import type {
  GuideResource,
  ResourceOccupancySnapshot,
  ResourceType,
} from '@/types';
import { initialGuideResources, initialResourceSnapshots } from '@/utils/mockData';
import { uid, loadStorageSlice, saveStorageSlice } from './shared';

const RESOURCE_KEYS = [
  'guideResources', 'resourceSnapshots',
] as const;

type ResourceSlice = Pick<ResourceAllocationState, 'guideResources' | 'resourceSnapshots'>;

interface ResourceAllocationState {
  guideResources: GuideResource[];
  resourceSnapshots: ResourceOccupancySnapshot[];

  addGuideResource: (resource: Omit<GuideResource, 'id'>) => void;
  updateGuideResource: (id: string, updates: Partial<GuideResource>) => void;
  removeGuideResource: (id: string) => void;
  assignResource: (resourceId: string, planId: string, timeSlotId: string) => void;
  unassignResource: (resourceId: string) => void;

  addResourceSnapshot: (snapshot: Omit<ResourceOccupancySnapshot, 'id' | 'timestamp'>) => void;
  captureResourceSnapshot: (resourceType: ResourceType) => void;
}

export const useResourceAllocationStore = create<ResourceAllocationState>((set, get) => {
  const stored = loadStorageSlice<ResourceSlice>([...RESOURCE_KEYS]);
  const initial = stored || {
    guideResources: initialGuideResources,
    resourceSnapshots: initialResourceSnapshots,
  };

  function persist(s: ResourceAllocationState) {
    saveStorageSlice({
      guideResources: s.guideResources,
      resourceSnapshots: s.resourceSnapshots,
    });
  }

  return {
    ...initial,

    addGuideResource: (resource) => {
      const newResource: GuideResource = { ...resource, id: uid() };
      set((s) => {
        const guideResources = [...s.guideResources, newResource];
        persist({ ...s, guideResources });
        return { guideResources };
      });
    },
    updateGuideResource: (id, updates) => {
      set((s) => {
        const guideResources = s.guideResources.map((r) => (r.id === id ? { ...r, ...updates } : r));
        persist({ ...s, guideResources });
        return { guideResources };
      });
    },
    removeGuideResource: (id) => {
      set((s) => {
        const guideResources = s.guideResources.filter((r) => r.id !== id);
        persist({ ...s, guideResources });
        return { guideResources };
      });
    },
    assignResource: (resourceId, planId, timeSlotId) => {
      set((s) => {
        const guideResources = s.guideResources.map((r) =>
          r.id === resourceId
            ? { ...r, assignedPlanId: planId, assignedTimeSlotId: timeSlotId, status: 'assigned' as const }
            : r
        );
        persist({ ...s, guideResources });
        return { guideResources };
      });
    },
    unassignResource: (resourceId) => {
      set((s) => {
        const guideResources = s.guideResources.map((r) =>
          r.id === resourceId
            ? { ...r, assignedPlanId: null, assignedTimeSlotId: null, status: 'available' as const }
            : r
        );
        persist({ ...s, guideResources });
        return { guideResources };
      });
    },

    addResourceSnapshot: (snapshot) => {
      const newSnapshot: ResourceOccupancySnapshot = { ...snapshot, id: uid(), timestamp: Date.now() };
      set((s) => {
        const resourceSnapshots = [...s.resourceSnapshots, newSnapshot];
        persist({ ...s, resourceSnapshots });
        return { resourceSnapshots };
      });
    },
    captureResourceSnapshot: (resourceType) => {
      const s = get();
      const resources = s.guideResources.filter((r) => r.type === resourceType);
      const totalCount = resources.length;
      const availableCount = resources.filter((r) => r.status === 'available').length;
      const assignedCount = resources.filter((r) => r.status === 'assigned').length;
      const busyCount = resources.filter((r) => r.status === 'busy').length;
      const restCount = resources.filter((r) => r.status === 'rest').length;
      const occupancyRate = totalCount > 0 ? Math.round(((totalCount - availableCount) / totalCount) * 100) : 0;
      s.addResourceSnapshot({ resourceType, totalCount, availableCount, assignedCount, busyCount, restCount, occupancyRate });
    },
  };
});
