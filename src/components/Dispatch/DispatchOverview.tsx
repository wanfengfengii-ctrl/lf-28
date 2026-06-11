import { useMuseumStore } from '@/store/museumStore';
import {
  Users,
  Building2,
  AlertTriangle,
  CheckCircle,
  UsersRound,
  Bell,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  delay?: number;
}

function MetricCard({ label, value, icon, color, trend = 'neutral', delay = 0 }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-5 border-l-4"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-800">{value}</span>
            {trend === 'up' && (
              <span className="flex items-center text-xs text-red-500">
                <TrendingUp size={14} className="mr-0.5" />
                上升
              </span>
            )}
            {trend === 'down' && (
              <span className="flex items-center text-xs text-green-500">
                <TrendingDown size={14} className="mr-0.5" />
                下降
              </span>
            )}
          </div>
        </div>
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

export default function DispatchOverview() {
  const { timeSlots, hallCapacities, guideResources, congestionAlerts } = useMuseumStore();

  const totalExpectedVisitors = timeSlots.reduce((sum, t) => sum + t.expectedVisitors, 0);
  const totalActualVisitors = timeSlots.reduce((sum, t) => sum + t.actualVisitors, 0);
  const normalHalls = hallCapacities.filter((h) => h.status === 'normal').length;
  const warningHalls = hallCapacities.filter((h) => h.status === 'warning').length;
  const criticalHalls = hallCapacities.filter((h) => h.status === 'critical').length;
  const availableResources = guideResources.filter((r) => r.status === 'available').length;
  const activeAlerts = congestionAlerts.filter((a) => !a.resolved).length;

  const visitorTrend = totalActualVisitors > totalExpectedVisitors ? 'up' : 'down';

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      <MetricCard
        label="今日预计接待"
        value={totalExpectedVisitors}
        icon={<Users size={22} />}
        color="#3B82F6"
        delay={0}
      />
      <MetricCard
        label="当前实际人数"
        value={totalActualVisitors}
        icon={<UsersRound size={22} />}
        color="#8B5CF6"
        trend={visitorTrend as 'up' | 'down'}
        delay={0.05}
      />
      <MetricCard
        label="正常展厅"
        value={normalHalls}
        icon={<CheckCircle size={22} />}
        color="#10B981"
        delay={0.1}
      />
      <MetricCard
        label="预警展厅"
        value={warningHalls}
        icon={<AlertTriangle size={22} />}
        color="#F59E0B"
        delay={0.15}
      />
      <MetricCard
        label="拥挤展厅"
        value={criticalHalls}
        icon={<Building2 size={22} />}
        color="#EF4444"
        delay={0.2}
      />
      <MetricCard
        label="可用资源"
        value={availableResources}
        icon={<UsersRound size={22} />}
        color="#14B8A6"
        delay={0.25}
      />
      <MetricCard
        label="活跃预警"
        value={activeAlerts}
        icon={<Bell size={22} />}
        color="#EC4899"
        delay={0.3}
      />
    </div>
  );
}
