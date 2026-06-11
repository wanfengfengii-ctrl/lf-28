import { useRoutePlanStore } from '@/store/museumStore';
import { AUDIENCE_LABELS, AUDIENCE_COLORS } from '@/types';
import type { AudienceType, TourPlan } from '@/types';
import { Plus, Copy, Trash2, Users, Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import CreatePlanForm from '@/components/PlanPanel/CreatePlanForm';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}分${s}秒`;
}

function PlanCard({ plan }: { plan: TourPlan }) {
  const { exhibits, setActivePlan, deletePlan, duplicatePlan } = useRoutePlanStore();
  const totalDuration = plan.stops.reduce((sum, s) => sum + s.duration, 0);
  const hallIds = new Set(
    plan.stops.map((s) => exhibits.find((e) => e.id === s.exhibitId)?.hallId).filter(Boolean)
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 overflow-hidden"
      style={{ borderLeftColor: AUDIENCE_COLORS[plan.audienceType] }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-display text-lg font-bold text-gray-800">{plan.name}</h3>
            <span
              className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: AUDIENCE_COLORS[plan.audienceType] }}
            >
              {AUDIENCE_LABELS[plan.audienceType]}
            </span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => duplicatePlan(plan.id)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-museum-teal transition-colors"
              title="复制方案"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={() => deletePlan(plan.id)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              title="删除方案"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="flex gap-4 text-sm text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <MapPin size={14} />
            {plan.stops.length} 站
          </span>
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {formatDuration(totalDuration)}
          </span>
          <span className="flex items-center gap-1">
            <Users size={14} />
            {hallIds.size} 展厅
          </span>
        </div>

        {plan.stops.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {plan.stops.slice(0, 5).map((stop) => {
              const exhibit = exhibits.find((e) => e.id === stop.exhibitId);
              return (
                <span
                  key={stop.id}
                  className="px-2 py-0.5 bg-museum-ivory rounded-md text-xs text-gray-600 border border-amber-200"
                >
                  {exhibit?.name || '未知'}
                </span>
              );
            })}
            {plan.stops.length > 5 && (
              <span className="px-2 py-0.5 bg-gray-100 rounded-md text-xs text-gray-400">
                +{plan.stops.length - 5} 更多
              </span>
            )}
          </div>
        )}

        <button
          onClick={() => setActivePlan(plan.id)}
          className="mt-4 w-full py-2 rounded-lg bg-museum-teal text-white text-sm font-medium hover:bg-museum-teal-dark transition-colors"
        >
          编辑路线
        </button>
      </div>
    </motion.div>
  );
}

export default function Plans() {
  const { plans } = useRoutePlanStore();
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<AudienceType | 'all'>('all');

  const filteredPlans = filterType === 'all'
    ? plans
    : plans.filter((p) => p.audienceType === filterType);

  const groupedPlans = (['children', 'general', 'research'] as AudienceType[]).map((type) => ({
    type,
    label: AUDIENCE_LABELS[type],
    color: AUDIENCE_COLORS[type],
    plans: plans.filter((p) => p.audienceType === type),
  }));

  return (
    <div className="min-h-screen bg-museum-ivory">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-800">导览方案管理</h1>
            <p className="text-gray-500 mt-1">为不同观众群体创建和管理语音导览方案</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-museum-teal text-white rounded-lg hover:bg-museum-teal-dark transition-colors shadow-md"
          >
            <Plus size={18} />
            新建方案
          </button>
        </div>

        {showForm && (
          <div className="mb-6">
            <CreatePlanForm onCancel={() => setShowForm(false)} />
          </div>
        )}

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-museum-teal text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            全部 ({plans.length})
          </button>
          {groupedPlans.map((g) => (
            <button
              key={g.type}
              onClick={() => setFilterType(g.type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === g.type
                  ? 'text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
              style={filterType === g.type ? { backgroundColor: g.color } : undefined}
            >
              {g.label} ({g.plans.length})
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>

        {filteredPlans.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <Users size={48} className="mx-auto mb-3 opacity-50" />
            <p>暂无{filterType !== 'all' ? AUDIENCE_LABELS[filterType as AudienceType] : ''}导览方案</p>
            <p className="text-sm mt-1">点击"新建方案"创建第一个导览方案</p>
          </div>
        )}
      </div>
    </div>
  );
}
