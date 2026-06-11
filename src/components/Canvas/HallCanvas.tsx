import { useState, useMemo, useRef, useEffect } from 'react';
import { useMuseumStore } from '@/store/museumStore';
import HallNode from './HallNode';
import ConnectionLine from './ConnectionLine';
import type { HallConnection } from '@/types';
import {
  Plus,
  Minus,
  Star,
  Trash2,
  Link2,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

function getHallCenter(hall: { x: number; y: number; width: number; height: number }) {
  return { x: hall.x + hall.width / 2, y: hall.y + hall.height / 2 };
}

const PRIORITY_OPTIONS = [
  { value: 1, label: 'P1 低优', color: '#99F6E4', desc: '不推荐绕行' },
  { value: 2, label: 'P2 绕路', color: '#5EEAD4', desc: '较远但可行' },
  { value: 3, label: 'P3 常规', color: '#14B8A6', desc: '标准通道' },
  { value: 4, label: 'P4 推荐', color: '#FBBF24', desc: '较优路线' },
  { value: 5, label: 'P5 最优', color: '#F59E0B', desc: '主通道/最短' },
];

export default function HallCanvas() {
  const halls = useMuseumStore((s) => s.halls);
  const exhibits = useMuseumStore((s) => s.exhibits);
  const connections = useMuseumStore((s) => s.connections);
  const plans = useMuseumStore((s) => s.plans);
  const activePlanId = useMuseumStore((s) => s.activePlanId);
  const addConnection = useMuseumStore((s) => s.addConnection);
  const removeConnection = useMuseumStore((s) => s.removeConnection);
  const updateConnectionPriority = useMuseumStore((s) => s.updateConnectionPriority);

  const [selectedHallId, setSelectedHallId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [connectMode, setConnectMode] = useState(false);
  const [connectFromHallId, setConnectFromHallId] = useState<string | null>(null);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const activePlan = plans.find((p) => p.id === activePlanId);

  const activeStopExhibitIds = useMemo(() => {
    if (!activePlan) return new Set<string>();
    return new Set(activePlan.stops.map((s) => s.exhibitId));
  }, [activePlan]);

  const routeHallIds = useMemo(() => {
    if (!activePlan) return [];
    const ordered: string[] = [];
    let lastHallId: string | null = null;
    for (const stop of activePlan.stops) {
      const exhibit = exhibits.find((e) => e.id === stop.exhibitId);
      if (exhibit && exhibit.hallId !== lastHallId) {
        ordered.push(exhibit.hallId);
        lastHallId = exhibit.hallId;
      }
    }
    return ordered;
  }, [activePlan, exhibits]);

  const routeConnectionIds = useMemo(() => {
    if (routeHallIds.length < 2) return new Set<string>();
    const ids = new Set<string>();
    for (let i = 0; i < routeHallIds.length - 1; i++) {
      const from = routeHallIds[i];
      const to = routeHallIds[i + 1];
      const conn = connections.find(
        (c) =>
          (c.fromHallId === from && c.toHallId === to) ||
          (c.fromHallId === to && c.toHallId === from)
      );
      if (conn) ids.add(conn.id);
    }
    return ids;
  }, [routeHallIds, connections]);

  const selectedConnection = connections.find((c) => c.id === selectedConnectionId);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setSelectedConnectionId(null);
        setPopupPos(null);
      }
      if (!connectMode) {
        const target = e.target as HTMLElement;
        if (!target.closest('svg')) {
          setSelectedHallId(null);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [connectMode]);

  function handleConnectionClick(conn: HallConnection, e: React.MouseEvent) {
    if (connectMode) return;
    setSelectedConnectionId(conn.id);
    setSelectedHallId(null);
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      setPopupPos({
        x: Math.min(e.clientX - rect.left + container.scrollLeft, rect.width - 280),
        y: Math.max(e.clientY - rect.top + container.scrollTop - 20, 10),
      });
    }
  }

  function handleHallSelect(hallId: string) {
    if (connectMode) {
      if (!connectFromHallId) {
        setConnectFromHallId(hallId);
      } else if (connectFromHallId !== hallId) {
        const exists = connections.some(
          (c) =>
            (c.fromHallId === connectFromHallId && c.toHallId === hallId) ||
            (c.fromHallId === hallId && c.toHallId === connectFromHallId)
        );
        if (!exists) {
          addConnection({
            fromHallId: connectFromHallId,
            toHallId: hallId,
            priority: 3,
          });
        }
        setConnectFromHallId(null);
        setConnectMode(false);
      }
    } else {
      setSelectedHallId(hallId);
      setSelectedConnectionId(null);
      setPopupPos(null);
    }
  }

  function handlePriorityChange(priority: number) {
    if (selectedConnectionId) {
      updateConnectionPriority(selectedConnectionId, priority);
    }
  }

  function handleDeleteConnection() {
    if (selectedConnectionId) {
      removeConnection(selectedConnectionId);
      setSelectedConnectionId(null);
      setPopupPos(null);
    }
  }

  function getHallName(id: string) {
    return halls.find((h) => h.id === id)?.name || id;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3 px-1">
        <button
          onClick={() => {
            setConnectMode((v) => !v);
            setConnectFromHallId(null);
            setSelectedHallId(null);
            setSelectedConnectionId(null);
            setPopupPos(null);
          }}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            connectMode
              ? 'bg-museum-gold text-white shadow-md'
              : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
          }`}
        >
          <Link2 size={14} />
          {connectMode
            ? connectFromHallId
              ? `选择目标展厅：${getHallName(connectFromHallId)} → ?`
              : '选择起点展厅'
            : '创建连接'}
        </button>

        {connectMode && (
          <button
            onClick={() => {
              setConnectMode(false);
              setConnectFromHallId(null);
            }}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <X size={12} />
            取消
          </button>
        )}

        <div className="ml-auto flex items-center gap-3 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400"></span>
            当前方案路径
          </span>
          <span className="flex items-center gap-1">
            <Sparkles size={11} className="text-purple-400" />
            点击连接线可编辑优先级
          </span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="w-full flex-1 overflow-auto rounded-xl relative"
        style={{ background: '#1E293B' }}
        onClick={() => {
          if (!connectMode) {
            setSelectedHallId(null);
          }
        }}
      >
        <svg
          width={1000}
          height={560}
          viewBox="0 0 1000 560"
          className="block"
        >
          {connections.map((conn) => (
            <ConnectionLine
              key={conn.id}
              connection={conn}
              halls={halls}
              isRouteHighlighted={routeConnectionIds.has(conn.id)}
              isSelected={selectedConnectionId === conn.id}
              onClick={handleConnectionClick}
            />
          ))}

          {connectMode && connectFromHallId && (
            <circle
              cx={getHallCenter(halls.find((h) => h.id === connectFromHallId)!).x}
              cy={getHallCenter(halls.find((h) => h.id === connectFromHallId)!).y}
              r={28}
              fill="none"
              stroke="#F59E0B"
              strokeWidth={2}
              strokeDasharray="4 3"
            >
              <animate
                attributeName="r"
                values="24;32;24"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </circle>
          )}

          {activePlan && routeHallIds.length >= 2 && (
            <path
              d={routeHallIds
                .map((hid, i) => {
                  const hall = halls.find((h) => h.id === hid);
                  if (!hall) return '';
                  const c = getHallCenter(hall);
                  return `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`;
                })
                .join(' ')}
              fill="none"
              stroke="#F59E0B"
              strokeWidth={3}
              strokeDasharray="8 4"
              opacity={0.5}
            />
          )}

          {halls.map((hall) => (
            <HallNode
              key={hall.id}
              hall={hall}
              exhibits={exhibits}
              isSelected={selectedHallId === hall.id || connectFromHallId === hall.id}
              activeStopExhibitIds={activeStopExhibitIds}
              onSelect={handleHallSelect}
            />
          ))}
        </svg>

        {selectedConnection && popupPos && (
          <div
            ref={popupRef}
            className="absolute z-20 w-72 rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
            style={{ left: popupPos.x, top: popupPos.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between bg-slate-50 px-4 py-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Link2 size={15} className="text-museum-teal" />
                <span className="text-sm font-semibold text-slate-800">
                  编辑连接优先级
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedConnectionId(null);
                  setPopupPos(null);
                }}
                className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 border border-slate-200">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="text-xs font-medium text-slate-700 truncate">
                    {getHallName(selectedConnection.fromHallId)}
                  </span>
                  <ArrowRight size={12} className="text-slate-400 shrink-0" />
                  <span className="text-xs font-medium text-slate-700 truncate">
                    {getHallName(selectedConnection.toHallId)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-600">
                    优先级设置
                  </span>
                  <span className="text-[10px] text-slate-400">
                    用于智能排线优化
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {PRIORITY_OPTIONS.map((opt) => {
                    const active = selectedConnection.priority === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handlePriorityChange(opt.value)}
                        className={`group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-all ${
                          active
                            ? 'bg-slate-800 shadow-md'
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-slate-800"
                          style={{ backgroundColor: opt.color }}
                        >
                          P{opt.value}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-xs font-medium ${
                              active ? 'text-white' : 'text-slate-700'
                            }`}
                          >
                            {opt.label}
                          </div>
                          <div
                            className={`text-[10px] ${
                              active ? 'text-slate-300' : 'text-slate-400'
                            }`}
                          >
                            {opt.desc}
                          </div>
                        </div>
                        {active && (
                          <Star size={13} className="text-amber-400 fill-amber-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      handlePriorityChange(Math.max(1, selectedConnection.priority - 1))
                    }
                    disabled={selectedConnection.priority <= 1}
                    className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <div className="flex h-8 w-12 items-center justify-center rounded-md bg-slate-50 text-sm font-bold text-slate-800 tabular-nums border border-slate-200">
                    P{selectedConnection.priority}
                  </div>
                  <button
                    onClick={() =>
                      handlePriorityChange(Math.min(5, selectedConnection.priority + 1))
                    }
                    disabled={selectedConnection.priority >= 5}
                    className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  onClick={handleDeleteConnection}
                  className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={13} />
                  删除连接
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
