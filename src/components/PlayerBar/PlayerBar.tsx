import { useEffect, useRef } from 'react';
import { useMuseumStore } from '@/store/museumStore';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

export default function PlayerBar() {
  const plans = useMuseumStore((s) => s.plans);
  const activePlanId = useMuseumStore((s) => s.activePlanId);
  const playingStopIndex = useMuseumStore((s) => s.playingStopIndex);
  const isPlaying = useMuseumStore((s) => s.isPlaying);
  const exhibits = useMuseumStore((s) => s.exhibits);
  const togglePlay = useMuseumStore((s) => s.togglePlay);
  const setPlayingStopIndex = useMuseumStore((s) => s.setPlayingStopIndex);
  const setIsPlaying = useMuseumStore((s) => s.setIsPlaying);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activePlan = plans.find((p) => p.id === activePlanId);
  const stops = activePlan?.stops ?? [];
  const currentIndex = playingStopIndex ?? -1;
  const currentStop = currentIndex >= 0 ? stops[currentIndex] : null;
  const currentExhibit = currentStop
    ? exhibits.find((e) => e.id === currentStop.exhibitId)
    : null;

  useEffect(() => {
    if (isPlaying && currentStop) {
      const demoDuration = currentStop.duration / 30;
      timerRef.current = setTimeout(() => {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= stops.length) {
          setIsPlaying(false);
          setPlayingStopIndex(null);
        } else {
          setPlayingStopIndex(nextIndex);
        }
      }, demoDuration * 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentIndex, currentStop, stops.length, setIsPlaying, setPlayingStopIndex]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setPlayingStopIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < stops.length - 1) {
      setPlayingStopIndex(currentIndex + 1);
    }
  };

  if (!activePlan || stops.length === 0) {
    return (
      <div className="h-14 flex items-center justify-center bg-museum-canvas border-t border-white/10">
        <span className="text-sm text-museum-slate-light">请选择一个方案并添加展品以开始播放</span>
      </div>
    );
  }

  return (
    <div className="h-14 flex items-center gap-4 bg-museum-canvas border-t border-white/10 px-6">
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium text-white truncate">
          {currentExhibit?.name ?? '未选择展品'}
        </span>
        {currentStop && (
          <span className="text-xs text-museum-slate-light">
            第 {currentIndex + 1} 站 / 共 {stops.length} 站
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevious}
          disabled={currentIndex <= 0}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <SkipBack className="h-4 w-4" />
        </button>

        <button
          onClick={() => {
            if (!isPlaying && playingStopIndex === null && stops.length > 0) {
              setPlayingStopIndex(0);
            }
            togglePlay();
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-museum-gold text-white hover:bg-museum-gold-light transition-colors"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex >= stops.length - 1}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <SkipForward className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 w-32">
        <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-museum-gold transition-all duration-300"
            style={{ width: `${stops.length > 0 ? ((currentIndex + 1) / stops.length) * 100 : 0}%` }}
          />
        </div>
        <span className="text-xs text-museum-slate-light tabular-nums">
          {currentIndex + 1}/{stops.length}
        </span>
      </div>
    </div>
  );
}
