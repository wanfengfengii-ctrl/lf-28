import { motion } from 'framer-motion';
import type { Hall, Exhibit } from '@/types';

interface HallNodeProps {
  hall: Hall;
  exhibits: Exhibit[];
  isSelected: boolean;
  activeStopExhibitIds: Set<string>;
  onSelect: (id: string) => void;
}

export default function HallNode({
  hall,
  exhibits,
  isSelected,
  activeStopExhibitIds,
  onSelect,
}: HallNodeProps) {
  const hallExhibits = exhibits.filter((e) => e.hallId === hall.id);
  const activeCount = hallExhibits.filter((e) => activeStopExhibitIds.has(e.id)).length;

  return (
    <motion.g
      onClick={() => onSelect(hall.id)}
      style={{ cursor: 'pointer' }}
      whileHover={{ scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <rect
        x={hall.x}
        y={hall.y}
        width={hall.width}
        height={hall.height}
        rx={12}
        ry={12}
        fill={isSelected ? 'rgba(15, 118, 110, 0.25)' : 'rgba(15, 118, 110, 0.1)'}
        stroke="#0F766E"
        strokeWidth={isSelected ? 2.5 : 1.5}
      />

      <text
        x={hall.x + hall.width / 2}
        y={hall.y + 22}
        textAnchor="middle"
        fill="#E2E8F0"
        fontSize={13}
        fontWeight={600}
      >
        {hall.name}
      </text>

      <rect
        x={hall.x + hall.width - 38}
        y={hall.y + 8}
        width={28}
        height={18}
        rx={9}
        fill="rgba(15, 118, 110, 0.6)"
      />
      <text
        x={hall.x + hall.width - 24}
        y={hall.y + 21}
        textAnchor="middle"
        fill="#E2E8F0"
        fontSize={10}
        fontWeight={500}
      >
        {hallExhibits.length}
      </text>

      {!isSelected &&
        hallExhibits.slice(0, 5).map((exhibit, i) => {
          const cx = hall.x + 20 + (i % 5) * 18;
          const cy = hall.y + hall.height - 20;
          const isActive = activeStopExhibitIds.has(exhibit.id);
          return (
            <circle
              key={exhibit.id}
              cx={cx}
              cy={cy}
              r={isActive ? 5 : 4}
              fill={isActive ? '#F59E0B' : 'rgba(148, 163, 184, 0.5)'}
              stroke={isActive ? '#FDE68A' : 'none'}
              strokeWidth={isActive ? 1.5 : 0}
            />
          );
        })}

      {isSelected && (
        <>
          {hallExhibits.slice(0, 4).map((exhibit, i) => {
            const isActive = activeStopExhibitIds.has(exhibit.id);
            return (
              <g key={exhibit.id}>
                {isActive && (
                  <circle
                    cx={hall.x + 14}
                    cy={hall.y + 42 + i * 20}
                    r={4}
                    fill="#F59E0B"
                    stroke="#FDE68A"
                    strokeWidth={1}
                  />
                )}
                <text
                  x={hall.x + (isActive ? 24 : 14)}
                  y={hall.y + 46 + i * 20}
                  fill="#CBD5E1"
                  fontSize={10}
                >
                  {exhibit.name}
                </text>
              </g>
            );
          })}
          {hallExhibits.length > 4 && (
            <text
              x={hall.x + 14}
              y={hall.y + 46 + 4 * 20}
              fill="#64748B"
              fontSize={10}
            >
              +{hallExhibits.length - 4} 更多
            </text>
          )}
        </>
      )}

      {activeCount > 0 && (
        <>
          <circle
            cx={hall.x + hall.width / 2}
            cy={hall.y - 8}
            r={8}
            fill="#F59E0B"
          />
          <text
            x={hall.x + hall.width / 2}
            y={hall.y - 4}
            textAnchor="middle"
            fill="#1E293B"
            fontSize={9}
            fontWeight={700}
          >
            {activeCount}
          </text>
        </>
      )}
    </motion.g>
  );
}
