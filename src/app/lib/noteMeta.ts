export type NoteFamily =
  | "wood"
  | "citrus"
  | "floral"
  | "amber"
  | "musk"
  | "spicy"
  | "fresh"
  | "default";

const NOTE_AZ_MAP: Record<string, string> = {
  oud: "Ud",
  rose: "Qızılgül",
  vanilla: "Vanil",
  amber: "Ənbər",
  musk: "Müşk",
  bergamot: "Berqamot",
  lemon: "Limon",
  orange: "Portağal",
  jasmine: "Yasəmən",
  lily: "Zanbaq",
  sandalwood: "Səndəl ağacı",
  cedar: "Sidr",
  patchouli: "Paçuli",
  tonka: "Tonka",
  pepper: "İstiot",
  cardamom: "Hil",
  lavender: "Lavanda",
  mint: "Nanə",
  apple: "Alma",
  pear: "Armud",
  pineapple: "Ananas",
  coconut: "Kokos",
};

const FAMILY_KEYWORDS: Array<{ family: NoteFamily; words: string[] }> = [
  { family: "wood", words: ["oud", "wood", "cedar", "sandal", "patchouli"] },
  { family: "citrus", words: ["citrus", "bergamot", "lemon", "orange", "grapefruit"] },
  { family: "floral", words: ["rose", "jasmine", "lily", "floral", "violet", "iris"] },
  { family: "amber", words: ["amber", "vanilla", "tonka", "resin"] },
  { family: "musk", words: ["musk", "clean", "aldehyd"] },
  { family: "spicy", words: ["pepper", "cardamom", "spice", "cinnamon", "clove"] },
  { family: "fresh", words: ["mint", "apple", "pear", "pineapple", "marine"] },
];

export function noteToAz(note: string) {
  const key = note.trim().toLowerCase();
  if (!key) return "";
  if (NOTE_AZ_MAP[key]) return NOTE_AZ_MAP[key];
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export function noteFamily(note: string): NoteFamily {
  const key = note.trim().toLowerCase();
  for (const row of FAMILY_KEYWORDS) {
    if (row.words.some((w) => key.includes(w))) return row.family;
  }
  return "default";
}

export function noteChipClass(note: string) {
  const fam = noteFamily(note);
  const classes: Record<NoteFamily, string> = {
    wood: "bg-amber-900/35 text-amber-200 border border-amber-700/50",
    citrus: "bg-yellow-900/30 text-yellow-200 border border-yellow-700/50",
    floral: "bg-pink-900/30 text-pink-200 border border-pink-700/50",
    amber: "bg-orange-900/30 text-orange-200 border border-orange-700/50",
    musk: "bg-zinc-800 text-zinc-200 border border-zinc-600",
    spicy: "bg-rose-900/30 text-rose-200 border border-rose-700/50",
    fresh: "bg-emerald-900/30 text-emerald-200 border border-emerald-700/50",
    default: "bg-zinc-800 text-zinc-200 border border-zinc-700",
  };
  return classes[fam];
}
