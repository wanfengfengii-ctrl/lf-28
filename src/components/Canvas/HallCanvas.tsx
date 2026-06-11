import { useState, useMemo } from 'react';
import { useMuseumStore } from '@/store/museumStore';
import HallNode from './HallNode';
import ConnectionLine from './ConnectionLine';

function getHallCenter(hall: { x: number; y: number; width: number; height: number }) {
  return { x: hall.x + hall.width / 2, y: hall.y + hall.height / 2 };
}

export default function HallCanvas() {
  const halls = useMuseumStore((s) => s.halls);
  const exhibits = useMuseumStore((s) => s.exhibits);
  const connections = useMuseumStore((s) => s.connections);
  const plans = useMuseumStore((s) => s.plans);
  const activePlanId = useMuseumStore((s) => s.activePlanId);

  const [selectedHallId, setSelectedHallId] = useState<string | null>(null);

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

  return (
    <div className="w-full overflow-auto rounded-xl" style={{ background: '#1E293B' }}>
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
          />
        ))}

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
            isSelected={selectedHallId === hall.id}
            activeStopExhibitIds={activeStopExhibitIds}
            onSelect={setSelectedHallId}
          />
        ))}
      </svg>
    </div>
  );
}
