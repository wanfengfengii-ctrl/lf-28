import { useState } from 'react';
import { useMuseumStore } from '@/store/museumStore';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Trash2,
  Plus,
  Route,
  Clock,
  Users,
  Save,
  X,
  Edit2,
  GripVertical,
  MapPin,
  ChevronRight,
  Zap,
  RefreshCw,
  User,
  Mic,
  History,
  Settings,
  Bot,
  ArrowRight,
} from 'lucide-react';
import { AUDIENCE_LABELS, AUDIENCE_COLORS, ALERT_PROCESSING_STATUS_LABELS, ALERT_PROCESSING_STATUS_COLORS, DISPATCH_ACTION_LABELS, RESOURCE_TYPE_LABELS } from '@/types';
import type { AudienceType, AlternativeRoute, Exhibit, AlertProcessingStatus } from '@/types';

interface AddRouteForm {
  name: string;
  audienceType: AudienceType;
  originalPlanId: string;
  reason: string;
  peakHours: string;
  selectedStopIds: string[];
}

const initialAddForm: AddRouteForm = {
  name: '',
  audienceType: 'general',
  originalPlanId: '',
  reason: '',
  peakHours: '',
  selectedStopIds: [],
};

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}`;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  guide: <User size={12} />,
  volunteer: <Users size={12} />,
  audio_device: <Mic size={12} />,
};

export default function CongestionAlertPanel() {
  const congestionAlerts = useMuseumStore((s) => s.congestionAlerts);
  const halls = useMuseumStore((s) => s.halls);
  const exhibits = useMuseumStore((s) => s.exhibits);
  const alternativeRoutes = useMuseumStore((s) => s.alternativeRoutes);
  const plans = useMuseumStore((s) => s.plans);
  const dispatchRecords = useMuseumStore((s) => s.dispatchRecords);
  const guideResources = useMuseumStore((s) => s.guideResources);
  const autoDispatchConfig = useMuseumStore((s) => s.autoDispatchConfig);
  const addAlternativeRoute = useMuseumStore((s) => s.addAlternativeRoute);
  const updateAlternativeRoute = useMuseumStore((s) => s.updateAlternativeRoute);
  const removeAlternativeRoute = useMuseumStore((s) => s.removeAlternativeRoute);
  const resolveCongestionAlert = useMuseumStore((s) => s.resolveCongestionAlert);
  const removeCongestionAlert = useMuseumStore((s) => s.removeCongestionAlert);
  const updateAutoDispatchConfig = useMuseumStore((s) => s.updateAutoDispatchConfig);
  const executeAutoDispatchWorkflow = useMuseumStore((s) => s.executeAutoDispatchWorkflow);
  const recommendRouteForAlert = useMuseumStore((s) => s.recommendRouteForAlert);
  const autoDispatchResources = useMuseumStore((s) => s.autoDispatchResources);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<AddRouteForm>(initialAddForm);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AddRouteForm | null>(null);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'alerts' | 'routes' | 'records'>('alerts');

  const sortedAlerts = [...congestionAlerts].sort((a, b) => {
    if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
    return b.timestamp - a.timestamp;
  });

  function getHallName(hallId: string): string {
    return halls.find((h) => h.id === hallId)?.name || '未知展厅';
  }

  function getExhibit(exhibitId: string): Exhibit | undefined {
    return exhibits.find((e) => e.id === exhibitId);
  }

  function getPlanName(planId: string): string {
    return plans.find((p) => p.id === planId)?.name || '未知方案';
  }

  function getPlanExhibits(planId: string): Exhibit[] {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return [];
    return plan.stops
      .map((stop) => exhibits.find((e) => e.id === stop.exhibitId))
      .filter((e): e is Exhibit => !!e);
  }

  function getRouteName(routeId: string | null): string {
    if (!routeId) return '-';
    return alternativeRoutes.find((r) => r.id === routeId)?.name || '未知路线';
  }

  function getResourceName(resourceId: string | null): string {
    if (!resourceId) return '-';
    return guideResources.find((r) => r.id === resourceId)?.name || '未知资源';
  }

  function getAlertRecords(alertId: string) {
    return dispatchRecords.filter((r) => r.alertId === alertId);
  }

  function getLevelConfig(level: 'warning' | 'critical') {
    if (level === 'critical') {
      return {
        icon: <AlertCircle size={14} />,
        label: '严重',
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-600',
        badgeBg: 'bg-red-100',
        badgeText: 'text-red-700',
        pulse: 'animate-pulse',
      };
    }
    return {
      icon: <AlertTriangle size={14} />,
      label: '预警',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-600',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-700',
      pulse: 'animate-pulse',
    };
  }

  function getStatusBadge(status: AlertProcessingStatus) {
    const color = ALERT_PROCESSING_STATUS_COLORS[status];
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
        style={{ backgroundColor: `${color}15`, color }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
        {ALERT_PROCESSING_STATUS_LABELS[status]}
      </span>
    );
  }

  function toggleExhibitInAdd(exhibitId: string) {
    setAddForm((prev) => {
      const exists = prev.selectedStopIds.includes(exhibitId);
      return {
        ...prev,
        selectedStopIds: exists
          ? prev.selectedStopIds.filter((id) => id !== exhibitId)
          : [...prev.selectedStopIds, exhibitId],
      };
    });
  }

  function toggleExhibitInEdit(exhibitId: string) {
    if (!editForm) return;
    setEditForm((prev) => {
      if (!prev) return prev;
      const exists = prev.selectedStopIds.includes(exhibitId);
      return {
        ...prev,
        selectedStopIds: exists
          ? prev.selectedStopIds.filter((id) => id !== exhibitId)
          : [...prev.selectedStopIds, exhibitId],
      };
    });
  }

  function moveExhibitInEdit(exhibitId: string, direction: 'up' | 'down') {
    if (!editForm) return;
    setEditForm((prev) => {
      if (!prev) return prev;
      const index = prev.selectedStopIds.indexOf(exhibitId);
      if (index === -1) return prev;
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.selectedStopIds.length) return prev;
      const newIds = [...prev.selectedStopIds];
      [newIds[index], newIds[newIndex]] = [newIds[newIndex], newIds[index]];
      return { ...prev, selectedStopIds: newIds };
    });
  }

  function handleAddSubmit() {
    if (!addForm.name || !addForm.originalPlanId || !addForm.reason) {
      return;
    }
    const peakHoursArr = addForm.peakHours
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean);
    addAlternativeRoute({
      name: addForm.name,
      audienceType: addForm.audienceType,
      originalPlanId: addForm.originalPlanId,
      stopIds: addForm.selectedStopIds,
      reason: addForm.reason,
      peakHours: peakHoursArr,
    });
    setAddForm(initialAddForm);
    setShowAddForm(false);
  }

  function handleAddCancel() {
    setAddForm(initialAddForm);
    setShowAddForm(false);
  }

  function startEdit(route: AlternativeRoute) {
    setEditingRouteId(route.id);
    setEditForm({
      name: route.name,
      audienceType: route.audienceType,
      originalPlanId: route.originalPlanId,
      reason: route.reason,
      peakHours: route.peakHours.join(', '),
      selectedStopIds: [...route.stopIds],
    });
  }

  function handleEditSave() {
    if (!editForm || !editingRouteId) return;
    const peakHoursArr = editForm.peakHours
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean);
    updateAlternativeRoute(editingRouteId, {
      name: editForm.name,
      audienceType: editForm.audienceType,
      originalPlanId: editForm.originalPlanId,
      stopIds: editForm.selectedStopIds,
      reason: editForm.reason,
      peakHours: peakHoursArr,
    });
    setEditingRouteId(null);
    setEditForm(null);
  }

  function handleEditCancel() {
    setEditingRouteId(null);
    setEditForm(null);
  }

  function handleManualDispatch(alertId: string) {
    executeAutoDispatchWorkflow(alertId);
  }

  function handleRecommendRoute(alertId: string) {
    recommendRouteForAlert(alertId);
  }

  function handleDispatchResources(alertId: string) {
    autoDispatchResources(alertId);
  }

  function renderExhibitSelector(
    selectedIds: string[],
    originalPlanId: string,
    onToggle: (id: string) => void,
    allowReorder?: {
      onMove: (id: string, dir: 'up' | 'down') => void;
    }
  ) {
    const planExhibits = getPlanExhibits(originalPlanId);
    const selectedExhibits = selectedIds
      .map((id) => getExhibit(id))
      .filter((e): e is Exhibit => !!e);
    const otherExhibits = exhibits.filter(
      (e) => !selectedIds.includes(e.id) && !planExhibits.find((pe) => pe.id === e.id)
    );

    return (
      <div className="space-y-3">
        {selectedExhibits.length > 0 && (
          <div className="rounded-md border border-museum-gold/30 bg-amber-50/30 p-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium text-museum-gold">
                已选站点 ({selectedExhibits.length})
              </span>
              {allowReorder && (
                <span className="text-[10px] text-slate-400">点击可调整顺序</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {selectedExhibits.map((ex, idx) => {
                const hall = halls.find((h) => h.id === ex.hallId);
                return (
                  <div
                    key={ex.id}
                    className="flex items-center gap-1.5 rounded-md bg-white border border-slate-200 px-2 py-1.5"
                  >
                    {allowReorder && (
                      <div className="flex flex-col items-center gap-0.5 -ml-1">
                        <button
                          onClick={() => allowReorder.onMove(ex.id, 'up')}
                          disabled={idx === 0}
                          className="h-4 w-4 flex items-center justify-center text-slate-400 hover:text-museum-gold disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronRight size={12} className="rotate-[-90deg]" />
                        </button>
                        <button
                          onClick={() => allowReorder.onMove(ex.id, 'down')}
                          disabled={idx === selectedExhibits.length - 1}
                          className="h-4 w-4 flex items-center justify-center text-slate-400 hover:text-museum-gold disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronRight size={12} className="rotate-90" />
                        </button>
                      </div>
                    )}
                    {allowReorder ? (
                      <GripVertical size={12} className="text-slate-300 shrink-0" />
                    ) : null}
                    <div
                      className="flex-shrink-0 w-4 h-4 rounded border-2 border-museum-gold bg-museum-gold flex items-center justify-center cursor-pointer"
                      onClick={() => onToggle(ex.id)}
                    >
                      <CheckCircle size={10} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-slate-700 truncate">
                        {idx + 1}. {ex.name}
                      </p>
                      <p className="text-[9px] text-slate-400 truncate">
                        <MapPin size={9} className="inline mr-0.5 -mt-0.5" />
                        {hall?.name || '未知展厅'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {originalPlanId && planExhibits.length > 0 && (
          <div className="rounded-md border border-slate-200 bg-white p-2">
            <span className="text-[10px] font-medium text-slate-500 block mb-1.5">
              原方案展品（可直接选用）
            </span>
            <div className="flex flex-wrap gap-1">
              {planExhibits.map((ex) => {
                const isSelected = selectedIds.includes(ex.id);
                if (isSelected) return null;
                const hall = halls.find((h) => h.id === ex.hallId);
                return (
                  <button
                    key={ex.id}
                    onClick={() => onToggle(ex.id)}
                    className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 hover:border-museum-gold hover:bg-amber-50 transition-colors"
                  >
                    <div className="flex-shrink-0 w-3 h-3 rounded border border-slate-300" />
                    <span className="text-[10px] text-slate-600 truncate max-w-[120px]">
                      {ex.name}
                    </span>
                    <span className="text-[9px] text-slate-400 shrink-0">
                      · {hall?.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="rounded-md border border-slate-200 bg-white p-2">
          <span className="text-[10px] font-medium text-slate-500 block mb-1.5">
            全部展品 ({exhibits.length})
          </span>
          <div className="flex flex-wrap gap-1">
            {otherExhibits.map((ex) => {
              const isSelected = selectedIds.includes(ex.id);
              return (
                <button
                  key={ex.id}
                  onClick={() => onToggle(ex.id)}
                  className={`flex items-center gap-1 rounded-md border px-2 py-1 transition-colors ${
                    isSelected
                      ? 'border-museum-gold bg-amber-50'
                      : 'border-slate-200 hover:border-museum-gold hover:bg-amber-50'
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-3 h-3 rounded border ${
                      isSelected
                        ? 'border-museum-gold bg-museum-gold flex items-center justify-center'
                        : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <CheckCircle size={9} className="text-white" />}
                  </div>
                  <span className="text-[10px] text-slate-600 truncate max-w-[100px]">
                    {ex.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function renderRouteStopsDisplay(route: AlternativeRoute) {
    if (route.stopIds.length === 0) {
      return (
        <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-2">
          <p className="text-[10px] text-slate-400 text-center">
            尚未配置路线站点，请点击编辑按钮添加展品
          </p>
        </div>
      );
    }
    const stops = route.stopIds
      .map((id) => getExhibit(id))
      .filter((e): e is Exhibit => !!e);
    return (
      <div className="rounded-md bg-slate-50 border border-slate-200 p-2">
        <div className="flex items-center gap-1 mb-1.5">
          <Route size={10} className="text-museum-teal" />
          <span className="text-[10px] font-medium text-slate-600">
            路线站点 ({stops.length}站)
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {stops.map((stop, idx) => {
            const hall = halls.find((h) => h.id === stop.hallId);
            return (
              <div key={stop.id} className="flex items-center gap-1">
                <div className="flex items-center gap-1 rounded-md bg-white border border-slate-200 px-1.5 py-1 shadow-sm">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-museum-gold flex items-center justify-center text-[9px] font-bold text-white">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-slate-700 truncate max-w-[90px]">
                      {stop.name}
                    </p>
                    <p className="text-[8px] text-slate-400 truncate max-w-[90px]">
                      {hall?.name}
                    </p>
                  </div>
                </div>
                {idx < stops.length - 1 && (
                  <ChevronRight size={12} className="text-slate-300 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveSubTab('alerts')}
            className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeSubTab === 'alerts'
                ? 'bg-museum-gold text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle size={13} />
            预警列表
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeSubTab === 'alerts' ? 'bg-white/20' : 'bg-slate-200'
            }`}>
              {sortedAlerts.filter((a) => !a.resolved).length}
            </span>
          </button>
          <button
            onClick={() => setActiveSubTab('routes')}
            className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeSubTab === 'routes'
                ? 'bg-museum-gold text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Route size={13} />
            替代路线
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeSubTab === 'routes' ? 'bg-white/20' : 'bg-slate-200'
            }`}>
              {alternativeRoutes.length}
            </span>
          </button>
          <button
            onClick={() => setActiveSubTab('records')}
            className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeSubTab === 'records'
                ? 'bg-museum-gold text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History size={13} />
            调度记录
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeSubTab === 'records' ? 'bg-white/20' : 'bg-slate-200'
            }`}>
              {dispatchRecords.length}
            </span>
          </button>
        </div>
        <button
          onClick={() => setShowConfig((v) => !v)}
          className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-xs transition-colors ${
            showConfig
              ? 'bg-museum-teal text-white'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          }`}
        >
          <Settings size={13} />
          智能配置
        </button>
      </div>

      {showConfig && (
        <div className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot size={16} className="text-indigo-600" />
              <span className="text-xs font-semibold text-slate-700">智能预警联动与自动调度配置</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-[11px] text-slate-600">总开关</span>
              <button
                onClick={() => updateAutoDispatchConfig({ enabled: !autoDispatchConfig.enabled })}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  autoDispatchConfig.enabled ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                    autoDispatchConfig.enabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'autoTriggerWarning' as const, label: '预警级自动触发', color: 'amber' },
              { key: 'autoTriggerCritical' as const, label: '严重级自动触发', color: 'red' },
              { key: 'autoRecommendRoute' as const, label: '自动推荐路线', color: 'teal' },
              { key: 'autoAssignGuide' as const, label: '自动分配讲解员', color: 'blue' },
              { key: 'autoAssignVolunteer' as const, label: '自动分配志愿者', color: 'green' },
              { key: 'autoAssignAudioDevice' as const, label: '自动分配语音设备', color: 'purple' },
            ].map((item) => (
              <label key={item.key} className="flex items-center justify-between rounded-md bg-white/60 px-2.5 py-1.5 cursor-pointer hover:bg-white transition-colors">
                <span className="text-[11px] text-slate-600">{item.label}</span>
                <button
                  onClick={() => updateAutoDispatchConfig({ [item.key]: !autoDispatchConfig[item.key] })}
                  className={`relative w-8 h-4 rounded-full transition-colors ${
                    autoDispatchConfig[item.key] ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${
                      autoDispatchConfig[item.key] ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </label>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'guideDispatchThreshold' as const, label: '讲解员阈值(%)', suffix: '%' },
              { key: 'volunteerDispatchThreshold' as const, label: '志愿者阈值(%)', suffix: '%' },
              { key: 'audioDeviceDispatchThreshold' as const, label: '语音设备阈值(%)', suffix: '%' },
            ].map((item) => (
              <div key={item.key} className="rounded-md bg-white/60 px-2.5 py-1.5">
                <label className="text-[10px] text-slate-500 block mb-0.5">{item.label}</label>
                <div className="flex items-center gap-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={autoDispatchConfig[item.key]}
                    onChange={(e) => updateAutoDispatchConfig({ [item.key]: parseInt(e.target.value) })}
                    className="flex-1 h-1"
                  />
                  <span className="text-[11px] font-semibold text-slate-700 tabular-nums w-8 text-right">
                    {autoDispatchConfig[item.key]}{item.suffix}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 p-3">
        {activeSubTab === 'alerts' && (
          <div className="flex flex-col gap-2">
            {sortedAlerts.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-200 bg-white py-8 text-center text-xs text-slate-400">
                暂无拥堵预警
              </div>
            )}

            {sortedAlerts.map((alert) => {
              const config = getLevelConfig(alert.level);
              const isExpanded = expandedAlertId === alert.id;
              const alertRecords = getAlertRecords(alert.id);

              return (
                <div
                  key={alert.id}
                  className={`rounded-lg border p-3 ${config.bg} ${config.border} ${
                    !alert.resolved ? config.pulse : ''
                  } ${alert.resolved ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <span
                      className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${config.badgeBg} ${config.badgeText}`}
                    >
                      {config.icon}
                      {config.label}
                    </span>
                    <span className="text-sm font-semibold text-slate-800 truncate">
                      {getHallName(alert.hallId)}
                    </span>
                    {getStatusBadge(alert.processingStatus)}
                    {alert.resolved && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        <CheckCircle size={10} />
                        已解决
                      </span>
                    )}
                    <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock size={10} />
                      {formatTime(alert.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 mb-2">{alert.message}</p>

                  {(alert.recommendedRouteId || alert.handledBy) && (
                    <div className="mb-2 grid grid-cols-2 gap-2">
                      {alert.recommendedRouteId && (
                        <div className="rounded-md bg-white/70 px-2 py-1.5">
                          <span className="text-[9px] text-slate-400 block">推荐路线</span>
                          <div className="flex items-center gap-1">
                            <Route size={10} className="text-museum-teal shrink-0" />
                            <span className="text-[11px] font-medium text-slate-700 truncate">
                              {getRouteName(alert.recommendedRouteId)}
                            </span>
                          </div>
                        </div>
                      )}
                      {alert.handledBy && (
                        <div className="rounded-md bg-white/70 px-2 py-1.5">
                          <span className="text-[9px] text-slate-400 block">处理方式</span>
                          <div className="flex items-center gap-1">
                            {alert.handledBy === 'system' ? (
                              <Bot size={10} className="text-indigo-500 shrink-0" />
                            ) : (
                              <User size={10} className="text-slate-500 shrink-0" />
                            )}
                            <span className="text-[11px] font-medium text-slate-700">
                              {alert.handledBy === 'system' ? '系统自动' : '人工处理'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {alert.suggestions.length > 0 && (
                    <div className="mb-2 rounded-md bg-white/60 p-2">
                      <p className="text-[10px] font-medium text-slate-500 mb-1">处理建议：</p>
                      <ul className="space-y-0.5">
                        {alert.suggestions.map((s, idx) => (
                          <li key={idx} className="flex items-start gap-1 text-[11px] text-slate-600">
                            <span className="text-slate-400 mt-0.5">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {!alert.resolved && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      <button
                        onClick={() => handleManualDispatch(alert.id)}
                        className="flex items-center gap-1 rounded-md bg-indigo-500 px-2 py-1 text-[10px] text-white hover:bg-indigo-600 transition-colors shadow-sm"
                      >
                        <Zap size={11} />
                        一键智能调度
                      </button>
                      {!alert.recommendedRouteId && (
                        <button
                          onClick={() => handleRecommendRoute(alert.id)}
                          className="flex items-center gap-1 rounded-md bg-teal-500 px-2 py-1 text-[10px] text-white hover:bg-teal-600 transition-colors shadow-sm"
                        >
                          <Route size={11} />
                          推荐替代路线
                        </button>
                      )}
                      <button
                        onClick={() => handleDispatchResources(alert.id)}
                        className="flex items-center gap-1 rounded-md bg-blue-500 px-2 py-1 text-[10px] text-white hover:bg-blue-600 transition-colors shadow-sm"
                      >
                        <RefreshCw size={11} />
                        调度资源
                      </button>
                    </div>
                  )}

                  {alertRecords.length > 0 && (
                    <div className="mb-2">
                      <button
                        onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                        className="flex items-center gap-1 text-[10px] font-medium text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        <History size={11} />
                        调度记录 ({alertRecords.length}条)
                        <ChevronRight
                          size={12}
                          className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        />
                      </button>
                      {isExpanded && (
                        <div className="mt-2 rounded-md bg-white/80 border border-slate-200 divide-y divide-slate-100">
                          {alertRecords.map((record) => (
                            <div key={record.id} className="px-2.5 py-2">
                              <div className="flex items-start gap-2">
                                <div
                                  className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                    record.operator === 'system' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'
                                  }`}
                                >
                                  {record.operator === 'system' ? <Bot size={11} /> : <User size={11} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[11px] font-semibold text-slate-700">
                                      {DISPATCH_ACTION_LABELS[record.actionType]}
                                    </span>
                                    {record.resourceType && (
                                      <span className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] bg-slate-100 text-slate-600">
                                        {TYPE_ICON[record.resourceType]}
                                        {RESOURCE_TYPE_LABELS[record.resourceType]}
                                      </span>
                                    )}
                                    <span className="ml-auto text-[9px] text-slate-400">
                                      {formatDateTime(record.timestamp)}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-600 mt-0.5">{record.description}</p>
                                  {(record.resourceId || record.routeId) && (
                                    <div className="mt-1 flex items-center gap-2 flex-wrap text-[10px]">
                                      {record.resourceId && (
                                        <span className="inline-flex items-center gap-1 text-slate-500">
                                          <ArrowRight size={9} />
                                          {getResourceName(record.resourceId)}
                                        </span>
                                      )}
                                      {record.routeId && (
                                        <span className="inline-flex items-center gap-1 text-slate-500">
                                          <ArrowRight size={9} />
                                          {getRouteName(record.routeId)}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-1">
                    {!alert.resolved && (
                      <button
                        onClick={() => resolveCongestionAlert(alert.id)}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        <CheckCircle size={12} />
                        标记已解决
                      </button>
                    )}
                    <button
                      onClick={() => removeCongestionAlert(alert.id)}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={12} />
                      删除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeSubTab === 'routes' && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Route className="h-4 w-4 text-museum-teal shrink-0" />
                <span className="text-xs font-semibold text-slate-700">替代路线管理</span>
              </div>
              <button
                onClick={() => setShowAddForm((v) => !v)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-100 hover:text-museum-gold transition-colors"
              >
                <Plus size={13} />
                添加路线
              </button>
            </div>

            {showAddForm && (
              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">添加替代路线</span>
                  <button
                    onClick={handleAddCancel}
                    className="rounded p-0.5 text-slate-400 hover:bg-slate-100"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500">路线名称</label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="请输入路线名称"
                    className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-xs focus:border-museum-gold focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-500">适用观众</label>
                    <select
                      value={addForm.audienceType}
                      onChange={(e) =>
                        setAddForm({ ...addForm, audienceType: e.target.value as AudienceType })
                      }
                      className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-xs focus:border-museum-gold focus:outline-none bg-white"
                    >
                      {(['children', 'general', 'research'] as const).map((t) => (
                        <option key={t} value={t}>
                          {AUDIENCE_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500">关联原方案</label>
                    <select
                      value={addForm.originalPlanId}
                      onChange={(e) =>
                        setAddForm({ ...addForm, originalPlanId: e.target.value })
                      }
                      className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-xs focus:border-museum-gold focus:outline-none bg-white"
                    >
                      <option value="">请选择方案</option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500">启用原因</label>
                  <textarea
                    value={addForm.reason}
                    onChange={(e) => setAddForm({ ...addForm, reason: e.target.value })}
                    placeholder="请输入启用该替代路线的原因"
                    rows={2}
                    className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-xs focus:border-museum-gold focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-500">高峰时段（逗号分隔）</label>
                  <input
                    type="text"
                    value={addForm.peakHours}
                    onChange={(e) => setAddForm({ ...addForm, peakHours: e.target.value })}
                    placeholder="例如：09:00-11:00, 14:00-16:00"
                    className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-xs focus:border-museum-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span>路线站点配置</span>
                    <span className="text-slate-400">
                      （已选 {addForm.selectedStopIds.length} 站）
                    </span>
                  </label>
                  <div className="mt-1">
                    {renderExhibitSelector(
                      addForm.selectedStopIds,
                      addForm.originalPlanId,
                      toggleExhibitInAdd
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-1 pt-1">
                  <button
                    onClick={handleAddCancel}
                    className="rounded-md px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAddSubmit}
                    className="flex items-center gap-1 rounded-md bg-museum-gold px-2.5 py-1 text-xs text-white hover:bg-amber-600 transition-colors"
                  >
                    <Save size={12} />
                    保存
                  </button>
                </div>
              </div>
            )}

            {alternativeRoutes.length === 0 && !showAddForm && (
              <div className="rounded-lg border border-dashed border-slate-200 bg-white py-8 text-center text-xs text-slate-400">
                暂无替代路线，点击右上角添加
              </div>
            )}

            <div className="flex flex-col gap-2">
              {alternativeRoutes.map((route) => {
                const audienceColor = AUDIENCE_COLORS[route.audienceType];
                const isEditing = editingRouteId === route.id;

                return (
                  <div
                    key={route.id}
                    className={`rounded-lg border bg-white p-3 shadow-sm ${
                      isEditing ? 'border-museum-gold ring-1 ring-museum-gold/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <Route size={14} className="text-museum-teal shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-800 truncate">
                            {isEditing && editForm ? editForm.name : route.name}
                          </span>
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{
                              backgroundColor: `${audienceColor}20`,
                              color: audienceColor,
                            }}
                          >
                            <Users size={10} />
                            {AUDIENCE_LABELS[
                              isEditing && editForm
                                ? editForm.audienceType
                                : route.audienceType
                            ]}
                          </span>
                        </div>
                        {(isEditing && editForm ? editForm.originalPlanId : route.originalPlanId) && (
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            基于方案：
                            {getPlanName(
                              isEditing && editForm
                                ? editForm.originalPlanId
                                : route.originalPlanId
                            )}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {!isEditing && (
                          <button
                            onClick={() => startEdit(route)}
                            className="rounded p-1 text-slate-400 hover:bg-amber-50 hover:text-museum-gold transition-colors"
                            title="编辑路线"
                          >
                            <Edit2 size={13} />
                          </button>
                        )}
                        <button
                          onClick={() => removeAlternativeRoute(route.id)}
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          title="删除"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {isEditing && editForm ? (
                      <div className="space-y-2.5">
                        <div>
                          <label className="text-[11px] text-slate-500">路线名称</label>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-xs focus:border-museum-gold focus:outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] text-slate-500">适用观众</label>
                            <select
                              value={editForm.audienceType}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  audienceType: e.target.value as AudienceType,
                                })
                              }
                              className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-xs focus:border-museum-gold focus:outline-none bg-white"
                            >
                              {(['children', 'general', 'research'] as const).map((t) => (
                                <option key={t} value={t}>
                                  {AUDIENCE_LABELS[t]}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-500">关联原方案</label>
                            <select
                              value={editForm.originalPlanId}
                              onChange={(e) =>
                                setEditForm({ ...editForm, originalPlanId: e.target.value })
                              }
                              className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-xs focus:border-museum-gold focus:outline-none bg-white"
                            >
                              <option value="">请选择方案</option>
                              {plans.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-500">启用原因</label>
                          <textarea
                            value={editForm.reason}
                            onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                            rows={2}
                            className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-xs focus:border-museum-gold focus:outline-none resize-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-500">高峰时段（逗号分隔）</label>
                          <input
                            type="text"
                            value={editForm.peakHours}
                            onChange={(e) => setEditForm({ ...editForm, peakHours: e.target.value })}
                            className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-xs focus:border-museum-gold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-500 flex items-center gap-1">
                            <span>路线站点配置</span>
                            <span className="text-slate-400">
                              （已选 {editForm.selectedStopIds.length} 站，可拖拽排序）
                            </span>
                          </label>
                          <div className="mt-1">
                            {renderExhibitSelector(
                              editForm.selectedStopIds,
                              editForm.originalPlanId,
                              toggleExhibitInEdit,
                              { onMove: moveExhibitInEdit }
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end gap-1 pt-1">
                          <button
                            onClick={handleEditCancel}
                            className="rounded-md px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100 transition-colors"
                          >
                            取消
                          </button>
                          <button
                            onClick={handleEditSave}
                            className="flex items-center gap-1 rounded-md bg-museum-gold px-2.5 py-1 text-xs text-white hover:bg-amber-600 transition-colors"
                          >
                            <Save size={12} />
                            保存
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="rounded-md bg-slate-50 p-2 mb-2">
                          <p className="text-[11px] text-slate-600">{route.reason}</p>
                        </div>

                        {renderRouteStopsDisplay(route)}

                        {route.peakHours.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap mt-2">
                            <Clock size={11} className="text-slate-400 shrink-0" />
                            <span className="text-[10px] text-slate-500">高峰时段：</span>
                            {route.peakHours.map((h, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"
                              >
                                {h}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeSubTab === 'records' && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-indigo-500 shrink-0" />
              <span className="text-xs font-semibold text-slate-700">调度记录时间线</span>
              <span className="ml-auto text-[10px] text-slate-400">
                共 {dispatchRecords.length} 条记录
              </span>
            </div>

            {dispatchRecords.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-200 bg-white py-8 text-center text-xs text-slate-400">
                暂无调度记录
              </div>
            )}

            <div className="relative pl-5 space-y-3">
              <div className="absolute left-1.5 top-1 bottom-1 w-px bg-slate-200" />
              {dispatchRecords.map((record) => (
                <div key={record.id} className="relative">
                  <div
                    className={`absolute -left-[14px] top-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${
                      record.operator === 'system' ? 'bg-indigo-500' : 'bg-amber-500'
                    }`}
                  >
                    {record.operator === 'system' ? (
                      <Bot size={8} className="text-white" />
                    ) : (
                      <User size={8} className="text-white" />
                    )}
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-semibold text-slate-700">
                            {DISPATCH_ACTION_LABELS[record.actionType]}
                          </span>
                          <span
                            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium ${
                              record.result === 'success'
                                ? 'bg-emerald-100 text-emerald-700'
                                : record.result === 'failed'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {record.result === 'success' ? '成功' : record.result === 'failed' ? '失败' : '待处理'}
                          </span>
                          {record.hallId && (
                            <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] bg-slate-100 text-slate-600">
                              <MapPin size={9} />
                              {getHallName(record.hallId)}
                            </span>
                          )}
                          <span className="ml-auto text-[9px] text-slate-400 shrink-0">
                            {formatDateTime(record.timestamp)}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1">{record.description}</p>
                        {(record.resourceId || record.routeId || record.timeSlotId) && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {record.resourceId && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[9px] text-blue-700">
                                {record.resourceType && TYPE_ICON[record.resourceType]}
                                资源：{getResourceName(record.resourceId)}
                              </span>
                            )}
                            {record.routeId && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 text-[9px] text-teal-700">
                                <Route size={9} />
                                路线：{getRouteName(record.routeId)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
