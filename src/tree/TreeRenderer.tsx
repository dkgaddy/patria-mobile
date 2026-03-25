import React, { useCallback } from 'react';
import Svg, { G, Path } from 'react-native-svg';
import { NodeCard } from './NodeCard';
import { SpouseOverlay } from './SpouseOverlay';
import { elbowPath, NH } from '../data/hierarchy';
import type { TreeLayoutResult } from './useTreeLayout';
import type { AppData } from '../data/types';

interface TreeRendererProps {
  layout: TreeLayoutResult;
  appData: AppData;
  selectedId: string | null;
  onSelectPerson: (id: string) => void;
  onToggle: (id: string) => void;
}

export function TreeRenderer({
  layout, appData, selectedId, onSelectPerson, onToggle,
}: TreeRendererProps) {
  const { nodes, links, spouseOverlays, svgWidth, svgHeight, originX, originY } = layout;

  const handleToggle = useCallback((id: string) => {
    onToggle(id);
  }, [onToggle]);

  return (
    <Svg
      width={svgWidth}
      height={svgHeight}
      style={{ position: 'absolute', left: originX, top: originY }}
    >
      <G>
        {/* Connector lines */}
        {links.map(link => (
          <Path
            key={`${link.sourceX}-${link.sourceY}-${link.targetX}-${link.targetY}`}
            d={elbowPath(link.sourceX, link.sourceY, link.targetX, link.targetY)}
            stroke="#8a7060"
            strokeWidth={1.2}
            fill="none"
            opacity={0.6}
          />
        ))}

        {/* Spouse overlays (rendered below main nodes so lines go behind cards) */}
        {spouseOverlays.map(s => (
          <SpouseOverlay
            key={`${s.husbandId}-${s.wifeId}`}
            wifeId={s.wifeId}
            husbandX={s.husbandX}
            husbandY={s.husbandY}
            slotIndex={s.slotIndex}
            isConcubine={s.isConcubine}
            person={appData.personsMap[s.wifeId] ?? {} as any}
            isSelected={selectedId === s.wifeId}
            onPress={onSelectPerson}
            clipId={`clip-${s.wifeId}`}
          />
        ))}

        {/* Main tree nodes */}
        {nodes.map(node => (
          <NodeCard
            key={node.id}
            id={node.id}
            x={node.x}
            y={node.y}
            person={node.person}
            isSelected={selectedId === node.id}
            hasChildren={node.hasChildren}
            isCollapsed={node.isCollapsed}
            onPress={onSelectPerson}
            onToggle={handleToggle}
            clipId={`clip-${node.id}`}
          />
        ))}
      </G>
    </Svg>
  );
}
