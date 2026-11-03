import type { Title } from "../types";
// Put choleyflix-catalog.json in the same folder as this file (src/data/).
// Requires "resolveJsonModule": true in tsconfig.json.
import catalog from "../choleyflix-catalog.json";

const NOW = Date.now();

// The export is already in the app's Title shape, so we only fill in gaps
// (missing arrays / timestamps) rather than rewriting the data.
const normalize = (raw: any): Title => ({
  featured: false,
  ...raw,
  genres: Array.isArray(raw.genres) ? raw.genres : [],
  links: Array.isArray(raw.links) ? raw.links : [],
  episodes: Array.isArray(raw.episodes) ? raw.episodes : undefined,
  createdAt: raw.createdAt ?? NOW,
  updatedAt: raw.updatedAt ?? raw.createdAt ?? NOW,
});

export const seedTitles: Title[] = (catalog.titles as any[]).map(normalize);

export const DEFAULT_PIN = "choley123";
