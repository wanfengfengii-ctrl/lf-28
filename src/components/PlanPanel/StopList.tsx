import { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Plus, Sparkles, ListOrdered, Route as RouteIcon, Check, X } from 'lucide-react';
import { useRoutePlanStore } from '@/store/routePlanStore';
import StopCard from './StopCard';

export default function StopList() {
  const activePlanId = useRoutePlanStore((s) => s.activePlanId);
  const plans = useRoutePlanStore((s) => s.plans);
  const exhibits = useRoutePlanStore((s) => s.exhibits);
  const halls = useRoutePlanStore((s) => s.halls);
  const reorderStops = useRoutePlanStore((s) => s.reorderStops);
  const addStopToPlan = useRoutePlanStore((s) => s.addStopToPlan);
  const playOrderMode = useRoutePlanStore((s) => s.playOrderMode);
  const recommendedStops = useRoutePlanStore((s) => s.recommendedStops);
  const setPlayOrderMode = useRoutePlanStore((s) => s.setPlayOrderMode);
  const generateAndApplyRecommendedRoute = useRoutePlanStore(
    (s) => s.generateAndApplyRecommendedRoute
  );
  const clearRecommendedRoute = useRoutePlanStore((s) => s.clearRecommendedRoute);
  const getEffectiveStops = useRoutePlanStore((s) => s.getEffectiveStops);

  const [showPicker, setShowPicker] = useState(false);

  const plan = plans.find((p) => p.id === activePlanId);
  const editStops = plan?.stops ?? [];
  const displayStops = getEffectiveStops();
  const isRecommendedMode = playOrderMode === 'recommended';

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const recommendedOrderMap = useMemo(() => {
    if (!recommendedStops) return new Map<string, number>();
    return new Map(recommendedStops.map((s, i) => [s.id, i]));
  }, [recommendedStops]);

  function handleDragEnd(event: DragEndEvent) {
    if (isRecommendedMode) return;
    const { active, over } = event;
    if (!over || active.id === over.id || !activePlanId) return;

    const oldIndex = editStops.findIndex((s) => s.id === active.id);
    const newIndex = editStops.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(editStops, oldIndex, newIndex);
    reorderStops(activePlanId, reordered);
  }

  const usedExhibitIds = new Set(editStops.map((s) => s.exhibitId));
  const availableExhibits = exhibits.filter((e) => !usedExhibitIds.has(e.id));

  const groupedByHall = halls
    .map((hall) => ({
      hall,
      exhibits: availableExhibits.filter((e) => e.hallId === hall.id),
    }))
    .filter((g) => g.exhibits.length > 0);

  function handleAddExhibit(exhibitId: string) {
    if (activePlanId) {
      addStopToPlan(activePlanId, exhibitId);
    }
  }

  function handleApplyRecommended() {
    const ok = generateAndApplyRecommendedRoute();
    if (!ok) {
      alert('停靠点数量不足，无法生成推荐路线');
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 rounded-lg bg-slate-50 p-2.5 border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-museum-gold" />
            <span className="text-xs font-medium text-slate-700">智能排线</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPlayOrderMode('edit')}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-colors ${
                !isRecommendedMode
                  ? 'bg-museum-teal text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-200'
              }`}
            >
              <ListOrdered className="h-3 w-3" />
              编辑顺序
            </button>
            <button
              onClick={() => setPlayOrderMode('recommended')}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-colors ${
                isRecommendedMode
                  ? 'bg-museum-gold text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-200'
              }`}
              disabled={editStops.length < 2}
              title={editStops.length < 2 ? '至少需要2个停靠点' : ''}
            >
              <RouteIcon className="h-3 w-3" />
              推荐顺序
            </button>
          </div>
        </div>

        {isRecommendedMode && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
            <span className="text-[11px] text-slate-500 flex-1">
              {recommendedStops ? (
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-emerald-500" />
                  已按连接优先级优化路线顺序
                </span>
              ) : (
                '正在生成推荐顺序...'
              )}
            </span>
            <button
              onClick={handleApplyRecommended}
              className="flex items-center gap-1 rounded-md bg-emerald-500 px-2 py-1 text-[11px] text-white hover:bg-emerald-600 transition-colors shadow-sm"
              title="将推荐顺序保存为编辑顺序"
            >
              <Check className="h-3 w-3" />
              应用
            </button>
            <button
              onClick={clearRecommendedRoute}
              className="flex items-center gap-1 rounded-md bg-slate-200 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-300 transition-colors"
            >
              <X className="h-3 w-3" />
              取消
            </button>
          </div>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={displayStops.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1.5">
            {displayStops.map((stop, i) => (
              <StopCard
                key={stop.id}
                stop={stop}
                index={i}
                recommendedIndex={
                  isRecommendedMode
                    ? recommendedOrderMap.get(stop.id)
                    : undefined
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {displayStops.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400">
          暂无停靠点，点击下方添加展品
        </div>
      )}

      <div className="relative">
        <button
          onClick={() => setShowPicker((v) => !v)}
          disabled={isRecommendedMode}
          className={`flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2 text-xs transition-colors ${
            isRecommendedMode
              ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
              : 'border-slate-300 text-slate-500 hover:border-museum-gold hover:text-museum-gold'
          }`}
          title={isRecommendedMode ? '请先退出推荐顺序模式再添加' : ''}
        >
          <Plus size={14} />
          添加展品
        </button>

        {showPicker && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            {groupedByHall.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                没有可添加的展品
              </div>
            )}
            {groupedByHall.map(({ hall, exhibits: hallExhibits }) => (
              <div key={hall.id}>
                <div className="sticky top-0 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
                  {hall.name}
                </div>
                {hallExhibits.map((exhibit) => (
                  <button
                    key={exhibit.id}
                    onClick={() => {
                      handleAddExhibit(exhibit.id);
                      setShowPicker(false);
                    }}
                    className="flex w-full items-center px-3 py-2 text-left text-xs text-slate-700 hover:bg-amber-50"
                  >
                    <Plus size={12} className="mr-2 text-slate-400" />
                    {exhibit.name}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
