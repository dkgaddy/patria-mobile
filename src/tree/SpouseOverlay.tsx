import React from 'react';
import { G, Line } from 'react-native-svg';
import { NodeCard } from './NodeCard';
import { NW, NH } from '../data/hierarchy';
import type { PersonRecord } from '../data/types';

// Horizontal spacing between husband and first wife, and between additional wives
const SPOUSE_GAP = NW + 24;

interface SpouseOverlayProps {
  wifeId: string;
  husbandX: number;
  husbandY: number;
  slotIndex: number;
  isConcubine: boolean;
  person: PersonRecord;
  isSelected: boolean;
  onPress: (id: string) => void;
  clipId: string;
}

function SpouseOverlayInner({
  wifeId, husbandX, husbandY, slotIndex,
  isConcubine, person, isSelected, onPress, clipId,
}: SpouseOverlayProps) {
  // Position: to the right of the husband card
  const wifeX = husbandX + (NW / 2) + SPOUSE_GAP * (slotIndex + 1);
  const wifeY = husbandY;

  // Connection line from husband card right-center to wife card left-center
  const lineX1 = husbandX + (NW / 2) + SPOUSE_GAP * slotIndex + NW;
  const lineY1 = husbandY + NH / 2;
  const lineX2 = wifeX - NW / 2;
  const lineY2 = wifeY + NH / 2;

  return (
    <G>
      {/* Marriage / concubine line */}
      <Line
        x1={lineX1} y1={lineY1}
        x2={lineX2} y2={lineY2}
        stroke={isConcubine ? '#c07030' : '#9060a0'}
        strokeWidth={1.5}
        strokeDasharray="5,4"
        opacity={0.75}
      />

      {/* Wife card */}
      <NodeCard
        id={wifeId}
        x={wifeX}
        y={wifeY}
        person={person}
        isSelected={isSelected}
        hasChildren={false}
        isCollapsed={false}
        onPress={onPress}
        onToggle={() => {}}
        clipId={clipId}
      />
    </G>
  );
}

export const SpouseOverlay = React.memo(SpouseOverlayInner, (prev, next) =>
  prev.husbandX  === next.husbandX &&
  prev.husbandY  === next.husbandY &&
  prev.slotIndex === next.slotIndex &&
  prev.isSelected === next.isSelected
);
