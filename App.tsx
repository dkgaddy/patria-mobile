import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { loadAppData } from './src/data/loadData';
import { buildHierarchy } from './src/data/hierarchy';
import type { AppData } from './src/data/types';

export default function App() {
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');
  const [stats, setStats] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const data: AppData = await loadAppData();
        const layout = buildHierarchy(data);

        const personCount  = Object.keys(data.personsMap).length;
        const labelCount   = Object.values(data.labelsMap).reduce((s, a) => s + a.length, 0);
        const relCount     = Object.values(data.relsMap).reduce((s, a) => s + a.length, 0);
        const spouseCount  = Object.values(data.spouseMap).reduce((s, a) => s + a.length, 0);
        const orphanCount  = layout.orphanRoots.length;
        const verseCount   = Object.keys(data.verseMap).length;

        setStats([
          `✅ Persons:       ${personCount.toLocaleString()}`,
          `✅ Labels:        ${labelCount.toLocaleString()}`,
          `✅ Relationships: ${relCount.toLocaleString()}`,
          `✅ Spouses:       ${spouseCount.toLocaleString()}`,
          `✅ Concubines:    ${data.concubineSet.size}`,
          `✅ Orphan trees:  ${orphanCount.toLocaleString()}`,
          `✅ Bible verses:  ${verseCount.toLocaleString()}`,
          '',
          `🌳 Main tree depth: ${layout.root.height}`,
          `🌳 Orphan start Y:  ${layout.orphanStartY}`,
        ]);
        setStatus('done');
      } catch (e: any) {
        setError(e?.message ?? String(e));
        setStatus('error');
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>PATRIA — Data Verification</Text>
      {status === 'loading' && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#c9a050" />
          <Text style={styles.sub}>Loading biblical genealogy…</Text>
        </View>
      )}
      {status === 'error' && (
        <Text style={styles.error}>Error: {error}</Text>
      )}
      {status === 'done' && (
        <ScrollView contentContainerStyle={styles.stats}>
          {stats.map((line, i) => (
            <Text key={i} style={styles.stat}>{line}</Text>
          ))}
          <Text style={[styles.stat, { marginTop: 20, color: '#c9a050' }]}>
            Phase 1 complete — data layer verified ✓
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0e08', padding: 24, paddingTop: 60 },
  title:     { color: '#c9a050', fontSize: 20, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  sub:       { color: '#a09080', fontSize: 14 },
  error:     { color: '#e05050', fontSize: 14 },
  stats:     { gap: 8, paddingBottom: 40 },
  stat:      { color: '#e8ddd0', fontSize: 14, fontFamily: 'monospace' },
});
