import normal from "@/data/drop-tables-0.json";
import hard from "@/data/drop-tables-1.json";
import veryHard from "@/data/drop-tables-2.json";
import ultimate from "@/data/drop-tables-3.json";
import type { DropRecord, DropTablePayload, ItemType, MatrixRow } from "./types";

type SourceDrop = [sectionId: string, item: string, rate: string | null];
type SourceRow = [enemy: string, dar: number, drops: SourceDrop[]];
type SourceTable = {
  source: string;
  syncedAt: string;
  difficulty: number;
  name: string;
  episodes: Array<{ episode: number; rows: SourceRow[] }>;
};

const tables = [normal, hard, veryHard, ultimate] as SourceTable[];

const normalize = (value: string) =>
  value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const hasAny = (value: string, terms: string[]) => terms.some((term) => value.includes(term));

function classifyItem(item: string): ItemType {
  const name = normalize(item);

  if (
    hasAny(name, [
      "material",
      "grinder",
      "photon drop",
      "photon crystal",
      "photon sphere",
      "photon core",
      "addslot",
      "syncesta",
      "amplifier",
      "magic rock",
      "dark matter",
      "parasitic gene",
      "orb of",
      "ideya cell",
      "administrator s core",
    ])
  ) {
    return "Material";
  }

  if (
    /(^| )(god|devil|heavenly|centurion|immortal|cure|resist|general|angel|master|hero|v50[123]|v80[123]|hp|tp|pb|trap) /.test(
      name.replaceAll("/", " "),
    ) ||
    (item.includes("/") && !/^(M&A|L&K|S-BEAT|P-ARMS)/i.test(item)) ||
    /^v\d{3}$/i.test(name) ||
    hasAny(name, ["smartlink", "limiter", "adept", "swordsman lore", "state maintenance"])
  ) {
    return "Unit";
  }

  if (
    hasAny(name, [
      "shield",
      "barrier",
      "bracer",
      "reflector",
      "kasami",
      "standstill",
      "tripolic",
      "s parts",
      "regen gear",
      "secret gear",
      "rico s earrings",
      "rico s glasses",
      "red ring",
      "anti dark ring",
      "anti light ring",
      "wings",
    ]) ||
    /(^| )(wall|guard|gear|ring)$/.test(name)
  ) {
    return "Shield";
  }

  if (
    hasAny(name, [
      "armor",
      "frame",
      "field",
      "uniform",
      "garment",
      "cuirass",
      "cloak",
      "coat",
      "suit",
      "jacket",
      "mantle",
      "dress",
      "nexus",
      "aura",
      "sacred cloth",
      "guard wave",
      "love heart",
      "brightness circle",
      "sense plate",
      "attribute plate",
      "graviton plate",
      "d parts",
      "mother garb",
      "virus wear",
    ])
  ) {
    return "Armor";
  }

  if (
    hasAny(name, [
      "monomate",
      "dimate",
      "trimate",
      "monofluid",
      "difluid",
      "trifluid",
      "atomizer",
      "scape doll",
      "telepipe",
      "antidote",
      "antiparalysis",
      "trap vision",
    ])
  ) {
    return "Consumable";
  }

  if (hasAny(name, ["heart of", "kit of", "mag cell", "rappy s beak"]) || /(^| )mag($| )/.test(name)) {
    return "Mag";
  }

  if (hasAny(name, ["present", "easter egg", "jack o lantern", "badge", "ticket", "bouquet"])) {
    return "Other";
  }

  return "Weapon";
}

const areaGroups: Record<number, Array<[string, string[]]>> = {
  1: [
    ["Forest", ["hilde", "moth", "monest", "rappy", "wolf", "gulgus", "booma", "bartle", "barble", "tollaw", "dragon"]],
    ["Caves", ["assassin", "lily", "nano dragon", "shark", "vulmer", "melqueek", "slime", "pan arms", "migium", "hidoom", "de rol", "dal ra"]],
    ["Mines", ["dubch", "garanz", "baranz", "canadine", "canane", "sinow beat", "sinow gold", "sinow blue", "sinow red", "gillch", "vol opt"]],
    ["Ruins", ["delsaber", "sorcerer", "belra", "bringer", "claw", "bulk", "bulclaw", "dimenian", "dark falz"]],
  ],
  2: [
    ["VR Temple", ["hilde", "rappy", "wolf", "lily", "assassin", "pan arms", "migium", "hidoom", "barba ray"]],
    ["VR Spaceship", ["dubch", "garanz", "delsaber", "sorcerer", "belra", "dimenian", "gilch", "gol dragon"]],
    ["Central Control Area", ["merill", "gee", "gi gue", "mericarol", "merikle", "mericus", "gibbon", "gibbles", "gal gryphon"]],
    ["Seabed", ["sinow berill", "sinow spigell", "sinow zoa", "sinow zele", "dolmolm", "dolmdarl", "morfos", "recon", "deldepth", "delbiter", "olga flow"]],
    ["Control Tower", ["ill gill", "del lily", "epsilon"]],
  ],
  4: [
    ["Crater", ["astark", "yowie", "satellite lizard", "merissa", "girtablulu", "zu", "pazuzu"]],
    ["Subterranean Desert", ["boota", "dorphon", "goran", "sand rappy", "del rappy", "saint million", "shambertin", "kondrieu"]],
  ],
};

function getArea(episode: number, enemy: string) {
  const value = normalize(enemy);
  const match = areaGroups[episode]?.find(([, enemies]) => enemies.some((name) => value.includes(name)));
  return match?.[0] ?? "Custom / Raid";
}

function getSearchText(item: string, enemy: string) {
  const aliases = /parasitic gene\s*["']?flow/i.test(item) ? " pgf parasitic gene flow" : "";
  return `${normalize(item)} ${normalize(enemy)}${aliases}`;
}

function parseDenominator(rate: string | null) {
  if (!rate) return null;
  const value = Number(rate.replace(/^1\//, ""));
  return Number.isFinite(value) ? value : null;
}

export function getDropTablePayload(): DropTablePayload {
  const records: DropRecord[] = [];
  const matrixRows: MatrixRow[] = [];

  for (const table of tables) {
    for (const episode of table.episodes) {
      episode.rows.forEach(([enemy, dar, drops], rowIndex) => {
        matrixRows.push({
          id: `${table.difficulty}-${episode.episode}-${rowIndex}`,
          difficultyId: table.difficulty,
          difficulty: table.name,
          episode: episode.episode,
          area: getArea(episode.episode, enemy),
          enemy,
          dar,
          drops: drops.map(([sectionId, item, rate]) => ({
            sectionId,
            item,
            itemType: item.toLowerCase() === "no item" ? "Other" : classifyItem(item),
            rate,
            denominator: parseDenominator(rate),
          })),
        });

        drops.forEach(([sectionId, item, rate], dropIndex) => {
          if (!item || item.toLowerCase() === "no item") return;
          records.push({
            id: `${table.difficulty}-${episode.episode}-${rowIndex}-${dropIndex}`,
            difficultyId: table.difficulty,
            difficulty: table.name,
            sectionId,
            episode: episode.episode,
            area: getArea(episode.episode, enemy),
            enemy,
            dar,
            item,
            itemType: classifyItem(item),
            rate,
            denominator: parseDenominator(rate),
            searchText: getSearchText(item, enemy),
          });
        });
      });
    }
  }

  const latest = tables.reduce((current, table) =>
    Date.parse(table.syncedAt) > Date.parse(current.syncedAt) ? table : current,
  );

  return {
    records,
    matrixRows,
    syncedAt: latest.syncedAt,
    sourceUrl: "https://playpso.net/drop-tables",
  };
}
