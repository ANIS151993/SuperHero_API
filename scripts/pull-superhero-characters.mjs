import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const outputFiles = [
  "public/superhero_characters.json",
  "docs/superhero_characters.json",
  "superhero-api/superhero_characters.json",
  "superhero-json/superhero_characters.json",
  "superhero-json/public/superhero_characters.json",
  "superhero-generator/superhero_characters.json",
  "mongodb/superhero_characters.json",
];
const reportFile = "state/superhero-pull-report.json";
const sourceUrl = "https://akabab.github.io/superhero-api/api/all.json";

function cleanOptionalText(value) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : "";
}

function cleanText(value, fallback = "Unknown") {
  const text = cleanOptionalText(value);
  return text.length > 0 ? text : fallback;
}

function normalizeAlignment(value) {
  const alignment = cleanText(value, "neutral").toLowerCase();
  if (alignment === "good" || alignment === "bad" || alignment === "neutral") {
    return alignment;
  }
  return "neutral";
}

function safeImage(pathOrUrl, extension) {
  if (!pathOrUrl) return "";
  if (extension) {
    if (pathOrUrl.includes("image_not_available")) return "";
    return `${pathOrUrl}.${extension}`;
  }
  return pathOrUrl;
}

function normalizeCharacterRecord(record) {
  const name = cleanText(record?.name, "");
  const image = safeImage(record?.image?.url || record?.images?.md || record?.images?.lg || record?.image);
  const rawId =
    record?.id === undefined || record?.id === null ? "" : String(record.id).trim();

  return {
    id: rawId,
    name,
    fullName: cleanText(record?.fullName || record?.biography?.["full-name"] || record?.biography?.fullName || name),
    publisher: cleanText(record?.publisher || record?.biography?.publisher),
    alignment: normalizeAlignment(record?.alignment || record?.biography?.alignment),
    gender: cleanText(record?.gender || record?.appearance?.gender),
    race: cleanText(record?.race || record?.appearance?.race),
    firstAppearance: cleanText(
      record?.firstAppearance ||
        record?.biography?.["first-appearance"] ||
        record?.biography?.firstAppearance ||
        record?.comics?.items?.[0]?.name ||
        record?.description
    ),
    image,
  };
}

function characterKey(character) {
  if (character.id.length > 0) return `id:${character.id}`;
  return `name:${character.name.toLowerCase()}`;
}

function characterScore(character) {
  let score = 0;
  if (character.image.length > 0) score += 4;
  if (character.fullName !== "Unknown") score += 1;
  if (character.firstAppearance !== "Unknown") score += 1;
  if (character.gender !== "Unknown") score += 1;
  if (character.race !== "Unknown") score += 1;
  if (character.publisher !== "Unknown") score += 1;
  return score;
}

function dedupeCharacters(characters) {
  const map = new Map();
  let dropped = 0;

  for (const record of characters) {
    const normalized = normalizeCharacterRecord(record);
    if (normalized.name.length === 0) continue;

    const key = characterKey(normalized);
    const existing = map.get(key);

    if (!existing) {
      map.set(key, normalized);
      continue;
    }

    dropped += 1;

    if (characterScore(normalized) > characterScore(existing)) {
      map.set(key, normalized);
    }
  }

  return {
    characters: [...map.values()].sort((a, b) => a.name.localeCompare(b.name)),
    dropped,
  };
}

async function loadPreviousDataset() {
  const fullPath = path.resolve(repoRoot, outputFiles[0]);

  try {
    const content = await readFile(fullPath, "utf8");
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) return [];
    return dedupeCharacters(parsed).characters;
  } catch {
    return [];
  }
}

function hasCharacterChanged(previous, current) {
  const fields = [
    "name",
    "fullName",
    "publisher",
    "alignment",
    "gender",
    "race",
    "firstAppearance",
    "image",
  ];

  return fields.some((field) => previous[field] !== current[field]);
}

function buildChangeReport(previous, current) {
  const previousMap = new Map(previous.map((character) => [characterKey(character), character]));
  const currentMap = new Map(current.map((character) => [characterKey(character), character]));

  const added = [];
  const removed = [];
  const updated = [];

  for (const [key, character] of currentMap.entries()) {
    if (!previousMap.has(key)) {
      added.push(character.name);
      continue;
    }

    const oldCharacter = previousMap.get(key);
    if (hasCharacterChanged(oldCharacter, character)) {
      updated.push(character.name);
    }
  }

  for (const [key, character] of previousMap.entries()) {
    if (!currentMap.has(key)) {
      removed.push(character.name);
    }
  }

  added.sort((a, b) => a.localeCompare(b));
  removed.sort((a, b) => a.localeCompare(b));
  updated.sort((a, b) => a.localeCompare(b));

  return {
    previousCount: previous.length,
    currentCount: current.length,
    added,
    removed,
    updated,
  };
}

function formatNamePreview(names, limit = 15) {
  if (names.length === 0) return "none";
  if (names.length <= limit) return names.join(", ");
  const head = names.slice(0, limit).join(", ");
  return `${head}, ... (+${names.length - limit} more)`;
}

async function fetchJson(url) {
  const response = await fetch(url);
  const text = await response.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }

  if (!response.ok) {
    const reason = data?.message || text.slice(0, 200) || "Unknown API error";
    throw new Error(`HTTP ${response.status}: ${reason}`);
  }

  return data;
}

function normalizeFromAkababApi(results) {
  return results
    .map((character) =>
      normalizeCharacterRecord({
      id: character.id,
      name: character.name,
      fullName: character.biography?.["full-name"],
      publisher: character.biography?.publisher,
      alignment: character.biography?.alignment,
      gender: character.appearance?.gender,
      race: character.appearance?.race,
      firstAppearance: character.biography?.["first-appearance"],
      image: character.images?.md || character.images?.lg || character.image?.url,
      })
    )
    .filter((character) => character.id.length > 0 && character.name.length > 0)
    .filter((character) => character.name.length > 0 && character.image.length > 0);
}

async function pullFromAkababApi() {
  console.log(`Pulling dataset from ${sourceUrl}`);
  const data = await fetchJson(sourceUrl);

  if (!Array.isArray(data)) {
    throw new Error("Unexpected SuperHero API response shape.");
  }

  return normalizeFromAkababApi(data);
}

async function writeDataset(characters) {
  const payload = `${JSON.stringify(characters, null, 2)}\n`;

  for (const relPath of outputFiles) {
    const fullPath = path.resolve(repoRoot, relPath);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, payload, "utf8");
    console.log(`Wrote ${characters.length} records -> ${relPath}`);
  }
}

async function writeReport(report) {
  const fullPath = path.resolve(repoRoot, reportFile);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Wrote change report -> ${reportFile}`);
}

async function main() {
  const previousCharacters = await loadPreviousDataset();
  let characters = [];
  let source = "Akabab SuperHero API (full dataset)";

  try {
    characters = await pullFromAkababApi();
  } catch (error) {
    console.warn(`Remote pull failed: ${error.message}`);
    characters = previousCharacters;
    source = "Local existing dataset (offline fallback)";
  }

  if (characters.length === 0) {
    throw new Error("No SuperHero characters were pulled.");
  }

  const dedupeResult = dedupeCharacters(characters);
  characters = dedupeResult.characters;
  const duplicateDrops = dedupeResult.dropped;

  const diff = buildChangeReport(previousCharacters, characters);

  await writeDataset(characters);
  await writeReport({
    createdAt: new Date().toISOString(),
    source,
    totalPulled: characters.length,
    duplicatesDropped: duplicateDrops,
    ...diff,
    addedNames: diff.added,
    removedNames: diff.removed,
    updatedNames: diff.updated,
  });

  console.log("");
  console.log(`Done. Pulled ${characters.length} characters from ${source}.`);
  console.log(`Deduplicated records dropped: ${duplicateDrops}`);
  console.log(`Change report vs previous pull: ${diff.previousCount} -> ${diff.currentCount}`);
  console.log(`New characters: ${diff.added.length}`);
  console.log(`Removed characters: ${diff.removed.length}`);
  console.log(`Updated characters: ${diff.updated.length}`);
  console.log(`New names: ${formatNamePreview(diff.added)}`);
  console.log(`Removed names: ${formatNamePreview(diff.removed)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
