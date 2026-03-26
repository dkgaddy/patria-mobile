import { create } from 'zustand';

interface TreeState {
  // Transform (managed by Reanimated — these are snapshot values for culling)
  translateX: number;
  translateY: number;
  scale: number;

  // Render trigger — bump to force tree re-render after collapse/expand
  renderVersion: number;

  // Center-on request — set to a person id to animate tree to that node
  centerOnId: string | null;

  // Fit/Center button triggers — bump to fire
  fitViewTrigger:    number;
  centerRootTrigger: number;

  setTransform:      (tx: number, ty: number, scale: number) => void;
  bumpRender:        () => void;
  setCenterOnId:     (id: string | null) => void;
  bumpFitView:       () => void;
  bumpCenterRoot:    () => void;
}

export const useTreeStore = create<TreeState>((set) => ({
  translateX: 0,
  translateY: 0,
  scale: 1.7,
  renderVersion: 0,
  centerOnId: null,
  fitViewTrigger: 0,
  centerRootTrigger: 0,

  setTransform:   (tx, ty, scale) => set({ translateX: tx, translateY: ty, scale }),
  bumpRender:     () => set(s => ({ renderVersion: s.renderVersion + 1 })),
  setCenterOnId:  (id) => set({ centerOnId: id }),
  bumpFitView:    () => set(s => ({ fitViewTrigger: s.fitViewTrigger + 1 })),
  bumpCenterRoot: () => set(s => ({ centerRootTrigger: s.centerRootTrigger + 1 })),
}));
