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

export interface CharacterFull extends Character {
  originPlanet: string;
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
    originPlanet: "Planet Vegeta",
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
    originPlanet: "Planet Vegeta",
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
    originPlanet: "Unknown",
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
 * Convierte un ki string ("60.000.000" / "90 Septillion" / "unknown") a número (0 si no parsea)
 */
export function parseKi(ki: string): number {
  if (!ki) return 0;
  const s = String(ki).toLowerCase().trim();
  if (s === "unknown" || s === "?" || s === "") return 0;
  const cleaned = s.replace(/\./g, "").replace(/,/g, "");
  const n = Number.parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : 0;
}
