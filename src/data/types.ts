export interface PersonRecord {
  person_id: string;
  person_name: string;
  surname: string;
  unique_attribute: string;
  sex: string;         // 'male' | 'female' | ''
  tribe: string;
  person_notes: string;
  name_instance: string;
  person_sequence: string;
}

export interface LabelRecord {
  person_id: string;
  english_label: string;
  hebrew_label: string;
  hebrew_label_transliterated: string;
  hebrew_label_meaning: string;
  hebrew_strongs_number: string;
  greek_label: string;
  greek_label_transliterated: string;
  greek_label_meaning: string;
  greek_strongs_number: string;
  label_reference_id: string;
  label_type: string;
  'label-given_by_god': string;
  label_notes: string;
}

export interface RelRecord {
  person_id: string;
  relationship_type: string;
  person_id_2: string;
  relationship_category: string;
  reference_id: string;
  relationship_notes: string;
}

// ── Tree node types ──────────────────────────────────────────────────────────

export interface TreeNodeData {
  id: string;
  person: PersonRecord;
  _children?: TreeNodeData[] | null; // collapsed children
  children?: TreeNodeData[] | null;  // visible children
}

export interface PositionedNode {
  id: string;
  x: number;
  y: number;
  depth: number;
  person: PersonRecord;
  hasChildren: boolean;
  isCollapsed: boolean;
}

export interface PositionedLink {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

export interface SpouseInfo {
  husbandId: string;
  wifeId: string;
  isConcubine: boolean;
  husbandX: number;
  husbandY: number;
  slotIndex: number; // 0-based position among wives
}

// ── App-level data maps ───────────────────────────────────────────────────────

export interface AppData {
  personsMap: Record<string, PersonRecord>;
  labelsMap: Record<string, LabelRecord[]>;
  relsMap: Record<string, RelRecord[]>;
  childrenMap: Record<string, string[]>;   // parent_id → [child_ids]
  spouseMap: Record<string, string[]>;     // husband_id → [wife_ids]
  wifeOfMap: Record<string, string>;       // wife_id → husband_id
  concubineSet: Set<string>;
  verseMap: Record<string, string>;        // "GEN.1.1" → verse text
  freePersonIds: Set<string>;              // ancestors of Abram_1 (inclusive) + their spouses — free tier
}
