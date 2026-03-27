import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View, ScrollView } from 'react-native';
import type { ScriptureRef } from './verseUtils';
import { lookupVerses } from './verseUtils';

interface ScriptureSheetProps {
  currentRef: ScriptureRef | null;
  verseMap: Record<string, string>;
  onClose: () => void;
}

export function ScriptureSheet({ currentRef, verseMap, onClose }: ScriptureSheetProps) {
  const verses = currentRef ? lookupVerses(verseMap, currentRef) : [];

  return (
    <Modal
      visible={currentRef !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Backdrop — tap outside to dismiss */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          {/* Stop tap propagation so tapping the dialog itself doesn't close it */}
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.dialog}>
              <View style={styles.header}>
                <Text style={styles.title}>{currentRef?.label ?? ''}</Text>
                <TouchableOpacity onPress={onClose} hitSlop={12}>
                  <Text style={styles.close}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
                {verses.length === 0 ? (
                  <Text style={styles.empty}>Verse not found in database.</Text>
                ) : (
                  verses.map((v, i) => {
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
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog:      { width: '100%', maxHeight: '70%', backgroundColor: '#faf6ee', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(139,94,60,0.4)', overflow: 'hidden' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(139,94,60,0.2)' },
  title:       { color: '#8B5E3C', fontWeight: '700', fontSize: 15, letterSpacing: 0.5, flex: 1 },
  close:       { color: '#7a5a3a', fontSize: 18, paddingLeft: 12 },
  body:        { flexShrink: 1 },
  bodyContent: { paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 20 },
  verse:       { color: '#2a1208', fontSize: 15, lineHeight: 24, marginBottom: 8 },
  verseNum:    { color: '#8B6914', fontWeight: '700', fontSize: 13 },
  empty:       { color: '#7a5a3a', fontSize: 14, fontStyle: 'italic' },
});
