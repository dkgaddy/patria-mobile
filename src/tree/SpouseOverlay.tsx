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
  isLocked: boolean;
  onPress: (id: string) => void;
  clipId: string;
}

function SpouseOverlayInner({
  wifeId, husbandX, husbandY, slotIndex,
  isConcubine, person, isSelected, isLocked, onPress, clipId,
}: SpouseOverlayProps) {
  // Position: to the right of the husband card
  const wifeX = husbandX + (NW / 2) + SPOUSE_GAP * (slotIndex + 1);
  const wifeY = husbandY;

  // Connection line: from right edge of card to the left, to left edge of this wife card
  // For slotIndex=0: right edge of husband = husbandX + NW/2
  // For slotIndex>0: right edge of previous wife = husbandX + NW/2 + SPOUSE_GAP*slotIndex + NW/2
  const lineX1 = slotIndex === 0
    ? husbandX + NW / 2
    : husbandX + NW / 2 + SPOUSE_GAP * slotIndex + NW / 2;
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
        isLocked={isLocked}
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
  prev.isSelected === next.isSelected &&
  prev.isLocked  === next.isLocked
);
