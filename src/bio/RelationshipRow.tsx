import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { ScriptureText } from '../bible/ScriptureText';
import type { RelRecord, PersonRecord } from '../data/types';
import type { ScriptureRef } from '../bible/verseUtils';

const SKIP_REL_TYPES = new Set(['ancestor', 'descendant']);

interface RelationshipRowProps {
  rel: RelRecord;
  targetPerson: PersonRecord | undefined;
  onNavigate: (id: string) => void;
  onRefPress: (ref: ScriptureRef) => void;
}

export function RelationshipRow({ rel, targetPerson, onNavigate, onRefPress }: RelationshipRowProps) {
  const relType = (rel.relationship_type || '').toLowerCase();
  if (SKIP_REL_TYPES.has(relType)) return null;

  const targetName = targetPerson?.person_name ?? rel.person_id_2;

  return (
    <View style={styles.row}>
      <Text style={styles.type}>{rel.relationship_type} of</Text>
      <TouchableOpacity onPress={() => onNavigate(rel.person_id_2)}>
        <Text style={styles.name}>{targetName}</Text>
      </TouchableOpacity>
      {rel.reference_id ? (
        <ScriptureText
          text={rel.reference_id}
          style={styles.ref}
          onRefPress={onRefPress}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row:  { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.08)' },
  type: { fontSize: 12, color: '#7a5a3a' },
  name: { fontSize: 13, color: '#8B5E3C', fontWeight: '600', textDecorationLine: 'underline' },
  ref:  { fontSize: 11, color: '#9a7a5a' },
});
