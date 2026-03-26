import React, { useCallback, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import type { ScriptureRef } from './verseUtils';
import { lookupVerses } from './verseUtils';

interface ScriptureSheetProps {
  sheetRef: React.RefObject<BottomSheet>;
  currentRef: ScriptureRef | null;
  verseMap: Record<string, string>;
}

export function ScriptureSheet({ sheetRef, currentRef, verseMap }: ScriptureSheetProps) {
  const snapPoints = ['40%'];

  const handleClose = useCallback(() => {
    sheetRef.current?.close();
  }, [sheetRef]);

  const verses = currentRef ? lookupVerses(verseMap, currentRef) : [];

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.indicator}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{currentRef?.label ?? ''}</Text>
        <TouchableOpacity onPress={handleClose} hitSlop={12}>
          <Text style={styles.close}>✕</Text>
        </TouchableOpacity>
      </View>
      <BottomSheetScrollView contentContainerStyle={styles.body}>
        {verses.length === 0 ? (
          <Text style={styles.empty}>Verse not found in database.</Text>
        ) : (
          verses.map((v, i) => {
            // Format: "3 In the beginning..." → verse number is first word
            const spaceIdx = v.indexOf(' ');
            const vNum = v.slice(0, spaceIdx);
            const vText = v.slice(spaceIdx + 1);
            return (
              <Text key={i} style={styles.verse}>
                <Text style={styles.verseNum}>{vNum} </Text>
                {vText}
              </Text>
            );
          })
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background:  { backgroundColor: '#faf6ee', borderWidth: 1, borderColor: 'rgba(139,94,60,0.3)', borderRadius: 16 },
  indicator:   { backgroundColor: '#8B5E3C' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(139,94,60,0.2)' },
  title:       { color: '#8B5E3C', fontWeight: '700', fontSize: 15, letterSpacing: 0.5 },
  close:       { color: '#7a5a3a', fontSize: 18, padding: 4 },
  body:        { paddingHorizontal: 20, paddingVertical: 12, paddingBottom: 40 },
  verse:       { color: '#2a1208', fontSize: 15, lineHeight: 24, marginBottom: 8 },
  verseNum:    { color: '#8B6914', fontWeight: '700', fontSize: 13 },
  empty:       { color: '#7a5a3a', fontSize: 14, fontStyle: 'italic' },
});
