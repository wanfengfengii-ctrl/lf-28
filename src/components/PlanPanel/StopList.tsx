import { useState } from 'react';
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
import { Plus } from 'lucide-react';
import { useMuseumStore } from '@/store/museumStore';
import StopCard from './StopCard';

export default function StopList() {
  const activePlanId = useMuseumStore((s) => s.activePlanId);
  const plans = useMuseumStore((s) => s.plans);
  const exhibits = useMuseumStore((s) => s.exhibits);
  const halls = useMuseumStore((s) => s.halls);
  const reorderStops = useMuseumStore((s) => s.reorderStops);
  const addStopToPlan = useMuseumStore((s) => s.addStopToPlan);

  const [showPicker, setShowPicker] = useState(false);

  const plan = plans.find((p) => p.id === activePlanId);
  const stops = plan?.stops ?? [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !activePlanId) return;

    const oldIndex = stops.findIndex((s) => s.id === active.id);
    const newIndex = stops.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(stops, oldIndex, newIndex);
    reorderStops(activePlanId, reordered);
  }

  const usedExhibitIds = new Set(stops.map((s) => s.exhibitId));
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

  return (
    <div className="space-y-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={stops.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1.5">
            {stops.map((stop, i) => (
              <StopCard key={stop.id} stop={stop} index={i} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {stops.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400">
          暂无停靠点，点击下方添加展品
        </div>
      )}

      <div className="relative">
        <button
          onClick={() => setShowPicker((v) => !v)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2 text-xs text-slate-500 hover:border-museum-gold hover:text-museum-gold"
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
