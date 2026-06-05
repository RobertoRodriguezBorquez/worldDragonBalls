/**
 * Cliente de Dragon Ball API
 * Documentación: https://dragonball-api.com/api-docs
 * Formato: { items: Character[], meta: { totalItems, totalPages, currentPage } }
 */

export interface Character {
  id: number;
  name: string;
  ki: string;
  maxKi: string;
  race: string;
  gender: string;
  description: string;
  image: string;
  affiliation: string;
  deletedAt: string | null;
}

export interface Planet {
  id: number;
  name: string;
  isDestroyed: boolean;
  description?: string;
  image?: string;
  deletedAt?: string | null;
}

export interface CharacterFull extends Omit<Character, "originPlanet"> {
  originPlanet: Planet | null;
  transformations: Transformation[];
}

export interface Transformation {
  id: number;
  name: string;
  image: string;
  ki: string;
  deletedAt: string | null;
}

interface ApiList<T> {
  items: T[];
  meta?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
  };
}

const API_BASE = "https://dragonball-api.com/api/characters";

/**
 * IDs curados de personajes icónicos (Saiyans + villanos clásicos)
 */
export const FEATURED_IDS: number[] = [
  1, 2, 3, 4, 5, 6, 7, 9, 10, 14, 15, 16, 17, 18, 19, 20,
];

/**
 * Sagas soportadas en el sitio
 */
export const SAGAS = [
  { id: "dragon-ball", name: "Dragon Ball" },
  { id: "dragon-ball-z", name: "Dragon Ball Z" },
  { id: "dragon-ball-super", name: "Dragon Ball Super" },
  { id: "dragon-ball-gt", name: "Dragon Ball GT" },
] as const;

/**
 * Arcos narrativos curados. La API no expone "saga" así que mapeamos
 * por ID/affiliation/raza. Un personaje puede aparecer en varios arcos.
 */
export const STORY_ARCS = [
  { id: "all", name: "Todos", color: "var(--color-ki-yellow)" },
  { id: "original", name: "Dragon Ball", color: "var(--color-ki-yellow)" },
  { id: "saiyan", name: "Saiyan", color: "#ff6b3d" },
  { id: "frieza", name: "Namek / Frieza", color: "#a855f7" },
  { id: "cell", name: "Cell", color: "#10b981" },
  { id: "buu", name: "Buu", color: "#ec4899" },
  { id: "god", name: "Dios / Beerus", color: "#6366f1" },
  { id: "tournament", name: "Torneo", color: "#0ea5e9" },
  { id: "other", name: "Otros", color: "#a89a7e" },
] as const;

export type SagaId = (typeof STORY_ARCS)[number]["id"];

/**
 * Mapeo de personaje → arcos. Se calcula por heurística (affiliation + id).
 */
const SAGA_BY_AFFILIATION: Record<string, SagaId[]> = {
  "Z Fighter": ["original", "saiyan", "frieza", "cell", "buu"],
  "Army of Frieza": ["saiyan", "frieza"],
  Villain: ["cell", "buu"],
  "Pride Troopers": ["tournament"],
  "Assistant of Beerus": ["god"],
  "Assistant of Vermoud": ["tournament"],
  Freelancer: ["cell"],
  Other: ["other"],
};

const SAGA_OVERRIDES: Record<number, SagaId[]> = {
  4: ["original"],
  11: ["original", "frieza", "cell", "buu"],
  12: ["original", "frieza", "cell", "buu"],
  13: ["original", "frieza"],
  14: ["original"],
  17: ["original", "tournament"],
  19: ["original"],
  20: ["buu", "tournament", "other"],
  30: ["saiyan"],
  33: ["god", "tournament"],
  34: ["god", "tournament"],
  35: ["tournament", "other"],
  37: ["buu", "god"],
  38: ["tournament"],
  39: ["tournament"],
  40: ["tournament"],
  42: ["tournament"],
  43: ["tournament"],
  44: ["tournament"],
  63: ["other", "tournament"],
  64: ["cell", "buu"],
  65: ["buu", "tournament"],
  66: ["buu", "tournament"],
  67: ["buu"],
  68: ["saiyan", "buu", "tournament"],
  69: ["other", "tournament"],
  70: ["other", "tournament"],
  71: ["other", "tournament"],
  72: ["other", "tournament"],
  73: ["buu", "tournament"],
  74: ["buu", "tournament"],
  75: ["buu", "tournament"],
  76: ["buu", "tournament"],
  77: ["buu", "tournament"],
  78: ["buu", "tournament"],
};

export function getCharacterSagas(character: Pick<Character, "id" | "affiliation">): SagaId[] {
  const override = SAGA_OVERRIDES[character.id];
  if (override) return override;
  const fromAff = SAGA_BY_AFFILIATION[character.affiliation] ?? ["other"];
  return fromAff;
}

export function characterInSaga(character: Pick<Character, "id" | "affiliation">, saga: SagaId): boolean {
  if (saga === "all") return true;
  return getCharacterSagas(character).includes(saga);
}

async function safeFetch<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[api] Fallback usado para ${url}:`, err);
    return fallback;
  }
}

export const KI_MULTIPLIERS: Record<string, number> = {
  thousand: 1e3,
  million: 1e6,
  billion: 1e9,
  trillion: 1e12,
  quadrillion: 1e15,
  quintillion: 1e18,
  sextillion: 1e21,
  septillion: 1e24,
  septllion: 1e24,
  octillion: 1e27,
  nonillion: 1e30,
  decillion: 1e33,
};

const FALLBACK_CHARACTERS: CharacterFull[] = [
  {
    id: 1,
    name: "Goku",
    ki: "60.000.000",
    maxKi: "90 Septillion",
    race: "Saiyan",
    gender: "Male",
    description:
      "Kakaroto, conocido como Goku, es el protagonista de Dragon Ball. Es un Saiyan criado en la Tierra.",
    image: "https://dragonball-api.com/characters/goku_normal.webp",
    affiliation: "Z Fighter",
    deletedAt: null,
    originPlanet: { id: 3, name: "Vegeta", isDestroyed: true, description: "Planeta natal de los Saiyans.", deletedAt: null },
    transformations: [],
  },
  {
    id: 2,
    name: "Vegeta",
    ki: "54.000.000",
    maxKi: "19.84 Septillion",
    race: "Saiyan",
    gender: "Male",
    description:
      "Príncipe de los Saiyans, rival eterno de Goku y miembro clave de los Guerreros Z.",
    image: "https://dragonball-api.com/characters/vegeta_normal.webp",
    affiliation: "Z Fighter",
    deletedAt: null,
    originPlanet: { id: 3, name: "Vegeta", isDestroyed: true, description: "Planeta natal de los Saiyans.", deletedAt: null },
    transformations: [],
  },
  {
    id: 3,
    name: "Frieza",
    ki: "530.000",
    maxKi: "1.5 Septillion",
    race: "Frieza Race",
    gender: "Male",
    description:
      "El tirano galáctico más temido del universo. Responsable de la destrucción del Planeta Vegeta.",
    image: "https://dragonball-api.com/characters/frieza_normal.webp",
    affiliation: "Army of Frieza",
    deletedAt: null,
    originPlanet: null,
    transformations: [],
  },
];

/**
 * Trae los personajes destacados (cacheables en build)
 */
export async function getFeaturedCharacters(): Promise<CharacterFull[]> {
  const ids = FEATURED_IDS.join(",");
  const data = await safeFetch<ApiList<CharacterFull>>(
    `${API_BASE}?id=${ids}&limit=58`,
    { items: FALLBACK_CHARACTERS }
  );
  return Array.isArray(data?.items) ? data.items : FALLBACK_CHARACTERS;
}

/**
 * Trae un personaje por id
 */
export async function getCharacterById(id: number): Promise<CharacterFull> {
  const data = await safeFetch<CharacterFull | { items: CharacterFull[] }>(
    `${API_BASE}/${id}`,
    FALLBACK_CHARACTERS[0]
  );
  if (data && "items" in data && Array.isArray(data.items)) {
    return data.items[0] ?? FALLBACK_CHARACTERS[0];
  }
  return (data as CharacterFull) ?? FALLBACK_CHARACTERS[0];
}

/**
 * Convierte un ki string ("60.000.000" / "90 Septillion" / "1.5 Billion" / "unknown") a número.
 * Devuelve 0 si no se puede parsear o si el valor es "unknown".
 */
export function parseKi(ki: string): number {
  if (!ki) return 0;
  const raw = String(ki).toLowerCase().trim();
  if (raw === "unknown" || raw === "?" || raw === "") return 0;

  const [numPart, ...rest] = raw.split(/\s+/);
  const cleanedNum = (numPart || "").replace(/\./g, "").replace(/,/g, "");
  const base = Number.parseFloat(cleanedNum);
  if (!Number.isFinite(base)) return 0;

  const suffix = rest.join(" ").replace(/[^a-z]/g, "");
  const multiplier = suffix ? KI_MULTIPLIERS[suffix] : 1;
  if (multiplier === undefined) {
    const n = Number.parseInt(cleanedNum, 10);
    return Number.isFinite(n) ? n : 0;
  }
  return base * multiplier;
}

/**
 * Indica si un ki es desconocido / vacío
 */
export function isUnknownKi(ki: string | null | undefined): boolean {
  if (!ki) return true;
  const s = String(ki).toLowerCase().trim();
  return s === "" || s === "unknown" || s === "?";
}
