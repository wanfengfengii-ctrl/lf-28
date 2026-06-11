import type { Hall, HallConnection } from '@/types';

interface ConnectionLineProps {
  connection: HallConnection;
  halls: Hall[];
  isRouteHighlighted?: boolean;
}

function getHallCenter(hall: Hall) {
  return { x: hall.x + hall.width / 2, y: hall.y + hall.height / 2 };
}

function getPriorityColor(priority: number): string {
  if (priority >= 3) return '#14B8A6';
  if (priority === 2) return '#5EEAD4';
  return '#99F6E4';
}

function getPriorityStroke(priority: number): string {
  if (priority >= 3) return '#0F766E';
  if (priority === 2) return '#14B8A6';
  return '#5EEAD4';
}

export default function ConnectionLine({
  connection,
  halls,
  isRouteHighlighted = false,
}: ConnectionLineProps) {
  const fromHall = halls.find((h) => h.id === connection.fromHallId);
  const toHall = halls.find((h) => h.id === connection.toHallId);
  if (!fromHall || !toHall) return null;

  const from = getHallCenter(fromHall);
  const to = getHallCenter(toHall);

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const cx = (from.x + to.x) / 2 - dy * 0.15;
  const cy = (from.y + to.y) / 2 + dx * 0.15;

  const pathD = `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
  const midX = (from.x + 2 * cx + to.x) / 4;
  const midY = (from.y + 2 * cy + to.y) / 4;

  const strokeColor = isRouteHighlighted
    ? '#F59E0B'
    : getPriorityStroke(connection.priority);
  const fillColor = isRouteHighlighted
    ? '#FDE68A'
    : getPriorityColor(connection.priority);

  return (
    <g>
      <defs>
        <marker
          id={`arrow-${connection.id}`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={strokeColor} />
        </marker>
      </defs>

      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={isRouteHighlighted ? 2.5 : 1.5}
        strokeDasharray={connection.priority > 2 ? '6 4' : 'none'}
        markerEnd={`url(#arrow-${connection.id})`}
        opacity={isRouteHighlighted ? 1 : 0.7}
      />

      <rect
        x={midX - 12}
        y={midY - 10}
        width={24}
        height={20}
        rx={10}
        fill={fillColor}
        opacity={0.9}
      />
      <text
        x={midX}
        y={midY + 4}
        textAnchor="middle"
        fill="#1E293B"
        fontSize={10}
        fontWeight={600}
      >
        P{connection.priority}
      </text>
    </g>
  );
}
