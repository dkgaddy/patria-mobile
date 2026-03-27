import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet from '@gorhom/bottom-sheet';
import { loadAppData } from './src/data/loadData';
import { buildHierarchy } from './src/data/hierarchy';
import { useAppStore } from './src/store/useAppStore';
import { useTreeStore } from './src/store/useTreeStore';
import { TreeCanvas } from './src/tree/TreeCanvas';
import { BioPanel } from './src/bio/BioPanel';
import { SearchSheet } from './src/search/SearchSheet';
import type { AppData } from './src/data/types';

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#c8a85a" />
      <Text style={styles.loadingTitle}>PATRIA</Text>
      <Text style={styles.loadingSub}>Loading…</Text>
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
  const {
    dataError, setAppData, setDataError,
    selectedId, appData, selectPerson,
    navHistory, navIndex, navigateBack, navigateForward,
  } = useAppStore();
  const { setCenterOnId, bumpFitView, bumpCenterRoot } = useTreeStore();

  const [status, setStatus] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [searchOpen, setSearchOpen] = React.useState(false);
  const bioPanelRef = useRef<BottomSheet>(null);

  useEffect(() => {
    (async () => {
      try {
        const data: AppData = await loadAppData();
        const layout = buildHierarchy(data);
        setAppData(data, layout);
        setStatus('ready');
      } catch (e: any) {
        console.error('[Patria] load error:', e);
        setDataError(e?.message ?? String(e));
        setStatus('error');
      }
    })();
  }, []);

  const handlePersonSelected = useCallback((id: string) => {
    bioPanelRef.current?.snapToIndex(0);
  }, []);

  const handleNavigate = useCallback((id: string) => {
    if (!appData?.personsMap[id]) return;
    selectPerson(id);
    setCenterOnId(id);
    bioPanelRef.current?.snapToIndex(0);
  }, [appData, selectPerson, setCenterOnId]);

  const handleBack = useCallback(() => {
    navigateBack();
  }, [navigateBack]);

  const handleForward = useCallback(() => {
    navigateForward();
  }, [navigateForward]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />

      {status === 'loading' && <LoadingScreen />}
      {status === 'error'   && <ErrorScreen message={dataError ?? 'Unknown error'} />}

      {status === 'ready' && (
        <SafeAreaView style={styles.root}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>PATRIA</Text>
            <TouchableOpacity onPress={bumpFitView} style={styles.hbtn} hitSlop={8}>
              <Text style={styles.hbtnText}>Fit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={bumpCenterRoot} style={styles.hbtn} hitSlop={8}>
              <Text style={styles.hbtnText}>Center</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSearchOpen(true)} style={styles.hbtn} hitSlop={8}>
              <Text style={styles.hbtnText}>Search</Text>
            </TouchableOpacity>
          </View>

          {/* Tree canvas fills remaining space */}
          <View style={styles.treeArea}>
            <TreeCanvas onPersonSelected={handlePersonSelected} />
          </View>

          {/* Search modal */}
          {appData && (
            <SearchSheet
              isOpen={searchOpen}
              onClose={() => setSearchOpen(false)}
              appData={appData}
              onSelectPerson={handleNavigate}
            />
          )}

          {/* Bio panel — bottom sheet */}
          {appData && (
            <BioPanel
              sheetRef={bioPanelRef}
              personId={selectedId}
              appData={appData}
              navIndex={navIndex}
              navHistory={navHistory}
              onNavigate={handleNavigate}
              onBack={handleBack}
              onForward={handleForward}
            />
          )}
        </SafeAreaView>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#2a2a2a' },

  loading:      { flex: 1, backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingTitle: { color: '#c8a85a', fontSize: 28, fontWeight: 'bold', letterSpacing: 4, marginTop: 12 },
  loadingSub:   { color: '#888', fontSize: 13 },
  errorTitle:   { color: '#e05050', fontSize: 18, fontWeight: 'bold' },
  errorMsg:     { color: '#888', fontSize: 13, textAlign: 'center', paddingHorizontal: 24 },

  header: {
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#505050',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: { color: '#c8a85a', fontSize: 18, fontWeight: 'bold', letterSpacing: 3, flex: 1 },
  hbtn:        { backgroundColor: '#3a3a3a', borderWidth: 1, borderColor: '#555', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 5 },
  hbtnText:    { color: '#bbb', fontSize: 12 },

  treeArea: { flex: 1 },
});
