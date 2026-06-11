import { useEffect, useRef } from 'react';
import { useRoutePlanStore } from '@/store/routePlanStore';
import { Play, Pause, SkipBack, SkipForward, Sparkles, ListOrdered } from 'lucide-react';

export default function PlayerBar() {
  const exhibits = useRoutePlanStore((s) => s.exhibits);
  const playingStopIndex = useRoutePlanStore((s) => s.playingStopIndex);
  const isPlaying = useRoutePlanStore((s) => s.isPlaying);
  const togglePlay = useRoutePlanStore((s) => s.togglePlay);
  const setPlayingStopIndex = useRoutePlanStore((s) => s.setPlayingStopIndex);
  const setIsPlaying = useRoutePlanStore((s) => s.setIsPlaying);
  const getEffectiveStops = useRoutePlanStore((s) => s.getEffectiveStops);
  const playOrderMode = useRoutePlanStore((s) => s.playOrderMode);
  const setPlayOrderMode = useRoutePlanStore((s) => s.setPlayOrderMode);
  const activePlanId = useRoutePlanStore((s) => s.activePlanId);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stops = getEffectiveStops();
  const currentIndex = playingStopIndex ?? -1;
  const currentStop = currentIndex >= 0 ? stops[currentIndex] : null;
  const currentExhibit = currentStop
    ? exhibits.find((e) => e.id === currentStop.exhibitId)
    : null;
  const isRecommendedMode = playOrderMode === 'recommended';

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

  if (!activePlanId || stops.length === 0) {
    return (
      <div className="h-14 flex items-center justify-center bg-museum-canvas border-t border-white/10">
        <span className="text-sm text-museum-slate-light">请选择一个方案并添加展品以开始播放</span>
      </div>
    );
  }

  return (
    <div className="h-14 flex items-center gap-4 bg-museum-canvas border-t border-white/10 px-6">
      <div className="flex items-center gap-2 mr-2">
        <button
          onClick={() => setPlayOrderMode('edit')}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px transition-colors ${
            !isRecommendedMode
              ? 'bg-white/20 text-white'
              : 'text-white/50 hover:text-white/70 hover:bg-white/10'
          }`}
          title="按编辑顺序播放"
        >
          <ListOrdered className="h-3 w-3" />
          编辑
        </button>
        <button
          onClick={() => setPlayOrderMode('recommended')}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px transition-colors ${
            isRecommendedMode
              ? 'bg-museum-gold text-white'
              : 'text-white/50 hover:text-white/70 hover:bg-white/10'
          }`}
          disabled={stops.length < 2}
          title="按推荐顺序播放"
        >
          <Sparkles className="h-3 w-3" />
          推荐
        </button>
      </div>

      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium text-white truncate">
          {currentExhibit?.name ?? '未选择展品'}
        </span>
        {currentStop && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-museum-slate-light">
              第 {currentIndex + 1} 站 / 共 {stops.length} 站
            </span>
            {isRecommendedMode && (
              <span className="text-[10px] bg-museum-gold/20 text-museum-gold px-1.5 rounded">
                推荐顺序
              </span>
            )}
          </div>
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
            className={`h-full rounded-full transition-all duration-300 ${
              isRecommendedMode ? 'bg-purple-400' : 'bg-museum-gold'
            }`}
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
