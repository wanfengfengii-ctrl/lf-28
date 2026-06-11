import { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  User,
  Mic,
  Users,
  Check,
  X,
  Save,
  Link,
  Unlink,
} from 'lucide-react';
import { useMuseumStore } from '@/store/museumStore';
import {
  RESOURCE_TYPE_LABELS,
  RESOURCE_STATUS_LABELS,
  RESOURCE_STATUS_COLORS,
} from '@/types';
import type { GuideResource, ResourceType } from '@/types';

const TYPE_ICONS: Record<ResourceType, React.ReactNode> = {
  guide: <User size={16} />,
  audio_device: <Mic size={16} />,
  volunteer: <Users size={16} />,
};

interface AddFormState {
  name: string;
  type: ResourceType;
  contact: string;
}

interface EditState {
  id: string;
  status: GuideResource['status'];
}

interface AssignState {
  id: string;
  planId: string;
  timeSlotId: string;
}

type FilterType = 'all' | ResourceType;

const initialAddForm: AddFormState = {
  name: '',
  type: 'guide',
  contact: '',
};

export default function ResourceAllocation() {
  const guideResources = useMuseumStore((s) => s.guideResources);
  const plans = useMuseumStore((s) => s.plans);
  const timeSlots = useMuseumStore((s) => s.timeSlots);
  const addGuideResource = useMuseumStore((s) => s.addGuideResource);
  const updateGuideResource = useMuseumStore((s) => s.updateGuideResource);
  const removeGuideResource = useMuseumStore((s) => s.removeGuideResource);
  const assignResource = useMuseumStore((s) => s.assignResource);
  const unassignResource = useMuseumStore((s) => s.unassignResource);
  const showConfirmModal = useMuseumStore((s) => s.showConfirmModal);

  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<AddFormState>(initialAddForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignState, setAssignState] = useState<AssignState | null>(null);

  const filteredResources = guideResources.filter(
    (r) => filterType === 'all' || r.type === filterType
  );

  function handleAddSubmit() {
    if (!addForm.name.trim()) return;
    addGuideResource({
      name: addForm.name.trim(),
      type: addForm.type,
      status: 'available',
      assignedPlanId: null,
      assignedTimeSlotId: null,
      contact: addForm.contact.trim() || undefined,
    });
    setAddForm(initialAddForm);
    setShowAddForm(false);
  }

  function handleAddCancel() {
    setAddForm(initialAddForm);
    setShowAddForm(false);
  }

  function startEdit(resource: GuideResource) {
    setEditingId(resource.id);
    setEditState({
      id: resource.id,
      status: resource.status,
    });
  }

  function handleEditSave() {
    if (!editState) return;
    updateGuideResource(editState.id, { status: editState.status });
    setEditingId(null);
    setEditState(null);
  }

  function handleEditCancel() {
    setEditingId(null);
    setEditState(null);
  }

  function startAssign(resource: GuideResource) {
    setAssigningId(resource.id);
    setAssignState({
      id: resource.id,
      planId: resource.assignedPlanId || plans[0]?.id || '',
      timeSlotId: resource.assignedTimeSlotId || timeSlots[0]?.id || '',
    });
  }

  function handleAssignSave() {
    if (!assignState || !assignState.planId || !assignState.timeSlotId) return;
    assignResource(assignState.id, assignState.planId, assignState.timeSlotId);
    setAssigningId(null);
    setAssignState(null);
  }

  function handleAssignCancel() {
    setAssigningId(null);
    setAssignState(null);
  }

  function handleUnassign(id: string) {
    unassignResource(id);
  }

  function handleDelete(resource: GuideResource) {
    showConfirmModal(
      '删除资源',
      `确定要删除资源"${resource.name}"吗？`,
      () => {
        removeGuideResource(resource.id);
      }
    );
  }

  function getPlanName(planId: string | null): string {
    if (!planId) return '-';
    return plans.find((p) => p.id === planId)?.name || '未知方案';
  }

  function getTimeSlotLabel(timeSlotId: string | null): string {
    if (!timeSlotId) return '-';
    const slot = timeSlots.find((t) => t.id === timeSlotId);
    return slot ? `${slot.startTime} - ${slot.endTime}` : '未知时段';
  }

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">导览资源调度</h2>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-museum-gold"
        >
          <Plus size={14} />
          新增资源
        </button>
      </div>

      <div className="border-b border-slate-200 bg-white px-3 py-2">
        <div className="flex gap-1">
          {(['all', 'guide', 'audio_device', 'volunteer'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`rounded px-2.5 py-1 text-xs transition-colors ${
                filterType === type
                  ? 'bg-museum-gold text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type === 'all' ? '全部' : RESOURCE_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {showAddForm && (
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700">添加新资源</span>
              <button
                onClick={handleAddCancel}
                className="rounded p-0.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={14} />
              </button>
            </div>
            <div>
              <label className="text-[11px] text-slate-500">名称</label>
              <input
                type="text"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                placeholder="请输入资源名称"
                className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-xs focus:border-museum-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">类型</label>
              <select
                value={addForm.type}
                onChange={(e) =>
                  setAddForm({ ...addForm, type: e.target.value as ResourceType })
                }
                className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-xs focus:border-museum-gold focus:outline-none bg-white"
              >
                {(['guide', 'audio_device', 'volunteer'] as const).map((type) => (
                  <option key={type} value={type}>
                    {RESOURCE_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500">联系方式（可选）</label>
              <input
                type="text"
                value={addForm.contact}
                onChange={(e) => setAddForm({ ...addForm, contact: e.target.value })}
                placeholder="电话或工号"
                className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-xs focus:border-museum-gold focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-1 pt-1">
              <button
                onClick={handleAddCancel}
                className="rounded-md px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100"
              >
                取消
              </button>
              <button
                onClick={handleAddSubmit}
                className="flex items-center gap-1 rounded-md bg-museum-gold px-2.5 py-1 text-xs text-white hover:bg-amber-600"
              >
                <Save size={12} />
                保存
              </button>
            </div>
          </div>
        )}

        {filteredResources.length === 0 && !showAddForm && (
          <div className="rounded-lg border border-dashed border-slate-200 py-12 text-center text-xs text-slate-400">
            暂无资源，点击右上角新增
          </div>
        )}

        {filteredResources.map((resource) => {
          const isEditing = editingId === resource.id;
          const isAssigning = assigningId === resource.id;
          const statusColor = RESOURCE_STATUS_COLORS[resource.status];

          return (
            <div
              key={resource.id}
              className={`rounded-lg border bg-white p-3 shadow-sm ${
                isEditing || isAssigning
                  ? 'border-museum-gold ring-1 ring-museum-gold/20'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${statusColor}15`,
                        color: statusColor,
                      }}
                    >
                      {TYPE_ICONS[resource.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-800 truncate">
                          {resource.name}
                        </span>
                        <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 shrink-0">
                          {RESOURCE_TYPE_LABELS[resource.type]}
                        </span>
                      </div>
                      {isEditing && editState ? (
                        <div className="mt-2.5 space-y-2">
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] text-slate-500 w-12">状态</label>
                            <select
                              value={editState.status}
                              onChange={(e) =>
                                setEditState({
                                  ...editState,
                                  status: e.target.value as GuideResource['status'],
                                })
                              }
                              className="flex-1 rounded border border-slate-200 px-2 py-1 text-xs focus:border-museum-gold focus:outline-none bg-white"
                            >
                              {(['available', 'assigned', 'busy', 'rest'] as const).map(
                                (s) => (
                                  <option key={s} value={s}>
                                    {RESOURCE_STATUS_LABELS[s]}
                                  </option>
                                )
                              )}
                            </select>
                          </div>
                          <div className="flex justify-end gap-1 pt-1">
                            <button
                              onClick={handleEditCancel}
                              className="rounded-md px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100"
                            >
                              取消
                            </button>
                            <button
                              onClick={handleEditSave}
                              className="flex items-center gap-1 rounded-md bg-museum-gold px-2.5 py-1 text-xs text-white hover:bg-amber-600"
                            >
                              <Check size={12} />
                              保存
                            </button>
                          </div>
                        </div>
                      ) : isAssigning && assignState ? (
                        <div className="mt-2.5 space-y-2">
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] text-slate-500 w-12">方案</label>
                            <select
                              value={assignState.planId}
                              onChange={(e) =>
                                setAssignState({ ...assignState, planId: e.target.value })
                              }
                              className="flex-1 rounded border border-slate-200 px-2 py-1 text-xs focus:border-museum-gold focus:outline-none bg-white"
                            >
                              <option value="">请选择方案</option>
                              {plans.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] text-slate-500 w-12">时段</label>
                            <select
                              value={assignState.timeSlotId}
                              onChange={(e) =>
                                setAssignState({
                                  ...assignState,
                                  timeSlotId: e.target.value,
                                })
                              }
                              className="flex-1 rounded border border-slate-200 px-2 py-1 text-xs focus:border-museum-gold focus:outline-none bg-white"
                            >
                              <option value="">请选择时段</option>
                              {timeSlots.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.startTime} - {t.endTime}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex justify-end gap-1 pt-1">
                            <button
                              onClick={handleAssignCancel}
                              className="rounded-md px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100"
                            >
                              取消
                            </button>
                            <button
                              onClick={handleAssignSave}
                              className="flex items-center gap-1 rounded-md bg-museum-gold px-2.5 py-1 text-xs text-white hover:bg-amber-600"
                            >
                              <Link size={12} />
                              分配
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="mt-1 flex items-center gap-2 flex-wrap">
                            <span
                              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
                              style={{
                                backgroundColor: `${statusColor}15`,
                                color: statusColor,
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: statusColor }}
                              />
                              {RESOURCE_STATUS_LABELS[resource.status]}
                            </span>
                            {resource.contact && (
                              <span className="text-[11px] text-slate-500">
                                {resource.contact}
                              </span>
                            )}
                          </div>
                          {(resource.assignedPlanId || resource.assignedTimeSlotId) && (
                            <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                              <div className="flex items-center gap-2 text-[11px]">
                                <span className="text-slate-400 w-12 shrink-0">方案</span>
                                <span className="text-slate-700 font-medium truncate">
                                  {getPlanName(resource.assignedPlanId)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px]">
                                <span className="text-slate-400 w-12 shrink-0">时段</span>
                                <span className="text-slate-700 font-medium">
                                  {getTimeSlotLabel(resource.assignedTimeSlotId)}
                                </span>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {!isEditing && !isAssigning && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => startAssign(resource)}
                      className="rounded p-1 text-slate-400 hover:bg-blue-50 hover:text-blue-500"
                      title="分配资源"
                    >
                      <Link size={14} />
                    </button>
                    {resource.assignedPlanId && (
                      <button
                        onClick={() => handleUnassign(resource.id)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title="取消分配"
                      >
                        <Unlink size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(resource)}
                      className="rounded p-1 text-slate-400 hover:bg-amber-50 hover:text-museum-gold"
                      title="编辑状态"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(resource)}
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                      title="删除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
