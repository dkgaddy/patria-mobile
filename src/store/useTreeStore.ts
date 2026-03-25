import { create } from 'zustand';

interface TreeState {
  // Transform (managed by Reanimated — these are snapshot values for culling)
  translateX: number;
  translateY: number;
  scale: number;

  // Render trigger — bump to force tree re-render after collapse/expand
  renderVersion: number;

  setTransform: (tx: number, ty: number, scale: number) => void;
  bumpRender: () => void;
}

export const useTreeStore = create<TreeState>((set) => ({
  translateX: 0,
  translateY: 0,
  scale: 1.7,
  renderVersion: 0,

  setTransform: (tx, ty, scale) => set({ translateX: tx, translateY: ty, scale }),
  bumpRender:   () => set(s => ({ renderVersion: s.renderVersion + 1 })),
}));
