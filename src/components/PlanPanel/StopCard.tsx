import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { GripVertical, X } from 'lucide-react';
import { useMuseumStore } from '@/store/museumStore';
import type { TourStop } from '@/types';

interface StopCardProps {
  stop: TourStop;
  index: number;
}

export default function StopCard({ stop, index }: StopCardProps) {
  const exhibits = useMuseumStore((s) => s.exhibits);
  const halls = useMuseumStore((s) => s.halls);
  const activePlanId = useMuseumStore((s) => s.activePlanId);
  const playingStopIndex = useMuseumStore((s) => s.playingStopIndex);
  const removeStopFromPlan = useMuseumStore((s) => s.removeStopFromPlan);
  const updateStopDuration = useMuseumStore((s) => s.updateStopDuration);

  const exhibit = exhibits.find((e) => e.id === stop.exhibitId);
  const hall = exhibit ? halls.find((h) => h.id === exhibit.hallId) : undefined;
  const isPlaying = playingStopIndex === index;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function handleDurationChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1 && activePlanId) {
      updateStopDuration(activePlanId, stop.id, val);
    }
  }

  function handleDelete() {
    if (activePlanId) {
      removeStopFromPlan(activePlanId, stop.id);
    }
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      className={`flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 shadow-sm border-l-[3px] ${
        isPlaying ? 'border-l-amber-500 bg-amber-50' : 'border-l-museum-gold'
      } ${isDragging ? 'shadow-md' : ''}`}
    >
      <button
        className="cursor-grab text-slate-300 hover:text-slate-500 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>

      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${
          isPlaying ? 'bg-amber-500' : 'bg-museum-gold'
        }`}
      >
        {index + 1}
      </span>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-slate-800">
          {exhibit?.name ?? '未知展品'}
        </div>
        <div className="truncate text-xs text-slate-400">
          {hall?.name ?? ''}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <input
          type="number"
          min={1}
          value={stop.duration}
          onChange={handleDurationChange}
          className="w-14 rounded border border-slate-200 px-1.5 py-0.5 text-center text-xs text-slate-600 focus:border-museum-gold focus:outline-none"
        />
        <span className="text-xs text-slate-400">秒</span>
      </div>

      <button
        onClick={handleDelete}
        className="shrink-0 rounded p-0.5 text-slate-300 hover:bg-red-50 hover:text-red-500"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}
