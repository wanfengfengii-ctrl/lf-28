import HallCanvas from '@/components/Canvas/HallCanvas';
import PlanPanel from '@/components/PlanPanel/PlanPanel';
import StatsPanel from '@/components/StatsPanel/StatsPanel';
import PlayerBar from '@/components/PlayerBar/PlayerBar';
import ConfirmModal from '@/components/Modals/ConfirmModal';

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-museum-ivory">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto p-4">
          <HallCanvas />
        </div>
        <div className="w-[360px] border-l border-gray-200 bg-white flex flex-col overflow-hidden">
          <StatsPanel />
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <PlanPanel />
          </div>
        </div>
      </div>
      <PlayerBar />
      <ConfirmModal />
    </div>
  );
}
