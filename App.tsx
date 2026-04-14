import React, { useCallback, useEffect, useRef } from 'react';
import { useFonts, Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { FontAwesome5 } from '@expo/vector-icons';
import { StyleSheet, Text, View, ActivityIndicator, SafeAreaView, TouchableOpacity, useWindowDimensions } from 'react-native';
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
import { PaywallModal } from './src/purchases/PaywallModal';
import { usePurchases } from './src/purchases/usePurchases';
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
  const [fontsLoaded] = useFonts({ Cinzel_700Bold });
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const {
    dataError, setAppData, setDataError,
    selectedId, appData, selectPerson,
    navHistory, navIndex, navigateBack, navigateForward,
    isPro,
  } = useAppStore();
  const { setCenterOnId, bumpCenterRoot } = useTreeStore();
  const { purchasePro, restorePurchases } = usePurchases();

  const [paywallVisible, setPaywallVisible] = React.useState(false);

  const isPersonLocked = useCallback((id: string): boolean => {
    if (isPro) return false;
    return !(appData?.freePersonIds.has(id) ?? true);
  }, [isPro, appData]);

  const handleCenter = useCallback(() => {
    if (selectedId && appData?.personsMap[selectedId]) {
      setCenterOnId(selectedId);
    } else {
      bumpCenterRoot();
    }
  }, [selectedId, appData, setCenterOnId, bumpCenterRoot]);

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
    if (!isLandscape) bioPanelRef.current?.snapToIndex(0);
  }, [isLandscape]);

  const handleUnlockPress = useCallback(() => {
    setPaywallVisible(true);
  }, []);

  const handleNavigate = useCallback((id: string) => {
    if (!appData?.personsMap[id]) return;
    selectPerson(id);
    setCenterOnId(id);
    if (!isLandscape) bioPanelRef.current?.snapToIndex(0);
  }, [appData, selectPerson, setCenterOnId, isLandscape]);

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
            <TouchableOpacity onPress={bumpCenterRoot} style={styles.hbtn} hitSlop={8}>
              <FontAwesome5 name="home" size={15} color="#bbb" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCenter} style={styles.hbtn} hitSlop={8}>
              <Text style={styles.hbtnText}>Center</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSearchOpen(true)} style={styles.hbtn} hitSlop={8}>
              <Text style={styles.hbtnText}>Search</Text>
            </TouchableOpacity>
          </View>

          {/* Tree + sidebar row */}
          <View style={[styles.body, isLandscape && styles.bodyRow]}>
            <View style={styles.treeArea}>
              <TreeCanvas
                onPersonSelected={handlePersonSelected}
                isPersonLocked={isPersonLocked}
              />
            </View>

            {/* Bio panel — sidebar (landscape) or bottom sheet (portrait) */}
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
                mode={isLandscape ? 'sidebar' : 'sheet'}
                isPersonLocked={isPersonLocked}
                onUnlockPress={handleUnlockPress}
              />
            )}
          </View>

          {/* Search modal */}
          {appData && (
            <SearchSheet
              isOpen={searchOpen}
              onClose={() => setSearchOpen(false)}
              appData={appData}
              isPersonLocked={isPersonLocked}
              onSelectPerson={handleNavigate}
            />
          )}

          {/* Paywall */}
          <PaywallModal
            visible={paywallVisible}
            onClose={() => setPaywallVisible(false)}
            onPurchase={purchasePro}
            onRestore={restorePurchases}
          />
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
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: { color: '#c8a85a', fontSize: 24, fontFamily: 'Cinzel_700Bold', letterSpacing: 3, flex: 1 },
  hbtn:        { backgroundColor: '#3a3a3a', borderWidth: 1, borderColor: '#555', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 8 },
  hbtnText:    { color: '#bbb', fontSize: 15 },

  body:     { flex: 1 },
  bodyRow:  { flexDirection: 'row' },
  treeArea: { flex: 1 },
});
