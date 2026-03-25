import { useMemo } from 'react';
import type { PersonRecord } from '../data/types';

export interface SearchResult {
  id: string;
  person: PersonRecord;
  matchField: 'name' | 'attribute' | 'tribe';
}

export function useSearch(
  personsMap: Record<string, PersonRecord>,
  query: string,
  maxResults = 24,
): SearchResult[] {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const results: SearchResult[] = [];

    for (const [id, person] of Object.entries(personsMap)) {
      if (results.length >= maxResults) break;

      const name = (person.person_name || '').toLowerCase();
      const attr = (person.unique_attribute || person.person_notes || '').toLowerCase();
      const tribe = (person.tribe || '').toLowerCase();

      if (name.includes(q)) {
        results.push({ id, person, matchField: 'name' });
      } else if (tribe.includes(q)) {
        results.push({ id, person, matchField: 'tribe' });
      } else if (attr.includes(q)) {
        results.push({ id, person, matchField: 'attribute' });
      }
    }

    // Sort: name matches first, then tribe, then attribute
    const order = { name: 0, tribe: 1, attribute: 2 };
    results.sort((a, b) => order[a.matchField] - order[b.matchField]);

    return results;
  }, [personsMap, query]);
}
