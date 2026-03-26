import React, { useCallback } from 'react';
import Svg, { G, Path } from 'react-native-svg';
import { NodeCard } from './NodeCard';
import { SpouseOverlay } from './SpouseOverlay';
import { elbowPath, NH } from '../data/hierarchy';
import type { TreeLayoutResult } from './useTreeLayout';
import type { AppData } from '../data/types';

// The SVG is positioned at AV(originX, originY) via absolute style.
// Without a G offset, nodes at negative tree-x coords land at negative SVG coords
// and get clipped by the SVG element. The G translate(-originX, -originY) shifts
// all nodes into positive SVG-coordinate space, while the SVG's absolute position
// cancels the shift so AV-coords equal tree-coords (AV(tx, ty) = tree(tx, ty)).
// This means the pan/zoom transform in TreeCanvas can use the simple formulas:
//   screen = (tx * scale + translateX, ty * scale + translateY)

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
      {/* Shift all content so tree-coords map to positive SVG coords */}
      <G transform={`translate(${-originX}, ${-originY})`}>
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
      </G>
    </Svg>
  );
}
