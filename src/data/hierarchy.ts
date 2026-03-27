import { hierarchy, tree } from 'd3-hierarchy';
import type { HierarchyNode } from 'd3-hierarchy';
import type { PersonRecord, PositionedNode, PositionedLink, SpouseInfo, AppData } from './types';

export const NW   = 86;
export const NH   = 116;
export const NS_W = 220;
export const NS_H = 200;
export const AV_R = 33;
export const AV_CX = NW / 2;   // 43
export const AV_CY = AV_R + 5; // 38

// Raw tree node (pre-layout)
export interface TreeNodeDatum {
  id: string;
  name: string;
  surname: string;
  sex: string;
  tribe: string;
  notes: string;
  children?: TreeNodeDatum[];
  _children?: TreeNodeDatum[]; // collapsed
}

export type D3Node = HierarchyNode<TreeNodeDatum> & {
  x?: number;
  y?: number;
  _children?: D3Node[] | null;
};

export interface TreeLayout {
  root: D3Node;
  orphanRoots: D3Node[];
  orphanStartY: number;
}

// ── Build the D3 hierarchy from AppData ──────────────────────────────────────

export function buildHierarchy(data: AppData): TreeLayout {
  const { personsMap, childrenMap, spouseMap } = data;
  const mainVisited = new Set<string>();

  function makeNode(id: string): TreeNodeDatum | null {
    if (mainVisited.has(id) || !personsMap[id]) return null;
    mainVisited.add(id);
    const p = personsMap[id];
    const kids = (childrenMap[id] || [])
      .map(c => makeNode(c))
      .filter(Boolean) as TreeNodeDatum[];
    return {
      id,
      name:    p.person_name || id,
      surname: p.surname     || '',
      sex:     (p.sex || '').toLowerCase(),
      tribe:   p.tribe       || '',
      notes:   p.unique_attribute || p.person_notes || '',
      children: kids.length ? kids : undefined,
    };
  }

  const treeData = makeNode('YHVH_1')!;
  const root = hierarchy(treeData) as D3Node;

  // Collapse everything at depth >= 2 initially
  root.each((d: D3Node) => {
    if (d.depth >= 2 && d.children) {
      (d as any)._children = d.children;
      (d as any).children  = null;
    }
  });

  const orphanStartY = (root.height + 3) * NS_H;

  // Build orphan trees (persons not visited by main tree)
  const orphanRoots: D3Node[] = [];
  Object.keys(personsMap).forEach(id => {
    if (!mainVisited.has(id)) {
      const node = makeNode(id);
      if (node) {
        const orphanRoot = hierarchy(node) as D3Node;
        orphanRoot.each((d: D3Node) => {
          if (d.depth >= 2 && d.children) {
            (d as any)._children = d.children;
            (d as any).children  = null;
          }
        });
        orphanRoots.push(orphanRoot);
      }
    }
  });

  return { root, orphanRoots, orphanStartY };
}

// ── Toggle collapse/expand ───────────────────────────────────────────────────

export function toggleNode(node: D3Node): void {
  if ((node as any).children) {
    (node as any)._children = (node as any).children;
    (node as any).children  = null;
  } else if ((node as any)._children) {
    (node as any).children  = (node as any)._children;
    (node as any)._children = null;
  }
}

// ── Expand path from root to a target id ────────────────────────────────────

export function expandToId(root: D3Node, targetId: string): D3Node | null {
  let found: D3Node | null = null;

  function expand(node: D3Node): boolean {
    if (node.data.id === targetId) { found = node; return true; }
    const kids: D3Node[] = ((node as any).children || (node as any)._children || []) as D3Node[];
    for (const child of kids) {
      if (expand(child)) {
        // Ensure this node is expanded
        if (!(node as any).children && (node as any)._children) {
          (node as any).children  = (node as any)._children;
          (node as any)._children = null;
        }
        return true;
      }
    }
    return false;
  }

  expand(root);
  return found;
}

// ── Run D3 tree layout ───────────────────────────────────────────────────────

export function runLayout(root: D3Node, spouseMap: Record<string, string[]>, personsMap: Record<string, PersonRecord>): void {
  const layout = tree<TreeNodeDatum>()
    .nodeSize([NS_W, NS_H])
    .separation((a, b) => {
      const base = a.parent === b.parent ? 1 : 1.3;
      const leftOverlayCount = (spouseMap[(b as D3Node).data.id] || [])
        .filter(wid => personsMap[wid]).length;
      return base + leftOverlayCount * 0.6;
    });
  layout(root as any);

  // Normalize: pin root to x=0 so the viewport stays stable after expand/collapse.
  // D3 shifts the root's x when the tree grows asymmetrically, which would move
  // all nodes out of the current viewport and make the tree appear to disappear.
  const rootX = (root as D3Node).x ?? 0;
  if (rootX !== 0) {
    root.each((d: D3Node) => {
      if (d.x !== undefined) (d as any).x -= rootX;
    });
  }
}

// ── Compute elbow path between two nodes ────────────────────────────────────

export function elbowPath(sx: number, sy: number, tx: number, ty: number): string {
  const sourceMidY = sy + NH;
  const mid = (sourceMidY + ty) / 2;
  return `M${sx},${sourceMidY} L${sx},${mid} L${tx},${mid} L${tx},${ty}`;
}

// ── Extract positioned nodes for rendering (with viewport culling) ───────────

export function getPositionedNodes(
  root: D3Node,
  viewX: number,   // left edge of viewport in tree coords
  viewY: number,   // top edge
  viewW: number,   // viewport width in tree coords
  viewH: number,   // viewport height in tree coords
  margin = 200,    // extra pixels beyond viewport edge
): PositionedNode[] {
  const nodes: PositionedNode[] = [];
  const minX = viewX - margin;
  const maxX = viewX + viewW + margin;
  const minY = viewY - margin;
  const maxY = viewY + viewH + margin;

  root.each((d: D3Node) => {
    const x = d.x ?? 0;
    const y = d.y ?? 0;
    if (x + NW < minX || x > maxX || y + NH < minY || y > maxY) return;
    nodes.push({
      id:          d.data.id,
      x,
      y,
      depth:       d.depth,
      person:      {} as PersonRecord, // filled by caller using personsMap
      hasChildren: !!((d as any).children || (d as any)._children),
      isCollapsed: !(d as any).children && !!(d as any)._children,
    });
  });

  return nodes;
}

export function getLinks(root: D3Node): PositionedLink[] {
  return root.links().map(link => ({
    sourceX: (link.source as D3Node).x ?? 0,
    sourceY: (link.source as D3Node).y ?? 0,
    targetX: (link.target as D3Node).x ?? 0,
    targetY: (link.target as D3Node).y ?? 0,
  }));
}

export function getSpouseOverlays(
  root: D3Node,
  spouseMap: Record<string, string[]>,
  wifeOfMap: Record<string, string>,
  concubineSet: Set<string>,
  personsMap: Record<string, PersonRecord>,
): SpouseInfo[] {
  const overlays: SpouseInfo[] = [];
  root.each((d: D3Node) => {
    const husbandId = d.data.id;
    (spouseMap[husbandId] || []).forEach((spouseId, slotIndex) => {
      if (!personsMap[spouseId]) return;
      overlays.push({
        husbandId,
        wifeId:      spouseId,
        isConcubine: concubineSet.has(spouseId),
        husbandX:    d.x ?? 0,
        husbandY:    d.y ?? 0,
        slotIndex,
      });
    });
  });
  return overlays;
}

// ── Node card colors (matches web app exactly) ───────────────────────────────

export interface CardColors {
  card: string;
  border: string;
  avatarBg: string;
  sil: string;
  nameColor: string;
  tribeColor: string;
}

export function getCardColors(sex: string, id: string): CardColors {
  if (id === 'YHVH_1')
    return { card: '#eee8f8', border: '#8060b8', avatarBg: '#4e3a88', sil: '#b8a8e8', nameColor: '#2a1050', tribeColor: '#7060a8' };
  if (id === 'Jesus_1')
    return { card: '#fdf4de', border: '#c8a85a', avatarBg: '#8a6a20', sil: '#e8cc80', nameColor: '#3a2800', tribeColor: '#9a7a30' };
  if (sex === 'female')
    return { card: '#f8eef0', border: '#c08898', avatarBg: '#784060', sil: '#d8a0b8', nameColor: '#2a1020', tribeColor: '#b07080' };
  return { card: '#eef0f6', border: '#7090b4', avatarBg: '#405878', sil: '#90b8d8', nameColor: '#141e30', tribeColor: '#507898' };
}
