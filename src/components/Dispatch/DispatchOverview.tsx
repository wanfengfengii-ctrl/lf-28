import { useMemo } from 'react';
import { useMuseumStore } from '@/store/museumStore';
import {
  Users, Building2, AlertTriangle, CheckCircle, UsersRound, Bell, TrendingUp, TrendingDown, Zap, Bot, History, User, Mic, Clock, Activity, Route, PieChart
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  RESOURCE_TYPE_LABELS, ALERT_PROCESSING_STATUS_COLORS
} from '@/types';
import type { ResourceType } from '@/types';

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  delay?: number;
  subLabel?: string;
  subIcon?: React.ReactNode;
}

function MetricCard({ label, value, icon, color, trend = 'neutral', trendValue, delay = 0, subLabel, subIcon }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-4 border-l-4 flex flex-col gap-1"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-800 tabular-nums">{value}</span>
            {trend === 'up' && (
              <span className="flex items-center text-[10px] text-red-500">
                <TrendingUp size={12} className="mr-0.5" />
                {trendValue || '上升'}
              </span>
            )}
            {trend === 'down' && (
              <span className="flex items-center text-[10px] text-green-500">
                <TrendingDown size={12} className="mr-0.5" />
                {trendValue || '下降'}
              </span>
            )}
          </div>
          {(subLabel || subIcon) && (
            <div className="flex items-center gap-1 mt-0.5">
              {subIcon}
              <span className="text-[10px] text-slate-400">{subLabel}</span>
            </div>
          )}
        </div>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

const RESOURCE_ICONS: Record<ResourceType, React.ReactNode> = {
  guide: <User size={18} />,
  audio_device: <Mic size={18} />,
  volunteer: <UsersRound size={18} />,
};

export default function DispatchOverview() {
  const { timeSlots, hallCapacities, guideResources, congestionAlerts, dispatchRecords, resourceSnapshots, autoDispatchConfig } = useMuseumStore();

  const stats = useMemo(() => {
    const totalExpectedVisitors = timeSlots.reduce((sum, t) => sum + t.expectedVisitors, 0);
    const totalActualVisitors = timeSlots.reduce((sum, t) => sum + t.actualVisitors, 0);
    const normalHalls = hallCapacities.filter((h) => h.status === 'normal').length;
    const warningHalls = hallCapacities.filter((h) => h.status === 'warning').length;
    const criticalHalls = hallCapacities.filter((h) => h.status === 'critical').length;
    const availableResources = guideResources.filter((r) => r.status === 'available').length;
    const activeAlerts = congestionAlerts.filter((a) => !a.resolved).length;
    const pendingAlerts = congestionAlerts.filter((a) => !a.resolved && (a.processingStatus === 'pending' || a.processingStatus === 'auto_processing')).length;
    const routeRecommended = congestionAlerts.filter((a) => a.processingStatus === 'route_recommended').length;
    const resourcesDispatched = congestionAlerts.filter((a) => a.processingStatus === 'resources_dispatched').length;
    const resolvedAlerts = congestionAlerts.filter((a) => a.resolved).length;
    const autoDispatched = congestionAlerts.filter((a) => a.handledBy === 'system').length;
    const totalDispatches = dispatchRecords.length;
    const autoDispatches = dispatchRecords.filter((r) => r.operator === 'system').length;

    const resourceStats: Record<ResourceType, { total: number; available: number; assigned: number; busy: number; rest: number; rate: number }> = {
      guide: { total: 0, available: 0, assigned: 0, busy: 0, rest: 0, rate: 0 },
      volunteer: { total: 0, available: 0, assigned: 0, busy: 0, rest: 0, rate: 0 },
      audio_device: { total: 0, available: 0, assigned: 0, busy: 0, rest: 0, rate: 0 },
    };
    for (const r of guideResources) {
      resourceStats[r.type].total++;
      if (r.status === 'available') resourceStats[r.type].available++;
      else if (r.status === 'assigned') resourceStats[r.type].assigned++;
      else if (r.status === 'busy') resourceStats[r.type].busy++;
      else if (r.status === 'rest') resourceStats[r.type].rest++;
    }
    for (const key of Object.keys(resourceStats) as ResourceType[]) {
      const s = resourceStats[key];
      s.rate = s.total > 0 ? Math.round(((s.total - s.available) / s.total) * 100) : 0;
    }

    const latestSnapshots: Record<ResourceType, number | null> = { guide: null, volunteer: null, audio_device: null };
    for (const key of Object.keys(latestSnapshots) as ResourceType[]) {
      const snaps = resourceSnapshots.filter((s) => s.resourceType === key).sort((a, b) => b.timestamp - a.timestamp);
      if (snaps.length > 0) {
        latestSnapshots[key] = snaps[0].occupancyRate;
      }
    }

    return {
      totalExpectedVisitors,
      totalActualVisitors,
      normalHalls,
      warningHalls,
      criticalHalls,
      availableResources,
      activeAlerts,
      pendingAlerts,
      routeRecommended,
      resourcesDispatched,
      resolvedAlerts,
      autoDispatched,
      totalDispatches,
      autoDispatches,
      visitorTrend: totalActualVisitors > totalExpectedVisitors ? 'up' : 'down',
      resourceStats,
      latestSnapshots,
    };
  }, [timeSlots, hallCapacities, guideResources, congestionAlerts, dispatchRecords, resourceSnapshots]);

  const alertProcessingData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    for (const a of congestionAlerts) {
      if (a.resolved) {
        statusCounts['resolved'] = (statusCounts['resolved'] || 0) + 1;
      } else {
        statusCounts[a.processingStatus] = (statusCounts[a.processingStatus] || 0) + 1;
      }
    }
    return [
      { key: 'pending', label: '待处理', count: statusCounts['pending'] || 0, color: ALERT_PROCESSING_STATUS_COLORS['pending'] },
      { key: 'auto_processing', label: '处理中', count: statusCounts['auto_processing'] || 0, color: ALERT_PROCESSING_STATUS_COLORS['auto_processing'] },
      { key: 'route_recommended', label: '路线推荐', count: stats.routeRecommended || 0, color: ALERT_PROCESSING_STATUS_COLORS['route_recommended'] },
      { key: 'resources_dispatched', label: '资源调度', count: stats.resourcesDispatched || 0, color: ALERT_PROCESSING_STATUS_COLORS['resources_dispatched'] },
      { key: 'manually_handled', label: '人工处理', count: statusCounts['manually_handled'] || 0, color: ALERT_PROCESSING_STATUS_COLORS['manually_handled'] },
      { key: 'resolved', label: '已解决', count: stats.resolvedAlerts || 0, color: ALERT_PROCESSING_STATUS_COLORS['resolved'] },
    ].filter((d) => d.count > 0);
  }, [congestionAlerts, stats]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <MetricCard
          label="今日预计接待"
          value={stats.totalExpectedVisitors}
          icon={<Users size={20} />}
          color="#3B82F6"
          delay={0}
          subIcon={<Clock size={10} />}
          subLabel={`${timeSlots.filter((t) => t.status === 'completed').length} 批次已完成`}
        />
        <MetricCard
          label="当前实际人数"
          value={stats.totalActualVisitors}
          icon={<UsersRound size={20} />}
          color="#8B5CF6"
          trend={stats.visitorTrend as 'up' | 'down'}
          delay={0.05}
          subLabel={`${timeSlots.filter((t) => t.status === 'ongoing').length} 批次进行中`}
          subIcon={<Activity size={10} />}
        />
        <MetricCard
          label="正常展厅"
          value={`${stats.normalHalls}/${hallCapacities.length}`}
          icon={<CheckCircle size={20} />}
          color="#10B981"
          delay={0.1}
          subLabel={`预警 ${stats.warningHalls} · 拥挤 ${stats.criticalHalls}`}
          subIcon={<Building2 size={10} />}
        />
        <MetricCard
          label="活跃预警"
          value={stats.activeAlerts}
          icon={<Bell size={20} />}
          color="#EC4899"
          trend="neutral"
          delay={0.15}
          subLabel={`待处理 ${stats.pendingAlerts} · 已调度 ${stats.resourcesDispatched}`}
          subIcon={<AlertTriangle size={10} />}
        />
        <MetricCard
          label="智能调度"
          value={stats.totalDispatches}
          icon={<Zap size={20} />}
          color="#F59E0B"
          delay={0.2}
          subLabel={`系统自动 ${stats.autoDispatches} 次`}
          subIcon={<Bot size={10} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-xl shadow-md p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Bot size={16} className="text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-800">预警处理状态</h3>
              <p className="text-[10px] text-slate-400">实时处理进度</p>
            </div>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              autoDispatchConfig.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${autoDispatchConfig.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              {autoDispatchConfig.enabled ? '自动调度已开启' : '自动调度已关闭'}
            </span>
          </div>
          <div className="space-y-2.5">
            {alertProcessingData.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">暂无预警数据</div>
            ) : (
              alertProcessingData.map((item) => {
                const total = congestionAlerts.length;
                const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;
                return (
                  <div key={item.key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[11px] text-slate-600">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold tabular-nums" style={{ color: item.color }}>
                          {item.count}
                        </span>
                        <span className="text-[9px] text-slate-400">({percent}%)</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <History size={11} />
              共 {congestionAlerts.length} 条预警
            </div>
            <div className="flex items-center gap-1 text-[11px] text-indigo-600 font-medium">
              <CheckCircle size={11} />
              系统自动处理 {stats.autoDispatched}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-md p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
              <Users size={16} className="text-teal-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-800">资源占用变化</h3>
              <p className="text-[10px] text-slate-400">讲解员 · 志愿者 · 语音设备</p>
            </div>
            <span className="text-[11px] text-slate-500">
              可用 <span className="font-semibold text-slate-700">{stats.availableResources}</span>
            </span>
          </div>
          <div className="space-y-3.5">
            {(Object.keys(stats.resourceStats) as ResourceType[]).map((type) => {
              const s = stats.resourceStats[type];
              const color = s.rate >= 80 ? '#EF4444' : s.rate >= 60 ? '#F59E0B' : '#10B981';
              const prevRate = stats.latestSnapshots[type];
              const trendIcon = prevRate !== null ? (
                s.rate > prevRate ? (
                  <span className="flex items-center text-[9px] text-red-500">
                    <TrendingUp size={9} />
                    +{s.rate - prevRate}%
                  </span>
                ) : s.rate < prevRate ? (
                  <span className="flex items-center text-[9px] text-green-500">
                    <TrendingDown size={9} />
                    {s.rate - prevRate}%
                  </span>
                ) : null
              ) : null;
              return (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: `${color}15`, color }}
                    >
                      {RESOURCE_ICONS[type]}
                    </div>
                    <div className="flex-1">
                      <span className="text-[11px] font-medium text-slate-700">
                        {RESOURCE_TYPE_LABELS[type]}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold tabular-nums" style={{ color }}>
                      {s.rate}%
                    </span>
                    {trendIcon}
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${s.rate}%`, backgroundColor: color }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-0.5 text-[9px] text-slate-400">
                    <span>空闲 {s.available}</span>
                    <span>已分配 {s.assigned}</span>
                    <span>服务中 {s.busy}</span>
                    <span>休息 {s.rest}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-xl shadow-md p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Route size={16} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-800">近期调度结果</h3>
              <p className="text-[10px] text-slate-400">最近调度动作时间线</p>
            </div>
            <span className="text-[11px] text-amber-600 font-medium flex items-center gap-1">
              <Zap size={11} />
              {stats.autoDispatches} 次自动
            </span>
          </div>

          {dispatchRecords.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">暂无调度记录</div>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {dispatchRecords.slice(0, 5).map((record) => {
                const color = record.operator === 'system' ? '#6366F1' : '#F59E0B';
                const timeAgo = Math.floor((Date.now() - record.timestamp) / 60000);
                const timeStr = timeAgo < 1 ? '刚刚' : timeAgo < 60 ? `${Math.floor(timeAgo)}分钟前` : `${Math.floor(timeAgo / 60)}小时前`;
                return (
                  <div key={record.id} className="flex items-start gap-2 py-1.5 border-b border-slate-50 last:border-0">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: `${color}15`, color }}
                    >
                      {record.operator === 'system' ? <Bot size={10} /> : <User size={10} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium text-slate-700 truncate">
                          {record.description}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[9px] px-1 py-0.5 rounded ${
                            record.result === 'success' ? 'bg-emerald-100 text-emerald-600' : record.result === 'failed' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                          }`}
                        >
                          {record.result === 'success' ? '成功' : record.result === 'failed' ? '失败' : '待处理'}
                        </span>
                        <span className="text-[9px] text-slate-400">{timeStr}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[10px]">
            <div className="rounded-md bg-slate-50 px-2 py-1.5">
              <div className="flex items-center gap-1 text-slate-500 mb-0.5">
                <PieChart size={10} />
                <span>分配资源</span>
              </div>
              <div className="text-sm font-semibold text-slate-700 tabular-nums">
                {dispatchRecords.filter((r) => r.resourceId).length}
              </div>
            </div>
            <div className="rounded-md bg-slate-50 px-2 py-1.5">
              <div className="flex items-center gap-1 text-slate-500 mb-0.5">
                <Route size={10} />
                <span>推荐路线</span>
              </div>
              <div className="text-sm font-semibold text-slate-700 tabular-nums">
                {dispatchRecords.filter((r) => r.routeId).length}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
