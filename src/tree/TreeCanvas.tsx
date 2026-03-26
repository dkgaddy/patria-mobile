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
  const { renderVersion, bumpRender, setTransform } = useTreeStore();

  // Reanimated shared values for smooth gesture-driven transform
  const translateX = useSharedValue(screenW / 2);
  const translateY = useSharedValue(80);
  const scale      = useSharedValue(1.7);

  // Saved values at gesture start
  const savedTx    = useSharedValue(screenW / 2);
  const savedTy    = useSharedValue(80);
  const savedScale = useSharedValue(1.7);

  // React state snapshot for culling (updated via runOnJS)
  const txSnap = useRef(screenW / 2);
  const tySnap = useRef(80);
  const scaleSnap = useRef(1.7);

  const updateSnapshot = useCallback((tx: number, ty: number, s: number) => {
    txSnap.current    = tx;
    tySnap.current    = ty;
    scaleSnap.current = s;
    setTransform(tx, ty, s);
  }, [setTransform]);

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

  // Center on YHVH_1 on first load
  useEffect(() => {
    if (!treeLayout || !appData) return;
    runLayout(treeLayout.root, appData.spouseMap, appData.personsMap);

    // Compute the SVG origin offset (same logic as useTreeLayout)
    const PAD = 500;
    let minX = 0, minY = 0;
    treeLayout.root.each((d: D3Node) => {
      const x = d.x ?? 0;
      const y = d.y ?? 0;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
    });
    const originX = minX - PAD;
    const originY = minY - PAD;

    // Root's D3 position
    const rootX = (treeLayout.root as D3Node).x ?? 0;
    const rootY = (treeLayout.root as D3Node).y ?? 0;

    // Root is at AV coord (rootX + originX, rootY + originY) because the SVG
    // is absolutely positioned at left:originX, top:originY inside the AV.
    // For root to appear at (screenW/2, 100) with scale 1.7:
    //   screen = AV * scale + translate  →  translate = screen - AV * scale
    const s = 1.7;
    const initTx = screenW / 2 - (rootX + originX) * s;
    const initTy = 100 - (rootY + originY) * s;

    translateX.value = initTx;
    translateY.value = initTy;
    scale.value      = s;
    savedTx.value    = initTx;
    savedTy.value    = initTy;
    savedScale.value = s;
    txSnap.current    = initTx;
    tySnap.current    = initTy;
    scaleSnap.current = s;
    setTransform(initTx, initTy, s);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeLayout, appData]);

  if (!layout || !appData) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.canvas, animatedStyle]} pointerEvents="box-none">
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
    backgroundColor: '#1a1008',
  },
  canvas: {
    position: 'absolute',
    transformOrigin: '0 0',
  },
});
