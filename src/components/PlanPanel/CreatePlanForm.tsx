import { useState } from 'react';
import { useRoutePlanStore } from '@/store/routePlanStore';
import { AUDIENCE_LABELS, AUDIENCE_COLORS } from '@/types';
import type { AudienceType } from '@/types';

interface CreatePlanFormProps {
  onCancel: () => void;
}

const AUDIENCE_TYPES: AudienceType[] = ['children', 'general', 'research'];

export default function CreatePlanForm({ onCancel }: CreatePlanFormProps) {
  const createPlan = useRoutePlanStore((s) => s.createPlan);
  const [name, setName] = useState('');
  const [audienceType, setAudienceType] = useState<AudienceType>('general');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createPlan(name.trim(), audienceType);
    onCancel();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg bg-white p-3 shadow-sm">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="方案名称"
        autoFocus
        className="w-full rounded border border-slate-200 px-3 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-museum-gold focus:outline-none"
      />

      <div className="flex gap-2">
        {AUDIENCE_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setAudienceType(type)}
            className="flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors"
            style={{
              backgroundColor: audienceType === type ? AUDIENCE_COLORS[type] : '#F1F5F9',
              color: audienceType === type ? '#FFFFFF' : '#64748B',
            }}
          >
            {AUDIENCE_LABELS[type]}
          </button>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={!name.trim()}
          className="rounded-md bg-museum-gold px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          创建
        </button>
      </div>
    </form>
  );
}
