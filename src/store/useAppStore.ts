import { create } from 'zustand';
import type { AppData } from '../data/types';
import type { D3Node, TreeLayout } from '../data/hierarchy';

interface AppState {
  // Data
  appData: AppData | null;
  treeLayout: TreeLayout | null;
  dataLoaded: boolean;
  dataError: string | null;

  // Selection & navigation
  selectedId: string | null;
  navHistory: string[];
  navIndex: number;

  // Actions
  setAppData: (data: AppData, layout: TreeLayout) => void;
  setDataError: (err: string) => void;
  selectPerson: (id: string) => void;
  navigateBack: () => string | null;
  navigateForward: () => string | null;
}

export const useAppStore = create<AppState>((set, get) => ({
  appData:     null,
  treeLayout:  null,
  dataLoaded:  false,
  dataError:   null,
  selectedId:  null,
  navHistory:  [],
  navIndex:    -1,

  setAppData: (data, layout) => set({ appData: data, treeLayout: layout, dataLoaded: true }),
  setDataError: (err) => set({ dataError: err }),

  selectPerson: (id) => set(state => {
    const hist = state.navHistory.slice(0, state.navIndex + 1);
    // Don't push duplicate consecutive entries
    if (hist[hist.length - 1] === id) return { selectedId: id };
    const newHist = [...hist, id];
    return { selectedId: id, navHistory: newHist, navIndex: newHist.length - 1 };
  }),

  navigateBack: () => {
    const { navHistory, navIndex } = get();
    if (navIndex <= 0) return null;
    const newIndex = navIndex - 1;
    const id = navHistory[newIndex];
    set({ navIndex: newIndex, selectedId: id });
    return id;
  },

  navigateForward: () => {
    const { navHistory, navIndex } = get();
    if (navIndex >= navHistory.length - 1) return null;
    const newIndex = navIndex + 1;
    const id = navHistory[newIndex];
    set({ navIndex: newIndex, selectedId: id });
    return id;
  },
}));
