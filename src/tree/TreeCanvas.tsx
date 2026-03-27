import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { TreeRenderer } from './TreeRenderer';
import { useTreeLayout } from './useTreeLayout';
import { toggleNode, expandToId, runLayout } from '../data/hierarchy';
import { useAppStore } from '../store/useAppStore';
import { useTreeStore } from '../store/useTreeStore';
import type { D3Node } from '../data/hierarchy';

const MIN_SCALE = 0.04;
const MAX_SCALE = 4;

interface TreeCanvasProps {
  onPersonSelected: (id: string) => void;
}

export function TreeCanvas({ onPersonSelected }: TreeCanvasProps) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const { appData, treeLayout, selectPerson, selectedId } = useAppStore();
  const {
    renderVersion, bumpRender, setTransform,
    centerOnId, setCenterOnId,
    fitViewTrigger, centerRootTrigger,
  } = useTreeStore();

  // Reanimated shared values for smooth gesture-driven transform
  const translateX = useSharedValue(screenW / 2);
  const translateY = useSharedValue(100);
  const scale      = useSharedValue(1.7);

  // Saved values at gesture start
  const savedTx    = useSharedValue(screenW / 2);
  const savedTy    = useSharedValue(100);
  const savedScale = useSharedValue(1.7);

  // React state snapshot for culling (updated via runOnJS)
  const txSnap = useRef(screenW / 2);
  const tySnap = useRef(100);
  const scaleSnap = useRef(1.7);

  const updateSnapshot = useCallback((tx: number, ty: number, s: number) => {
    txSnap.current    = tx;
    tySnap.current    = ty;
    scaleSnap.current = s;
    setTransform(tx, ty, s);
    bumpRender(); // resize the viewport-based SVG for the new scale/position
  }, [setTransform, bumpRender]);

  // ── Pan gesture ────────────────────────────────────────────────────────────
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      savedTx.value    = translateX.value;
      savedTy.value    = translateY.value;
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      translateX.value = savedTx.value + e.translationX;
      translateY.value = savedTy.value + e.translationY;
    })
    .onEnd(() => {
      savedTx.value = translateX.value;
      savedTy.value = translateY.value;
      runOnJS(updateSnapshot)(translateX.value, translateY.value, scale.value);
    });

  // ── Pinch gesture ──────────────────────────────────────────────────────────
  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      savedTx.value    = translateX.value;
      savedTy.value    = translateY.value;
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, savedScale.value * e.scale));
      // Zoom toward focal point
      translateX.value = e.focalX + (savedTx.value - e.focalX) * (newScale / savedScale.value);
      translateY.value = e.focalY + (savedTy.value - e.focalY) * (newScale / savedScale.value);
      scale.value      = newScale;
    })
    .onEnd(() => {
      savedTx.value    = translateX.value;
      savedTy.value    = translateY.value;
      savedScale.value = scale.value;
      runOnJS(updateSnapshot)(translateX.value, translateY.value, scale.value);
    });

  const composed = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // ── Handle person selection ────────────────────────────────────────────────
  const handleSelectPerson = useCallback((id: string) => {
    selectPerson(id);
    onPersonSelected(id);
  }, [selectPerson, onPersonSelected]);

  // ── Handle toggle (expand/collapse) ───────────────────────────────────────
  const handleToggle = useCallback((id: string) => {
    if (!treeLayout) return;
    // Find the node in the tree and toggle it
    let targetNode: D3Node | null = null;
    treeLayout.root.each((d: D3Node) => {
      if (d.data.id === id) targetNode = d;
    });
    if (targetNode) {
      toggleNode(targetNode);
      bumpRender();
    }
  }, [treeLayout, bumpRender]);

  // ── Compute layout ────────────────────────────────────────────────────────
  const layout = useTreeLayout(
    treeLayout?.root ?? null,
    appData,
    renderVersion,
    txSnap.current,
    tySnap.current,
    scaleSnap.current,
  );

  // Center on YHVH_1 on first load.
  // With the G-transform in TreeRenderer, AV-coords == tree-coords, so:
  //   screen = tree * scale + translate  →  translate = screen - tree * scale
  useEffect(() => {
    if (!treeLayout || !appData) return;
    runLayout(treeLayout.root, appData.spouseMap, appData.personsMap);

    const rootX = (treeLayout.root as D3Node).x ?? 0;
    const rootY = (treeLayout.root as D3Node).y ?? 0;
    const s = 1.7;
    const initTx = screenW / 2 - rootX * s;
    const initTy = 100 - rootY * s;

    translateX.value = initTx;
    translateY.value = initTy;
    scale.value      = s;
    savedTx.value    = initTx;
    savedTy.value    = initTy;
    savedScale.value = s;
    txSnap.current    = initTx;
    tySnap.current    = initTy;
    scaleSnap.current = s;
    bumpRender();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeLayout, appData]);

  // ── Center on root node ────────────────────────────────────────────────────
  useEffect(() => {
    if (!centerRootTrigger || !treeLayout || !appData) return;
    runLayout(treeLayout.root, appData.spouseMap, appData.personsMap);
    const rootX = (treeLayout.root as D3Node).x ?? 0;
    const rootY = (treeLayout.root as D3Node).y ?? 0;
    const s = 1.7;
    const tx = screenW / 2 - rootX * s;
    const ty = 100 - rootY * s;
    translateX.value = tx; translateY.value = ty; scale.value = s;
    savedTx.value = tx; savedTy.value = ty; savedScale.value = s;
    txSnap.current = tx; tySnap.current = ty; scaleSnap.current = s;
    bumpRender();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerRootTrigger]);

  // ── Fit entire tree in viewport ────────────────────────────────────────────
  useEffect(() => {
    if (!fitViewTrigger || !layout) return;
    const treeW  = layout.treeMaxX - layout.treeMinX;
    const treeH  = layout.treeMaxY - layout.treeMinY;
    const treeCX = (layout.treeMinX + layout.treeMaxX) / 2;
    const treeCY = (layout.treeMinY + layout.treeMaxY) / 2;
    const MARGIN = 40;
    const s = Math.min(
      Math.max(MIN_SCALE, Math.min(MAX_SCALE, (screenW - 2 * MARGIN) / treeW)),
      Math.max(MIN_SCALE, Math.min(MAX_SCALE, (screenH - 2 * MARGIN) / treeH))
    );
    const tx = screenW / 2 - treeCX * s;
    const ty = screenH / 2 - treeCY * s;
    translateX.value = tx; translateY.value = ty; scale.value = s;
    savedTx.value = tx; savedTy.value = ty; savedScale.value = s;
    txSnap.current = tx; tySnap.current = ty; scaleSnap.current = s;
    bumpRender();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitViewTrigger]);

  // Pending center target: set after tree expansion, applied after layout re-runs
  const pendingCenterIdRef = useRef<string | null>(null);

  // ── Step 1: expand tree path, queue centering for after layout re-run ──────
  useEffect(() => {
    if (!centerOnId || !treeLayout || !appData) return;
    setCenterOnId(null);
    const found = expandToId(treeLayout.root, centerOnId);
    if (!found) { bumpRender(); return; }
    pendingCenterIdRef.current = centerOnId;
    bumpRender(); // triggers useTreeLayout re-run with expanded tree
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerOnId]);

  // ── Step 2: once layout re-runs with expanded tree, apply centering ─────────
  useEffect(() => {
    const targetId = pendingCenterIdRef.current;
    if (!targetId || !treeLayout) return;
    pendingCenterIdRef.current = null;

    // Find the node's updated position in the now-laid-out tree
    let targetNode: D3Node | null = null;
    treeLayout.root.each((d: D3Node) => {
      if (d.data.id === targetId) targetNode = d;
    });
    if (!targetNode) return;

    const nodeX = (targetNode as D3Node).x ?? 0;
    const nodeY = (targetNode as D3Node).y ?? 0;
    const s = 1.7;
    const tx = screenW / 2 - nodeX * s;
    const ty = screenH / 3 - nodeY * s;
    translateX.value = tx; translateY.value = ty; scale.value = s;
    savedTx.value = tx; savedTy.value = ty; savedScale.value = s;
    txSnap.current = tx; tySnap.current = ty; scaleSnap.current = s;
    bumpRender();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  if (!layout || !appData) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.canvas, animatedStyle]}>
          <TreeRenderer
            layout={layout}
            appData={appData}
            selectedId={selectedId}
            onSelectPerson={handleSelectPerson}
            onToggle={handleToggle}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#3a3a3a',
  },
  canvas: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    transformOrigin: '0 0',
  },
});
