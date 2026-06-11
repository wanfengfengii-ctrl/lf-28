import { motion } from 'framer-motion';
import type { Hall, HallConnection } from '@/types';

interface ConnectionLineProps {
  connection: HallConnection;
  halls: Hall[];
  isRouteHighlighted?: boolean;
  isSelected?: boolean;
  onClick?: (connection: HallConnection, e: React.MouseEvent) => void;
}

function getHallCenter(hall: Hall) {
  return { x: hall.x + hall.width / 2, y: hall.y + hall.height / 2 };
}

function getPriorityColor(priority: number): string {
  if (priority >= 5) return '#F59E0B';
  if (priority >= 4) return '#FBBF24';
  if (priority >= 3) return '#14B8A6';
  if (priority === 2) return '#5EEAD4';
  return '#99F6E4';
}

function getPriorityStroke(priority: number): string {
  if (priority >= 5) return '#D97706';
  if (priority >= 4) return '#F59E0B';
  if (priority >= 3) return '#0F766E';
  if (priority === 2) return '#14B8A6';
  return '#5EEAD4';
}

function getPriorityLabel(priority: number): string {
  if (priority >= 5) return '最优';
  if (priority === 4) return '推荐';
  if (priority === 3) return '常规';
  if (priority === 2) return '绕路';
  return '低优';
}

export default function ConnectionLine({
  connection,
  halls,
  isRouteHighlighted = false,
  isSelected = false,
  onClick,
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

  const strokeColor = isSelected
    ? '#A855F7'
    : isRouteHighlighted
    ? '#F59E0B'
    : getPriorityStroke(connection.priority);
  const fillColor = isSelected
    ? '#C084FC'
    : isRouteHighlighted
    ? '#FDE68A'
    : getPriorityColor(connection.priority);
  const strokeWidth = isSelected
    ? 3.5
    : isRouteHighlighted
    ? 2.5
    : 1.5;

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (onClick) onClick(connection, e);
  }

  return (
    <g style={{ cursor: onClick ? 'pointer' : 'default' }} onClick={handleClick}>
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

      <motion.path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={connection.priority >= 4 ? '6 4' : 'none'}
        markerEnd={`url(#arrow-${connection.id})`}
        opacity={isSelected || isRouteHighlighted ? 1 : 0.7}
        whileHover={{ strokeWidth: strokeWidth + 1, opacity: 1 }}
        transition={{ duration: 0.1 }}
      />

      <motion.g whileHover={{ scale: 1.12 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }}>
        <rect
          x={midX - 28}
          y={midY - 12}
          width={56}
          height={24}
          rx={12}
          fill={fillColor}
          stroke={isSelected ? '#7E22CE' : 'rgba(30, 41, 59, 0.25)'}
          strokeWidth={isSelected ? 2 : 0.5}
          opacity={0.95}
        />
        <text
          x={midX}
          y={midY - 1}
          textAnchor="middle"
          fill="#1E293B"
          fontSize={9}
          fontWeight={700}
        >
          P{connection.priority}
        </text>
        <text
          x={midX}
          y={midY + 8}
          textAnchor="middle"
          fill="#334155"
          fontSize={8}
          fontWeight={500}
        >
          {getPriorityLabel(connection.priority)}
        </text>
      </motion.g>
    </g>
  );
}
