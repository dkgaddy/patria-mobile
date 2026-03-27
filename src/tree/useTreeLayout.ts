import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { runLayout, getPositionedNodes, getLinks, getSpouseOverlays, NW, NH } from '../data/hierarchy';
import type { D3Node } from '../data/hierarchy';
import type { PositionedNode, PositionedLink, SpouseInfo, AppData } from '../data/types';

export interface TreeLayoutResult {
  nodes: PositionedNode[];
  links: PositionedLink[];
  spouseOverlays: SpouseInfo[];
  // SVG rendering area — viewport-sized to avoid huge SVG crashes
  svgWidth: number;
  svgHeight: number;
  originX: number;
  originY: number;
  // Full tree bounding box — used by Fit (separate from SVG size)
  treeMinX: number;
  treeMaxX: number;
  treeMinY: number;
  treeMaxY: number;
}

export function useTreeLayout(
  root: D3Node | null,
  appData: AppData | null,
  renderVersion: number,
  translateX: number,
  translateY: number,
  scale: number,
): TreeLayoutResult | null {
  const { width: screenW, height: screenH } = useWindowDimensions();

  return useMemo(() => {
    if (!root || !appData) return null;

    // Run D3 layout (mutates x/y on each node)
    runLayout(root, appData.spouseMap, appData.personsMap);

    // Viewport in tree coordinates
    const viewX = (-translateX) / scale;
    const viewY = (-translateY) / scale;
    const viewW = screenW / scale;
    const viewH = screenH / scale;

    // Cull nodes to viewport + margin
    const MARGIN = 400;
    const rawNodes = getPositionedNodes(root, viewX, viewY, viewW, viewH, MARGIN);
    const nodes: PositionedNode[] = rawNodes.map(n => ({
      ...n,
      person: appData.personsMap[n.id] ?? {} as any,
    }));

    const links = getLinks(root);

    const visibleIds = new Set(nodes.map(n => n.id));
    const allSpouseOverlays = getSpouseOverlays(
      root,
      appData.spouseMap,
      appData.wifeOfMap,
      appData.concubineSet,
      appData.personsMap,
    );
    const spouseOverlays = allSpouseOverlays.filter(s => visibleIds.has(s.husbandId));

    // Full tree bounding box — needed by Fit, NOT used for SVG dimensions
    let treeMinX = 0, treeMaxX = 0, treeMinY = 0, treeMaxY = 0;
    root.each((d: D3Node) => {
      const x = d.x ?? 0;
      const y = d.y ?? 0;
      if (x < treeMinX) treeMinX = x;
      if (x + NW > treeMaxX) treeMaxX = x + NW;
      if (y < treeMinY) treeMinY = y;
      if (y + NH > treeMaxY) treeMaxY = y + NH;
    });
    allSpouseOverlays.forEach(s => {
      const rx = s.husbandX + NW / 2 + (NW + 24) * (s.slotIndex + 1) + NW / 2;
      if (rx > treeMaxX) treeMaxX = rx;
    });

    // SVG sized to intersection of (viewport + margin) and (tree bounds + margin)
    // This prevents react-native-svg from receiving huge dimensions at small scales (e.g. Fit view)
    const originX  = Math.max(treeMinX - MARGIN, viewX - MARGIN);
    const originY  = Math.max(treeMinY - MARGIN, viewY - MARGIN);
    const svgRight  = Math.min(treeMaxX + MARGIN, viewX + viewW + MARGIN);
    const svgBottom = Math.min(treeMaxY + MARGIN, viewY + viewH + MARGIN);
    // Hard cap to prevent react-native-svg from allocating an enormous bitmap
    const MAX_SVG_DIM = 4096;
    const svgWidth  = Math.max(1, Math.min(MAX_SVG_DIM, svgRight  - originX));
    const svgHeight = Math.max(1, Math.min(MAX_SVG_DIM, svgBottom - originY));

    return { nodes, links, spouseOverlays, svgWidth, svgHeight, originX, originY, treeMinX, treeMaxX, treeMinY, treeMaxY };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderVersion, translateX, translateY, scale, root, appData]);
}
