import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { ScriptureText } from '../bible/ScriptureText';
import { ScriptureSheet } from '../bible/ScriptureSheet';
import { LabelCard } from './LabelCard';
import { RelationshipRow } from './RelationshipRow';
import type { AppData } from '../data/types';
import type { ScriptureRef } from '../bible/verseUtils';

const IMAGE_BASE = 'https://patria.explosiveconcepts.com/pix/';
const SNAP_POINTS = ['35%', '85%'];

interface BioPanelProps {
  sheetRef: React.RefObject<BottomSheet>;
  personId: string | null;
  appData: AppData;
  navIndex: number;
  navHistory: string[];
  onNavigate: (id: string) => void;
  onBack: () => void;
  onForward: () => void;
}

export function BioPanel({
  sheetRef, personId, appData,
  navIndex, navHistory, onNavigate, onBack, onForward,
}: BioPanelProps) {
  const [labelsExpanded, setLabelsExpanded] = useState(false);
  const scriptureSheetRef = useRef<BottomSheet>(null);
  const [currentRef, setCurrentRef] = useState<ScriptureRef | null>(null);

  const handleRefPress = useCallback((ref: ScriptureRef) => {
    setCurrentRef(ref);
    scriptureSheetRef.current?.snapToIndex(0);
  }, []);

  const person = personId ? appData.personsMap[personId] : null;
  if (!person) {
    return (
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={SNAP_POINTS}
        enablePanDownToClose
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.indicator}
      >
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>📜</Text>
          <Text style={styles.placeholderTitle}>PATRIA</Text>
          <Text style={styles.placeholderSub}>Biblical Family Tree</Text>
          <Text style={styles.placeholderHint}>Tap any person in the tree to view their biography.</Text>
        </View>
      </BottomSheet>
    );
  }

  const labels = appData.labelsMap[personId!] ?? [];
  const rels   = (appData.relsMap[personId!] ?? []).filter(r => {
    const t = (r.relationship_type || '').toLowerCase();
    return t !== 'ancestor' && t !== 'descendant';
  });
  const sex   = person.sex ? person.sex.charAt(0).toUpperCase() + person.sex.slice(1) : '';
  const tribe = person.tribe ? ` · ${person.tribe}` : '';
  const displayName = person.person_name + (person.surname ? ' ' + person.surname : '');

  const visibleLabels = labelsExpanded ? labels : labels.slice(0, 3);
  const canBack    = navIndex > 0;
  const canForward = navIndex < navHistory.length - 1;

  return (
    <>
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={SNAP_POINTS}
        enablePanDownToClose
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.indicator}
      >
        <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>

          {/* Nav history buttons */}
          {navHistory.length > 1 && (
            <View style={styles.navRow}>
              <TouchableOpacity onPress={onBack} disabled={!canBack} style={[styles.navBtn, !canBack && styles.navBtnDisabled]}>
                <Text style={styles.navBtnText}>◀ Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onForward} disabled={!canForward} style={[styles.navBtn, !canForward && styles.navBtnDisabled]}>
                <Text style={styles.navBtnText}>Forward ▶</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Photo */}
          <Image
            source={{ uri: `${IMAGE_BASE}${personId}.jpg` }}
            style={styles.photo}
            contentFit="cover"
            transition={200}
          />

          {/* Name & metadata */}
          <View style={styles.nameBlock}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.meta}>{sex}{tribe}</Text>
          </View>

          {/* Unique attribute / notes */}
          {(person.unique_attribute || person.person_notes) ? (
            <View style={styles.notesBlock}>
              <ScriptureText
                text={person.unique_attribute || person.person_notes}
                style={styles.notes}
                onRefPress={handleRefPress}
              />
            </View>
          ) : null}

          {/* Names & Titles */}
          {labels.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Names &amp; Titles</Text>
              <View style={styles.sectionRule} />
              {visibleLabels.map((l, i) => (
                <LabelCard key={i} label={l} onRefPress={handleRefPress} />
              ))}
              {labels.length > 3 && (
                <TouchableOpacity onPress={() => setLabelsExpanded(e => !e)} style={styles.showMoreBtn}>
                  <Text style={styles.showMoreText}>
                    {labelsExpanded ? 'Show less ▲' : `Show ${labels.length - 3} more ▼`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Relationships */}
          {rels.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Relationships</Text>
              <View style={styles.sectionRule} />
              {rels.map((r, i) => (
                <RelationshipRow
                  key={i}
                  rel={r}
                  targetPerson={appData.personsMap[r.person_id_2]}
                  onNavigate={onNavigate}
                  onRefPress={handleRefPress}
                />
              ))}
            </View>
          )}

          <View style={{ height: 40 }} />
        </BottomSheetScrollView>
      </BottomSheet>

      {/* Scripture verse sheet (stacked above bio sheet) */}
      <ScriptureSheet
        sheetRef={scriptureSheetRef}
        currentRef={currentRef}
        verseMap={appData.verseMap}
      />
    </>
  );
}

const styles = StyleSheet.create({
  background:       { backgroundColor: '#1a0e08', borderWidth: 2, borderColor: 'rgba(201,160,80,0.4)', borderRadius: 16 },
  indicator:        { backgroundColor: '#c9a050' },
  scrollContent:    { paddingBottom: 60 },

  placeholder:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  placeholderIcon:  { fontSize: 40 },
  placeholderTitle: { color: '#c9a050', fontSize: 22, fontWeight: 'bold', letterSpacing: 4 },
  placeholderSub:   { color: '#8a7060', fontSize: 12, letterSpacing: 1 },
  placeholderHint:  { color: '#6a5a4a', fontSize: 12, textAlign: 'center', marginTop: 8 },

  navRow:           { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  navBtn:           { backgroundColor: 'rgba(201,160,80,0.12)', borderWidth: 1, borderColor: 'rgba(201,160,80,0.35)', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 5 },
  navBtnDisabled:   { opacity: 0.3 },
  navBtnText:       { color: '#c9a050', fontSize: 12, fontWeight: '700' },

  photo:            { width: '100%', height: 220, backgroundColor: '#2a1a10' },

  nameBlock:        { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  name:             { color: '#e8ddd0', fontSize: 22, fontWeight: '700', fontStyle: 'italic' },
  meta:             { color: '#8a7060', fontSize: 13, marginTop: 2 },

  notesBlock:       { marginHorizontal: 16, marginVertical: 10, backgroundColor: '#22140c', borderRadius: 6, padding: 12, borderLeftWidth: 3, borderLeftColor: '#c9a050' },
  notes:            { color: '#c8b8a8', fontSize: 13, lineHeight: 20 },

  section:          { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle:     { color: '#c9a050', fontSize: 13, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  sectionRule:      { height: 2, backgroundColor: 'rgba(201,160,80,0.3)', marginVertical: 8 },

  showMoreBtn:      { alignItems: 'center', paddingVertical: 10 },
  showMoreText:     { color: '#c9a050', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
});
