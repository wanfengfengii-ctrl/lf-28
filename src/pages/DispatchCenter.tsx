import { useState } from 'react';
import { useDispatchAlertStore } from '@/store/museumStore';
import DispatchOverview from '@/components/Dispatch/DispatchOverview';
import TimeSlotManager from '@/components/Dispatch/TimeSlotManager';
import HallCapacityMonitor from '@/components/Dispatch/HallCapacityMonitor';
import ResourceAllocation from '@/components/Dispatch/ResourceAllocation';
import CongestionAlertPanel from '@/components/Dispatch/CongestionAlertPanel';
import {
  LayoutDashboard,
  Clock,
  Building2,
  Users,
  AlertTriangle,
  Download,
  FileDown,
} from 'lucide-react';

type TabType = 'overview' | 'timeslots' | 'capacity' | 'resources' | 'alerts';

const TABS: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
  { id: 'overview', label: '总览看板', icon: <LayoutDashboard size={15} /> },
  { id: 'timeslots', label: '分时批次', icon: <Clock size={15} /> },
  { id: 'capacity', label: '展厅容量', icon: <Building2 size={15} /> },
  { id: 'resources', label: '资源调度', icon: <Users size={15} /> },
  { id: 'alerts', label: '预警与路线', icon: <AlertTriangle size={15} /> },
];

export default function DispatchCenter() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const exportDispatchPlan = useDispatchAlertStore((s) => s.exportDispatchPlan);

  function handleExport() {
    const data = exportDispatchPlan();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `museum-dispatch-${data.date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportCSV() {
    const data = exportDispatchPlan();
    const lines: string[] = [];
    
    lines.push('博物馆观众分流与导览容量调度方案');
    lines.push(`导出日期,${data.date}`);
    lines.push('');
    
    lines.push('=== 统计概览 ===');
    lines.push('指标,数值');
    lines.push(`今日预计接待人数,${data.summary.totalExpectedVisitors}`);
    lines.push(`今日实际人数,${data.summary.totalActualVisitors}`);
    lines.push(`正常展厅数,${data.summary.normalHalls}`);
    lines.push(`预警展厅数,${data.summary.warningHalls}`);
    lines.push(`拥挤展厅数,${data.summary.criticalHalls}`);
    lines.push(`可用资源数,${data.summary.availableResources}`);
    lines.push(`活跃预警数,${data.summary.activeAlerts}`);
    lines.push('');
    
    lines.push('=== 分时入场批次 ===');
    lines.push('开始时间,结束时间,预计人数,实际人数,状态');
    for (const slot of data.timeSlots) {
      lines.push(`${slot.startTime},${slot.endTime},${slot.expectedVisitors},${slot.actualVisitors},${slot.status}`);
    }
    lines.push('');
    
    lines.push('=== 展厅容量 ===');
    lines.push('展厅名称,当前人数,最大容量,预警阈值,拥挤阈值,状态');
    for (const cap of data.hallCapacities) {
      lines.push(`${cap.hallName},${cap.currentVisitors},${cap.maxCapacity},${cap.warningThreshold},${cap.criticalThreshold},${cap.status}`);
    }
    lines.push('');
    
    lines.push('=== 导览资源 ===');
    lines.push('名称,类型,状态,联系方式');
    for (const r of data.resources) {
      lines.push(`"${r.name}","${r.type}","${r.status}","${r.contact || ''}"`);
    }
    
    const csv = lines.join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `museum-dispatch-${data.date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col h-full bg-museum-ivory">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-800">
            观众分流与导览容量调度中心
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            管理分时入场批次、展厅承载能力、导览资源分配与拥堵预警
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <FileDown size={16} />
            导出 CSV
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-museum-teal text-white text-sm hover:bg-museum-teal-dark transition-colors shadow-md"
          >
            <Download size={16} />
            导出调度方案
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-museum-gold text-museum-gold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            <DispatchOverview />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <TimeSlotManager />
              </div>
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <HallCapacityMonitor />
              </div>
            </div>
          </div>
        )}
        {activeTab === 'timeslots' && (
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <TimeSlotManager />
              </div>
            </div>
          </div>
        )}
        {activeTab === 'capacity' && (
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <HallCapacityMonitor />
              </div>
            </div>
          </div>
        )}
        {activeTab === 'resources' && (
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-md overflow-hidden h-[calc(100vh-200px)]">
                <ResourceAllocation />
              </div>
            </div>
          </div>
        )}
        {activeTab === 'alerts' && (
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-md overflow-hidden h-[calc(100vh-200px)]">
                <CongestionAlertPanel />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
