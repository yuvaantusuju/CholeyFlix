import { SEED_VERSION } from "./seed";

const VERSION_KEY = "choleyflix:seedVersion";

// If the catalog JSON changed since this browser last loaded it,
// wipe all saved data so the app starts fresh from the new seed.
try {
  if (localStorage.getItem(VERSION_KEY) !== SEED_VERSION) {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem(VERSION_KEY, SEED_VERSION);
  }
} catch {
  // storage blocked (private mode etc.) - nothing to reset
}
