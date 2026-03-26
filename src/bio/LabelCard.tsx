import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScriptureText } from '../bible/ScriptureText';
import type { LabelRecord } from '../data/types';
import type { ScriptureRef } from '../bible/verseUtils';

interface LabelCardProps {
  label: LabelRecord;
  onRefPress: (ref: ScriptureRef) => void;
}

export function LabelCard({ label, onRefPress }: LabelCardProps) {
  const givenByGod = label['label-given_by_god'] === 'Y';

  return (
    <View style={styles.card}>
      {label.label_type ? (
        <Text style={styles.type}>
          {label.label_type}{givenByGod ? ' ✦' : ''}
        </Text>
      ) : null}

      {label.english_label ? (
        <Text style={styles.name}>{label.english_label}</Text>
      ) : null}

      {label.hebrew_label ? (
        <Text style={styles.hebrew}>{label.hebrew_label}</Text>
      ) : null}

      <View style={styles.rows}>
        {label.hebrew_label_transliterated ? (
          <Row label="Transliteration" value={label.hebrew_label_transliterated} />
        ) : null}
        {label.hebrew_label_meaning ? (
          <Row label="Meaning" value={label.hebrew_label_meaning} />
        ) : null}
        {label.hebrew_strongs_number ? (
          <Row label="Heb. Strong's" value={label.hebrew_strongs_number} />
        ) : null}
        {label.greek_label ? (
          <Row label="Greek" value={label.greek_label + (label.greek_label_transliterated ? ` (${label.greek_label_transliterated})` : '')} />
        ) : null}
        {label.greek_label_meaning ? (
          <Row label="Gk. Meaning" value={label.greek_label_meaning} />
        ) : null}
        {label.greek_strongs_number && label.greek_strongs_number !== 'none' ? (
          <Row label="Gk. Strong's" value={label.greek_strongs_number} />
        ) : null}
        {label.label_reference_id ? (
          <View style={styles.rowItem}>
            <Text style={styles.rowKey}>Reference</Text>
            <ScriptureText
              text={label.label_reference_id}
              style={styles.rowVal}
              onRefPress={onRefPress}
            />
          </View>
        ) : null}
      </View>

      {label.label_notes ? (
        <Text style={styles.notes}>{label.label_notes}</Text>
      ) : null}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.rowItem}>
      <Text style={styles.rowKey}>{label}</Text>
      <Text style={styles.rowVal}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card:    { backgroundColor: '#ede6d8', borderRadius: 6, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#8B6914' },
  type:    { fontSize: 10, fontWeight: '700', color: '#8B5E3C', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 3 },
  name:    { fontSize: 15, fontWeight: '600', color: '#2a1208', marginBottom: 2 },
  hebrew:  { fontSize: 18, color: '#6a3e10', marginBottom: 6, fontStyle: 'italic' },
  rows:    { gap: 4 },
  rowItem: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  rowKey:  { fontSize: 11, color: '#7a5a3a', fontWeight: '600', minWidth: 90 },
  rowVal:  { fontSize: 12, color: '#3a2010', flex: 1 },
  notes:   { fontSize: 10, color: '#9a7a5a', marginTop: 6, fontStyle: 'italic' },
});
