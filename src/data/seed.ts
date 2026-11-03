import type { DownloadLink, Episode, Title } from "../types";

const NOW = Date.now();
const DAY = 86_400_000;

const archiveUrl = (id: string, file: string) =>
  `https://archive.org/download/${id}/${encodeURIComponent(file)}`;
const googleUrl = (name: string) =>
  `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/${name}.mp4`;
const googleImg = (name: string) =>
  `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/${name}.jpg`;
const archiveImg = (id: string) => `https://archive.org/services/img/${id}`;

let linkCounter = 0;
const link = (label: string, url: string, size?: number): DownloadLink => ({
  id: `seed-link-${++linkCounter}`,
  label,
  url,
  size,
});

let episodeCounter = 0;
const episode = (number: number, title: string, links: DownloadLink[], image?: string): Episode => ({
  id: `seed-ep-${++episodeCounter}`,
  number,
  title,
  links,
  image,
});

let titleCounter = 0;
const title = (
  partial: Omit<Title, "id" | "createdAt" | "updatedAt" | "featured"> & { featured?: boolean },
  addedDaysAgo: number,
): Title => ({
  featured: false,
  ...partial,
  id: `seed-title-${++titleCounter}`,
  createdAt: NOW - addedDaysAgo * DAY,
  updatedAt: NOW - addedDaysAgo * DAY,
});

export const seedTitles: Title[] = [
  title({
    name: "Sintel", type: "movie", year: 2010, language: "English", featured: true,
    genres: ["Fantasy", "Adventure", "Animation"], accent: "#e36b45",
    description: "A fiercely determined young warrior crosses frozen mountains and sun-baked ruins searching for Scales, the baby dragon she once rescued and befriended. A compact, emotional fantasy from the Blender Institute with an unforgettable final revelation.",
    poster: googleImg("Sintel"), backdrop: googleImg("Sintel"),
    links: [
      link("1080p · MP4 Stereo", archiveUrl("Sintel", "sintel-2048-stereo.mp4")),
      link("720p · MP4 Mirror", googleUrl("Sintel"), 129_243_452),
    ],
  }, 1),
  title({
    name: "Big Buck Bunny", type: "movie", year: 2008, language: "No dialogue",
    genres: ["Comedy", "Family", "Animation"], accent: "#b7d63e",
    description: "A gentle giant of the forest has his peaceful morning ruined by three rude rodents — and prepares an elaborately staged, beautifully animated revenge in the classic cartoon tradition.",
    poster: googleImg("BigBuckBunny"), backdrop: googleImg("BigBuckBunny"),
    links: [
      link("720p · MP4 Surround", archiveUrl("BigBuckBunny_124", "Content/big_buck_bunny_720p_surround.mp4"), 61_878_609),
      link("720p · MP4 Mirror", googleUrl("BigBuckBunny"), 158_008_992),
    ],
  }, 2),
  title({
    name: "Elephants Dream", type: "movie", year: 2006, language: "English",
    genres: ["Sci-Fi", "Surreal", "Animation"], accent: "#d3924f",
    description: "The world's first open movie. Proog guides the skeptical Emo through a vast, capricious machine in a strange duel between imagination and experience whose meaning remains deliciously unresolved.",
    poster: googleImg("ElephantsDream"), backdrop: googleImg("ElephantsDream"),
    links: [
      link("1024p · MP4", archiveUrl("ElephantsDream", "ed_1024.mp4"), 67_835_590),
      link("720p · MP4 Mirror", googleUrl("ElephantsDream"), 169_543_384),
    ],
  }, 3),
  title({
    name: "Tears of Steel", type: "movie", year: 2012, language: "English",
    genres: ["Sci-Fi", "Action", "Live action"], accent: "#4b9bb5",
    description: "Forty years after an awkward heartbreak on an Amsterdam bridge, a team of scientists restages the moment with robots and memory technology to save the city from an apocalyptic future.",
    poster: googleImg("TearsOfSteel"), backdrop: googleImg("TearsOfSteel"),
    links: [link("720p · MP4", googleUrl("TearsOfSteel"), 137_989_653)],
  }, 4),
  title({
    name: "Cosmos Laundromat: First Cycle", type: "movie", year: 2015, language: "English",
    genres: ["Drama", "Surreal", "Animation"], accent: "#a970d5",
    description: "On a desolate island, the despairing sheep Franck meets Victor, an eccentric salesman with a mysterious product. A darkly comic, startlingly sincere trip through parallel lives from the Blender Institute.",
    poster: archiveImg("CosmosLaundromatFirstCycle"), backdrop: archiveImg("CosmosLaundromatFirstCycle"),
    links: [
      link("1080p · MP4", archiveUrl("CosmosLaundromatFirstCycle", "Cosmos Laundromat - First Cycle (1080p).mp4"), 220_087_570),
      link("SD · OGV (small)", archiveUrl("CosmosLaundromatFirstCycle", "Cosmos Laundromat - First Cycle (1080p).ogv"), 56_832_560),
    ],
  }, 6),
  title({
    name: "Sita Sings the Blues", type: "movie", year: 2008, language: "English",
    genres: ["Musical", "Romance", "Animation"], accent: "#e84a75",
    description: "Nina Paley interweaves episodes from the Ramayana with autobiographical heartbreak and the voice of 1920s jazz singer Annette Hanshaw. A singular independent feature in multiple animation styles.",
    poster: archiveImg("Sita_Sings_the_Blues"), backdrop: archiveImg("Sita_Sings_the_Blues"),
    links: [
      link("1080p · MP4", archiveUrl("Sita_Sings_the_Blues", "Sita_Sings_the_Blues_1080p.mp4"), 4_428_753_160),
      link("720p · MP4", archiveUrl("Sita_Sings_the_Blues", "Sita_Sings_the_Blues_720p.mp4"), 2_594_195_433),
      link("480p · MP4 (fast)", archiveUrl("Sita_Sings_the_Blues", "Sita_Sings_the_Blues.mp4"), 507_536_373),
    ],
  }, 8),
  title({
    name: "The General", type: "movie", year: 1926, language: "Silent · intertitles",
    genres: ["Comedy", "Action", "Silent"], accent: "#b5a78b",
    description: "When Union spies steal his beloved locomotive, engineer Johnnie Gray gives chase and accidentally crosses enemy lines. Buster Keaton's impeccably composed gags build from intimate misunderstandings to monumental spectacle.",
    poster: archiveImg("TheGeneral1926"), backdrop: archiveImg("TheGeneral1926"),
    links: [
      link("720p · MP4", archiveUrl("TheGeneral1926", "The_General_1926_720p.mp4"), 1_003_361_613),
      link("SD · MP4 (fast)", archiveUrl("TheGeneral1926", "The_General_1926_720p_512kb.mp4"), 419_224_226),
    ],
  }, 12),
  title({
    name: "Sherlock Jr.", type: "movie", year: 1924, language: "Silent · intertitles",
    genres: ["Comedy", "Fantasy", "Silent"], accent: "#c7b690",
    description: "Falsely accused of theft, a young projectionist falls asleep and dreams himself into the detective story on screen. Forty-five minutes of impossible edits, audacious stunts, and pure cinema.",
    poster: archiveImg("MyMovie_20190318"), backdrop: archiveImg("MyMovie_20190318"),
    links: [
      link("HD · MP4", archiveUrl("MyMovie_20190318", "My Movie.mp4"), 627_165_683),
      link("SD · OGV (small)", archiveUrl("MyMovie_20190318", "My Movie.ogv"), 170_849_579),
    ],
  }, 14),
  title({
    name: "Nosferatu", type: "movie", year: 1922, language: "Silent · restored",
    genres: ["Horror", "Fantasy", "Silent"], accent: "#71876b",
    description: "Estate agent Thomas Hutter travels to Count Orlok's isolated castle and unknowingly opens a path for terror to reach his home. Murnau's expressionist landmark still feels dangerously alive.",
    poster: archiveImg("Nosferatu_most_complete_version_93_mins."), backdrop: archiveImg("Nosferatu_most_complete_version_93_mins."),
    links: [
      link("HD · MP4", archiveUrl("Nosferatu_most_complete_version_93_mins.", "Nosferatu_1922_Symphony_of_Horror_512kb.mp4"), 395_416_378),
      link("HD · OGV", archiveUrl("Nosferatu_most_complete_version_93_mins.", "Nosferatu_1922_Symphony_of_Horror.ogv"), 401_195_646),
    ],
  }, 16),
  title({
    name: "Detour", type: "movie", year: 1945, language: "English",
    genres: ["Noir", "Crime", "Thriller"], accent: "#8f8578",
    description: "A pianist hitchhiking to Los Angeles assumes a dead motorist's identity and falls under the spell of the ferociously manipulative Vera. Stark road noir that turns bad luck into existential momentum.",
    poster: archiveImg("Detour"), backdrop: archiveImg("Detour"),
    links: [
      link("HD · MP4", archiveUrl("Detour", "Detour.mp4"), 423_770_341),
      link("SD · MP4 (fast)", archiveUrl("Detour", "Detour_512kb.mp4"), 294_622_587),
    ],
  }, 18),
  title({
    name: "His Girl Friday", type: "movie", year: 1940, language: "English",
    genres: ["Comedy", "Romance", "Newsroom"], accent: "#c69c5c",
    description: "Newspaper editor Walter Burns will do anything to stop his star reporter — and former wife — Hildy Johnson from leaving journalism. Dialogue at breakneck speed from Howard Hawks.",
    poster: archiveImg("HisGirlFriday"), backdrop: archiveImg("HisGirlFriday"),
    links: [
      link("HD · MP4", archiveUrl("HisGirlFriday", "MoviePowderPresentsHisGirlFriday.mp4"), 551_669_835),
      link("SD · MP4 (fast)", archiveUrl("HisGirlFriday", "MoviePowderPresentsHisGirlFriday_512kb.mp4"), 384_258_272),
    ],
  }, 21),
  title({
    name: "D.O.A.", type: "movie", year: 1949, language: "English",
    genres: ["Noir", "Mystery", "Thriller"], accent: "#7e8a96",
    description: "A man walks into a police station to report his own murder. Accountant Frank Bigelow has days to find his killer in this ingenious noir with a ticking clock and a piercing opening hook.",
    poster: archiveImg("doa-1949"), backdrop: archiveImg("doa-1949"),
    links: [link("HD · MP4", archiveUrl("doa-1949", "DOA 1950.mp4"), 475_079_732)],
  }, 24),
  title({
    name: "The Stranger", type: "movie", year: 1946, language: "English",
    genres: ["Noir", "Thriller", "Drama"], accent: "#8b735c",
    description: "A determined investigator arrives in Connecticut on the trail of a fugitive war criminal living as a respected schoolteacher. Orson Welles directs and stars, building to a clocktower confrontation.",
    poster: archiveImg("TheStranger_0"), backdrop: archiveImg("TheStranger_0"),
    links: [
      link("HD · MP4", archiveUrl("TheStranger_0", "The_Stranger.mp4"), 570_456_474),
      link("SD · MP4 (fast)", archiveUrl("TheStranger_0", "The_Stranger_512kb.mp4"), 397_241_981),
    ],
  }, 27),
  title({
    name: "Plan 9 from Outer Space", type: "movie", year: 1957, language: "English",
    genres: ["Sci-Fi", "Horror", "Cult"], accent: "#746b91",
    description: "Alien visitors implement Plan 9 — raising the recently dead — to stop humanity from building a universe-ending weapon. Ed Wood's earnest, eccentric production is a beloved celebration of personal filmmaking.",
    poster: archiveImg("plan-9-from-outer-space"), backdrop: archiveImg("plan-9-from-outer-space"),
    links: [link("HD · MP4", archiveUrl("plan-9-from-outer-space", "plan-9-from-outer-space.mp4"), 454_359_304)],
  }, 30),
  title({
    name: "Night of the Living Dead", type: "movie", year: 1968, language: "English",
    genres: ["Horror", "Thriller", "Independent"], accent: "#79816c",
    description: "Seven people shelter in a rural farmhouse as an unexplained plague of reanimated corpses spreads. Romero's landmark combines documentary immediacy and unflinching horror that changed the genre forever.",
    poster: archiveImg("night_of_the_living_dead_dvd"), backdrop: archiveImg("night_of_the_living_dead_dvd"),
    links: [
      link("HD · MP4", archiveUrl("night_of_the_living_dead_dvd", "Night.mp4"), 596_399_542),
      link("HD · OGV", archiveUrl("night_of_the_living_dead_dvd", "Night.ogv"), 441_276_820),
    ],
  }, 33),
  title({
    name: "Caminandes", type: "series", year: 2013, language: "No dialogue",
    genres: ["Comedy", "Family", "Animation"], accent: "#4f9c9b",
    description: "Koro the llama faces beautifully observed Patagonian misadventures in this three-part open-movie series. Tiny problems, extremely determined solutions, one helpful penguin.",
    poster: archiveImg("Caminandes2GranDillama"), backdrop: archiveImg("CaminandesLlamigos"),
    links: [],
    episodes: [
      episode(1, "Llama Drama", [link("1080p · MP4", archiveUrl("Caminandes1LlamaDrama", "01_llama_drama_1080p.mp4"), 35_103_580)], archiveImg("Caminandes1LlamaDrama")),
      episode(2, "Gran Dillama", [link("1080p · MP4", archiveUrl("Caminandes2GranDillama", "02_gran_dillama_1080p.mp4"), 125_974_946)], archiveImg("Caminandes2GranDillama")),
      episode(3, "Llamigos", [link("1080p · MP4", archiveUrl("CaminandesLlamigos", "Caminandes_ Llamigos-1080p.mp4"), 138_945_811)], archiveImg("CaminandesLlamigos")),
    ],
  }, 5),
  title({
    name: "Open Movie Showcase", type: "series", year: 2006, language: "Multiple",
    genres: ["Anthology", "Animation", "Sci-Fi"], accent: "#d76340",
    description: "A curated journey through the open-movie movement: intimate fantasy, absurd comedy, surreal machinery, live-action spectacle, and musical animation — six chapters, one extraordinary creative laboratory.",
    poster: googleImg("Sintel"), backdrop: googleImg("TearsOfSteel"),
    links: [],
    episodes: [
      episode(1, "Sintel", [link("720p · MP4", googleUrl("Sintel"), 129_243_452)], googleImg("Sintel")),
      episode(2, "Big Buck Bunny", [link("720p · MP4", googleUrl("BigBuckBunny"), 158_008_992)], googleImg("BigBuckBunny")),
      episode(3, "Elephants Dream", [link("720p · MP4", googleUrl("ElephantsDream"), 169_543_384)], googleImg("ElephantsDream")),
      episode(4, "Tears of Steel", [link("720p · MP4", googleUrl("TearsOfSteel"), 137_989_653)], googleImg("TearsOfSteel")),
      episode(5, "Cosmos Laundromat", [link("1080p · MP4", archiveUrl("CosmosLaundromatFirstCycle", "Cosmos Laundromat - First Cycle (1080p).mp4"), 220_087_570)], archiveImg("CosmosLaundromatFirstCycle")),
      episode(6, "Sita Sings the Blues", [link("480p · MP4", archiveUrl("Sita_Sings_the_Blues", "Sita_Sings_the_Blues.mp4"), 507_536_373)], archiveImg("Sita_Sings_the_Blues")),
    ],
  }, 9),
  title({
    name: "Silent Cinema Essentials", type: "series", year: 1922, language: "Silent · intertitles",
    genres: ["Anthology", "Silent", "Classic"], accent: "#9e9279",
    description: "Three films that taught the camera to run, dream, and haunt: Keaton's grand engineering, Keaton's cinematic dreaming, and Murnau's supernatural atmosphere.",
    poster: archiveImg("MyMovie_20190318"), backdrop: archiveImg("Nosferatu_most_complete_version_93_mins."),
    links: [],
    episodes: [
      episode(1, "The General", [link("720p · MP4", archiveUrl("TheGeneral1926", "The_General_1926_720p.mp4"), 1_003_361_613)], archiveImg("TheGeneral1926")),
      episode(2, "Sherlock Jr.", [link("HD · MP4", archiveUrl("MyMovie_20190318", "My Movie.mp4"), 627_165_683)], archiveImg("MyMovie_20190318")),
      episode(3, "Nosferatu", [link("HD · MP4", archiveUrl("Nosferatu_most_complete_version_93_mins.", "Nosferatu_1922_Symphony_of_Horror_512kb.mp4"), 395_416_378)], archiveImg("Nosferatu_most_complete_version_93_mins.")),
    ],
  }, 15),
  title({
    name: "Midnight: Noir & Beyond", type: "series", year: 1945, language: "English",
    genres: ["Anthology", "Noir", "Horror"], accent: "#69765f",
    description: "A late-night program from apocalyptic horror through postwar suspicion and hard-luck noir to outer-space delirium. Shadowy photography and a deep suspicion of peaceful surfaces.",
    poster: archiveImg("Detour"), backdrop: archiveImg("night_of_the_living_dead_dvd"),
    links: [],
    episodes: [
      episode(1, "Night of the Living Dead", [link("HD · MP4", archiveUrl("night_of_the_living_dead_dvd", "Night.mp4"), 596_399_542)], archiveImg("night_of_the_living_dead_dvd")),
      episode(2, "The Stranger", [link("HD · MP4", archiveUrl("TheStranger_0", "The_Stranger.mp4"), 570_456_474)], archiveImg("TheStranger_0")),
      episode(3, "Detour", [link("HD · MP4", archiveUrl("Detour", "Detour.mp4"), 423_770_341)], archiveImg("Detour")),
      episode(4, "Plan 9 from Outer Space", [link("HD · MP4", archiveUrl("plan-9-from-outer-space", "plan-9-from-outer-space.mp4"), 454_359_304)], archiveImg("plan-9-from-outer-space")),
    ],
  }, 20),
];

export const DEFAULT_PIN = "choley123";
