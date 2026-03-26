import Papa from 'papaparse';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import type { PersonRecord, LabelRecord, RelRecord, AppData } from './types';

// Bundled data assets
const ASSETS = {
  persons:       require('../../assets/data/Person.csv'),
  labels:        require('../../assets/data/PersonLabel.csv'),
  rels:          require('../../assets/data/PersonRelationship.csv'),
  bibletext:     require('../../assets/data/bibletext.json'),
};

async function readAssetText(module: number): Promise<string> {
  const [asset] = await Asset.loadAsync(module);
  const uri = asset.localUri ?? asset.uri;
  return FileSystem.readAsStringAsync(uri);
}

function parseCSV<T>(text: string): T[] {
  const result = Papa.parse<T>(text, { header: true, skipEmptyLines: true });
  return result.data;
}

export async function loadAppData(): Promise<AppData> {
  console.log('[loadData] loading assets...');
  // Load CSVs in parallel
  const [personsText, labelsText, relsText] = await Promise.all([
    readAssetText(ASSETS.persons),
    readAssetText(ASSETS.labels),
    readAssetText(ASSETS.rels),
  ]);
  console.log('[loadData] CSVs loaded, lengths:', personsText.length, labelsText.length, relsText.length);

  const persons = parseCSV<PersonRecord>(personsText);
  const labels  = parseCSV<LabelRecord>(labelsText);
  const rels    = parseCSV<RelRecord>(relsText);

  console.log('[loadData] parsing CSVs...');
  // Verse map is bundled JSON — require() loads it synchronously
  const verseMap: Record<string, string> = ASSETS.bibletext;
  console.log('[loadData] verseMap keys:', Object.keys(verseMap).length);

  // Build persons map
  const personsMap: Record<string, PersonRecord> = {};
  persons.forEach(p => { personsMap[p.person_id] = p; });

  // Build labels map
  const labelsMap: Record<string, LabelRecord[]> = {};
  labels.forEach(l => {
    if (!labelsMap[l.person_id]) labelsMap[l.person_id] = [];
    labelsMap[l.person_id].push(l);
  });

  // Build relationship maps
  const relsMap: Record<string, RelRecord[]> = {};
  const childrenMap: Record<string, string[]> = {};
  const spouseMap: Record<string, string[]>   = {};
  const wifeOfMap: Record<string, string>     = {};
  const concubineSet = new Set<string>();
  const tempFatherMap: Record<string, string> = {}; // childId → fatherId
  const motherMap: Record<string, string>     = {}; // childId → motherId

  // Pass 1 — build raw maps
  rels.forEach(r => {
    if (!relsMap[r.person_id]) relsMap[r.person_id] = [];
    relsMap[r.person_id].push(r);

    const type = (r.relationship_type || '').toLowerCase();

    if (type === 'father' || type === 'creator') {
      tempFatherMap[r.person_id_2] = r.person_id;
    }
    if (type === 'mother') {
      motherMap[r.person_id_2] = r.person_id;
    }
    if (type === 'husband') {
      if (!spouseMap[r.person_id]) spouseMap[r.person_id] = [];
      if (!spouseMap[r.person_id].includes(r.person_id_2))
        spouseMap[r.person_id].push(r.person_id_2);
      wifeOfMap[r.person_id_2] = r.person_id;
    }
    if (type === 'concubinator') {
      if (!spouseMap[r.person_id]) spouseMap[r.person_id] = [];
      if (!spouseMap[r.person_id].includes(r.person_id_2))
        spouseMap[r.person_id].push(r.person_id_2);
      wifeOfMap[r.person_id_2] = r.person_id;
      concubineSet.add(r.person_id_2);
    }
  });

  // Pass 2 — build childrenMap from father relationships
  Object.entries(tempFatherMap).forEach(([childId, fatherId]) => {
    if (!childrenMap[fatherId]) childrenMap[fatherId] = [];
    if (!childrenMap[fatherId].includes(childId))
      childrenMap[fatherId].push(childId);
  });

  // Children with only a mother recorded (no father):
  // If mother has a husband → child goes under husband; otherwise under mother
  Object.entries(motherMap).forEach(([childId, motherId]) => {
    if (tempFatherMap[childId]) return; // already handled
    if (!personsMap[motherId]) return;
    const husbandId = wifeOfMap[motherId];
    const parentId  = (husbandId && personsMap[husbandId]) ? husbandId : motherId;
    if (!childrenMap[parentId]) childrenMap[parentId] = [];
    if (!childrenMap[parentId].includes(childId))
      childrenMap[parentId].push(childId);
  });

  return { personsMap, labelsMap, relsMap, childrenMap, spouseMap, wifeOfMap, concubineSet, verseMap };
}
