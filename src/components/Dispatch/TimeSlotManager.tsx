import { useState } from 'react';
import { Plus, Edit2, Trash2, Clock, Users, Save, X } from 'lucide-react';
import { useMuseumStore } from '@/store/museumStore';
import { SLOT_STATUS_LABELS } from '@/types';
import type { TimeSlot } from '@/types';

const STATUS_COLORS: Record<TimeSlot['status'], { bg: string; text: string; bar: string }> = {
  scheduled: { bg: 'bg-slate-100', text: 'text-slate-600', bar: 'bg-slate-400' },
  ongoing: { bg: 'bg-blue-100', text: 'text-blue-600', bar: 'bg-blue-500' },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-600', bar: 'bg-emerald-500' },
  full: { bg: 'bg-red-100', text: 'text-red-600', bar: 'bg-red-500' },
};

interface AddFormState {
  startTime: string;
  endTime: string;
  expectedVisitors: string;
}

interface EditState {
  id: string;
  expectedVisitors: string;
  status: TimeSlot['status'];
}

const initialAddForm: AddFormState = {
  startTime: '',
  endTime: '',
  expectedVisitors: '',
};

export default function TimeSlotManager() {
  const timeSlots = useMuseumStore((s) => s.timeSlots);
  const addTimeSlot = useMuseumStore((s) => s.addTimeSlot);
  const updateTimeSlot = useMuseumStore((s) => s.updateTimeSlot);
  const removeTimeSlot = useMuseumStore((s) => s.removeTimeSlot);
  const showConfirmModal = useMuseumStore((s) => s.showConfirmModal);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<AddFormState>(initialAddForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);

  function handleAddSubmit() {
    const expected = parseInt(addForm.expectedVisitors, 10);
    if (!addForm.startTime || !addForm.endTime || isNaN(expected) || expected <= 0) {
      return;
    }
    addTimeSlot({
      startTime: addForm.startTime,
      endTime: addForm.endTime,
      expectedVisitors: expected,
      actualVisitors: 0,
      status: 'scheduled',
    });
    setAddForm(initialAddForm);
    setShowAddForm(false);
  }

  function handleAddCancel() {
    setAddForm(initialAddForm);
    setShowAddForm(false);
  }

  function startEdit(slot: TimeSlot) {
    setEditingId(slot.id);
    setEditState({
      id: slot.id,
      expectedVisitors: slot.expectedVisitors.toString(),
      status: slot.status,
    });
  }

  function handleEditSave() {
    if (!editState) return;
    const expected = parseInt(editState.expectedVisitors, 10);
    if (isNaN(expected) || expected <= 0) return;
    updateTimeSlot(editState.id, {
      expectedVisitors: expected,
      status: editState.status,
    });
    setEditingId(null);
    setEditState(null);
  }

  function handleEditCancel() {
    setEditingId(null);
    setEditState(null);
  }

  function handleDelete(slot: TimeSlot) {
    showConfirmModal(
      '删除批次',
      `确定要删除 ${slot.startTime} - ${slot.endTime} 的批次吗？`,
      () => {
        removeTimeSlot(slot.id);
      }
    );
  }

  const sortedSlots = [...timeSlots].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">分时入场管理</h2>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-museum-gold"
        >
          <Plus size={14} />
          新增批次
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {showAddForm && (
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700">添加新批次</span>
              <button
                onClick={handleAddCancel}
                className="rounded p-0.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500">开始时间</label>
                <input
                  type="time"
                  value={addForm.startTime}
                  onChange={(e) => setAddForm({ ...addForm, startTime: e.target.value })}
                  className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-xs focus:border-museum-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500">结束时间</label>
                <input
                  type="time"
                  value={addForm.endTime}
                  onChange={(e) => setAddForm({ ...addForm, endTime: e.target.value })}
                  className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-xs focus:border-museum-gold focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-slate-500">预计人数</label>
              <input
                type="number"
                min="1"
                value={addForm.expectedVisitors}
                onChange={(e) => setAddForm({ ...addForm, expectedVisitors: e.target.value })}
                placeholder="请输入预计人数"
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

        {sortedSlots.length === 0 && !showAddForm && (
          <div className="rounded-lg border border-dashed border-slate-200 py-12 text-center text-xs text-slate-400">
            暂无批次，点击右上角新增
          </div>
        )}

        {sortedSlots.map((slot) => {
          const isEditing = editingId === slot.id;
          const colors = STATUS_COLORS[slot.status];
          const progress = slot.expectedVisitors > 0
            ? Math.min((slot.actualVisitors / slot.expectedVisitors) * 100, 100)
            : 0;

          return (
            <div
              key={slot.id}
              className={`rounded-lg border bg-white p-3 shadow-sm ${
                isEditing ? 'border-museum-gold ring-1 ring-museum-gold/20' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-slate-400 shrink-0" />
                    <span className="text-sm font-medium text-slate-800 tabular-nums">
                      {slot.startTime} - {slot.endTime}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${colors.bg} ${colors.text}`}
                    >
                      {SLOT_STATUS_LABELS[slot.status]}
                    </span>
                  </div>

                  {isEditing && editState ? (
                    <div className="mt-2.5 space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-slate-500 w-16">预计人数</label>
                        <input
                          type="number"
                          min="1"
                          value={editState.expectedVisitors}
                          onChange={(e) =>
                            setEditState({ ...editState, expectedVisitors: e.target.value })
                          }
                          className="flex-1 rounded border border-slate-200 px-2 py-1 text-xs focus:border-museum-gold focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-slate-500 w-16">状态</label>
                        <select
                          value={editState.status}
                          onChange={(e) =>
                            setEditState({
                              ...editState,
                              status: e.target.value as TimeSlot['status'],
                            })
                          }
                          className="flex-1 rounded border border-slate-200 px-2 py-1 text-xs focus:border-museum-gold focus:outline-none bg-white"
                        >
                          {(['scheduled', 'ongoing', 'completed', 'full'] as const).map((s) => (
                            <option key={s} value={s}>
                              {SLOT_STATUS_LABELS[s]}
                            </option>
                          ))}
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
                          <Save size={12} />
                          保存
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Users size={12} className="text-slate-400" />
                          预计 <span className="font-medium text-slate-700 tabular-nums">{slot.expectedVisitors}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          实际 <span className="font-medium text-slate-700 tabular-nums">{slot.actualVisitors}</span>
                        </span>
                      </div>

                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span>人数进度</span>
                          <span className="tabular-nums">{slot.actualVisitors} / {slot.expectedVisitors}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${colors.bar}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {!isEditing && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => startEdit(slot)}
                      className="rounded p-1 text-slate-400 hover:bg-amber-50 hover:text-museum-gold"
                      title="编辑"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(slot)}
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
