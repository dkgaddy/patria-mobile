// Ported directly from the web app's BOOK_MAP and SREF_RE

export const BOOK_MAP: Record<string, string> = {
  // Standard XML codes (pass-through)
  GEN:'GEN',EXO:'EXO',LEV:'LEV',NUM:'NUM',DEU:'DEU',JOS:'JOS',
  JDG:'JDG',RUT:'RUT','1SA':'1SA','2SA':'2SA','1KI':'1KI','2KI':'2KI',
  '1CH':'1CH','2CH':'2CH',EZR:'EZR',NEH:'NEH',EST:'EST',JOB:'JOB',
  PSA:'PSA',PRO:'PRO',ECC:'ECC',SNG:'SNG',ISA:'ISA',JER:'JER',
  LAM:'LAM',EZK:'EZK',DAN:'DAN',HOS:'HOS',JOL:'JOL',AMO:'AMO',
  OBA:'OBA',JON:'JON',MIC:'MIC',NAM:'NAM',HAB:'HAB',ZEP:'ZEP',
  HAG:'HAG',ZEC:'ZEC',MAL:'MAL',MAT:'MAT',MRK:'MRK',LUK:'LUK',
  JHN:'JHN',ACT:'ACT',ROM:'ROM','1CO':'1CO','2CO':'2CO',GAL:'GAL',
  EPH:'EPH',PHP:'PHP',COL:'COL','1TH':'1TH','2TH':'2TH','1TI':'1TI',
  '2TI':'2TI',TIT:'TIT',PHM:'PHM',HEB:'HEB',JAS:'JAS','1PE':'1PE',
  '2PE':'2PE','1JN':'1JN','2JN':'2JN','3JN':'3JN',JUD:'JUD',REV:'REV',
  // Variants
  ACTS:'ACT',DEUT:'DEU',EZ:'EZK',NAH:'NAM',JN:'JHN',
  // Title-case full names
  Genesis:'GEN',Exodus:'EXO',Leviticus:'LEV',Numbers:'NUM',
  Deuteronomy:'DEU',Joshua:'JOS',Judges:'JDG',Ruth:'RUT',
  Psalms:'PSA',Psalm:'PSA',Proverbs:'PRO',Daniel:'DAN',
  Esther:'EST',Nehemiah:'NEH',Ezra:'EZR',Hosea:'HOS',
  Amos:'AMO',Micah:'MIC',Nahum:'NAM',Malachi:'MAL',
  Jonah:'JON',Joel:'JOL',Obadiah:'OBA',Habakkuk:'HAB',
  Haggai:'HAG',Zechariah:'ZEC',Zephaniah:'ZEP',
  Matthew:'MAT',Mark:'MRK',Luke:'LUK',John:'JHN',
  Acts:'ACT',Romans:'ROM',Galatians:'GAL',Ephesians:'EPH',
  Philippians:'PHP',Colossians:'COL',Titus:'TIT',
  Philemon:'PHM',Hebrews:'HEB',James:'JAS',Revelation:'REV',
  // Abbreviated short forms
  Neh:'NEH',Chr:'1CH',Sam:'1SA',
  SA:'1SA',KI:'1KI',Ki:'1KI',CH:'1CH',CO:'1CO',TI:'1TI',
};

// Regex: "GEN 4:1", "1CO 15:45", "1 SA 14:3", optional verse range
export const SREF_RE = /\b((?:\d\s?)?[A-Za-z]{2,})\s+(\d+):(\d+)(?:-(\d+))?/g;

export interface ScriptureRef {
  book: string;    // XML book code (e.g. "GEN")
  ch: number;
  v1: number;
  v2: number;
  label: string;  // original text for display
}

export function parseScriptureRef(text: string): ScriptureRef | null {
  const re = /^((?:\d\s?)?[A-Za-z]{2,})\s+(\d+):(\d+)(?:-(\d+))?$/;
  const m  = re.exec(text.trim());
  if (!m) return null;
  const rawBook = m[1].replace(/\s/g, '');
  const book    = BOOK_MAP[rawBook];
  if (!book) return null;
  const ch = parseInt(m[2]);
  const v1 = parseInt(m[3]);
  const v2 = m[4] ? parseInt(m[4]) : v1;
  return { book, ch, v1, v2, label: text.trim() };
}

export interface TextSegment {
  type: 'text' | 'ref';
  content: string;
  ref?: ScriptureRef;
}

export function parseTextSegments(text: string): TextSegment[] {
  if (!text) return [];
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  const re = new RegExp(SREF_RE.source, 'g');
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, m.index) });
    }
    const rawBook = m[1].replace(/\s/g, '');
    const book    = BOOK_MAP[rawBook];
    if (book) {
      const ch = parseInt(m[2]);
      const v1 = parseInt(m[3]);
      const v2 = m[4] ? parseInt(m[4]) : v1;
      segments.push({ type: 'ref', content: m[0], ref: { book, ch, v1, v2, label: m[0] } });
    } else {
      segments.push({ type: 'text', content: m[0] });
    }
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }
  return segments;
}

export function lookupVerses(verseMap: Record<string, string>, ref: ScriptureRef): string[] {
  const verses: string[] = [];
  for (let v = ref.v1; v <= ref.v2; v++) {
    const key  = `${ref.book}.${ref.ch}.${v}`;
    const text = verseMap[key];
    if (text) verses.push(`${v} ${text}`);
  }
  return verses;
}
