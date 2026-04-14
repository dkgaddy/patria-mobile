import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet, Text, View, TextInput,
  TouchableOpacity, Modal, KeyboardAvoidingView,
  Platform, FlatList, SafeAreaView,
} from 'react-native';
import { useSearch } from './useSearch';
import type { AppData } from '../data/types';
import type { SearchResult } from './useSearch';

interface SearchSheetProps {
  isOpen: boolean;
  onClose: () => void;
  appData: AppData;
  isPersonLocked: (id: string) => boolean;
  onSelectPerson: (id: string) => void;
}

export function SearchSheet({ isOpen, onClose, appData, isPersonLocked, onSelectPerson }: SearchSheetProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);
  const results = useSearch(appData.personsMap, query);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const handleSelect = useCallback((id: string) => {
    onClose();
    onSelectPerson(id);
  }, [onClose, onSelectPerson]);

  const renderItem = ({ item }: { item: SearchResult }) => {
    const { id, person, matchField } = item;
    const displayName = person.person_name + (person.surname ? ' ' + person.surname : '');
    const locked = isPersonLocked(id);
    return (
      <TouchableOpacity style={styles.resultRow} onPress={() => handleSelect(id)}>
        <View style={styles.resultMain}>
          <Text style={[styles.resultName, locked && styles.resultNameLocked]}>{displayName}</Text>
          {person.tribe ? <Text style={styles.resultTribe}>{person.tribe}</Text> : null}
          {locked && <Text style={styles.lockBadge}>🔒</Text>}
        </View>
        {matchField === 'attribute' && !locked && (
          <Text style={styles.resultSnippet} numberOfLines={1}>
            {(person.unique_attribute || person.person_notes || '').slice(0, 60)}…
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
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
            <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>

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

          <FlatList
            data={results}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea:    { flex: 1, backgroundColor: '#faf6ee' },
  container:   { flex: 1 },

  searchBar:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ede6d8', marginHorizontal: 16, marginTop: 8, marginBottom: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(139,94,60,0.25)', paddingHorizontal: 12, gap: 8 },
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
  resultName:       { color: '#2a1208', fontSize: 15, fontWeight: '600', flex: 1 },
  resultNameLocked: { color: '#9a7a5a' },
  resultTribe:      { color: '#7a5a3a', fontSize: 12 },
  resultSnippet:    { color: '#9a7a5a', fontSize: 11, marginTop: 3 },
  lockBadge:        { fontSize: 13 },
});
