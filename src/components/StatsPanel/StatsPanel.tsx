import { useState } from 'react';
import { useRoutePlanStore } from '@/store/museumStore';
import {
  Clock,
  AlertTriangle,
  Zap,
  Route,
  CheckCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  MapPin,
  Info,
  Layers,
} from 'lucide-react';

function formatDuration(seconds: number) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}分${sec}秒`;
}

export default function StatsPanel() {
  const getValidationReport = useRoutePlanStore((s) => s.getValidationReport);
  const report = getValidationReport();

  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({
    duplicates: false,
    disconnections: false,
    jumps: false,
    repeatedPaths: false,
  });

  function toggleDetail(key: string) {
    setShowDetails((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (!report) {
    return (
      <div className="flex flex-col gap-2 p-3 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-center gap-2 rounded-lg bg-slate-50 p-3">
          <Info className="h-4 w-4 text-slate-400" />
          <span className="text-xs text-slate-500">请选择一个方案以查看校验结果</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3 border-b border-slate-200 bg-white">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-museum-teal shrink-0" />
        <span className="text-xs font-semibold text-slate-700">校验中心</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-slate-400">共 {report.totalStops} 站</span>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 tabular-nums">
            {formatDuration(report.totalDuration)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5">
        <Clock className="h-4 w-4 text-museum-teal shrink-0" />
        <span className="text-xs text-slate-500">总时长</span>
        <span className="ml-auto text-sm font-semibold text-museum-teal-dark tabular-nums">
          {formatDuration(report.totalDuration)}
        </span>
      </div>

      {report.duplicateExhibits.length > 0 ? (
        <div className="flex flex-col gap-1 rounded-lg bg-amber-50 p-2.5 border border-amber-100">
          <button
            onClick={() => toggleDetail('duplicates')}
            className="flex items-start gap-2 w-full text-left"
          >
            <Layers className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <span className="text-xs text-amber-700 font-medium flex items-center gap-1">
                重复展品
                <span className="rounded-full bg-amber-200 px-1.5 py-0 text-[10px] text-amber-800 tabular-nums">
                  {report.duplicateExhibits.length}
                </span>
              </span>
              <span className="text-xs text-amber-600 truncate">
                {report.duplicateExhibits.map((d) => d.exhibitName).join('、')}
              </span>
            </div>
            {showDetails.duplicates ? (
              <ChevronUp className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
            )}
          </button>
          {showDetails.duplicates && (
            <div className="mt-1.5 pt-1.5 border-t border-amber-200/60 space-y-1.5 pl-6">
              {report.duplicateExhibits.map((d) => (
                <div
                  key={d.exhibitId}
                  className="flex items-center gap-2 text-[11px] text-amber-700"
                >
                  <MapPin className="h-3 w-3 text-amber-500 shrink-0" />
                  <span className="font-medium">{d.exhibitName}</span>
                  <span className="text-amber-500">出现在：</span>
                  <span className="tabular-nums text-amber-800">
                    第 {d.indices.map((i) => i + 1).join('、')} 站
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5">
          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="text-xs text-slate-500">无重复展品</span>
        </div>
      )}

      {report.disconnections.length > 0 ? (
        <div className="flex flex-col gap-1 rounded-lg bg-red-50 p-2.5 border border-red-100">
          <button
            onClick={() => toggleDetail('disconnections')}
            className="flex items-start gap-2 w-full text-left"
          >
            <Zap className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <span className="text-xs text-red-700 font-medium flex items-center gap-1">
                展厅断连
                <span className="rounded-full bg-red-200 px-1.5 py-0 text-[10px] text-red-800 tabular-nums">
                  {report.disconnections.length}
                </span>
              </span>
              <span className="text-xs text-red-600 truncate">
                {report.disconnections.length} 处展厅之间无连接通道
              </span>
            </div>
            {showDetails.disconnections ? (
              <ChevronUp className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
            )}
          </button>
          {showDetails.disconnections && (
            <div className="mt-1.5 pt-1.5 border-t border-red-200/60 space-y-2 pl-6">
              {report.disconnections.map((d, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-[11px] text-red-700">
                    <span className="tabular-nums font-medium text-red-800 bg-red-100 rounded px-1.5 py-0.5">
                      第{d.fromStopIndex + 1}→{d.toStopIndex + 1}站
                    </span>
                  </div>
                  <div className="text-[11px] text-red-700">
                    <span className="font-medium">{d.fromExhibitName}</span>
                    <span className="text-red-500 mx-1">→</span>
                    <span className="font-medium">{d.toExhibitName}</span>
                  </div>
                  <div className="text-[10px] text-red-500 flex items-start gap-1">
                    <Info className="h-3 w-3 shrink-0 mt-0.5" />
                    <span>{d.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5">
          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="text-xs text-slate-500">无展厅断连</span>
        </div>
      )}

      {report.jumps.length > 0 ? (
        <div className="flex flex-col gap-1 rounded-lg bg-orange-50 p-2.5 border border-orange-100">
          <button
            onClick={() => toggleDetail('jumps')}
            className="flex items-start gap-2 w-full text-left"
          >
            <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <span className="text-xs text-orange-700 font-medium flex items-center gap-1">
                低优先级跳点
                <span className="rounded-full bg-orange-200 px-1.5 py-0 text-[10px] text-orange-800 tabular-nums">
                  {report.jumps.length}
                </span>
              </span>
              <span className="text-xs text-orange-600 truncate">
                存在通过低优先级通道的跳转
              </span>
            </div>
            {showDetails.jumps ? (
              <ChevronUp className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
            )}
          </button>
          {showDetails.jumps && (
            <div className="mt-1.5 pt-1.5 border-t border-orange-200/60 space-y-1.5 pl-6">
              {report.jumps.map((j, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-0.5 text-[11px] text-orange-700"
                >
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums font-medium text-orange-800 bg-orange-100 rounded px-1.5 py-0.5">
                      第{j.fromStopIndex + 1}→{j.toStopIndex + 1}站
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">{j.fromExhibitName}</span>
                    <span className="text-orange-500 mx-1">({j.fromHallName})</span>
                    <span className="text-orange-500">→</span>
                    <span className="font-medium ml-1">{j.toExhibitName}</span>
                    <span className="text-orange-500 mx-1">({j.toHallName})</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5">
          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="text-xs text-slate-500">无低优先级跳点</span>
        </div>
      )}

      {report.repeatedPaths.length > 0 ? (
        <div className="flex flex-col gap-1 rounded-lg bg-amber-50 p-2.5 border border-amber-100">
          <button
            onClick={() => toggleDetail('repeatedPaths')}
            className="flex items-start gap-2 w-full text-left"
          >
            <Route className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <span className="text-xs text-amber-700 font-medium flex items-center gap-1">
                重复路径
                <span className="rounded-full bg-amber-200 px-1.5 py-0 text-[10px] text-amber-800 tabular-nums">
                  {report.repeatedPaths.length}
                </span>
              </span>
              <span className="text-xs text-amber-600 truncate">
                {report.repeatedPaths.map((p) => `${p.fromHallName}↔${p.toHallName}`).join('、')}
              </span>
            </div>
            {showDetails.repeatedPaths ? (
              <ChevronUp className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
            )}
          </button>
          {showDetails.repeatedPaths && (
            <div className="mt-1.5 pt-1.5 border-t border-amber-200/60 space-y-2 pl-6">
              {report.repeatedPaths.map((p, idx) => (
                <div key={idx} className="flex flex-col gap-0.5 text-[11px] text-amber-700">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.fromHallName}</span>
                    <span className="text-amber-500">↔</span>
                    <span className="font-medium">{p.toHallName}</span>
                    <span className="ml-auto rounded bg-amber-200 px-1.5 py-0 text-[10px] font-medium text-amber-800 tabular-nums">
                      往返 ×{p.count}
                    </span>
                  </div>
                  <div className="text-[10px] text-amber-600 flex flex-wrap gap-1">
                    {p.occurrences.map((o, oi) => (
                      <span key={oi} className="bg-amber-100 rounded px-1.5 py-0.5 tabular-nums">
                        第{o.fromIndex + 1}→{o.toIndex + 1}站
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5">
          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="text-xs text-slate-500">无重复路径</span>
        </div>
      )}

      {!report.hasCriticalIssues && !report.hasWarnings ? (
        <div className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 p-2.5 border border-emerald-100">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <span className="text-xs text-emerald-700 font-medium">路线校验全部通过</span>
        </div>
      ) : report.hasCriticalIssues ? (
        <div className="flex items-center justify-center gap-1.5 rounded-lg bg-red-50 p-2.5 border border-red-100">
          <Zap className="h-4 w-4 text-red-500" />
          <span className="text-xs text-red-700 font-medium">存在严重问题，建议修复后再导出</span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-1.5 rounded-lg bg-amber-50 p-2.5 border border-amber-100">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span className="text-xs text-amber-700 font-medium">存在优化建议，可考虑调整路线</span>
        </div>
      )}
    </div>
  );
}
