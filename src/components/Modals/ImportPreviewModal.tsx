import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useValidationImportStore } from '@/store/validationImportStore';
import {
  X,
  Upload,
  AlertTriangle,
  CheckCircle,
  Layers,
  Zap,
  MapPin,
  Route,
  Building2,
  Image,
  Link2,
  FolderKanban,
  ListChecks,
  Clock,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';

function formatDuration(seconds: number) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}分${sec}秒`;
}

export default function ImportPreviewModal() {
  const importPreview = useValidationImportStore((s) => s.importPreview);
  const cancelImport = useValidationImportStore((s) => s.cancelImport);
  const confirmImportAndOverride = useValidationImportStore((s) => s.confirmImportAndOverride);

  const [expandedPlans, setExpandedPlans] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  if (!importPreview) return null;

  const { summary, validation, planValidationReports } = importPreview;
  const hasCriticalErrors =
    !validation.valid ||
    planValidationReports.some((r) => r.report.hasCriticalIssues);
  const hasAnyIssues =
    hasCriticalErrors ||
    planValidationReports.some((r) => r.report.hasWarnings);

  function togglePlan(idx: number) {
    setExpandedPlans((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  function handleConfirm() {
    setError(null);
    const result = confirmImportAndOverride();
    if (!result.success) {
      setError(result.errors[0] || '导入失败');
    }
  }

  return (
    <AnimatePresence>
      {importPreview && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={cancelImport}
          />

          <motion.div
            className="relative z-10 w-full max-w-3xl max-h-[85vh] flex flex-col rounded-xl bg-white shadow-2xl overflow-hidden"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3 px-5 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-museum-teal/10">
                <Upload className="h-5 w-5 text-museum-teal" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-slate-800">
                  导入配置预览
                </h3>
                <p className="text-xs text-slate-500">
                  请预览校验结果，确认无误后再覆盖当前方案
                </p>
              </div>
              <button
                onClick={cancelImport}
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="grid grid-cols-5 gap-2">
                <div className="flex flex-col items-center gap-1 rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  <span className="text-lg font-semibold text-slate-800 tabular-nums">
                    {summary.hallsCount}
                  </span>
                  <span className="text-[10px] text-slate-500">展厅</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <Image className="h-4 w-4 text-slate-500" />
                  <span className="text-lg font-semibold text-slate-800 tabular-nums">
                    {summary.exhibitsCount}
                  </span>
                  <span className="text-[10px] text-slate-500">展品</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <Link2 className="h-4 w-4 text-slate-500" />
                  <span className="text-lg font-semibold text-slate-800 tabular-nums">
                    {summary.connectionsCount}
                  </span>
                  <span className="text-[10px] text-slate-500">连接</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <FolderKanban className="h-4 w-4 text-slate-500" />
                  <span className="text-lg font-semibold text-slate-800 tabular-nums">
                    {summary.plansCount}
                  </span>
                  <span className="text-[10px] text-slate-500">方案</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <ListChecks className="h-4 w-4 text-slate-500" />
                  <span className="text-lg font-semibold text-slate-800 tabular-nums">
                    {summary.totalStops}
                  </span>
                  <span className="text-[10px] text-slate-500">停靠点</span>
                </div>
              </div>

              {validation.errors.length > 0 && (
                <div className="flex flex-col gap-2 rounded-lg bg-red-50 p-4 border border-red-200">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-red-500 shrink-0" />
                    <span className="text-sm font-semibold text-red-700">
                      基础数据校验失败（{validation.errors.length}项）
                    </span>
                  </div>
                  <div className="space-y-1 pl-6">
                    {validation.errors.map((e, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-1.5 text-xs text-red-600"
                      >
                        <span className="text-red-400 mt-0.5">•</span>
                        <span>{e}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {validation.warnings.length > 0 && (
                <div className="flex flex-col gap-2 rounded-lg bg-amber-50 p-4 border border-amber-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="text-sm font-semibold text-amber-700">
                      基础数据警告（{validation.warnings.length}项）
                    </span>
                  </div>
                  <div className="space-y-1 pl-6">
                    {validation.warnings.map((w, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-1.5 text-xs text-amber-600"
                      >
                        <span className="text-amber-400 mt-0.5">•</span>
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-museum-teal" />
                  <span className="text-sm font-semibold text-slate-700">
                    方案路线校验详情
                  </span>
                </div>

                {planValidationReports.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 rounded-lg bg-slate-50 py-6 border border-dashed border-slate-200">
                    <Info className="h-4 w-4 text-slate-400" />
                    <span className="text-xs text-slate-500">没有包含任何方案</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {planValidationReports.map(({ planName, report }, idx) => {
                      const expanded = expandedPlans[idx];
                      const critical = report.hasCriticalIssues;
                      const warning = report.hasWarnings;
                      const ok = !critical && !warning;

                      return (
                        <div
                          key={idx}
                          className={`rounded-lg border overflow-hidden ${
                            critical
                              ? 'border-red-200 bg-red-50/50'
                              : warning
                              ? 'border-amber-200 bg-amber-50/50'
                              : 'border-emerald-200 bg-emerald-50/50'
                          }`}
                        >
                          <button
                            onClick={() => togglePlan(idx)}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left"
                          >
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                                critical
                                  ? 'bg-red-100'
                                  : warning
                                  ? 'bg-amber-100'
                                  : 'bg-emerald-100'
                              }`}
                            >
                              {critical ? (
                                <ShieldAlert
                                  className={`h-4 w-4 ${
                                    critical
                                      ? 'text-red-500'
                                      : 'text-amber-500'
                                  }`}
                                />
                              ) : ok ? (
                                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-800 truncate">
                                  {planName}
                                </span>
                                <span className="rounded bg-white/70 px-1.5 py-0.5 text-[10px] text-slate-600 tabular-nums border border-slate-200">
                                  {report.totalStops} 站
                                </span>
                                <span className="rounded bg-white/70 px-1.5 py-0.5 text-[10px] text-slate-600 tabular-nums border border-slate-200">
                                  <Clock className="h-3 w-3 inline mr-0.5 -mt-0.5" />
                                  {formatDuration(report.totalDuration)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                                {report.duplicateExhibits.length > 0 && (
                                  <span className="text-red-600">
                                    重复展品 {report.duplicateExhibits.length}
                                  </span>
                                )}
                                {report.disconnections.length > 0 && (
                                  <span className="text-red-600">
                                    断连 {report.disconnections.length}
                                  </span>
                                )}
                                {report.jumps.length > 0 && (
                                  <span className="text-orange-600">
                                    跳点 {report.jumps.length}
                                  </span>
                                )}
                                {report.repeatedPaths.length > 0 && (
                                  <span className="text-amber-600">
                                    重复路径 {report.repeatedPaths.length}
                                  </span>
                                )}
                                {ok && (
                                  <span className="text-emerald-600 font-medium">
                                    校验通过
                                  </span>
                                )}
                              </div>
                            </div>
                            {expanded ? (
                              <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                            )}
                          </button>

                          {expanded && (
                            <div className="border-t border-slate-200/60 p-4 space-y-3 bg-white/40">
                              {report.duplicateExhibits.length > 0 && (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-red-700">
                                    <Layers className="h-3.5 w-3.5" />
                                    重复展品
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 pl-5">
                                    {report.duplicateExhibits.map((d, i) => (
                                      <span
                                        key={i}
                                        className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded"
                                      >
                                        {d.exhibitName}（第
                                        {d.indices.map((x) => x + 1).join('、')}站）
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {report.disconnections.length > 0 && (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-red-700">
                                    <Zap className="h-3.5 w-3.5" />
                                    展厅断连
                                  </div>
                                  <div className="space-y-1 pl-5">
                                    {report.disconnections.map((d, i) => (
                                      <div
                                        key={i}
                                        className="text-[10px] text-red-600 flex flex-col gap-0.5"
                                      >
                                        <span>
                                          <span className="tabular-nums font-medium text-red-700 bg-red-100 rounded px-1">
                                            第{d.fromStopIndex + 1}→{d.toStopIndex + 1}站
                                          </span>
                                          <span className="mx-1">
                                            {d.fromExhibitName}→{d.toExhibitName}
                                          </span>
                                        </span>
                                        <span className="text-red-500 pl-1">
                                          原因：{d.reason}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {report.jumps.length > 0 && (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-orange-700">
                                    <MapPin className="h-3.5 w-3.5" />
                                    低优先级跳点
                                  </div>
                                  <div className="space-y-1 pl-5">
                                    {report.jumps.map((j, i) => (
                                      <div
                                        key={i}
                                        className="text-[10px] text-orange-600"
                                      >
                                        <span className="tabular-nums font-medium text-orange-700 bg-orange-100 rounded px-1">
                                          第{j.fromStopIndex + 1}→{j.toStopIndex + 1}站
                                        </span>
                                        <span className="mx-1">
                                          {j.fromHallName}→{j.toHallName}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {report.repeatedPaths.length > 0 && (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-700">
                                    <Route className="h-3.5 w-3.5" />
                                    重复路径
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 pl-5">
                                    {report.repeatedPaths.map((p, i) => (
                                      <span
                                        key={i}
                                        className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded"
                                      >
                                        {p.fromHallName}↔{p.toHallName}（×{p.count}）
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {ok && (
                                <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 border border-emerald-200">
                                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                                  <span className="text-xs text-emerald-700 font-medium">
                                    该方案路线校验全部通过
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 px-5 py-4 bg-slate-50 border-t border-slate-200">
              <div className="flex-1 min-w-0">
                {error && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {error}
                  </div>
                )}
                {!error && hasCriticalErrors && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600">
                    <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                    存在严重校验问题，需修正后才能导入
                  </div>
                )}
                {!error && !hasCriticalErrors && hasAnyIssues && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    存在优化建议，导入后可进一步调整路线
                  </div>
                )}
                {!error && !hasAnyIssues && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                    <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                    校验通过，可以安全导入覆盖
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelImport}
                  className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={hasCriticalErrors}
                  className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
                    hasCriticalErrors
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-museum-gold hover:bg-museum-gold-light'
                  }`}
                >
                  覆盖当前方案
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
