/* ========================================================================== 
   레벨별 장비 진행표

   엔드게임 장비 원문(class_builds.js)과 초보 성장 동선을 섞지 않기 위해 별도
   데이터로 둔다. 아이템명, 퀘스트명, Section ID는 게임 안에서 찾는 표기라
   번역하지 않고, 설명만 i18n 키로 바꾼다.
   ========================================================================== */
(function () {
    "use strict";

    function route(name, category, roleKey, farm) {
        return {
            name: name,
            dbName: farm.dbName || name,
            cat: category,
            roleKey: roleKey,
            source: farm.source || "drop",
            difficulty: farm.difficulty || "",
            episode: farm.episode || "",
            section: farm.section || "",
            area: farm.area || "",
            quest: farm.quest || "",
            enemy: farm.enemy || "",
            rate: farm.rate || "",
            cost: farm.cost || "",
            tipKey: farm.tipKey || "",
            exactItem: farm.exactItem !== false
        };
    }

    var routes = {
        chargeHandgun: route("Charge Handgun", "Weapons", "bld.role.safeRange", {
            source: "shop", area: "Pioneer 2", quest: "Weapon Shop", enemy: "Shop NPC",
            tipKey: "bld.route.chargeHandgun", exactItem: false
        }),
        chargeCalibur: route("Hit Charge Calibur", "Weapons", "bld.role.groupDamage", {
            source: "trade", area: "Pioneer 2", quest: "Player shops / Discord Trade",
            tipKey: "bld.route.chargeCalibur", exactItem: false
        }),
        chargeMechguns: route("Charge Mechguns", "Weapons", "bld.role.bossDamage", {
            source: "shop", area: "Pioneer 2", quest: "Weapon Shop", enemy: "Shop NPC",
            tipKey: "bld.route.chargeMechguns", exactItem: false
        }),
        vjaya: route("VJAYA", "Weapons", "bld.role.groupDamage", {
            difficulty: "Hard", episode: "EP2", section: "Bluefull", area: "Central Control Area",
            quest: "Dolmolm Research", enemy: "Hildebear", rate: "1/45.71",
            tipKey: "bld.route.vjaya"
        }),
        starterEventGear: route("Hallowed Garment / Deal With It", "Armor", "bld.role.starterDefense", {
            source: "event", area: "Pioneer 2", quest: "Seasonal trade / Discord",
            tipKey: "bld.route.starterEvent", exactItem: false
        }),
        yunchang: route("YUNCHANG", "Weapons", "bld.role.riskyGroupDamage", {
            difficulty: "Very Hard", episode: "EP1", section: "Bluefull", area: "Ruins",
            enemy: "Chaos Bringer", rate: "1/517.17", tipKey: "bld.route.yunchang"
        }),
        kitetsu: route("KITETSU", "Weapons", "bld.role.control", {
            difficulty: "Ultimate", episode: "EP1", section: "Pinkal", area: "Forest",
            enemy: "Hildetorr", rate: "1/16", tipKey: "bld.route.kitetsu"
        }),
        swordOfDespair: route("SWORD OF DESPAIR", "Weapons", "bld.role.singleTarget", {
            difficulty: "Ultimate", episode: "EP1", section: "Oran", area: "Ruins",
            enemy: "Gran Sorcerer", rate: "1/650.16", tipKey: "bld.route.swordDespair"
        }),
        rainbowShield: route("RAINBOW SHIELD", "Shields", "bld.role.flexDefense", {
            difficulty: "Very Hard", episode: "EP4", section: "Purplenum", area: "Crater",
            enemy: "Girtablulu", rate: "1/393.85", tipKey: "bld.route.rainbowShield"
        }),
        bluePhantom: route("BLUE PHANTOM FIELD", "Shields", "bld.role.accuracyDefense", {
            difficulty: "Ultimate", episode: "EP2", section: "Bluefull", area: "Central Control Area",
            quest: "Maximum Attack 4th Stage 2A / 2B / 2C", enemy: "Zol Gibbon", rate: "1/2127.8",
            tipKey: "bld.route.bluePhantom"
        }),
        twinCyclone: route("TWIN CYCLONE", "Weapons", "bld.role.lateUpgrade", {
            difficulty: "Ultimate", episode: "EP4", section: "Skyly", area: "Subterranean Desert",
            enemy: "Saint Million", rate: "1/51.2", tipKey: "bld.route.bossRepeat"
        }),
        lastEmperor: route("LAST EMPEROR", "Weapons", "bld.role.lateUpgrade", {
            difficulty: "Ultimate", episode: "EP4", section: "Yellowboze", area: "Subterranean Desert",
            enemy: "Kondrieu", rate: "1/21.33", tipKey: "bld.route.bossRepeat"
        }),
        rathalos: route("RATHALOS GREATSWORD", "Weapons", "bld.role.lateUpgrade", {
            difficulty: "Ultimate", episode: "EP1", section: "Pinkal / Redria / Oran / Yellowboze / Whitill",
            area: "Custom / Raid", quest: "Rathalos encounter", enemy: "Rathalos", rate: "1/103",
            tipKey: "bld.route.rathalos"
        }),
        darkFlow: route("DARK FLOW", "Weapons", "bld.role.endgameCraft", {
            source: "craft", difficulty: "Ultimate", episode: "EP2", section: "Any", area: "Seabed",
            enemy: "Olga Flow", rate: "Parasitic Gene Flow 1/204.8", tipKey: "bld.route.darkFlow"
        }),

        chargeVulcans: route("Charge Vulcans", "Weapons", "bld.role.bossDamage", {
            source: "shop", area: "Pioneer 2", quest: "Phantastic Bazaar", enemy: "Shop NPC", cost: "1 PD",
            tipKey: "bld.route.chargeRanger", exactItem: false
        }),
        chargeArms: route("Charge Arms", "Weapons", "bld.role.groupDamage", {
            source: "shop", area: "Pioneer 2", quest: "Phantastic Bazaar", enemy: "Shop NPC", cost: "1 PD",
            tipKey: "bld.route.chargeRanger", exactItem: false
        }),
        rangerWall: route("RANGER WALL", "Shields", "bld.role.accuracyDefense", {
            source: "trade", area: "Pioneer 2", quest: "Player shops / Discord Trade",
            tipKey: "bld.route.rangerWall"
        }),
        tormentor: route("TORMENTOR", "Weapons", "bld.role.demons", {
            difficulty: "Ultimate", episode: "EP1", section: "Whitill", area: "Caves",
            enemy: "Dal Ral Lie", rate: "1/21.33", tipKey: "bld.route.bossRepeat"
        }),
        frozenShooter: route("FROZEN SHOOTER", "Weapons", "bld.role.freeze", {
            difficulty: "Ultimate", episode: "EP1", section: "Greenill / Purplenum / Yellowboze / Whitill",
            area: "Forest", enemy: "Hildetorr", rate: "1/2", tipKey: "bld.route.frozenShooter"
        }),
        graveDigger: route("GRAVE DIGGER", "Weapons", "bld.role.demons", {
            difficulty: "Ultimate", episode: "EP4", section: "Greenill", area: "Crater / Subterranean Desert",
            quest: "Mop Up Operation 3 (first two rooms)", enemy: "Quest enemies / Kondrieu",
            rate: "Direct drop: Kondrieu 1/32",
            tipKey: "bld.route.graveDigger"
        }),
        typeShotHell: route("TYPE/SHOT (Hell)", "Weapons", "bld.role.leveling", {
            source: "trade", difficulty: "Hard / Very Hard", episode: "EP1", section: "Any",
            quest: "Maximum Attack S 2", tipKey: "bld.route.typeShot", exactItem: false
        }),
        arrestNeedle: route("ARREST NEEDLE", "Weapons", "bld.role.control", {
            source: "craft", difficulty: "Ultimate", episode: "EP1", section: "Redria", area: "Ruins",
            enemy: "Dark Bringer", rate: "Spread Needle 1/358.04", tipKey: "bld.route.arrestNeedle"
        }),
        dVirusLauncher: route("D-VIRUS LAUNCHER", "Weapons", "bld.role.bossDamage", {
            difficulty: "Ultimate", episode: "EP2", section: "Bluefull", area: "Custom / Raid",
            enemy: "Baranz", rate: "1/3640.87", tipKey: "bld.route.dVirus"
        }),

        mindMag: route("200 MIND MAG", "Mags", "bld.role.techPower", {
            source: "shop", area: "Pioneer 2", quest: "Phantastic Bazaar", enemy: "Shop NPC", cost: "20 PD",
            tipKey: "bld.route.mindMag", exactItem: false
        }),
        cureUnits: route("Cure/Paralysis / Cure/Shock / Cure/Freeze", "Units", "bld.role.statusSafety", {
            difficulty: "Very Hard", episode: "EP1", section: "Greenill / Yellowboze / Whitill", area: "Caves",
            enemy: "Pouilly Slime", rate: "1/1.14", tipKey: "bld.route.cureUnits", exactItem: false
        }),
        techDisks: route("High-level Technique Disks", "Units", "bld.role.techPower", {
            source: "box", episode: "EP2", section: "Any", quest: "Phantasmal World #3", enemy: "Boxes",
            tipKey: "bld.route.techDisks", exactItem: false
        }),
        motherGarb: route("MOTHER GARB+", "Armor", "bld.role.tpEfficiency", {
            difficulty: "Very Hard", episode: "EP2", section: "Greenill", area: "Control Tower",
            quest: "Defend the Main Room", enemy: "Ill Gill", rate: "1/256", tipKey: "bld.route.motherGarb"
        }),
        psychoWand: route("PSYCHO WAND", "Weapons", "bld.role.techPower", {
            difficulty: "Ultimate", episode: "EP2", section: "Whitill", area: "Control Tower",
            quest: "Defend the Main Room", enemy: "Del Lily", rate: "1/900.22", tipKey: "bld.route.psychoWand"
        }),
        glideDivine: route("GLIDE DIVINE", "Weapons", "bld.role.supportRange", {
            difficulty: "Ultimate", episode: "EP1", section: "Bluefull", area: "Forest",
            enemy: "Tollaw", rate: "1/900.22", tipKey: "bld.route.glideDivine"
        }),
        threeSeals: route("THREE SEALS", "Shields", "bld.role.techPower", {
            difficulty: "Ultimate", episode: "EP1", section: "Oran", area: "Caves",
            quest: "Maximum Attack S", enemy: "Melqueek", rate: "1/620.61", tipKey: "bld.route.threeSeals"
        }),
        v802: route("V802", "Units", "bld.role.castSpeed", {
            difficulty: "Ultimate", episode: "EP1", section: "Whitill", area: "Mines",
            quest: "Lost SOUL BLADE", enemy: "Sinow Blue", rate: "1/975.24", tipKey: "bld.route.sinowBlue"
        }),
        primalNexus: route("PRIMAL NEXUS", "Armor", "bld.role.techPower", {
            difficulty: "Ultimate", episode: "EP1", section: "Pinkal", area: "Mines",
            quest: "Lost SOUL BLADE", enemy: "Sinow Blue", rate: "1/3900.92", tipKey: "bld.route.sinowBlue"
        }),
        skyfall: route("SKYFALL", "Weapons", "bld.role.lateUpgrade", {
            difficulty: "Ultimate", episode: "EP1", section: "Bluefull", area: "Ruins",
            enemy: "Dark Falz", rate: "1/64", tipKey: "bld.route.bossRepeat"
        }),
        darkBridge: route("DARK BRIDGE", "Weapons", "bld.role.endgameCraft", {
            source: "craft", difficulty: "Ultimate", episode: "EP2", section: "Any", area: "Seabed",
            enemy: "Olga Flow", rate: "Parasitic Gene Flow 1/204.8", tipKey: "bld.route.darkBridge"
        })
    };

    window.DESTINY_LEVELING = {
        ui: {
            "ui.materialTitle": "Material plan",
            "ui.materialLead": "Use this as the safe level 200 baseline. Unused materials can be adapted to the selected variant.",
            "ui.matPower": "Power",
            "ui.matDefense": "Defense",
            "ui.matMind": "Mind",
            "ui.matEvade": "Evade",
            "ui.matLuck": "Luck",
            "ui.matUnused": "Unused",
            "ui.matTotal": "Used",
            "ui.levelTitle": "Leveling roadmap",
            "ui.levelLead": "Choose your current milestone. Equip the left column first, then farm the right column in order.",
            "ui.levelSelect": "Select a level milestone",
            "ui.levelFocus": "Class focus",
            "ui.levelEquip": "Equip now",
            "ui.levelFarm": "Farm next",
            "ui.levelRoute": "Farming route",
            "ui.levelDifficulty": "Difficulty",
            "ui.levelEpisode": "Episode",
            "ui.levelSection": "Section ID",
            "ui.levelArea": "Area",
            "ui.levelQuest": "Quest",
            "ui.levelEnemy": "Target",
            "ui.levelRate": "Drop / cost",
            "ui.levelItemDetails": "Open item details",
            "ui.levelEndgame": "The full level 200 loadout and its attribute targets continue below this roadmap.",
            "ui.levelSource": "Routes use the supplied beginner notes and the current Destiny drop tables. Quest-specific routes are preferred when they are safer to repeat.",

            "bld.role.safeRange": "Safe ranged pull",
            "bld.role.groupDamage": "Group damage",
            "bld.role.bossDamage": "Boss damage",
            "bld.role.starterDefense": "Starter defense",
            "bld.role.riskyGroupDamage": "Optional Berserk group damage",
            "bld.role.control": "Crowd control",
            "bld.role.singleTarget": "Fast single-target damage",
            "bld.role.flexDefense": "General defense",
            "bld.role.accuracyDefense": "ATA and defense",
            "bld.role.lateUpgrade": "Later upgrade",
            "bld.role.endgameCraft": "Endgame craft",
            "bld.role.demons": "Demon's damage",
            "bld.role.freeze": "Reliable freeze",
            "bld.role.leveling": "Solo leveling",
            "bld.role.techPower": "Technique damage",
            "bld.role.statusSafety": "Status protection",
            "bld.role.tpEfficiency": "Lower TP cost",
            "bld.role.supportRange": "Support range",
            "bld.role.castSpeed": "Casting speed",

            "bld.focus.humar": "Keep a ranged pull, a group weapon, and a boss weapon. HUmar can add TP-based weapons and Demon specials without giving up its main melee tools.",
            "bld.focus.hunewearl": "Use level 20 support techniques and self-healing to make risky approaches safer. Build toward a strong Ultimate Double Cannon setup later.",
            "bld.focus.hucast": "Use traps to create safe openings. Stay with the attack route while leveling, then choose the attack or defense level 200 variant below.",
            "bld.focus.hucaseal": "Use the highest Hunter ATA and traps to land specials early. The spare materials can support the EVP variant you plan to use at level 200.",
            "bld.focus.ramar": "Lean into accurate Demon specials and keep both rifle range and mechgun burst available.",
            "bld.focus.ramarl": "Use level 20 support techniques to stabilize solo runs, then use the fast handgun animation for cleanup and specials.",
            "bld.focus.racast": "Traps set up Charge and sacrificial damage safely. Prioritize raw ATP after the core control weapons are ready.",
            "bld.focus.racaseal": "High DFP and ATA make this the safest Ranger progression. Build the core control kit before expensive endgame damage weapons.",
            "bld.focus.fomar": "Level as a technique user first. At 200, decide whether the melee tank or battle utility variant below is your real destination.",
            "bld.focus.fomarl": "Use wide support ranges to keep parties stable. The same early Force kit leads into either the support fortress or battle utility setup.",
            "bld.focus.fonewm": "Prioritize Ra and Gi technique damage, cast speed, and TP efficiency. Physical weapons are secondary until the Force core is complete.",
            "bld.focus.fonewearl": "Prioritize single-target techniques and piercing Megid. The plan intentionally leaves Luck uncapped and keeps 41 materials flexible.",
            "bld.mat.fonewearl": "Luck is intentionally not maxed because the supplied build says ATP 800 plus Luck is not worth the material cost.",

            "bld.stage.hu100": "Use cheap, safe weapons while your ATA is still growing. A ranged pull and one dependable group weapon matter more than rare gear.",
            "bld.stage.hu150": "Keep the Charge baseline and add one reliable rare weapon. Berserk upgrades are optional until HP management feels comfortable.",
            "bld.stage.hu180": "Finish a three-weapon kit for range, groups, and bosses. Start the accessible shield farms before chasing raid gear.",
            "bld.stage.hu200": "Keep the level 180 core equipped while you replace one slot at a time with the selected endgame variant below.",
            "bld.stage.ra100": "Cover groups and bosses with inexpensive Charge weapons. Add ATA before attempting special-heavy Ultimate runs.",
            "bld.stage.ra150": "Secure freezing and Demon's damage first. These two tools make later solo farms safer and more consistent.",
            "bld.stage.ra180": "Grave Digger, Frozen Shooter, and a Charge weapon cover the main jobs. Improve defense before difficult Max Attack routes.",
            "bld.stage.ra200": "Keep the complete control kit and add expensive damage tools gradually. The full class-specific loadout continues below.",
            "bld.stage.fo100": "Technique disks, a MIND MAG, and status immunity provide more value than temporary weapons at this level.",
            "bld.stage.fo150": "Use Mother Garb+ when TP cost is a problem, then assemble one technique weapon and Three Seals.",
            "bld.stage.fo180": "With technique damage covered, farm casting speed and the level 200 armor from the same Sinow Blue room loop.",
            "bld.stage.fo200": "V802 and Primal Nexus form the farming core. Use it to fund the class-specific level 200 build shown below.",

            "bld.route.chargeHandgun": "Check the weapon shop after level-ups and keep a copy with Hit. Use it to pull enemies without committing to melee.",
            "bld.route.chargeCalibur": "Buy a low-cost Hit copy from another player. Treat it as a baseline, not a reason to stop EXP farming.",
            "bld.route.chargeMechguns": "Add these when your ATA makes full combos reliable. Free Meseta makes Charge practical for daily use.",
            "bld.route.vjaya": "Run Dolmolm Research and defeat the Hildebear. This route overlaps with EXP progression and is the easiest early target in the supplied notes.",
            "bld.route.starterEvent": "Check player shops or ask the community. Old low-level event gear is often inexpensive or donated.",
            "bld.route.yunchang": "Farm only if you are ready to manage Berserk HP loss. A safe weapon used consistently is better while learning.",
            "bld.route.kitetsu": "Use a Forest quest with many Hilde enemies and restart until the rare Hildetorr appears.",
            "bld.route.swordDespair": "Choose an EP1 Ruins route with several Gran Sorcerers so the run still gives useful EXP and drops.",
            "bld.route.rainbowShield": "The Very Hard Girtablulu route is available earlier than the Ultimate alternatives and works for both Hunter and Ranger.",
            "bld.route.bluePhantom": "Clear the first room, check the Zol Gibbon drops, then remake. This avoids committing to the harder rooms.",
            "bld.route.bossRepeat": "Use a short boss route and remake after the clear. Happy Hour improves the drop chance, but not rare-enemy spawns.",
            "bld.route.rathalos": "Farm with one of the five listed Section IDs. Treat this as a later upgrade, not a leveling requirement.",
            "bld.route.darkFlow": "Farm Parasitic Gene Flow from Olga Flow, then combine it with a Sword-series weapon at level 140 or higher.",
            "bld.route.chargeRanger": "The Phantastic Bazaar sells non-rare Charge weapons for 1 PD. Prefer Hit on the Vulcans when possible.",
            "bld.route.rangerWall": "Use it as an inexpensive ATA bridge. Do not delay the Frozen Shooter or Grave Digger farms for a perfect shield.",
            "bld.route.frozenShooter": "Run a Forest quest with many Hilde enemies. The rare Hildetorr has a 1/2 drop on the four listed IDs.",
            "bld.route.graveDigger": "Repeat only the first two rooms of Mop Up Operation 3 and remake. This is safer than learning the difficult EP2 Max Attack S route first.",
            "bld.route.typeShot": "Use Hell in Hard or Very Hard Maximum Attack S 2 for fast solo EXP when the special lands reliably.",
            "bld.route.arrestNeedle": "Farm a Spread Needle first, then combine it with Proof of Sonic Team. Check Item Combinations for the full recipe path.",
            "bld.route.dVirus": "This is a long endgame farm. Maximize Dark attribute for Olga Flow phase 2, but keep Grave Digger as the affordable core.",
            "bld.route.mindMag": "Buy or build the shared 200 MIND MAG first. It can be moved to future Force characters.",
            "bld.route.cureUnits": "Split slimes with Rabarta until a rare Pouilly Slime appears. The Section ID decides which Cure unit drops.",
            "bld.route.techDisks": "Open the EP2 Phantasmal World #3 boxes, then lower the difficulty if the monsters make the loop unsafe.",
            "bld.route.motherGarb": "Kill the early Ill Gills in Defend the Main Room and remake. Its 50 percent TP reduction is useful before level 200.",
            "bld.route.psychoWand": "Kill the first five Del Lilies in Defend the Main Room, then remake. Keep Resta ready for the weapon's HP cost.",
            "bld.route.glideDivine": "Use an EP1 Forest route with many Tollaws. Choose this when support range matters more than Psycho Wand damage.",
            "bld.route.threeSeals": "Run Maximum Attack S on Oran and target Melqueek packs. Watch the gradual HP drain while it is equipped.",
            "bld.route.sinowBlue": "Clear the room with four Sinow Blues in Lost SOUL BLADE, check drops, and remake. Use Rafoie flinch to control the room.",
            "bld.route.darkBridge": "Farm Parasitic Gene Flow from Olga Flow, then combine it with a Rod-series weapon at level 130 or higher."
        },
        materials: {
            humar:      { power: 148, luck: 45, unused: 57, cap: 250 },
            hunewearl:  { power: 71,  luck: 45, unused: 34, cap: 150 },
            hucast:     { power: 105, luck: 45, unused: 0,  cap: 150 },
            hucaseal:   { power: 67,  luck: 45, unused: 38, cap: 150 },
            ramar:      { power: 170, luck: 45, unused: 35, cap: 250 },
            ramarl:     { power: 148, luck: 45, unused: 57, cap: 250 },
            racast:     { power: 101, luck: 45, unused: 4,  cap: 150 },
            racaseal:   { power: 99,  luck: 45, unused: 6,  cap: 150 },
            fomar:      { power: 90,  mind: 115, luck: 45, unused: 0,  cap: 250 },
            fomarl:     { power: 88,  mind: 117, luck: 45, unused: 0,  cap: 250 },
            fonewm:     { power: 38,  mind: 61,  luck: 45, unused: 6,  cap: 150 },
            fonewearl:  { power: 64,  mind: 45,  unused: 41, cap: 150, noteKey: "bld.mat.fonewearl" }
        },
        focus: {
            humar: "bld.focus.humar",
            hunewearl: "bld.focus.hunewearl",
            hucast: "bld.focus.hucast",
            hucaseal: "bld.focus.hucaseal",
            ramar: "bld.focus.ramar",
            ramarl: "bld.focus.ramarl",
            racast: "bld.focus.racast",
            racaseal: "bld.focus.racaseal",
            fomar: "bld.focus.fomar",
            fomarl: "bld.focus.fomarl",
            fonewm: "bld.focus.fonewm",
            fonewearl: "bld.focus.fonewearl"
        },
        routes: routes,
        families: {
            HU: [
                { level: 100, summaryKey: "bld.stage.hu100", equip: ["chargeHandgun", "chargeCalibur"], farm: ["vjaya", "starterEventGear"] },
                { level: 150, summaryKey: "bld.stage.hu150", equip: ["vjaya", "chargeMechguns"], farm: ["yunchang", "kitetsu", "swordOfDespair"] },
                { level: 180, summaryKey: "bld.stage.hu180", equip: ["yunchang", "kitetsu"], farm: ["bluePhantom", "rainbowShield", "twinCyclone"] },
                { level: 200, summaryKey: "bld.stage.hu200", equip: ["bluePhantom", "twinCyclone"], farm: ["lastEmperor", "rathalos", "darkFlow"], endgame: true }
            ],
            RA: [
                { level: 100, summaryKey: "bld.stage.ra100", equip: ["chargeVulcans", "chargeArms", "rangerWall"], farm: ["tormentor"] },
                { level: 150, summaryKey: "bld.stage.ra150", equip: ["tormentor", "chargeVulcans"], farm: ["frozenShooter", "graveDigger", "typeShotHell"] },
                { level: 180, summaryKey: "bld.stage.ra180", equip: ["graveDigger", "frozenShooter", "chargeArms"], farm: ["bluePhantom", "rainbowShield"] },
                { level: 200, summaryKey: "bld.stage.ra200", equip: ["graveDigger", "frozenShooter", "bluePhantom"], farm: ["arrestNeedle", "dVirusLauncher"], endgame: true }
            ],
            FO: [
                { level: 100, summaryKey: "bld.stage.fo100", equip: ["mindMag", "cureUnits"], farm: ["techDisks", "motherGarb"] },
                { level: 150, summaryKey: "bld.stage.fo150", equip: ["motherGarb", "techDisks"], farm: ["psychoWand", "glideDivine", "threeSeals"] },
                { level: 180, summaryKey: "bld.stage.fo180", equip: ["psychoWand", "threeSeals"], farm: ["v802", "primalNexus"] },
                { level: 200, summaryKey: "bld.stage.fo200", equip: ["v802", "primalNexus", "threeSeals"], farm: ["skyfall", "darkBridge"], endgame: true }
            ]
        }
    };
})();
