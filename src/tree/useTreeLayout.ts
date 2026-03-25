import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { runLayout, getPositionedNodes, getLinks, getSpouseOverlays, NW, NH } from '../data/hierarchy';
import type { D3Node } from '../data/hierarchy';
import type { PositionedNode, PositionedLink, SpouseInfo, AppData } from '../data/types';

export interface TreeLayoutResult {
  nodes: PositionedNode[];
  links: PositionedLink[];
  spouseOverlays: SpouseInfo[];
  svgWidth: number;
  svgHeight: number;
  originX: number; // left edge of bounding box (may be negative)
  originY: number;
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

    // Viewport in tree coordinates (for culling)
    const viewX = (-translateX) / scale - screenW / (2 * scale);
    const viewY = (-translateY) / scale;
    const viewW = screenW / scale;
    const viewH = screenH / scale;

    // Get positioned nodes (with culling)
    const rawNodes = getPositionedNodes(root, viewX, viewY, viewW, viewH, 400);

    // Attach person records
    const nodes: PositionedNode[] = rawNodes.map(n => ({
      ...n,
      person: appData.personsMap[n.id] ?? {} as any,
    }));

    // Links (all visible — we only draw between visible nodes in practice)
    const links = getLinks(root);

    // Spouse overlays for visible nodes
    const visibleIds = new Set(nodes.map(n => n.id));
    const allSpouseOverlays = getSpouseOverlays(
      root,
      appData.spouseMap,
      appData.wifeOfMap,
      appData.concubineSet,
      appData.personsMap,
    );
    const spouseOverlays = allSpouseOverlays.filter(s => visibleIds.has(s.husbandId));

    // Compute bounding box for SVG canvas
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    root.each((d: D3Node) => {
      const x = d.x ?? 0;
      const y = d.y ?? 0;
      if (x < minX) minX = x;
      if (x + NW > maxX) maxX = x + NW;
      if (y < minY) minY = y;
      if (y + NH > maxY) maxY = y + NH;
    });

    // Include spouse positions in bounding box
    allSpouseOverlays.forEach(s => {
      const rx = s.husbandX + NW / 2 + (NW + 24) * (s.slotIndex + 1) + NW / 2;
      if (rx > maxX) maxX = rx;
    });

    const PAD = 500;
    const originX = minX - PAD;
    const originY = minY - PAD;
    const svgWidth  = maxX - minX + PAD * 2;
    const svgHeight = maxY - minY + PAD * 2;

    return { nodes, links, spouseOverlays, svgWidth, svgHeight, originX, originY };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderVersion, translateX, translateY, scale, root, appData]);
}
