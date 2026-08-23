(() => {
  "use strict";

  const split = (value) => value.split("|").map((name) => name.trim()).filter(Boolean);
  const items = new Map();
  const ensure = (name) => {
    if (!items.has(name)) items.set(name, { name, aliases: [], overall: [] });
    return items.get(name);
  };

  const addPriority = (field, groups) => {
    Object.entries(groups).forEach(([grade, names]) => {
      split(names).forEach((name) => { ensure(name)[field] = grade; });
    });
  };

  addPriority("hit", {
    S: "D-VIRUS LAUNCHER|FINAL EGG BLASTER|ASTRAL DRAGON|DARK FLOW|ULTIMATE DOUBLE CANNON|LAVIS STORM|DOUBLE FURY|GRAVE DIGGER|NEFARIOUS NEEDLE|SNOW QUEEN",
    "A+": "TWIN RIKA'S CLAW|EXCALIBUR|TWIN CYCLONE|CELESTIAL FUSION",
    A: "PLANET EATER|TSUMIKIRI J-SWORD|TERROR SAWD|RATHALOS GREAT SWORD|TWIN EXECUTIONER|STORMRENDER|YASMINKOV 9000M|ETERNAL NIGHT|3RD ANNIVERSARY BLADE|ILL GILL REAPER",
    "B+": "DARK METEOR|VENUS BOW|SOUL DEVOURER|TASTE OF AFFECTION|LAST EMPEROR",
    B: "M&A85 FURY|OROTIAGITO|ARMAGEDDON|CHRISTMAS SPIRIT|ACT OF WAR|HELL STRIKER|HELL NEEDLE|TYPE-SH/SHOT [HELL]|NIGHTMARE|COMBUSTION CANNON|DAYLIGHT SCAR|ARREST NEEDLE",
    C: "HOLY RAY|SUBZERO|IRON FAUST|ARCTIC FAUST|MASTER RAVEN|LAST SWAN|JUDGEMENT BLADE|KITETSU|BRINGER'S RIFLE|SLICER OF FANATIC|HEAVEN STRIKER"
  });

  addPriority("attribute", {
    S: "D-VIRUS LAUNCHER|FINAL EGG BLASTER|ASTRAL DRAGON|DARK FLOW|ULTIMATE DOUBLE CANNON|LAVIS STORM|DOUBLE FURY",
    "A+": "EXCALIBUR|TWIN RIKA'S CLAW|TSUMIKIRI J-SWORD|DARK METEOR",
    A: "PLANET EATER|ETERNAL NIGHT|3RD ANNIVERSARY BLADE|STORMRENDER|TWIN EXECUTIONER|TWIN CYCLONE|RATHALOS GREAT SWORD|TERROR SAWD|ILL GILL REAPER|LAST EMPEROR",
    "B+": "SOUL DEVOURER|M&A85 FURY|OROTIAGITO",
    B: "SNOW QUEEN|TASTE OF AFFECTION|ARMAGEDDON|GRAVE DIGGER|NEFARIOUS NEEDLE|CELESTIAL FUSION|CHRISTMAS SPIRIT|ACT OF WAR|COMBUSTION CANNON|DAYLIGHT SCAR|HEAVEN STRIKER",
    C: "IRON FAUST|ARCTIC FAUST|JUDGEMENT BLADE|KITETSU"
  });

  const rate = (score, category, entries) => {
    entries.forEach((entry) => {
      const value = typeof entry === "string" ? { name: entry } : entry;
      ensure(value.name).overall.push({
        score,
        category,
        condition: value.condition || ""
      });
    });
  };

  rate("10/10", "Weapon", [
    "DARK FLOW", "ULTIMATE DOUBLE CANNON", "LAVIS STORM", "DOUBLE FURY",
    "D-VIRUS LAUNCHER", "FINAL EGG BLASTER", "ASTRAL DRAGON",
    { name: "CELESTIAL FUSION", condition: "JOINTPARTS and Force" },
    { name: "RATHALOS GREAT SWORD", condition: "IGNIS ENGINE" },
    { name: "TERROR SAWD", condition: "IGNIS ENGINE" },
    "DIVINE BLADE",
    { name: "SKYFALL", condition: "Party play" }
  ]);
  rate("10/10", "Armor", ["DIVINE FIELD", "PARASITIC ARMOR 'PREDATOR'", "PHANTASMAL FIELD", "PARAGON FRAME"]);
  rate("10/10", "Shield", ["ASTRAL WINGS", "ASTRAL HALO", "CHAOS HALO", "GOLDEN HALO", "PHOENIX WINGS", "CRYSTALLIZED WINGS", "D-VIRUS SHIELD"]);

  rate("9.5/10", "Weapon", [
    "ASTRAL CLAW", "ASTRAL SABER", "PHANTOM RAVEN", "GRAVE DIGGER", "NEFARIOUS NEEDLE",
    { name: "ZU'S PUNISHMENT", condition: "IGNIS ENGINE" },
    { name: "LAST EMPEROR", condition: "RADIANT RING" },
    "DARK METEOR", "DARK BRIDGE", "TWIN CYCLONE", "CELESTIAL FUSION", "SNOW QUEEN",
    "YASMINKOV 9000M",
    { name: "ILL GILL REAPER", condition: "CHAOS ENGINE" },
    { name: "TWIN RIKA'S CLAW", condition: "JOINTPARTS" },
    { name: "CANNON ROUGE", condition: "ASTEROID ENGINE" },
    { name: "BERSERK NEEDLE", condition: "VECTOR SCOPE" },
    { name: "PLANET EATER", condition: "CHAOS ENGINE" },
    { name: "M&A85 FURY", condition: "CHAOS ENGINE" }
  ]);
  rate("9.5/10", "Armor / Shield", [
    "RADIANT RING", "ASTRAL CLOAK", "SECTION ID HALOS", "WINGS OF LIFE", "VALENTINE WING",
    { name: "PRIMAL NEXUS", condition: "Solo play" },
    "HEAVENLY RESONANCE", "5TH ANNIVERSARY ARMOR", "BEHEMOTH ARMOR", "EVIL AURA", "BLAST GARMENT"
  ]);

  rate("9.0/10", "Weapon", [
    "3RD ANNIVERSARY BLADE", "ETERNAL NIGHT", "TSUMIKIRI J-SWORD",
    { name: "EXCALIBUR", condition: "TELLUSIS" },
    "NEI'S CLAW", "STORMRENDER", "TWIN EXECUTIONER", "RATHALOS GREAT SWORD", "TERROR SAWD",
    "YASMINKOV 9000M",
    { name: "DUAL BIRD", condition: "JOINTPARTS" },
    { name: "GULD MILLA", condition: "JOINTPARTS" },
    { name: "MILLE MARTEAUX", condition: "JOINTPARTS" },
    "TASTE OF AFFECTION", "CLAW OF ELEMENTS", "GLIDE DIVINE S",
    { name: "SOUL DEVOURER", condition: "PARAGON FRAME" },
    "LAST EMPEROR", "ZU'S PUNISHMENT", "DAYLIGHT SCAR",
    { name: "YASMINKOV 2000H", condition: "RASTER SCOPE" },
    { name: "YASMINKOV 3000R", condition: "RASTER SCOPE" },
    { name: "ARREST NEEDLE", condition: "VECTOR SCOPE" },
    { name: "HELL NEEDLE", condition: "VECTOR SCOPE" },
    { name: "SLICER OF FANATIC", condition: "ASTEROID ENGINE" },
    { name: "YUNCHANG", condition: "ASTEROID ENGINE" }
  ]);
  rate("9.0/10", "Armor / Shield", [
    "BLUE PHANTOM FIELD", "2ND ANNIVERSARY WINGS", "THREE SEALS", "PROFOUND DARKNESS",
    "SHADOW CLOAK", "D-VIRUS ARMOR", "RED PHANTOM FIELD", "BATWING", "DEMON WING",
    "CURSED WING", "GOLDEN BATWING", "GRATIA"
  ]);

  split("IMMORTAL/BATTLE|HEAVENLY/RESIST|CHAOS ENGINE|ASTEROID ENGINE|VECTOR SCOPE|RASTER SCOPE|IGNIS ENGINE|JOINTPARTS|V803|FORBIDDEN GRIMOIRE|MILLENNIUM/HP|V503|V802|STATE/MAINTENANCE|IMMORTAL/HP")
    .forEach((name) => { ensure(name).endgameUnit = true; });

  split("DIVINE FIELD|PHANTASMAL FIELD|ASTRAL WINGS|ASTRAL HALO|ASTRAL CLAW|ASTRAL SABER|ASTRAL CLOAK|IGNIS ENGINE|JOINTPARTS|V803|FORBIDDEN GRIMOIRE|MILLENNIUM/HP")
    .forEach((name) => { ensure(name).tradeOnly = true; });

  const aliases = {
    "D-VIRUS LAUNCHER": ["D VIRUS LAUNCHER"],
    "RATHALOS GREAT SWORD": ["RATHALOS GREATSWORD", "RATHALOS_GREATSWORD"],
    "ILL GILL REAPER": ["ILL GILL REAPER IGR", "ILL GILL REAPER(IGR)"],
    "COMBUSTION CANNON": ["COMBUSTION CANON"],
    "CRYSTALLIZED WINGS": ["CRYSTALIZED WINGS"],
    "GLIDE DIVINE S": ["GILDE DIVINE S"],
    "VALENTINE WING": ["VALENTINE WINGS"],
    "PROFOUND DARKNESS": ["PROFOUND OF DARKNESS"]
  };
  Object.entries(aliases).forEach(([name, values]) => { ensure(name).aliases.push(...values); });

  const weapon = (id, name, section, type, atp, ata, special, required, summary, combat = [], image = "") => ({
    id: "database-" + id,
    section,
    category: "Weapon",
    type,
    name,
    image,
    imageFallback: !image,
    imagePosition: "center center",
    summary,
    stats: [
      ["Type", type], ["ATP", atp], ["ATA", ata], ["Special", special], ["Requirement", required]
    ].filter((entry) => entry[1]),
    combat,
    obtain: ["Item data imported from the Destiny item database. Check the current drop table for its latest source."],
    obtainKeys: ["catalog.import.obtain"],
    required: []
  });

  const shield = (id, name, level, dfp, evp, boosts, summary, image = "") => ({
    id: "database-" + id,
    section: "shield",
    category: "Shield",
    type: "Shield",
    name,
    image,
    imageFallback: !image,
    imagePosition: "center center",
    summary,
    stats: [["Level", level], ["DFP", dfp], ["EVP", evp], ["Boosts", boosts]].filter((entry) => entry[1]),
    combat: boosts ? [boosts] : [],
    obtain: ["Item data imported from the Destiny item database. Check the current drop table for its latest source."],
    obtainKeys: ["catalog.import.obtain"],
    required: []
  });

  const unit = (id, name, statType, statAmount, summary, combat = [], image = "") => ({
    id: "database-" + id,
    section: "unit",
    category: "Unit",
    type: "Unit",
    name,
    image,
    imageFallback: !image,
    imagePosition: "center center",
    imageFit: image ? "contain" : "cover",
    summary,
    stats: [["Stat type", statType], ["Stat amount", statAmount]].filter((entry) => entry[1]),
    combat,
    obtain: ["Item data imported from the Destiny item database. Check the current drop table for its latest source."],
    obtainKeys: ["catalog.import.obtain"],
    required: []
  });

  const imports = [
    weapon("astral-dragon", "ASTRAL DRAGON", "ranger", "Mechgun", "400 - 440", "40", "Final Explosion", "ATA 200", "A special twin gun whose low-health special destroys targets in front of the user.", ["IGNIS ENGINE empowers this weapon."]),
    weapon("lavis-storm", "LAVIS STORM", "hunter", "Double Saber", "1000", "60", "Ultimate Destruction", "ATP 1200", "An ultimate double saber that releases a destructive cone-shaped blast.", ["JOINTPARTS adds Speed +15%, ATA +20, improved special range and angle, and face hits on Episode 4 lizards."]),
    weapon("double-fury", "DOUBLE FURY", "hunter", "Double Saber", "1000", "60", "Ultimate Destruction", "ATP 1200", "An ultimate double saber that releases a destructive cone-shaped blast.", ["JOINTPARTS adds Speed +15%, ATA +20, improved special range and angle, and face hits on Episode 4 lizards."]),
    weapon("twin-rikas-claw", "TWIN RIKA'S CLAW", "hunter", "Claw", "660 - 730", "40", "Tempest / Razonde", "ATP 1100", "A modified pair of Rika's claws whose ATP rises by 200 for Hunters.", ["JOINTPARTS changes Normal, Heavy and Special attacks to 2-2-2, widens the angle, raises targets to 5, and uses a dagger animation."]),
    weapon("planet-eater", "PLANET EATER", "hunter", "Twin Sword", "400", "50", "Berserk", "ATP 960", "A twin sword forged in a universe that predates our own.", ["CHAOS ENGINE raises ATP and hit count and changes the animation."]),
    weapon("third-anniversary-blade", "3RD ANNIVERSARY BLADE", "hunter", "Dagger", "640", "45", "Charge", "ATP 950", "A pair of special swords from Destiny PSOBB's 3rd Anniversary."),
    weapon("taste-of-affection", "TASTE OF AFFECTION", "ranger", "Mechgun", "260", "50", "Berserk", "ATA 170", "A male-only mechgun that shows great passion for loved ones.", ["Shifta +100%, Deband +100%."]),
    weapon("armageddon", "ARMAGEDDON", "ranger", "Mechgun", "180", "25", "Autotarget Charge", "ATA 200", "Designed to end any creature in a blitz of gunfire.", [], "./images/weapon/Armageddon.jpg"),
    weapon("typesh-shot-hell", "TYPE-SH/SHOT [HELL]", "ranger", "Shot", "10", "40", "Hell", "ATA 90", "The Hell-special version of TypeSH/SHOT referenced by the operator priority list."),
    weapon("daylight-scar", "DAYLIGHT SCAR", "hunter", "Dagger", "500 - 550", "48", "Berserk", "ATP 850", "A six-pronged double claw that becomes more dangerous at low HP."),
    weapon("holy-ray", "HOLY RAY", "ranger", "Rifle", "290 - 300", "70", "Arrest", "MST 680", "A rifle that impales enemies with a giant spear and can paralyze them."),
    weapon("subzero", "SUBZERO", "ranger", "Rifle", "250 - 280", "70", "Blizzard", "MST 680", "A rifle that improves freezing and boosts the Barta technique family.", ["Barta +50%, Gibarta +40%, Rabarta +30%."]),
    weapon("iron-faust", "IRON FAUST", "ranger", "Shot", "500 - 580", "42", "Chaos", "ATA 181", "A mysterious heavy shot weapon."),
    weapon("master-raven", "MASTER RAVEN", "ranger", "Handgun", "150 - 180", "52", "Lord's", "ATA 150", "A heavy black-barrel handgun usable by male characters."),
    weapon("last-swan", "LAST SWAN", "ranger", "Handgun", "150 - 180", "52", "Master's", "ATA 150", "A small white-barrel handgun usable by female characters."),
    weapon("judgement-blade", "JUDGEMENT BLADE", "hunter", "Twin Sword", "920", "65", "Demon's", "ATP 1000", "A twin sword designed to punish enemies with agonizing force."),
    weapon("kitetsu", "KITETSU", "hunter", "Super Katana", "900 - 920", "45", "Arrest", "ATP 900", "A cursed katana capable of stopping foes in their tracks."),
    weapon("bringers-rifle", "BRINGER'S RIFLE", "ranger", "Rifle", "330 - 370", "63", "Demon's", "ATA 140", "An enemy weapon made from a Bringer's arm whose special cuts enemy HP.", ["EVP -20."]),
    weapon("slicer-of-fanatic", "SLICER OF FANATIC", "ranger", "Slicer", "340 - 360", "40", "Demon's", "ATP 570", "A bizarre slicer with a Demon's special.", ["ASTEROID ENGINE empowers this weapon."]),
    weapon("dual-bird", "DUAL BIRD", "ranger", "Mechgun", "300 - 310", "22", "King's", "ATA 190", "A pair of guns that work in perfect concert.", ["JOINTPARTS improves range and changes Normal, Heavy and Special attacks to 4-4-4."]),
    weapon("yunchang", "YUNCHANG", "hunter", "Partisan", "300 - 350", "49", "Berserk", "ATP 800", "A legendary Blue Dragon blade whose damage rises as HP falls.", ["ASTEROID ENGINE empowers this weapon."]),
    shield("astral-halo", "ASTRAL HALO", "150", "180", "180", "State/Maintenance, Trap/Search", "An astral halo that grants status immunity and trap detection."),
    shield("valentine-wings", "VALENTINE WINGS", "150", "200", "180", "Resta +100%, Reverser +100%", "Lovely wings that boost support techniques.", "./images/items/shields/valentine-wings-forum.webp"),
    shield("demon-wing", "DEMON WING", "150", "200", "180", "ATP +60, Zalure +100%, Jellen +100%", "Demonic wings that boost support techniques and attack power."),
    shield("cursed-wing", "CURSED WING", "150", "200", "180", "ATP +60, Zalure +100%, Jellen +100%", "Cursed wings that boost support techniques and attack power."),
    unit("heavenly-resist", "HEAVENLY/RESIST", "All Resistances", "+12", "Raises fire, ice, lightning, light and dark resistances by 12."),
    unit("v803", "V803", "MST", "+165", "Greatly reduces technique casting time and improves freezing with Rabarta and Gibarta.", ["Technique cast speed +100%."], "./images/common/v803_img.png"),
    unit("v503", "V503", "ATP", "+5", "Improves the success rate of special attacks and gives ranged support to Hunters and Forces.", ["Freeze, Paralyze, Confuse and Hell success +100%; built-in Smartlink."]),
    unit("v802", "V802", "MST", "+80", "Greatly reduces technique casting time.", ["Technique cast speed +100%."]),
    unit("state-maintenance", "STATE/MAINTENANCE", "Status immunity", "All conditions", "A medical unit that cures and prevents status conditions.", ["Cures all conditions."]),
    unit("immortal-hp", "IMMORTAL/HP", "HP", "+200", "A reinforcing unit that raises maximum HP by 200.")
  ];

  window.DestinyItemPriorityData = {
    updatedAt: "10/11/2025",
    legend: {
      condition: "(+Item) means the listed item is required for the buffed rating.",
      trade: "★ Obtainable from the Trade NPC only.",
      genericUnits: ["RESIST/XXX++ (Reward NPC only)", "RESIST/XXX"]
    },
    items: Array.from(items.values()),
    imports
  };
})();
