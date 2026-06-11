import { create } from 'zustand';
import type {
  Hall,
  Exhibit,
  HallConnection,
  TourPlan,
  ImportPreviewData,
  RouteConfig,
} from '@/types';
import { validateImportConfig, generateImportPreviewData } from '@/utils/validation';
import { useRoutePlanStore } from './routePlanStore';

interface ValidationImportState {
  importPreview: ImportPreviewData | null;

  setImportPreview: (preview: ImportPreviewData | null) => void;
  previewImportConfig: (json: string) => ImportPreviewData | null;
  confirmImportAndOverride: () => { success: boolean; errors: string[] };
  cancelImport: () => void;

  exportConfig: () => string;
  importConfig: (json: string) => { success: boolean; errors: string[] };
}

export const useValidationImportStore = create<ValidationImportState>((set, get) => ({
  importPreview: null,

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
    useRoutePlanStore.getState().importOverride(c.halls, c.exhibits, c.connections, c.plans);
    set({ importPreview: null });
    return { success: true, errors: [] };
  },

  cancelImport: () => set({ importPreview: null }),

  exportConfig: () => {
    const { halls, exhibits, connections, plans } = useRoutePlanStore.getState();
    return JSON.stringify({ halls, exhibits, connections, plans }, null, 2);
  },

  importConfig: (json) => {
    try {
      const config = JSON.parse(json);
      const result = validateImportConfig(config);
      if (!result.valid) {
        return { success: false, errors: result.errors };
      }
      const c = config as { halls: Hall[]; exhibits: Exhibit[]; connections: HallConnection[]; plans: TourPlan[] };
      useRoutePlanStore.getState().importOverride(c.halls, c.exhibits, c.connections, c.plans);
      return { success: true, errors: [] };
    } catch {
      return { success: false, errors: ['JSON 格式解析失败'] };
    }
  },
}));
