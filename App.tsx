import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { loadAppData } from './src/data/loadData';
import { buildHierarchy } from './src/data/hierarchy';
import { useAppStore } from './src/store/useAppStore';
import { TreeCanvas } from './src/tree/TreeCanvas';

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#c9a050" />
      <Text style={styles.loadingTitle}>PATRIA</Text>
      <Text style={styles.loadingSub}>Loading biblical genealogy…</Text>
    </View>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <View style={styles.loading}>
      <Text style={styles.errorTitle}>Failed to load</Text>
      <Text style={styles.errorMsg}>{message}</Text>
    </View>
  );
}

export default function App() {
  const { dataLoaded, dataError, setAppData, setDataError, selectedId, appData } = useAppStore();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    (async () => {
      try {
        const data = await loadAppData();
        const layout = buildHierarchy(data);
        setAppData(data, layout);
        setStatus('ready');
      } catch (e: any) {
        setDataError(e?.message ?? String(e));
        setStatus('error');
      }
    })();
  }, []);

  const selectedPerson = selectedId ? appData?.personsMap[selectedId] : null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      {status === 'loading' && <LoadingScreen />}
      {status === 'error'   && <ErrorScreen message={dataError ?? 'Unknown error'} />}
      {status === 'ready'   && (
        <SafeAreaView style={styles.root}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>PATRIA</Text>
            <Text style={styles.headerSub}>Biblical Family Tree</Text>
          </View>

          {/* Tree canvas fills remaining space */}
          <View style={styles.treeArea}>
            <TreeCanvas onPersonSelected={() => {}} />
          </View>

          {/* Selected person bar */}
          {selectedPerson && (
            <View style={styles.selBar}>
              <Text style={styles.selName} numberOfLines={1}>
                {selectedPerson.person_name}
                {selectedPerson.surname ? ' ' + selectedPerson.surname : ''}
              </Text>
              {selectedPerson.tribe ? (
                <Text style={styles.selTribe}>{selectedPerson.tribe}</Text>
              ) : null}
              <TouchableOpacity style={styles.selBtn}>
                <Text style={styles.selBtnText}>View Bio →</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a0e08' },

  loading: { flex: 1, backgroundColor: '#1a0e08', alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingTitle: { color: '#c9a050', fontSize: 28, fontWeight: 'bold', letterSpacing: 4, marginTop: 12 },
  loadingSub:   { color: '#a09080', fontSize: 13 },
  errorTitle:   { color: '#e05050', fontSize: 18, fontWeight: 'bold' },
  errorMsg:     { color: '#a09080', fontSize: 13, textAlign: 'center', paddingHorizontal: 24 },

  header: {
    backgroundColor: 'rgba(20,10,5,0.92)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(201,160,80,0.5)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: { color: '#c9a050', fontSize: 18, fontWeight: 'bold', letterSpacing: 3 },
  headerSub:   { color: '#8a7060', fontSize: 11, letterSpacing: 1 },

  treeArea: { flex: 1 },

  selBar: {
    backgroundColor: 'rgba(20,10,5,0.95)',
    borderTopWidth: 2,
    borderTopColor: 'rgba(201,160,80,0.4)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selName:    { color: '#e8ddd0', fontSize: 15, fontWeight: '600', flex: 1 },
  selTribe:   { color: '#8a7060', fontSize: 12 },
  selBtn:     { backgroundColor: 'rgba(201,160,80,0.15)', borderWidth: 1, borderColor: 'rgba(201,160,80,0.5)', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 5 },
  selBtnText: { color: '#c9a050', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
});
