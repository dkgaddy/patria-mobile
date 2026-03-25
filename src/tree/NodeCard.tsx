import React from 'react';
import { G, Rect, Circle, Ellipse, Path, Text as SvgText, Image as SvgImage, ClipPath, Defs } from 'react-native-svg';
import { getCardColors, NW, NH, AV_R, AV_CX, AV_CY } from '../data/hierarchy';
import type { PersonRecord } from '../data/types';

// Font Awesome 6 Free solid paths (viewBox 0 0 512 512)
// Scaled to 18px: scale(18/512) translate(-256,-256) = scale(0.03515625) translate(-256,-256)
const FA_ICON_TRANSFORM = 'scale(0.03515625) translate(-256 -256)';
export const FA_CIRCLE_PLUS  = 'M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM232 344V280H168c-13.3 0-24-10.7-24-24s10.7-24 24-24h64V168c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24H280v64c0 13.3-10.7 24-24 24s-24-10.7-24-24z';
export const FA_CIRCLE_MINUS = 'M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM184 232H328c13.3 0 24 10.7 24 24s-10.7 24-24 24H184c-13.3 0-24-10.7-24-24s10.7-24 24-24z';

const IMAGE_BASE = 'https://patria.explosiveconcepts.com/pix/';

interface NodeCardProps {
  id: string;
  x: number;
  y: number;
  person: PersonRecord;
  isSelected: boolean;
  hasChildren: boolean;
  isCollapsed: boolean;
  onPress: (id: string) => void;
  onToggle: (id: string) => void;
  clipId: string; // unique clip-path id for this card
}

function NodeCardInner({
  id, x, y, person, isSelected, hasChildren, isCollapsed, onPress, onToggle, clipId,
}: NodeCardProps) {
  const sex = (person.sex || '').toLowerCase();
  const c   = getCardColors(sex, id);
  const name    = person.person_name || id;
  const surname = person.surname || '';
  const tribe   = person.tribe || '';
  const displayName = name + (surname ? ' ' + surname : '');
  const nameLine = displayName.length > 12 ? displayName.slice(0, 11) + '…' : displayName;

  const imageUrl = `${IMAGE_BASE}${id}.jpg`;

  return (
    <G transform={`translate(${x - NW / 2}, ${y})`} onPress={() => onPress(id)}>
      <Defs>
        <ClipPath id={clipId}>
          <Circle cx={AV_CX} cy={AV_CY} r={AV_R} />
        </ClipPath>
      </Defs>

      {/* Jesus halo ring */}
      {id === 'Jesus_1' && (
        <Rect
          x={-5} y={-5}
          width={NW + 10} height={NH + 10}
          rx={12} ry={12}
          fill="none"
          stroke="#c8a85a"
          strokeWidth={3}
          opacity={0.85}
        />
      )}

      {/* Selection highlight */}
      {isSelected && (
        <Rect
          x={-3} y={-3}
          width={NW + 6} height={NH + 6}
          rx={10} ry={10}
          fill="none"
          stroke="#c9a050"
          strokeWidth={2.5}
          opacity={0.9}
        />
      )}

      {/* Card background */}
      <Rect
        width={NW} height={NH}
        rx={8} ry={8}
        fill={c.card}
        stroke={c.border}
        strokeWidth={1.5}
      />

      {/* Avatar background */}
      <Circle
        cx={AV_CX} cy={AV_CY}
        r={AV_R + 2}
        fill={c.avatarBg}
        clipPath={`url(#${clipId})`}
      />

      {/* Silhouette head */}
      <Circle
        cx={AV_CX} cy={AV_CY - 9}
        r={12}
        fill={c.sil}
        opacity={0.88}
        clipPath={`url(#${clipId})`}
      />

      {/* Silhouette shoulders */}
      <Ellipse
        cx={AV_CX} cy={AV_CY + AV_R + 2}
        rx={AV_R - 2} ry={AV_R - 4}
        fill={c.sil}
        opacity={0.8}
        clipPath={`url(#${clipId})`}
      />

      {/* Profile photo */}
      <SvgImage
        x={AV_CX - AV_R} y={AV_CY - AV_R}
        width={AV_R * 2} height={AV_R * 2}
        preserveAspectRatio="xMidYMid slice"
        href={imageUrl}
        clipPath={`url(#${clipId})`}
      />

      {/* Avatar ring border */}
      <Circle
        cx={AV_CX} cy={AV_CY}
        r={AV_R}
        fill="none"
        stroke={c.border}
        strokeWidth={2}
        opacity={0.9}
      />

      {/* Name */}
      <SvgText
        x={AV_CX} y={AV_CY + AV_R + 14}
        textAnchor="middle"
        fill={c.nameColor}
        fontSize={10}
        fontWeight="600"
      >
        {nameLine}
      </SvgText>

      {/* Tribe */}
      {tribe ? (
        <SvgText
          x={AV_CX} y={NH - 7}
          textAnchor="middle"
          fill={c.tribeColor}
          fontSize={7.5}
        >
          {tribe.slice(0, 15)}
        </SvgText>
      ) : null}

      {/* Toggle button */}
      {hasChildren && (
        <G
          transform={`translate(${NW / 2}, ${NH + 14})`}
          onPress={(e) => { (e as any).stopPropagation?.(); onToggle(id); }}
        >
          <Circle cx={0} cy={0} r={11} fill="rgba(20,10,5,0.55)" />
          <G transform={FA_ICON_TRANSFORM}>
            <Path
              d={isCollapsed ? FA_CIRCLE_PLUS : FA_CIRCLE_MINUS}
              fill="#c9a050"
            />
          </G>
        </G>
      )}
    </G>
  );
}

export const NodeCard = React.memo(NodeCardInner, (prev, next) =>
  prev.x === next.x &&
  prev.y === next.y &&
  prev.isSelected  === next.isSelected &&
  prev.isCollapsed === next.isCollapsed &&
  prev.hasChildren === next.hasChildren
);
