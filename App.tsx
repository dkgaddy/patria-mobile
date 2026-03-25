import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet from '@gorhom/bottom-sheet';
import { loadAppData } from './src/data/loadData';
import { buildHierarchy } from './src/data/hierarchy';
import { useAppStore } from './src/store/useAppStore';
import { TreeCanvas } from './src/tree/TreeCanvas';
import { BioPanel } from './src/bio/BioPanel';
import { SearchSheet } from './src/search/SearchSheet';
import type { AppData } from './src/data/types';

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
  const {
    dataError, setAppData, setDataError,
    selectedId, appData, selectPerson,
    navHistory, navIndex, navigateBack, navigateForward,
  } = useAppStore();

  const [status, setStatus] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const bioPanelRef  = useRef<BottomSheet>(null);
  const searchSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    (async () => {
      try {
        const data: AppData = await loadAppData();
        const layout = buildHierarchy(data);
        setAppData(data, layout);
        setStatus('ready');
      } catch (e: any) {
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
    bioPanelRef.current?.snapToIndex(0);
  }, [appData, selectPerson]);

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
            <Text style={styles.headerSub}>Biblical Family Tree</Text>
            <TouchableOpacity
              onPress={() => searchSheetRef.current?.snapToIndex(0)}
              style={styles.searchBtn}
              hitSlop={8}
            >
              <Text style={styles.searchBtnText}>🔍 Search</Text>
            </TouchableOpacity>
          </View>

          {/* Tree canvas fills remaining space */}
          <View style={styles.treeArea}>
            <TreeCanvas onPersonSelected={handlePersonSelected} />
          </View>

          {/* Search sheet */}
          {appData && (
            <SearchSheet
              sheetRef={searchSheetRef}
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
  root: { flex: 1, backgroundColor: '#1a0e08' },

  loading:      { flex: 1, backgroundColor: '#1a0e08', alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingTitle: { color: '#c9a050', fontSize: 28, fontWeight: 'bold', letterSpacing: 4, marginTop: 12 },
  loadingSub:   { color: '#a09080', fontSize: 13 },
  errorTitle:   { color: '#e05050', fontSize: 18, fontWeight: 'bold' },
  errorMsg:     { color: '#a09080', fontSize: 13, textAlign: 'center', paddingHorizontal: 24 },

  header: {
    backgroundColor: 'rgba(20,10,5,0.95)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(201,160,80,0.5)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: { color: '#c9a050', fontSize: 18, fontWeight: 'bold', letterSpacing: 3 },
  headerSub:   { color: '#6a5a4a', fontSize: 11, letterSpacing: 1, flex: 1 },
  searchBtn:   { backgroundColor: 'rgba(201,160,80,0.12)', borderWidth: 1, borderColor: 'rgba(201,160,80,0.4)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
  searchBtnText: { color: '#c9a050', fontSize: 12, fontWeight: '700' },

  treeArea: { flex: 1 },
});
