const STICKIES_FILE_EXTENSION = ".stickies";
const LEGACY_STICKIES_JSON_EXTENSION = ".stickies.json";
const LEGACY_JSON_EXTENSION = ".json";

const FUN_NAME_ADJECTIVES = [
  "Bright",
  "Cosmic",
  "Daring",
  "Electric",
  "Golden",
  "Hidden",
  "Lucky",
  "Magic",
  "Neon",
  "Pocket",
  "Quiet",
  "Radiant",
  "Solar",
  "Velvet",
  "Wild",
  "Zesty",
];

const FUN_NAME_NOUNS = [
  "Beacon",
  "Comet",
  "Compass",
  "Garden",
  "Lantern",
  "Map",
  "Meadow",
  "Orbit",
  "Pixel",
  "Rocket",
  "Signal",
  "Sketch",
  "Spark",
  "Studio",
  "Voyage",
  "Workshop",
];

function pickRandomItem(values: string[], random: () => number) {
  return values[Math.floor(random() * values.length) % values.length];
}

export function createFunProjectName(random: () => number = Math.random) {
  return `${pickRandomItem(FUN_NAME_ADJECTIVES, random)} ${pickRandomItem(FUN_NAME_NOUNS, random)}`;
}

export function stripStickiesFileExtension(name: string) {
  const trimmedName = name.trim();
  const lowerName = trimmedName.toLowerCase();

  if (lowerName.endsWith(LEGACY_STICKIES_JSON_EXTENSION)) {
    return trimmedName.slice(0, -LEGACY_STICKIES_JSON_EXTENSION.length);
  }

  if (lowerName.endsWith(STICKIES_FILE_EXTENSION)) {
    return trimmedName.slice(0, -STICKIES_FILE_EXTENSION.length);
  }

  if (lowerName.endsWith(LEGACY_JSON_EXTENSION)) {
    return trimmedName.slice(0, -LEGACY_JSON_EXTENSION.length);
  }

  return trimmedName;
}

export function createFileBasename(name: string, fallback = "stickies-project") {
  const strippedName = stripStickiesFileExtension(name) || fallback;
  const basename = strippedName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return basename || fallback;
}

export function createStickiesFileName(name: string) {
  return `${createFileBasename(name)}${STICKIES_FILE_EXTENSION}`;
}

export function isSupportedStickiesFileName(name: string) {
  const lowerName = name.toLowerCase();
  return (
    lowerName.endsWith(STICKIES_FILE_EXTENSION) ||
    lowerName.endsWith(LEGACY_STICKIES_JSON_EXTENSION) ||
    lowerName.endsWith(LEGACY_JSON_EXTENSION)
  );
}

export { STICKIES_FILE_EXTENSION, LEGACY_STICKIES_JSON_EXTENSION, LEGACY_JSON_EXTENSION };
