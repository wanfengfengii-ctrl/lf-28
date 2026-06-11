import { useState } from 'react';
import { useMuseumStore } from '@/store/museumStore';
import {
  Users,
  Edit2,
  Plus,
  Minus,
  AlertTriangle,
  AlertCircle,
  Save,
  X,
} from 'lucide-react';
import { CAPACITY_STATUS_COLORS, CAPACITY_STATUS_LABELS } from '@/types';
import type { HallCapacity } from '@/types';

interface EditFormState {
  maxCapacity: string;
  warningThreshold: string;
  criticalThreshold: string;
}

export default function HallCapacityMonitor() {
  const halls = useMuseumStore((s) => s.halls);
  const hallCapacities = useMuseumStore((s) => s.hallCapacities);
  const updateHallCapacity = useMuseumStore((s) => s.updateHallCapacity);
  const updateHallVisitors = useMuseumStore((s) => s.updateHallVisitors);

  const [editingHallId, setEditingHallId] = useState<string | null>(null);
  const [editForms, setEditForms] = useState<Record<string, EditFormState>>({});

  function getCapacityForHall(hallId: string): HallCapacity {
    const existing = hallCapacities.find((c) => c.hallId === hallId);
    if (existing) return existing;
    return {
      hallId,
      maxCapacity: 50,
      currentVisitors: 0,
      warningThreshold: 38,
      criticalThreshold: 45,
      status: 'normal',
    };
  }

  function getUsagePercent(cap: HallCapacity): number {
    if (cap.maxCapacity <= 0) return 0;
    return Math.min(100, Math.round((cap.currentVisitors / cap.maxCapacity) * 100));
  }

  function getStatusIcon(status: HallCapacity['status']) {
    if (status === 'critical') {
      return <AlertCircle className="h-4 w-4 shrink-0" />;
    }
    if (status === 'warning') {
      return <AlertTriangle className="h-4 w-4 shrink-0" />;
    }
    return null;
  }

  function getStatusBgClass(status: HallCapacity['status']) {
    if (status === 'critical') return 'bg-red-50 border-red-200';
    if (status === 'warning') return 'bg-amber-50 border-amber-200';
    return 'bg-white border-slate-200';
  }

  function getProgressBarClass(status: HallCapacity['status']) {
    if (status === 'critical') return 'bg-red-500';
    if (status === 'warning') return 'bg-amber-500';
    return 'bg-emerald-500';
  }

  function startEdit(cap: HallCapacity) {
    setEditForms((prev) => ({
      ...prev,
      [cap.hallId]: {
        maxCapacity: cap.maxCapacity.toString(),
        warningThreshold: cap.warningThreshold.toString(),
        criticalThreshold: cap.criticalThreshold.toString(),
      },
    }));
    setEditingHallId(cap.hallId);
  }

  function cancelEdit(hallId: string) {
    setEditingHallId((current) => (current === hallId ? null : current));
  }

  function updateEditForm(hallId: string, field: keyof EditFormState, value: string) {
    setEditForms((prev) => ({
      ...prev,
      [hallId]: {
        ...prev[hallId],
        [field]: value,
      },
    }));
  }

  function saveEdit(hallId: string) {
    const form = editForms[hallId];
    if (!form) return;

    const maxCapacity = parseInt(form.maxCapacity, 10);
    const warningThreshold = parseInt(form.warningThreshold, 10);
    const criticalThreshold = parseInt(form.criticalThreshold, 10);

    if (
      isNaN(maxCapacity) ||
      isNaN(warningThreshold) ||
      isNaN(criticalThreshold) ||
      maxCapacity <= 0 ||
      warningThreshold < 0 ||
      criticalThreshold < 0 ||
      warningThreshold >= criticalThreshold ||
      criticalThreshold > maxCapacity
    ) {
      return;
    }

    updateHallCapacity(hallId, {
      maxCapacity,
      warningThreshold,
      criticalThreshold,
    });

    const cap = getCapacityForHall(hallId);
    updateHallVisitors(hallId, cap.currentVisitors);

    setEditingHallId((current) => (current === hallId ? null : current));
  }

  function adjustVisitors(hallId: string, delta: number) {
    const cap = getCapacityForHall(hallId);
    const newVisitors = Math.max(0, Math.min(cap.maxCapacity, cap.currentVisitors + delta));
    updateHallVisitors(hallId, newVisitors);
  }

  return (
    <div className="flex flex-col gap-3 p-3 bg-white border-b border-slate-200">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-museum-teal shrink-0" />
        <span className="text-xs font-semibold text-slate-700">展厅容量监控</span>
        <div className="ml-auto flex items-center gap-2 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="text-slate-500">正常</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500"></span>
            <span className="text-slate-500">预警</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500"></span>
            <span className="text-slate-500">拥挤</span>
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {halls.map((hall) => {
          const cap = getCapacityForHall(hall.id);
          const usagePercent = getUsagePercent(cap);
          const isEditing = editingHallId === hall.id;
          const form = editForms[hall.id];
          const statusColor = CAPACITY_STATUS_COLORS[cap.status];

          return (
            <div
              key={hall.id}
              className={`rounded-lg border p-3 transition-colors ${getStatusBgClass(cap.status)}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-slate-800 truncate">
                  {hall.name}
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: `${statusColor}20`,
                    color: statusColor,
                  }}
                >
                  {getStatusIcon(cap.status)}
                  {CAPACITY_STATUS_LABELS[cap.status]}
                </span>
                {!isEditing && (
                  <button
                    onClick={() => startEdit(cap)}
                    className="ml-auto flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    title="编辑容量设置"
                  >
                    <Edit2 size={13} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => adjustVisitors(hall.id, -1)}
                    disabled={cap.currentVisitors <= 0}
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <div className="flex h-7 min-w-[72px] items-center justify-center rounded-md bg-slate-50 px-2 text-sm font-bold text-slate-800 tabular-nums border border-slate-200">
                    {cap.currentVisitors}
                    <span className="text-xs font-normal text-slate-400 mx-1">/</span>
                    {cap.maxCapacity}
                  </div>
                  <button
                    onClick={() => adjustVisitors(hall.id, 1)}
                    disabled={cap.currentVisitors >= cap.maxCapacity}
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span className="ml-auto text-xs font-medium tabular-nums" style={{ color: statusColor }}>
                  {usagePercent}%
                </span>
              </div>

              <div className="relative w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${getProgressBarClass(cap.status)} ${
                    cap.status !== 'normal' ? 'animate-pulse' : ''
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>

              {isEditing && form && (
                <div className="mt-3 pt-3 border-t border-slate-200 space-y-2.5">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-medium text-slate-600">
                        最大容纳
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={form.maxCapacity}
                        onChange={(e) =>
                          updateEditForm(hall.id, 'maxCapacity', e.target.value)
                        }
                        className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 focus:border-museum-gold focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-medium text-amber-600">
                        预警阈值
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={form.warningThreshold}
                        onChange={(e) =>
                          updateEditForm(hall.id, 'warningThreshold', e.target.value)
                        }
                        className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 focus:border-museum-gold focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-medium text-red-600">
                        拥挤阈值
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={form.criticalThreshold}
                        onChange={(e) =>
                          updateEditForm(hall.id, 'criticalThreshold', e.target.value)
                        }
                        className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 focus:border-museum-gold focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>要求：0 ≤ 预警 ＜ 拥挤 ≤ 最大容纳</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => cancelEdit(hall.id)}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 transition-colors"
                      >
                        <X size={12} />
                        取消
                      </button>
                      <button
                        onClick={() => saveEdit(hall.id)}
                        className="flex items-center gap-1 rounded-md bg-museum-gold px-2 py-1 text-white hover:bg-museum-gold-dark transition-colors"
                      >
                        <Save size={12} />
                        保存
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
