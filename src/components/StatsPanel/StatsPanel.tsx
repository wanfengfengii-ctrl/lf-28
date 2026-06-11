import { useMuseumStore } from '@/store/museumStore';
import { Clock, AlertTriangle, Zap, Route, CheckCircle } from 'lucide-react';

function formatDuration(seconds: number) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}分${sec}秒`;
}

export default function StatsPanel() {
  const getStats = useMuseumStore((s) => s.getStats);
  const stats = getStats();

  const hasIssues =
    stats.duplicateExhibits.length > 0 ||
    stats.jumpPoints.length > 0 ||
    stats.repeatedPaths.length > 0;

  return (
    <div className="flex flex-col gap-2 p-3 border-b border-slate-200 bg-white">
      <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5">
        <Clock className="h-4 w-4 text-museum-teal shrink-0" />
        <span className="text-xs text-slate-500">总时长</span>
        <span className="ml-auto text-sm font-semibold text-museum-teal-dark">
          {formatDuration(stats.totalDuration)}
        </span>
      </div>

      {stats.duplicateExhibits.length > 0 ? (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-xs text-amber-700 font-medium">重复展品</span>
            {stats.duplicateExhibits.map((name) => (
              <span key={name} className="text-xs text-amber-600 truncate">{name}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5">
          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="text-xs text-slate-500">无重复展品</span>
        </div>
      )}

      {stats.jumpPoints.length > 0 ? (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-2.5">
          <Zap className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-xs text-red-700 font-medium">跳跃路径</span>
            {stats.jumpPoints.map((point) => (
              <span key={point} className="text-xs text-red-600 truncate">{point}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5">
          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="text-xs text-slate-500">无跳跃路径</span>
        </div>
      )}

      {stats.repeatedPaths.length > 0 ? (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-2.5">
          <Route className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-xs text-amber-700 font-medium">重复路径</span>
            {stats.repeatedPaths.map((path) => (
              <span key={path} className="text-xs text-amber-600 truncate">{path}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5">
          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="text-xs text-slate-500">无重复路径</span>
        </div>
      )}

      {!hasIssues && (
        <div className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 p-2.5">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <span className="text-xs text-emerald-700 font-medium">路线检查通过</span>
        </div>
      )}
    </div>
  );
}
