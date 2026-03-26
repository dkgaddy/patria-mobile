import React, { useCallback, useRef, useState } from 'react';
import {
  StyleSheet, Text, View, TextInput,
  TouchableOpacity,
} from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useSearch } from './useSearch';
import type { AppData } from '../data/types';
import type { SearchResult } from './useSearch';

interface SearchSheetProps {
  sheetRef: React.RefObject<BottomSheet>;
  appData: AppData;
  onSelectPerson: (id: string) => void;
}

export function SearchSheet({ sheetRef, appData, onSelectPerson }: SearchSheetProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);
  const results = useSearch(appData.personsMap, query);

  const handleSelect = useCallback((id: string) => {
    setQuery('');
    sheetRef.current?.close();
    onSelectPerson(id);
  }, [sheetRef, onSelectPerson]);

  const handleClose = useCallback(() => {
    setQuery('');
    sheetRef.current?.close();
  }, [sheetRef]);

  const renderItem = ({ item }: { item: SearchResult }) => {
    const { id, person, matchField } = item;
    const displayName = person.person_name + (person.surname ? ' ' + person.surname : '');
    return (
      <TouchableOpacity style={styles.resultRow} onPress={() => handleSelect(id)}>
        <View style={styles.resultMain}>
          <Text style={styles.resultName}>{displayName}</Text>
          {person.tribe ? <Text style={styles.resultTribe}>{person.tribe}</Text> : null}
        </View>
        {matchField === 'attribute' && (
          <Text style={styles.resultSnippet} numberOfLines={1}>
            {(person.unique_attribute || person.person_notes || '').slice(0, 60)}…
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={['100%']}
      enablePanDownToClose
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.indicator}
      onAnimate={(from, to) => {
        if (to === 0) setTimeout(() => inputRef.current?.focus(), 100);
      }}
    >
      <BottomSheetView style={styles.container}>
        {/* Search bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Search people, tribes, descriptions…"
            placeholderTextColor="#9a7a5a"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={12}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Results */}
        {query.length >= 2 && results.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No results for "{query}"</Text>
          </View>
        )}

        {query.length < 2 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Type at least 2 characters to search</Text>
            <Text style={styles.emptyHint}>Search across 3,000+ biblical figures</Text>
          </View>
        )}

        <BottomSheetFlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
        />
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background:  { backgroundColor: '#faf6ee', borderWidth: 1, borderColor: 'rgba(139,94,60,0.3)', borderRadius: 16 },
  indicator:   { backgroundColor: '#8B5E3C' },
  container:   { flex: 1 },

  searchBar:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ede6d8', marginHorizontal: 16, marginBottom: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(139,94,60,0.25)', paddingHorizontal: 12, gap: 8 },
  searchIcon:  { fontSize: 16 },
  input:       { flex: 1, color: '#2a1208', fontSize: 15, paddingVertical: 12 },
  clearBtn:    { color: '#7a5a3a', fontSize: 16, padding: 4 },
  closeBtn:    { paddingLeft: 8 },
  closeBtnText:{ color: '#8B5E3C', fontSize: 13, fontWeight: '700' },

  emptyState:  { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyText:   { color: '#7a5a3a', fontSize: 14 },
  emptyHint:   { color: '#9a7a5a', fontSize: 12 },

  list:        { paddingHorizontal: 16, paddingBottom: 40 },
  resultRow:   { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.08)' },
  resultMain:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  resultName:  { color: '#2a1208', fontSize: 15, fontWeight: '600', flex: 1 },
  resultTribe: { color: '#7a5a3a', fontSize: 12 },
  resultSnippet:{ color: '#9a7a5a', fontSize: 11, marginTop: 3 },
});
