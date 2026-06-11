import { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { useRoutePlanStore } from '@/store/routePlanStore';
import { AUDIENCE_LABELS, AUDIENCE_COLORS } from '@/types';
import type { AudienceType } from '@/types';
import StopList from './StopList';
import CreatePlanForm from './CreatePlanForm';

const AUDIENCE_GROUP_ORDER: AudienceType[] = ['children', 'general', 'research'];

export default function PlanPanel() {
  const plans = useRoutePlanStore((s) => s.plans);
  const activePlanId = useRoutePlanStore((s) => s.activePlanId);
  const setActivePlan = useRoutePlanStore((s) => s.setActivePlan);

  const [showForm, setShowForm] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const activePlan = plans.find((p) => p.id === activePlanId);

  const groupedPlans = AUDIENCE_GROUP_ORDER.map((type) => ({
    type,
    label: AUDIENCE_LABELS[type],
    color: AUDIENCE_COLORS[type],
    plans: plans.filter((p) => p.audienceType === type),
  })).filter((g) => g.plans.length > 0);

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">导览方案</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-museum-gold"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {showForm && (
          <CreatePlanForm onCancel={() => setShowForm(false)} />
        )}

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left shadow-sm"
          >
            <div className="flex items-center gap-2">
              {activePlan && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: AUDIENCE_COLORS[activePlan.audienceType] }}
                />
              )}
              <span className="text-sm text-slate-700">
                {activePlan ? activePlan.name : '选择方案'}
              </span>
            </div>
            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
            />
          </button>

          {showDropdown && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
              {groupedPlans.length === 0 && (
                <div className="px-3 py-4 text-center text-xs text-slate-400">
                  暂无方案
                </div>
              )}
              {groupedPlans.map((group) => (
                <div key={group.type}>
                  <div className="sticky top-0 flex items-center gap-2 bg-slate-50 px-3 py-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="text-xs font-medium text-slate-500">
                      {group.label}
                    </span>
                  </div>
                  {group.plans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => {
                        setActivePlan(plan.id);
                        setShowDropdown(false);
                      }}
                      className={`flex w-full items-center px-3 py-2 text-left text-sm hover:bg-amber-50 ${
                        plan.id === activePlanId
                          ? 'font-medium text-museum-gold bg-amber-50'
                          : 'text-slate-700'
                      }`}
                    >
                      {plan.name}
                      <span className="ml-auto text-xs text-slate-400">
                        {plan.stops.length} 站
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {activePlan ? (
          <StopList />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <p className="text-sm">请选择或创建导览方案</p>
          </div>
        )}
      </div>
    </div>
  );
}
