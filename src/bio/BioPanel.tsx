import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
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
  mode: 'sheet' | 'sidebar';
}

export function BioPanel({
  sheetRef, personId, appData,
  navIndex, navHistory, onNavigate, onBack, onForward,
  mode,
}: BioPanelProps) {
  const [labelsExpanded, setLabelsExpanded] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [currentRef, setCurrentRef] = useState<ScriptureRef | null>(null);

  const handleRefPress = useCallback((ref: ScriptureRef) => {
    setCurrentRef(ref);
  }, []);

  // Reset photo error whenever person changes
  const prevPersonIdRef = useRef<string | null>(null);
  if (prevPersonIdRef.current !== personId) {
    prevPersonIdRef.current = personId;
    if (photoError) setPhotoError(false);
  }

  const person = personId ? appData.personsMap[personId] : null;

  const labels = person ? (appData.labelsMap[personId!] ?? []) : [];
  const rels   = person ? (appData.relsMap[personId!] ?? []).filter(r => {
    const t = (r.relationship_type || '').toLowerCase();
    return t !== 'ancestor' && t !== 'descendant';
  }) : [];
  const sex         = person?.sex ? person.sex.charAt(0).toUpperCase() + person.sex.slice(1) : '';
  const tribe       = person?.tribe ? ` · ${person.tribe}` : '';
  const displayName = person ? (person.person_name + (person.surname ? ' ' + person.surname : '')) : '';

  const visibleLabels = labelsExpanded ? labels : labels.slice(0, 3);
  const canBack    = navIndex > 0;
  const canForward = navIndex < navHistory.length - 1;

  // ── Shared bio content ────────────────────────────────────────────────────
  const bioContent = !person ? (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderIcon}>📜</Text>
      <Text style={styles.placeholderTitle}>PATRIA</Text>
      <Text style={styles.placeholderSub}>Biblical Family Tree</Text>
      <Text style={styles.placeholderHint}>Tap any person in the tree to view their biography.</Text>
    </View>
  ) : (
    <>
      {/* Nav history buttons */}
      {navHistory.length > 1 && (
        <View style={styles.navRow}>
          <TouchableOpacity onPress={onBack} disabled={!canBack} style={[styles.navBtn, !canBack && styles.navBtnDisabled]}>
            <Text style={styles.navBtnText}>◀</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onForward} disabled={!canForward} style={[styles.navBtn, !canForward && styles.navBtnDisabled]}>
            <Text style={styles.navBtnText}>▶</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Name & metadata */}
      <View style={styles.nameBlock}>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.meta}>{sex}{tribe}</Text>
      </View>

      {/* Photo — circular, centered; hidden only if the image 404s */}
      {!photoError && (
        <View style={styles.photoCircleWrap}>
          <Image
            key={personId}
            source={{ uri: `${IMAGE_BASE}${personId}.jpg` }}
            style={styles.photoCircle}
            contentFit="cover"
            transition={200}
            onError={() => setPhotoError(true)}
          />
        </View>
      )}

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
    </>
  );

  return (
    <>
      {mode === 'sidebar' ? (
        // ── Landscape sidebar ───────────────────────────────────────────────
        <View style={styles.sidebar}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {bioContent}
          </ScrollView>
        </View>
      ) : (
        // ── Portrait bottom sheet ───────────────────────────────────────────
        <BottomSheet
          ref={sheetRef}
          index={-1}
          snapPoints={SNAP_POINTS}
          enablePanDownToClose
          backgroundStyle={styles.background}
          handleIndicatorStyle={styles.indicator}
        >
          <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
            {bioContent}
          </BottomSheetScrollView>
        </BottomSheet>
      )}

      {/* Scripture verse dialog */}
      <ScriptureSheet
        currentRef={currentRef}
        verseMap={appData.verseMap}
        onClose={() => setCurrentRef(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  // Sheet mode
  background:       { backgroundColor: '#faf6ee', borderWidth: 1, borderColor: 'rgba(139,94,60,0.3)', borderRadius: 16 },
  indicator:        { backgroundColor: '#8B5E3C' },

  // Sidebar mode
  sidebar:          { width: 320, borderLeftWidth: 1, borderLeftColor: 'rgba(139,94,60,0.3)', backgroundColor: '#faf6ee' },

  scrollContent:    { paddingBottom: 60 },

  placeholder:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8, minHeight: 300 },
  placeholderIcon:  { fontSize: 40 },
  placeholderTitle: { color: '#8B6914', fontSize: 22, fontWeight: 'bold', letterSpacing: 4 },
  placeholderSub:   { color: '#7a5a3a', fontSize: 12, letterSpacing: 1 },
  placeholderHint:  { color: '#9a7a5a', fontSize: 12, textAlign: 'center', marginTop: 8 },

  navRow:           { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  navBtn:           { backgroundColor: 'rgba(139,94,60,0.1)', borderWidth: 1, borderColor: 'rgba(139,94,60,0.35)', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 5 },
  navBtnDisabled:   { opacity: 0.3 },
  navBtnText:       { color: '#8B5E3C', fontSize: 12, fontWeight: '700' },

  photoCircleWrap:  { alignSelf: 'center', marginVertical: 14, width: '75%', aspectRatio: 1, borderRadius: 999, overflow: 'hidden', borderWidth: 3, borderColor: '#8B5E3C' },
  photoCircle:      { width: '100%', height: '100%' },

  nameBlock:        { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  name:             { color: '#2a1208', fontSize: 22, fontWeight: '700', fontStyle: 'italic' },
  meta:             { color: '#7a5a3a', fontSize: 13, marginTop: 2 },

  notesBlock:       { marginHorizontal: 16, marginVertical: 10, backgroundColor: '#ede6d8', borderRadius: 6, padding: 12, borderLeftWidth: 3, borderLeftColor: '#8B6914' },
  notes:            { color: '#3a2010', fontSize: 13, lineHeight: 20 },

  section:          { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle:     { color: '#8B5E3C', fontSize: 13, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  sectionRule:      { height: 1, backgroundColor: 'rgba(139,94,60,0.25)', marginVertical: 8 },

  showMoreBtn:      { alignItems: 'center', paddingVertical: 10 },
  showMoreText:     { color: '#8B5E3C', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
});
