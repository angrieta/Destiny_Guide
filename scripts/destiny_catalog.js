(() => {
  const makeShieldItem = ({ id, name, image = "", summary, stats, combat = [], obtain = [], required = [] }) => ({
    id,
    section: "shield",
    category: "Shield",
    type: "Shield",
    name,
    image,
    imageFallback: !image,
    imagePosition: "center center",
    summary,
    stats,
    combat,
    obtain,
    required
  });

  const catalogItems = [
    {
      id: "divine-blade",
      section: "common",
      category: "Common",
      type: "Twin Sword",
      name: "DIVINE BLADE",
      image: "./images/items/gameplay/divine-blade-gameplay.webp",
      imagePosition: "center center",
      summary: "The Starlight Tower twin sword. It is the only weapon on the server that boosts Reverser, and it casts Shifta and Deband together.",
      stats: [
        ["Class", "All"],
        ["Type", "Twin Sword"],
        ["ATP", "1200"],
        ["ATA", "55"],
        ["Special", "Arrest"],
        ["Targets", "1"],
        ["Bonus", "All stats +30"]
      ],
      combat: [
        "Reverser +100% \u2014 the only weapon with a Reverser boost.",
        "Shifta +200%, Deband +200%.",
        "Casts Shifta and Deband at the same time.",
        "With DIVINE FIELD: targets 1\u21925, Speed +50%, wider angle."
      ],
      obtain: [
        "Reward from The Starlight Tower [Raid] \u2014 EP2 Special."
      ],
      required: []
    },
    {
      id: "venus-bow",
      section: "common",
      category: "Common",
      type: "Needle",
      name: "VENUS BOW",
      image: "./images/weapon/Venus_Bow.jpg",
      imagePosition: "center center",
      summary: "An anniversary needle whose special deals fixed damage, so it works on enemies that shrug off attack power.",
      stats: [
        ["Class", "All"],
        ["Type", "Needle"],
        ["ATP", "777"],
        ["ATA", "77"],
        ["Requirement", "ATA 77"],
        ["Range", "77.7"],
        ["Targets", "7"]
      ],
      combat: [
        "Special deals fixed damage: 7 on Normal, 77 on Heavy, 777 on Extra.",
        "The special damages EP4 lizards.",
        "Hits lizards in the face.",
        "Resta and Anti range +100%."
      ],
      obtain: [
        "Radiant Destiny! \u2014 EP2 Anniversary. Tormentorr at 1/154 on all IDs."
      ],
      required: []
    },
    {
      id: "madams-bracelet",
      section: "shield",
      category: "Shield",
      type: "Shield",
      name: "MADAM'S BRACELET",
      image: "./images/items/gameplay/madams-bracelet-gameplay.webp",
      imagePosition: "center center",
      summary: "A support shield with a strong ice resist and doubled Resta and Anti range.",
      stats: [
        ["Class", "All"],
        ["Level", "150"],
        ["DFP", "135"],
        ["EVP", "225"],
        ["Resists", "30 / 50 / 30 / 25 / 25"],
        ["Bonus", "ATA +25"]
      ],
      combat: [
        "Resta +100%.",
        "Anti +100%.",
        "Rabarta +70%."
      ],
      obtain: [
        "New MSB \u2014 EP2 Destiny. Olga Flow at 1/64 on all IDs (Ultimate)."
      ],
      required: []
    },
    {
      id: "lightning-garment",
      section: "armor",
      category: "Armor",
      type: "Armor",
      name: "LIGHTNING GARMENT",
      image: "./images/items/gameplay/blast-garment-item.png",
      imagePosition: "center center",
      summary: "A trade-only armor with heavy light and dark resistance and a Grants boost.",
      stats: [
        ["Class", "All"],
        ["Level", "150"],
        ["DFP", "210"],
        ["EVP", "170"],
        ["Resists", "15 / 15 / 15 / 60 / 60"],
        ["Bonus", "ATA +20"]
      ],
      combat: [
        "Grants +50%."
      ],
      obtain: [
        "Traded from the RAcaseal NPC in The Phantastic Bazaar \u2014 EP2 Shop.",
        "Secret Tickets come from Simulator 2.0 [EP1] and Random Attack Xrd Stage [EP2] on clearing the secret area."
      ],
      required: [
        "Secret Ticket x99"
      ]
    },
    {
      id: "jointparts",
      section: "unit",
      category: "Unit",
      type: "Unit",
      name: "JOINTPARTS",
      image: "./images/common/jointparts-effect.png",
      imagePosition: "center center",
      summary: "A trade unit that reworks six ranged and support weapons, and the only way to unlock Dual Casting.",
      stats: [
        ["Type", "Unit"],
        ["Affected weapons", "6"]
      ],
      combat: [
        "Guld Milla: ATP +400, longer range, auto-aim special with 5\u20135\u20135 hits.",
        "Mille Marteaux: Divine Punishment 3\u20133\u20133 and auto-aim 4\u20134\u20134 on Normal/Heavy, ATP and MST +100, longer range.",
        "Dual Bird: hits 4\u20134\u20134 on Normal/Heavy/Special, longer range. ATA requirement lowered to 190.",
        "Celestial Fusion: Dual Casting \u2014 Jellen and Zalure together at technique Lv30, ATA +20, longer range.",
        "Twin Rika's Claw: 5 targets, dagger animation, wider angle.",
        "Ultimate Double Cannon: ATA +20, better special range and angle, hits lizards, Speed +15%.",
        "Jointparts + Celestial Fusion + Blue Phantom Field pushes Jellen and Zalure to 400%."
      ],
      obtain: [
        "Traded from the FOmar NPC in the Bazaar.",
        "Materials drop in The Discontrolled Tower [Raid] \u2014 EP2 Special."
      ],
      required: []
    },
    {
      id: "ignis-engine",
      section: "unit",
      category: "Unit",
      type: "Unit",
      name: "IGNIS ENGINE",
      image: "./images/common/ignis-engine-effect.png",
      imagePosition: "center center",
      summary: "A Millennium Shop unit that reworks the fire-themed weapons.",
      stats: [
        ["Type", "Unit"],
        ["Affected weapons", "3"]
      ],
      combat: [
        "Final Egg Blaster / Astral Dragon: ATP +100, hits 4\u20134\u20134, longer range, hits lizards in the face.",
        "Zu's Punishment: special hits 1\u20132\u20133, MST +100.",
        "Rathalos Great Sword / Terror Sawd: special hits 1\u20131\u20134, custom animation."
      ],
      obtain: [
        "Traded in the Millennium Shop \u2014 The Phantastic Bazaar, EP2 Shop.",
        "The material list in the original announcement was cut off, so there may be further requirements."
      ],
      required: [
        "Millennium Photon Core x25",
        "Darkness Photon Sphere x1",
        "Blast Garment x1",
        "Behemoth Armor x1",
        "Proof of Sonic Team x1"
      ]
    },
    {
      id: "millennium-hp",
      section: "unit",
      category: "Unit",
      type: "Unit",
      name: "MILLENNIUM/HP",
      image: "./images/common/millennium-hp-effect.png",
      imagePosition: "center center",
      summary: "The largest single HP unit on the server.",
      stats: [
        ["Type", "Unit"],
        ["Bonus", "Max HP +275"]
      ],
      combat: [],
      obtain: [
        "Traded in the Millennium Shop \u2014 The Phantastic Bazaar, EP2 Shop."
      ],
      required: [
        "Millennium Photon Core x5",
        "Immortal/HP x2",
        "Cataclysm Shield x1",
        "MOLTEN RING x1",
        "Weapon Crystal Badge x10"
      ]
    },
    {
      id: "astral-claw",
      section: "force",
      category: "Force",
      type: "Claw",
      name: "ASTRAL CLAW",
      image: "./images/items/gameplay/astral-claw-gameplay.png",
      imagePosition: "center center",
      summary: "A Force-only claw that expands support-technique range while providing a fast Demons special.",
      stats: [
        ["Class", "Force only"],
        ["ATP", "700"],
        ["ATA", "50"],
        ["Special", "Demons"],
        ["Targets", "4"],
        ["Speed", "+15%"],
        ["Bonus", "HP +73"]
      ],
      requirements: [],
      combat: [
        "Jellen range +300%",
        "Resta range +100%",
        "Barta power +100%"
      ],
      obtain: [
        "Create the item with the recipe shown in the supplied update source."
      ],
      required: [
        "Millennium Photon Core x10",
        "Primal Photon Sphere x1",
        "Darkness Photon Sphere x1",
        "HP/FLOW x1",
        "TP/FLOW x1",
        "PB/FLOW x1",
        "Proof of Sonic Team x1",
        "ANTI-DARK RING x1",
        "ANTI-LIGHT RING x1"
      ]
    },
    {
      id: "astral-saber",
      section: "force",
      category: "Force",
      type: "Double Saber",
      name: "ASTRAL SABER",
      image: "./images/items/gameplay/astral-saber-card.png",
      imagePosition: "center center",
      summary: "A Force-only double saber with Berserk, four targets, major technique boosts, and defensive bonuses.",
      stats: [
        ["Class", "Force only"],
        ["Requirement", "MST 1200"],
        ["ATP", "800–850"],
        ["ATA", "55"],
        ["Special", "Berserk"],
        ["Targets", "4"],
        ["Bonus", "DFP +300, Speed +15%"]
      ],
      combat: [
        "Gifoie +100%",
        "Rafoie +90%",
        "Gibarta +400%"
      ],
      obtain: [
        "Create the item with the recipe shown in the supplied update source.",
        "Red Crystal: Meri Noir in VR Test Destiny: Sandstorm [EP1], 1/204 on all IDs.",
        "Blue Crystal: Bar Dalus in VR Test EXTRA: Singularity [EP1], 1/24.",
        "Yellow Crystal: Epsilon in The Eternal Age [EP2], 1/102.",
        "Green Crystal: Girtablulu in Christmas Fiasco EP4, 1/393."
      ],
      required: [
        "BLAST GARMENT x1",
        "Cladding of Manipulator III x2",
        "Millennium Photon Core x15",
        "Red Crystal x1",
        "Blue Crystal x2",
        "Yellow Crystal x2",
        "Green Crystal x2",
        "IZMAELA x1",
        "Dark Matter x1"
      ]
    },
    {
      id: "phantom-raven",
      section: "common",
      category: "Common",
      type: "Handgun",
      name: "PHANTOM RAVEN",
      image: "./images/items/gameplay/phantom-raven-gameplay.png",
      imagePosition: "center center",
      summary: "A multi-shot firearm that fires dark energy rounds and uses Arrest to paralyze enemies.",
      stats: [
        ["Class", "All"],
        ["ATP", "220–250"],
        ["ATA", "52"],
        ["Special", "Arrest"],
        ["Shots", "3–3–3 bullets"]
      ],
      combat: [
        "Fires like Master Raven / Last Swan.",
        "Designed to paralyze enemies and stop them in place."
      ],
      obtain: [
        "Quest: Phantasmal World #3 [Extreme], Ultimate Episode 2.",
        "Quest-exclusive drop from Dr. Robotnik at 1/1280."
      ],
      required: []
    },
    {
      id: "berserk-needle",
      section: "ranger",
      category: "Ranger",
      type: "Needle",
      name: "BERSERK NEEDLE",
      image: "./images/items/gameplay/berserk-needle-gameplay.png",
      imagePosition: "center center",
      summary: "A custom shotgun that fires countless needles and trades HP for higher damage.",
      stats: [
        ["ATP", "400"],
        ["ATA", "40"],
        ["Special", "Berserk"],
        ["Targets", "Needle spread"]
      ],
      combat: [
        "With VECTOR SCOPE equipped: Range +105 and ATA +20."
      ],
      obtain: [
        "The supplied source image lists the weapon stats but does not include its drop or crafting route."
      ],
      required: []
    },
    {
      id: "maxx76-omega",
      section: "ranger",
      category: "Ranger",
      type: "Mechgun",
      name: "MAXX76 OMEGA",
      image: "./images/items/gameplay/maxx76-omega-gameplay.png",
      imagePosition: "center center",
      summary: "An illegally modified dual vulcan built for overwhelming ranged firepower.",
      stats: [
        ["Class", "Ranger"],
        ["HP", "+92"],
        ["ATP", "350"],
        ["ATA", "40"],
        ["Special", "Charge"],
        ["Range", "210.0"]
      ],
      combat: [
        "Type: Mechgun."
      ],
      obtain: [
        "Final boss in Toward the Multiverse [Lv.III]: 1/32 on all IDs.",
        "Dark Falz in Toward the Multiverse [Lv.II]: 1/204 on Pinkal–Whitill."
      ],
      required: []
    },
    {
      id: "star-eulogy",
      section: "hunter",
      category: "Hunter",
      type: "Special Weapon",
      name: "STAR EULOGY",
      image: "./images/items/gameplay/rare-unit-box.png",
      imagePosition: "center center",
      summary: "A Hunter weapon that uses melee claw attacks and unleashes a piercing energy laser.",
      stats: [
        ["Class", "Hunter"],
        ["ATP", "500–520"],
        ["ATA", "50"],
        ["Bonus", "HP +100"],
        ["Normal / Heavy", "2–2–3, Claw animation"],
        ["Special", "Piercing laser, Rifle animation"]
      ],
      combat: [
        "Normal / Heavy target count: 5.",
        "Special target count: 10.",
        "Special deals 150% heavy damage at range 170.0 and consumes 5% HP per shot.",
        "Equipping it reduces Revive / Heal / Cure range by 100%."
      ],
      obtain: [
        "The supplied update source lists the completed stats but does not provide a drop route."
      ],
      required: []
    },
    {
      id: "forbidden-grimoire",
      section: "unit",
      category: "Unit",
      type: "Unit",
      name: "FORBIDDEN GRIMOIRE",
      image: "./images/items/units/forbidden-grimoire-cutout.png",
      imageFit: "contain",
      imagePosition: "center center",
      summary: "An ancient grimoire that enhances selected Force-class weapons and adds 200 HP.",
      stats: [
        ["Class", "Force-oriented"],
        ["Bonus", "HP +200"],
        ["Obtain type", "NPC trade"]
      ],
      combat: [
        "Prophet of Motav: Hits 1–2–3.",
        "The Sigh of a God: expanded range and Hits 3–3–3.",
        "Gal Wind: ATP +350, ATA +30, Normal/Heavy hits 3–3–3, Special hits 3–3–4."
      ],
      obtain: [
        "Trade with the NPC Paganini in Pioneer 2 while in Hallowed World [Master]."
      ],
      required: [
        "Hallowed Jack-O-Lantern x1",
        "Millennium Photon Core x10",
        "Cladding of Epsilon x1",
        "Proof of Sonic Team x1",
        "Sorcerer's Right Arm x1",
        "Magic Stone 'Iritista' x2",
        "Book of Hitogata x1"
      ]
    },
    {
      id: "blast-garment",
      section: "armor",
      category: "Armor",
      type: "Armor",
      name: "BLAST GARMENT",
      image: "./images/items/gameplay/blast-garment-item.png",
      imagePosition: "center center",
      summary: "A mysterious armor that protects its wearer with a mighty blast and provides a large class-scaled HP bonus.",
      stats: [
        ["Class", "All"],
        ["Level", "200"],
        ["DFP", "600"],
        ["EVP", "200"],
        ["Resists", "39 / 39 / 39 / 25 / 25"],
        ["HP bonus", "HU +250, RA +231, FO +181"]
      ],
      combat: [],
      obtain: [
        "Quest: Save the Pioneer 2! — EP1 Special, Beyond the Mainframe [Extreme].",
        "Quest-exclusive drop from The Prophet at 1/45."
      ],
      required: []
    },
    {
      id: "divine-field",
      section: "armor",
      category: "Armor",
      type: "Armor",
      name: "DIVINE FIELD",
      image: "./images/items/gameplay/blast-garment-item.png",
      imagePosition: "center center",
      summary: "The endgame armor from The Starlight Tower, with the highest defense on the server and a flat bonus to every stat.",
      stats: [
        ["Class", "All"],
        ["Level", "200"],
        ["DFP", "508"],
        ["EVP", "284"],
        ["Resists", "46 / 46 / 46 / 55 / 55"],
        ["Bonus", "All stats +20"]
      ],
      combat: [
        "DIVINE BLADE: targets 1\u21925, Speed +50%, wider angle.",
        "Heaven Striker: hits 3\u20133\u20133 while HP is low."
      ],
      obtain: [
        "Traded with materials from The Starlight Tower [Raid] \u2014 EP2 Special.",
        "Also added to the Millennium Shop during the Easter 2026 event."
      ],
      required: [
        "Cladding of Administrator x2",
        "Millennium Photon Core x15",
        "Proof of Sonic Team x2",
        "Primal Nexus x1",
        "Ethereal Armor x1",
        "D-Virus Armor x1"
      ]
    },
    {
      id: "parasitic-armor-predator",
      section: "armor",
      category: "Armor",
      type: "Armor",
      name: "PARASITIC ARMOR 'PREDATOR'",
      image: "./images/items/gameplay/blast-garment-item.png",
      imagePosition: "center center",
      summary: "A raid-exclusive armor dropped by Soul Butcher. It unlocks Dark Bridge's low HP mode.",
      stats: [
        ["Class", "All"],
        ["Type", "Armor"],
        ["Source", "The Ravenous Predator [Raid]"]
      ],
      combat: [
        "A high-end defensive option from the third raid tier."
      ],
      obtain: [
        "Soul Butcher in The Ravenous Predator [Raid].",
        "Official Ultimate drop table rate: 1/36 on all section IDs."
      ],
      required: []
    },
    {
      id: "phantasmal-field-armor",
      section: "armor",
      category: "Armor",
      type: "Armor",
      name: "PHANTASMAL FIELD",
      image: "./images/items/gameplay/blast-garment-item.png",
      imagePosition: "center center",
      summary: "A balanced level 200 armor with high defenses, strong resists, and an all-stat bonus.",
      stats: [
        ["Class", "All"],
        ["Level", "200"],
        ["DFP", "340"],
        ["EVP", "340"],
        ["Resists", "32 / 32 / 32 / 41 / 41"],
        ["Bonus", "All stats +30"]
      ],
      combat: [
        "A flexible endgame armor for builds that value both core stats and dark/light resistance."
      ],
      obtain: [
        "Purchase or exchange through the Millennium Shop."
      ],
      required: []
    },
    {
      id: "astral-cloak-armor",
      section: "armor",
      category: "Armor",
      type: "Armor",
      name: "ASTRAL CLOAK",
      image: "./images/items/gameplay/blast-garment-item.png",
      imagePosition: "center center",
      summary: "A level 200 technique armor with large simple- and Gi-technique boosts.",
      stats: [
        ["Class", "All"],
        ["Level", "200"],
        ["Resists", "35 / 35 / 35 / 35 / 35"],
        ["Simple techs", "+100%"],
        ["Gi techs", "+80%"],
        ["Rabarta", "+90%"]
      ],
      combat: [
        "Built for technique-focused play and broad elemental coverage."
      ],
      obtain: [
        "Create through the Millennium Shop using the recipe shown in the main item guide."
      ],
      required: [
        "Primal Photon Sphere x1",
        "Millennium Photon Core x8",
        "KROE'S SWEATER x1",
        "X-PARTS ver3.10 x1",
        "Archfiend Armor x1",
        "Dynasty Armor x1",
        "RING OF FIRE x1",
        "Ninja Suit x1",
        "Mother Garb+ x2"
      ]
    },
    {
      id: "d-virus-armor",
      section: "armor",
      category: "Armor",
      type: "Armor",
      name: "D-VIRUS ARMOR",
      image: "./images/items/armor/d-virus-armor-forum.webp",
      imagePosition: "center 44%",
      imageFilter: "brightness(1.12) saturate(1.08)",
      summary: "A level 200 high-DFP armor with excellent resists and built-in battle speed.",
      stats: [
        ["Class", "All"],
        ["Level", "200"],
        ["DFP", "600"],
        ["EVP", "200"],
        ["Resists", "32 / 32 / 32 / 32 / 32"],
        ["Attack speed", "+80%"]
      ],
      combat: [
        "The built-in Centurion/Battle effect can free a unit slot."
      ],
      obtain: [
        "D-Virus Baranz in Episode 1 Ultimate Mines.",
        "Featured event quests may provide a dedicated D-Virus Baranz route."
      ],
      required: []
    },
    {
      id: "fifth-anniversary-armor",
      section: "armor",
      category: "Armor",
      type: "Armor",
      name: "5TH ANNIVERSARY ARMOR",
      image: "./images/items/armor/fifth-anniversary-armor-forum.webp",
      imagePosition: "center 42%",
      imageFilter: "brightness(1.1) saturate(1.08)",
      summary: "An event armor with D-Virus Armor defenses and a built-in PB/FLOW effect.",
      stats: [
        ["Class", "All"],
        ["Level", "200"],
        ["DFP", "600"],
        ["EVP", "200"],
        ["Resists", "32 / 32 / 32 / 32 / 32"],
        ["Built-in", "PB/FLOW"]
      ],
      combat: [
        "Uses the D-Virus defensive profile, replacing battle speed with PB/FLOW utility."
      ],
      obtain: [
        "Limited to the fifth anniversary event."
      ],
      required: []
    },
    {
      id: "paragon-frame",
      section: "armor",
      category: "Armor",
      type: "Armor",
      name: "PARAGON FRAME",
      image: "./images/items/armor/paragon-frame-forum.webp",
      imagePosition: "center 46%",
      imageFilter: "brightness(1.12) contrast(1.04)",
      summary: "A Force-only support armor that greatly improves Resta and Shifta/Deband.",
      stats: [
        ["Class", "Force only"],
        ["Level", "200"],
        ["Resta power", "+800"],
        ["Shifta / Deband", "+5 levels"]
      ],
      combat: [
        "A dedicated support armor for high-level Force play."
      ],
      obtain: [
        "Dr. Robotnik in The Eternal Age during the Summer event.",
        "Official event guide rate: 1/1170."
      ],
      required: []
    },
    {
      id: "ethereal-armor",
      section: "armor",
      category: "Armor",
      type: "Armor",
      name: "ETHEREAL ARMOR",
      image: "./images/items/armor/ethereal-armor-forum.webp",
      imagePosition: "center 43%",
      imageFilter: "brightness(1.15) saturate(1.08)",
      summary: "A Force-only combat armor with maximum attack-speed support and piercing Megid.",
      stats: [
        ["Class", "Force only"],
        ["Attack speed", "+120%"],
        ["Built-in", "Megid penetration"]
      ],
      combat: [
        "Useful for battle-Force setups and Megid-focused rooms."
      ],
      obtain: [
        "Check the current Destiny item database and drop table for the active route."
      ],
      required: []
    },
    {
      id: "primal-nexus",
      section: "armor",
      category: "Armor",
      type: "Armor",
      name: "PRIMAL NEXUS",
      image: "./images/items/armor/primal-nexus-forum.webp",
      imagePosition: "center 45%",
      imageFilter: "brightness(1.1) saturate(1.12)",
      summary: "A level 200 Force armor that raises the power of ten offensive techniques.",
      stats: [
        ["Class", "Force only"],
        ["Level", "200"],
        ["Attack techniques", "+30%"]
      ],
      combat: [
        "Boosts ten attack techniques for broad elemental damage coverage."
      ],
      obtain: [
        "Check the current Destiny item database and drop table for the active route."
      ],
      required: []
    },
    {
      id: "genesis-armor",
      section: "armor",
      category: "Armor",
      type: "Armor",
      name: "GENESIS ARMOR",
      image: "./images/items/gameplay/blast-garment-item.png",
      imagePosition: "center center",
      summary: "A high-level general-purpose armor with strong defensive rolls and dark/light resistance.",
      stats: [
        ["Class", "All"],
        ["Level", "190"],
        ["DFP", "408–508"],
        ["EVP", "244–284"],
        ["Resists", "30 / 30 / 30 / 34 / 34"]
      ],
      combat: [
        "A reliable all-class choice when a build needs raw defense."
      ],
      obtain: [
        "Check the current Destiny item database and drop table for the active route."
      ],
      required: []
    },
    {
      id: "behemoth-armor",
      section: "armor",
      category: "Armor",
      type: "Armor",
      name: "BEHEMOTH ARMOR",
      image: "./images/items/armor/behemoth-armor-forum.webp",
      imagePosition: "center 44%",
      imageFilter: "brightness(1.1) saturate(1.12)",
      summary: "A level 200 all-class armor with balanced defense and an ATP bonus.",
      stats: [
        ["Class", "All"],
        ["Level", "200"],
        ["DFP", "340"],
        ["EVP", "340"],
        ["Resists", "32 / 32 / 32 / 35 / 35"],
        ["Bonus", "ATP +30"]
      ],
      combat: [
        "A physical-build armor with a compact ATP bonus."
      ],
      obtain: [
        "Create by combining Spirit Garment with Dark Matter."
      ],
      required: [
        "Spirit Garment x1",
        "Dark Matter x1"
      ]
    },
    {
      id: "evil-aura",
      section: "armor",
      category: "Armor",
      type: "Armor",
      name: "EVIL AURA",
      image: "./images/items/gameplay/blast-garment-item.png",
      imagePosition: "center center",
      summary: "An upgraded dark armor created from Behemoth Armor and Orb of Illusions.",
      stats: [
        ["Class", "All"],
        ["Role", "Dark upgrade"],
        ["Obtain type", "Combination"]
      ],
      combat: [
        "A Behemoth Armor upgrade for dark-themed defensive builds."
      ],
      obtain: [
        "Create through an item combination."
      ],
      required: [
        "Behemoth Armor x1",
        "Orb of Illusions x1"
      ]
    },
    {
      id: "reflex-gear",
      section: "armor",
      category: "Armor",
      type: "Armor",
      name: "REFLEX GEAR",
      image: "./images/items/gameplay/blast-garment-item.png",
      imagePosition: "center center",
      summary: "A level 200 all-class evasion armor with very high EVP and balanced resists.",
      stats: [
        ["Class", "All"],
        ["Level", "200"],
        ["DFP", "150"],
        ["EVP", "380"],
        ["Resists", "30 / 30 / 30 / 30 / 30"]
      ],
      combat: [
        "Made for EVP-heavy setups and defensive avoidance builds."
      ],
      obtain: [
        "Check the current Destiny item database and drop table for the active route."
      ],
      required: []
    },
    {
      id: "shadow-cloak",
      section: "armor",
      category: "Armor",
      type: "Armor",
      name: "SHADOW CLOAK",
      image: "./images/items/armor/shadow-cloak-forum.webp",
      imagePosition: "center 44%",
      imageFilter: "brightness(1.22) contrast(1.06)",
      summary: "A stealth-oriented armor with built-in trap detection and an accuracy bonus.",
      stats: [
        ["Class", "All"],
        ["Bonus", "ATA +20"],
        ["Built-in", "Trap/Search"]
      ],
      combat: [
        "Lets non-cast characters detect traps while adding accuracy."
      ],
      obtain: [
        "Check the current Destiny item database and drop table for the active route."
      ],
      required: []
    },
    {
      id: "dynasty-armor",
      section: "armor",
      category: "Armor",
      type: "Armor",
      name: "DYNASTY ARMOR",
      image: "./images/items/gameplay/blast-garment-item.png",
      imagePosition: "center center",
      summary: "A level 180 armor that adds 15 to every character stat.",
      stats: [
        ["Class", "All"],
        ["Level", "180"],
        ["DFP", "230–280"],
        ["EVP", "148–170"],
        ["Resists", "20 / 20 / 20 / 28 / 28"],
        ["Bonus", "All stats +15"]
      ],
      combat: [
        "A flexible choice for builds that benefit from every core stat."
      ],
      obtain: [
        "Dal Ral Lie, Vol Opt ver.2, or Del Lily routes shown in the Astral Cloak material guide."
      ],
      required: []
    },
    {
      id: "business-jacket",
      section: "armor",
      category: "Armor",
      type: "Armor",
      name: "BUSINESS JACKET",
      image: "./images/items/gameplay/blast-garment-item.png",
      imagePosition: "center center",
      summary: "A level 160 all-class armor with balanced resists and an extra 100 HP.",
      stats: [
        ["Class", "All"],
        ["Level", "160"],
        ["DFP", "288–330"],
        ["EVP", "260–280"],
        ["Resists", "30 / 30 / 30 / 30 / 30"],
        ["Bonus", "HP +100"]
      ],
      combat: [
        "A practical survivability armor before level 200 options become available."
      ],
      obtain: [
        "Check the current Destiny item database and drop table for the active route."
      ],
      required: []
    },
    {
      id: "archfiend-armor",
      section: "armor",
      category: "Armor",
      type: "Armor",
      name: "ARCHFIEND ARMOR",
      image: "./images/items/gameplay/blast-garment-item.png",
      imagePosition: "center center",
      summary: "A level 177 armor focused on dark resistance.",
      stats: [
        ["Class", "All"],
        ["Level", "177"],
        ["DFP", "370"],
        ["EVP", "180–260"],
        ["Resists", "0 / 0 / 0 / 50 / 0"]
      ],
      combat: [
        "Its 50 EDK is useful in rooms with dangerous Megid attacks."
      ],
      obtain: [
        "Gran Sorcerer or Dark Bringer routes shown in the Astral Cloak material guide."
      ],
      required: []
    },
    {
      id: "x-parts-ver310",
      section: "armor",
      category: "Armor",
      type: "Armor",
      name: "X-PARTS VER3.10",
      image: "./images/items/gameplay/blast-garment-item.png",
      imagePosition: "center center",
      summary: "A cast-only level 180 armor that adds a large ATP bonus.",
      stats: [
        ["Class", "Casts only"],
        ["Level", "180"],
        ["DFP", "180"],
        ["EVP", "150"],
        ["Resists", "0 / 0 / 0 / 30 / 30"],
        ["Bonus", "ATP +80"]
      ],
      combat: [
        "A strong physical-damage armor for cast characters."
      ],
      obtain: [
        "Sinow Spigell, Morfos, or Shambertin routes shown in the Astral Cloak material guide."
      ],
      required: []
    },
    {
      id: "ninja-suit",
      section: "armor",
      category: "Armor",
      type: "Armor",
      name: "NINJA SUIT",
      image: "./images/items/gameplay/blast-garment-item.png",
      imagePosition: "center center",
      summary: "A level 180 all-class armor with a direct ATP boost.",
      stats: [
        ["Class", "All"],
        ["Level", "180"],
        ["DFP", "140"],
        ["EVP", "200"],
        ["Resists", "24 / 20 / 20 / 24 / 24"],
        ["Bonus", "ATP +70"]
      ],
      combat: [
        "A straightforward offense-oriented armor."
      ],
      obtain: [
        "Dal Ral Lie, Gal Gryphon, or Bulclaw routes shown in the Astral Cloak material guide."
      ],
      required: []
    },
    {
      id: "hallowed-garment",
      section: "armor",
      category: "Armor",
      type: "Armor",
      name: "HALLOWED GARMENT",
      image: "./images/items/gameplay/blast-garment-item.png",
      imagePosition: "center center",
      summary: "A level 80 progression armor with unusually high defense for its level.",
      stats: [
        ["Class", "All"],
        ["Level", "80"],
        ["DFP", "235–285"]
      ],
      combat: [
        "A strong leveling armor that bridges characters into high-level gear."
      ],
      obtain: [
        "Hallowed World content and related seasonal routes."
      ],
      required: []
    },
    {
      id: "spectral-suit",
      section: "armor",
      category: "Armor",
      type: "Armor",
      name: "SPECTRAL SUIT",
      image: "./images/items/gameplay/blast-garment-item.png",
      imagePosition: "center center",
      summary: "A utility armor that removes weapon swing and firing delay.",
      stats: [
        ["Class", "All"],
        ["Effect", "No weapon lag"]
      ],
      combat: [
        "Useful for weapons whose recovery animation normally slows repeated attacks."
      ],
      obtain: [
        "Check the current Destiny item database and drop table for the active route."
      ],
      required: []
    },
    {
      id: "chaos-halo",
      section: "shield",
      category: "Shield",
      type: "Shield",
      name: "CHAOS HALO",
      image: "./images/items/gameplay/blast-garment-item.png",
      imagePosition: "center center",
      summary: "A darkness halo that boosts attack power, Grants, Zonde, and Megid penetration.",
      stats: [
        ["Class", "All"],
        ["Level", "200"],
        ["DFP", "180–230"],
        ["EVP", "200–250"],
        ["Resists", "32 / 32 / 32 / 24 / 24"]
      ],
      combat: [
        "ATP +80; Grants +70%; Zonde +100%.",
        "Grants Megid penetration."
      ],
      obtain: [
        "Only obtainable in The Phantasmal Dimension."
      ],
      required: []
    },
    {
      id: "crystalized-wings",
      section: "shield",
      category: "Shield",
      type: "Shield",
      name: "CRYSTALIZED WINGS",
      image: "./images/items/gameplay/wings-gameplay.png",
      imagePosition: "center center",
      summary: "A pair of crystal wings that strengthens Barta and expands Resta and Zalure range.",
      stats: [
        ["Class", "All"],
        ["Level", "200"],
        ["DFP", "180–230"],
        ["EVP", "200–250"],
        ["Resists", "32 / 40 / 32 / 20 / 40"],
        ["Bonus", "ATA +35"]
      ],
      combat: [
        "Resta and Zalure range +300%.",
        "Barta power +100%."
      ],
      obtain: [
        "Only obtainable in The Phantasmal Dimension."
      ],
      required: []
    },
    {
      id: "phoenix-wings",
      section: "shield",
      category: "Shield",
      type: "Shield",
      name: "PHOENIX WINGS",
      image: "./images/items/gameplay/phoenix-wings-gameplay.png",
      imagePosition: "center center",
      summary: "A pair of phoenix wings that empowers fire techniques and extends Reverser range.",
      stats: [
        ["Class", "All"],
        ["Level", "200"],
        ["DFP", "200–250"],
        ["EVP", "180–230"],
        ["Resists", "40 / 32 / 32 / 20 / 40"],
        ["Bonus", "ATA +35"]
      ],
      combat: [
        "Reverser range +100%.",
        "Foie +80%.",
        "Rafoie +70%."
      ],
      obtain: [
        "Only obtainable in The Phantasmal Dimension."
      ],
      required: []
    },
    {
      id: "astral-wings",
      section: "shield",
      category: "Shield",
      type: "Shield",
      name: "ASTRAL WINGS",
      image: "./images/items/gameplay/blast-garment-item.png",
      imagePosition: "center center",
      summary: "Astral wings that grant status immunity and reveal traps.",
      stats: [
        ["Class", "All"],
        ["Level", "150"],
        ["DFP", "180"],
        ["EVP", "180"],
        ["Resists", "32 / 32 / 32 / 24 / 24"]
      ],
      combat: [
        "Built-in State/Maintenance and Trap/Search. Astral Halo is an alternate skin with identical stats and effects."
      ],
      obtain: [
        "Halloween event trade with Paganini in Pioneer 2."
      ],
      required: [
        "Bat Wing x3",
        "Astral Essence x1",
        "Gratia x1",
        "Magic Stone Iritista x2",
        "Magic Rock Heart Key x1"
      ]
    },
    {
      id: "radiant-ring",
      section: "shield",
      category: "Shield",
      type: "Shield",
      name: "RADIANT RING",
      image: "./images/items/gameplay/radiant-ring-gameplay.png",
      imagePosition: "center center",
      summary: "A relic of forgotten royalty whose radiance unlocks Last Emperor's full potential.",
      stats: [
        ["Class", "All"],
        ["Level", "150"],
        ["DFP", "150–200"],
        ["EVP", "150–200"],
        ["Resists", "32 / 32 / 32 / 24 / 24"],
        ["Bonus", "ATA +30"]
      ],
      combat: [
        "Combo bonus with Last Emperor: Special Attack hits 3–3–3."
      ],
      obtain: [
        "The supplied source image does not list a drop or crafting route."
      ],
      required: []
    },
    {
      id: "heavenly-resonance",
      section: "shield",
      category: "Shield",
      type: "Shield",
      name: "HEAVENLY RESONANCE",
      image: "./images/items/gameplay/heavenly-resonance-gameplay.png",
      imagePosition: "center center",
      summary: "A divine all-class shield that boosts all three Gi techniques.",
      stats: [
        ["Class", "All"],
        ["Level", "200"],
        ["DFP", "150–200"],
        ["EVP", "150–200"],
        ["Resists", "33 / 33 / 33 / 33 / 33"]
      ],
      combat: [
        "Gifoie +50%; Gibarta +90%; Gizonde +50%."
      ],
      obtain: [
        "Dark Falz on the final floor of Toward the Multiverse [Lv. I], 1/102 on all IDs."
      ],
      required: []
    },
    {
      id: "d-virus-shield",
      section: "shield",
      category: "Shield",
      type: "Shield",
      name: "D-VIRUS SHIELD",
      image: "./images/items/gameplay/d-virus-shield-gameplay.png",
      imagePosition: "center center",
      summary: "A D-Factor-enhanced shield that increases every stat by 20 and adds strong defensive power.",
      stats: [
        ["Class", "All"],
        ["Level", "200"],
        ["DFP", "350"],
        ["EVP", "225"],
        ["Resists", "32 / 32 / 32 / 32 / 32"],
        ["Bonus", "All stats +20"]
      ],
      combat: [
        "Dark Bridge low HP mode: the special hits 1\u20131\u20134 with an alternate motion."
      ],
      obtain: [
        "Lost SOUL RIPPER [Extreme], difficulty 9.",
        "D-Virus Baranz ver.2 custom drop: D-Virus Shield at 1/1204."
      ],
      required: []
    },
    {
      id: "golden-halo",
      section: "shield",
      category: "Shield",
      type: "Shield",
      name: "GOLDEN HALO",
      image: "./images/items/gameplay/golden-halo-gameplay.png",
      imagePosition: "center center",
      summary: "A golden support shield that boosts HP and key support techniques.",
      stats: [
        ["Level", "150"],
        ["DFP", "150"],
        ["EVP", "210"],
        ["Resists", "32 / 32 / 32 / 32 / 32"],
        ["HP bonus", "+50"]
      ],
      combat: [
        "Reverser and Moon Atomizer range +100%.",
        "Shifta and Deband +200%."
      ],
      obtain: [
        "Manipulator III Ver.2 (stronger one) in The Manipulated Tower [Raid], 1/39 on all IDs."
      ],
      required: []
    },
    makeShieldItem({
      id: "second-anniversary-wings",
      name: "2ND ANNIVERSARY WINGS",
      summary: "Ten section-ID color variants released for Destiny's second anniversary.",
      stats: [
        ["Class", "All"], ["Level", "100"], ["DFP", "180"], ["EVP", "190"],
        ["Resists", "25 / 25 / 25 / 25 / 25"], ["Bonus", "ATA +30"]
      ],
      combat: ["Resta +100%; Jellen range +200%."],
      obtain: ["Exclusive second-anniversary drop; no longer obtainable."]
    }),
    makeShieldItem({
      id: "section-id-halos",
      name: "SECTION ID HALOS",
      summary: "Ten chromatic halo variants aligned with the game's section IDs.",
      stats: [
        ["Class", "All"], ["Level", "150"], ["DFP", "180"], ["EVP", "180"],
        ["Resists", "20 / 20 / 20 / 25 / 25"], ["Bonus", "ATA +25"]
      ],
      combat: ["Reverser and Moon Atomizer range +100%; Jellen and Zalure range +100%."],
      obtain: ["Valentine event: trade three Wings of Life and 50 flowers in Love Research."]
    }),
    makeShieldItem({
      id: "red-phantom-field",
      name: "RED PHANTOM FIELD",
      summary: "An attack-focused phantom field with expanded Jellen range.",
      stats: [
        ["Class", "All"], ["Level", "180"], ["DFP", "165–180"], ["EVP", "170–190"],
        ["Resists", "25 / 25 / 25 / 15 / 15"], ["Bonus", "ATP +60"]
      ],
      combat: ["Jellen range +300%."],
      obtain: ["Check the current Destiny drop table for its active source."]
    }),
    makeShieldItem({
      id: "blue-phantom-field",
      name: "BLUE PHANTOM FIELD",
      summary: "An accuracy-focused phantom field with expanded Zalure range.",
      stats: [
        ["Class", "All"], ["Level", "180"], ["DFP", "145–160"], ["EVP", "190–210"],
        ["Resists", "25 / 25 / 25 / 15 / 15"], ["Bonus", "ATA +30"]
      ],
      combat: ["Zalure range +300%."],
      obtain: ["Check the current Destiny drop table for its active source."]
    }),
    makeShieldItem({
      id: "cataclysm-shield",
      name: "CATACLYSM SHIELD",
      image: "./images/items/gameplay/blast-garment-item.png",
      summary: "A high-defense lava shield with a free HP boost.",
      stats: [
        ["Class", "All"], ["Level", "200"], ["DFP", "220"], ["EVP", "250"],
        ["Resists", "35 / 25 / 25 / 35 / 25"], ["HP bonus", "+50"]
      ],
      obtain: ["Check the current Destiny drop table for its active source."]
    }),
    makeShieldItem({
      id: "hellfire-shield",
      name: "HELLFIRE SHIELD",
      image: "./images/items/shields/cataclysm-hellfire-forum.webp",
      summary: "An ultimate lava shield with high defense, evasion, and HP.",
      stats: [
        ["Class", "All"], ["Level", "200"], ["DFP", "220"], ["EVP", "250"],
        ["Resists", "35 / 25 / 25 / 35 / 25"], ["HP bonus", "+50"]
      ],
      obtain: ["Check the current Destiny drop table for its active source."]
    }),
    makeShieldItem({
      id: "molten-ring",
      name: "MOLTEN RING",
      summary: "A Tower-oriented ring with exceptional fire and dark resistance.",
      stats: [
        ["Class", "All"], ["Level", "100"], ["DFP", "140"], ["EVP", "140"],
        ["Resists", "50 / 0 / 0 / 50 / 0"]
      ],
      obtain: ["Check the current Destiny drop table for its active source."]
    }),
    makeShieldItem({
      id: "rainbow-shield",
      name: "RAINBOW SHIELD",
      summary: "A high-EVP shield that adds all stats and strengthens Grants.",
      stats: [
        ["Class", "All"], ["Level", "135"], ["DFP", "170–190"], ["EVP", "230–255"],
        ["Resists", "15 / 15 / 15 / 32 / 32"], ["Bonus", "All stats +15"]
      ],
      combat: ["Grants +50%."],
      obtain: ["Check the current Destiny drop table for its active source."]
    }),
    makeShieldItem({
      id: "bat-wing",
      name: "BAT WING",
      image: "./images/items/shields/bat-wing-forum.webp",
      summary: "Mysterious wings for aggressive support play.",
      stats: [
        ["Class", "All"], ["Level", "150"], ["DFP", "160–200"], ["EVP", "160–180"],
        ["Resists", "20 / 20 / 20 / 25 / 25"], ["Bonus", "ATP +60"]
      ],
      combat: ["Jellen and Zalure range +100%. Demon Wing and Cursed Wing are alternate skins with identical stats."],
      obtain: ["Used in the Halloween recipe for Astral Wings."]
    }),
    makeShieldItem({
      id: "golden-bat-wing",
      name: "GOLDEN BAT WING",
      image: "./images/items/shields/golden-bat-wing-forum.webp",
      summary: "A golden bat-wing variant for attack-focused support builds.",
      stats: [
        ["Class", "All"], ["Level", "150"], ["DFP", "160–200"], ["EVP", "160–180"],
        ["Resists", "20 / 20 / 20 / 25 / 25"], ["Bonus", "ATP +60"]
      ],
      combat: ["Jellen and Zalure range +100%."],
      obtain: ["Check the current Destiny drop table for its active source."]
    }),
    makeShieldItem({
      id: "wings-of-life",
      name: "WINGS OF LIFE",
      image: "./images/items/shields/wings-of-life-forum.webp",
      summary: "Holy wings that extend healing and revival support.",
      stats: [
        ["Class", "All"], ["Level", "150"], ["DFP", "160–200"], ["EVP", "160–180"],
        ["Resists", "20 / 20 / 20 / 25 / 25"]
      ],
      combat: ["Resta +100%; Reverser and Moon Atomizer range +100%."],
      obtain: ["Three copies are used for the Section ID Halo Valentine trade."]
    }),
    makeShieldItem({
      id: "valentine-wings",
      name: "VALENTINE WINGS",
      image: "./images/items/shields/valentine-wings-forum.webp",
      summary: "A Valentine wing variant that extends healing and revival support.",
      stats: [
        ["Class", "All"], ["Level", "150"], ["DFP", "160–200"], ["EVP", "160–180"],
        ["Resists", "20 / 20 / 20 / 25 / 25"]
      ],
      combat: ["Resta +100%; Reverser and Moon Atomizer range +100%."],
      obtain: ["Valentine event item."]
    }),
    makeShieldItem({
      id: "deal-with-it",
      name: "DEAL WITH IT",
      summary: "Sunglasses that boost accuracy and all three Gi techniques.",
      stats: [
        ["Class", "All"], ["Level", "20"], ["DFP", "100"], ["EVP", "200"],
        ["Resists", "20 / 20 / 20 / 20 / 20"], ["Bonus", "ATA +15"]
      ],
      combat: ["Gifoie, Gibarta, and Gizonde +20%."],
      obtain: ["Check the current Destiny drop table for its active source."]
    }),
    makeShieldItem({
      id: "haunted-helm",
      name: "HAUNTED HELM",
      summary: "A low-level Halloween shield with balanced defenses and a broad stat bonus.",
      stats: [
        ["Class", "All"], ["Level", "60"], ["DFP", "160"], ["EVP", "160"],
        ["Resists", "20 / 20 / 20 / 20 / 20"], ["Bonus", "All stats +10"]
      ],
      obtain: ["Halloween event item."]
    }),
    makeShieldItem({
      id: "blue-winter-hat",
      name: "BLUE WINTER HAT",
      summary: "An accessible early shield with balanced defenses and bonus accuracy.",
      stats: [
        ["Class", "All"], ["Level", "60"], ["DFP", "150"], ["EVP", "150"],
        ["Resists", "20 / 20 / 20 / 20 / 20"], ["Bonus", "ATA +20"]
      ],
      obtain: ["Christmas event item."]
    }),
    makeShieldItem({
      id: "elemental-shield",
      name: "ELEMENTAL SHIELD",
      summary: "A Force-only shield that boosts the three simple attack techniques.",
      stats: [
        ["Class", "Force"], ["Level", "120"], ["DFP", "148"], ["EVP", "170"],
        ["Resists", "35 / 35 / 35 / 35 / 35"]
      ],
      combat: ["Foie, Barta, and Zonde +40%."],
      obtain: ["Check the current Destiny drop table for its active source."]
    }),
    makeShieldItem({
      id: "red-ring",
      name: "RED RING",
      summary: "A classic high-variable shield with a strong all-stat bonus.",
      stats: [
        ["Class", "All"], ["Level", "150"], ["DFP", "130–215"], ["EVP", "212–237"],
        ["Resists", "30 / 30 / 30 / 5 / 5"], ["Bonus", "All stats +20"]
      ],
      obtain: ["Check the current Destiny drop table for its active source."]
    }),
    makeShieldItem({
      id: "three-seals",
      name: "THREE SEALS",
      image: "./images/items/gameplay/blast-garment-item.png",
      summary: "A Force-only shield for broad Ra-technique amplification.",
      stats: [
        ["Class", "Force"], ["Level", "100"], ["DFP", "140"], ["EVP", "145"],
        ["Resists", "33 / 33 / 33 / 33 / 33"]
      ],
      combat: ["Rafoie, Rabarta, and Razonde +30%."],
      obtain: ["Can be upgraded into Profound Darkness with an Orb of Illusions."]
    }),
    makeShieldItem({
      id: "profound-darkness",
      name: "PROFOUND DARKNESS",
      image: "./images/items/shields/profound-darkness-forum.webp",
      summary: "The upgraded form of Three Seals for Force Ra-technique setups.",
      stats: [
        ["Class", "Force"], ["Level", "100"], ["DFP", "140"], ["EVP", "145"],
        ["Resists", "33 / 33 / 33 / 33 / 33"]
      ],
      combat: ["Rafoie, Rabarta, and Razonde +30%."],
      obtain: ["Combine Three Seals with an Orb of Illusions."]
    }),
    makeShieldItem({
      id: "gratia",
      name: "GRATIA",
      summary: "A Cast-only shield with high evasion and strong elemental resistances.",
      stats: [
        ["Class", "Cast"], ["Level", "101"], ["DFP", "130–150"], ["EVP", "200–215"],
        ["Resists", "34 / 34 / 34 / 24 / 24"]
      ],
      obtain: ["Also required for the Halloween Astral Wings trade."]
    }),
    makeShieldItem({
      id: "ranger-wall",
      name: "RANGER WALL",
      summary: "An early Ranger shield with low defenses but useful accuracy.",
      stats: [
        ["Class", "Ranger"], ["Level", "41"], ["DFP", "70–80"], ["EVP", "145–155"],
        ["Resists", "15 / 15 / 18 / 0 / 0"], ["Bonus", "ATA +20"]
      ],
      obtain: ["Check the current Destiny drop table for its active source."]
    }),
    makeShieldItem({
      id: "de-rol-le-shield",
      name: "DE ROL LE SHIELD",
      summary: "A human-only shield with highly variable defense and solid evasion.",
      stats: [
        ["Class", "Humans"], ["Level", "102"], ["DFP", "180–255"], ["EVP", "120–195"],
        ["Resists", "5 / 20 / 15 / 0 / 20"]
      ],
      obtain: ["Check the current Destiny drop table for its active source."]
    }),
    makeShieldItem({
      id: "gods-shield-kouryu",
      name: "GOD'S SHIELD KOURYU",
      summary: "A light-bathed all-class shield with high elemental resistances.",
      stats: [
        ["Class", "All"], ["Level", "101"], ["DFP", "95"], ["EVP", "180"],
        ["Resists", "40 / 40 / 40 / 0 / 0"]
      ],
      obtain: ["Check the current Destiny drop table for its active source."]
    }),
    {
      id: "asteroid-engine",
      section: "unit",
      category: "Unit",
      type: "Unit",
      name: "ASTEROID ENGINE",
      image: "./images/items/units/asteroid-effect.png",
      imagePosition: "center center",
      summary: "A resist-boosting unit that empowers Yunchang, Cannon Rouge, and Slicer of Fanatic.",
      stats: [
        ["All resists", "+5"],
        ["Affected weapons", "3"]
      ],
      combat: [
        "Yunchang: wider angle, longer range, Speed +15%, ATP +150, Double Saber animation.",
        "Cannon Rouge: shoots 5 bullets instead of 1, ATP +150.",
        "Slicer of Fanatic: Speed +15%, targets 3→5, wider angle, ATA +20."
      ],
      obtain: [
        "Exclusive drop in VR Test Destiny: Meteor Impact on all IDs.",
        "Epsilon: Asteroid Engine at 1/2100."
      ],
      required: []
    },
    {
      id: "matrix-scope",
      section: "unit",
      category: "Unit",
      type: "Unit",
      name: "MATRIX SCOPE",
      image: "./images/items/units/matrix-scope-cutout.png",
      imageFit: "contain",
      imagePosition: "center center",
      summary: "A scope unit with all resists +5 that empowers Apocalypse Bowgun, Snow Queen, and Power Maser.",
      stats: [
        ["All resists", "+5"],
        ["Affected weapons", "3"]
      ],
      combat: [
        "Apocalypse Bowgun: ATP +100; Normal/Heavy hits 3–3–3, Special hits 1–2–3 with adjusted special angle.",
        "Snow Queen: ATP +150, ATA +30, shoots 3 bullets at once like Master Raven while combo remains locked.",
        "Power Maser: Hits 4–4–4, MST +150, range 185.0 and angle 60.0."
      ],
      obtain: [
        "Create or trade the item with the required components shown in the supplied source.",
        "Fragments of Orb [Red]: Delbiter in Christmas Fiasco EP2, 1/393 on Redria and Pinkal.",
        "Fragments of Orb [Blue]: Dark Bringer in Christmas Fiasco EP1, 1/393 on Skyly and Bluefull."
      ],
      required: [
        "Infernal Stone x1",
        "Fragments of Orb [Red] x2",
        "Fragments of Orb [Blue] x2",
        "Reflex Gear x2",
        "ETHEREAL ARMOR x1",
        "Shadow Cloak x1",
        "Proof of Sonic Team x1",
        "Rare Tool x2",
        "Rare Unit x2",
        "Rare item x3",
        "Weapon Crystal Badge x20"
      ]
    },
    {
      id: "chaos-engine",
      section: "unit",
      category: "Unit",
      type: "Unit",
      name: "CHAOS ENGINE",
      image: "./images/items/units/chaos-effect.png",
      imagePosition: "center center",
      summary: "A year-round unit with all resists +5 that upgrades four weapons.",
      stats: [
        ["All resists", "+5"],
        ["Affected weapons", "4"]
      ],
      combat: [
        "Planet Eater: Hits 1–2–2 → 2–2–3, Twin Sword custom animation, ATA +20.",
        "M&A85 Fury: ATP +100, piercing bullet, range 170.0→210.0.",
        "Mortal Ruin: targets 3→10, ATP +100, auto-aim Megid special.",
        "Ill Gill Reaper: custom Partisan animation, targets 10→6, Speed +15%, buffed angle and expanded hit patterns."
      ],
      obtain: [
        "Nightmare Chaser XII in Silent Nightmare [Raid], 1/75 on all IDs."
      ],
      required: []
    },
    {
      id: "raster-scope",
      section: "unit",
      category: "Unit",
      type: "Unit",
      name: "RASTER SCOPE",
      image: "./images/items/units/scope-effect.png",
      imagePosition: "center center",
      summary: "A scope unit with all resists +5 that modifies Yasminkov-type weapons.",
      stats: [
        ["All resists", "+5"],
        ["Affected weapons", "Yasminkov series"]
      ],
      combat: [
        "Yasminkov 9000M: Range +40.0, ATP +50, ATA +20.",
        "Yasminkov 2000H: Range +70.0, Hits 3–3–3.",
        "Yasminkov 7000V: ATP +300, Range +55.0.",
        "Yasminkov 3000R: Normal/Heavy hits 3–3–3, Special hits 1–1–3, special range +75.0 and angle +35."
      ],
      obtain: [
        "Epsilon: Raster Scope at 1/2100, as listed in the supplied drop-table update."
      ],
      required: []
    },
    {
      id: "vector-scope",
      section: "unit",
      category: "Unit",
      type: "Unit",
      name: "VECTOR SCOPE",
      image: "./images/items/units/scope-effect.png",
      imagePosition: "center center",
      summary: "A scope unit with all resists +5 that buffs Needle-type weapons.",
      stats: [
        ["All resists", "+5"],
        ["Affected weapons", "Needle series"]
      ],
      combat: [
        "Arrest Needle / Hell Needle: Range +105, ATA +20.",
        "Gush Needle: Range +105, special hits 1–1–3, ATA +20.",
        "Grave Digger / Nefarious Needle: ATP +60, ATA +30."
      ],
      obtain: [
        "The supplied source lists the buffs but does not include a drop or crafting route."
      ],
      required: [],
      displayCard: false
    }
  ];

  const sectionLabels = {
    armor: {
      title: "ARMOR",
      subtitleKey: "catalog.armor.subtitle",
      subtitle: "Defensive equipment",
      descriptionKey: "catalog.armor.desc",
      description: "Armor updates, defensive stats, class requirements, and item sources."
    },
    shield: {
      title: "SHIELDS",
      subtitleKey: "catalog.shield.subtitle",
      subtitle: "Barriers and rings",
      descriptionKey: "catalog.shield.desc",
      description: "Shields, wings, rings, technique boosts, and quest-exclusive sources."
    }
  };

  const normalizeName = (value) => String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();

  const operatorData = window.DestinyItemPriorityData || {
    updatedAt: "",
    legend: { genericUnits: [] },
    items: [],
    imports: []
  };

  // The operator list references several items that were only available in the
  // item database. Add those database-backed records before the section maps are
  // built, while still protecting hand-authored cards from duplicate names.
  const knownCatalogIndexes = new Map(catalogItems.map((item, index) => [normalizeName(item.name), index]));
  (operatorData.imports || []).forEach((item) => {
    const key = normalizeName(item.name);
    if (!key) return;
    if (knownCatalogIndexes.has(key)) {
      const index = knownCatalogIndexes.get(key);
      const current = catalogItems[index];
      if (current.displayCard === false) {
        catalogItems[index] = { ...current, ...item, displayCard: true };
      }
      return;
    }
    catalogItems.push(item);
    knownCatalogIndexes.set(key, catalogItems.length - 1);
  });

  const escapeHTML = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const catalogById = new Map(catalogItems.map((item) => [item.id, item]));
  const catalogByName = new Map(catalogItems.map((item) => [normalizeName(item.name), item]));
  const operatorByName = new Map();

  (operatorData.items || []).forEach((meta) => {
    [meta.name].concat(meta.aliases || []).forEach((name) => {
      const key = normalizeName(name);
      if (key) operatorByName.set(key, meta);
    });
  });

  const getOperatorMeta = (name) => operatorByName.get(normalizeName(name)) || null;
  const scoreValue = (score) => Number.parseFloat(String(score || "0")) || 0;
  const bestOverall = (meta) => meta && meta.overall && meta.overall.length
    ? meta.overall.slice().sort((a, b) => scoreValue(b.score) - scoreValue(a.score))[0]
    : null;

  /** 아이템 데이터는 영어로 두고, 화면 문구만 사전에서 가져온다. */
  const t = (key, en) => window.DestinyI18n?.t(key, en) ?? en;

  // Items without a verified screenshot use the server-style red rare-item box.
  // It is intentionally treated as a visual fallback rather than the item's
  // authentic image so detail views never label it as original artwork.
  const FALLBACK_IMAGE = "./images/items/gameplay/rare-unit-box.png";

  // Never present a red box or another item's screenshot as if it were the selected item.
  const hasAuthenticImage = (item) => {
    if (!item.image || item.imageFallback) return false;
    const path = String(item.image).replace(/\\/g, "/").toLowerCase();
    if (path.endsWith("/rare-unit-box.png") || path.endsWith("/redbox.png")) return false;
    if (path.endsWith("/blast-garment-item.png") && normalizeName(item.name) !== "BLAST GARMENT") return false;
    return true;
  };

  /**
   * 스탯 라벨만 번역한다. 값은 게임 수치이므로 그대로 둔다.
   * ATP 같은 약어는 사전에 키가 없어 영어가 유지된다.
   */
  /** 라벨에서 사전 키만 만든다 (마킹용). */
  const statKey = (raw) => "stat." + String(raw).trim()
    .replace(/\s*%$/, " percent")
    .replace(/[^A-Za-z0-9 ]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((w, i) => (i === 0 ? w.charAt(0).toLowerCase() + w.slice(1) : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join("");

  const statLabel = (raw) => {
    const camel = String(raw).trim()
      .replace(/\s*%$/, " percent")
      .replace(/[^A-Za-z0-9 ]+/g, " ")
      .trim()
      .split(/\s+/)
      .map((word, i) => (i === 0 ? word.charAt(0).toLowerCase() + word.slice(1) : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
      .join("");
    return t("stat." + camel, raw);
  };

  /**
   * 아이템 설명문을 사전에서 가져온다.
   *
   * 키는 아이템 id 와 필드 이름으로 만든다: cat.<id>.summary, cat.<id>.combat.0
   * 영어 원문을 기본값으로 넘기므로 사전에 없으면 영어가 그대로 보인다.
   * required(재료 목록)는 아이템명이라 번역 대상이 아니다.
   */
  const prose = (item, field, index) => {
    const value = index === undefined ? item[field] || "" : (item[field] || [])[index] || "";
    // 정적 카드에서 합성한 아이템은 고정 문구용 공용 키를 들고 온다.
    // 아이템 id 로 키를 만들면 카드마다 다른 키가 되어 사전과 맞지 않는다.
    const shared = index === undefined ? item[field + "Key"] : (item[field + "Keys"] || [])[index];
    if (shared) return t(shared, value);
    return t("cat." + item.id + "." + field + (index === undefined ? "" : "." + index), value);
  };

  const proseList = (item, field) => (item[field] || []).map((_line, i) => prose(item, field, i));
  const proseRef = (item, field, index) => ({
    key: (item[field + "Keys"] || [])[index] || "cat." + item.id + "." + field + "." + index,
    en: (item[field] || [])[index] || ""
  });

  const operatorCategoryKeys = {
    "WEAPON": "catalog.operator.category.weapon",
    "ARMOR": "catalog.operator.category.armor",
    "SHIELD": "catalog.operator.category.shield",
    "ARMOR / SHIELD": "catalog.operator.category.armorShield"
  };

  const operatorConditionKeys = {
    "JOINTPARTS AND FORCE": "catalog.operator.condition.jointpartsForce",
    "PARTY PLAY": "catalog.operator.condition.party",
    "SOLO PLAY": "catalog.operator.condition.solo",
    "IGNIS ENGINE": "catalog.operator.condition.ignisEngine",
    "RADIANT RING": "catalog.operator.condition.radiantRing",
    "CHAOS ENGINE": "catalog.operator.condition.chaosEngine",
    "JOINTPARTS": "catalog.operator.condition.jointparts",
    "ASTEROID ENGINE": "catalog.operator.condition.asteroidEngine",
    "VECTOR SCOPE": "catalog.operator.condition.vectorScope",
    "TELLUSIS": "catalog.operator.condition.tellusis",
    "PARAGON FRAME": "catalog.operator.condition.paragonFrame",
    "RASTER SCOPE": "catalog.operator.condition.rasterScope"
  };

  const operatorCategoryLabel = (value) => t(operatorCategoryKeys[normalizeName(value)] || "", value);
  const operatorConditionLabel = (value) => t(operatorConditionKeys[normalizeName(value)] || "", value);

  function operatorBadgeMarkup(name) {
    const meta = getOperatorMeta(name);
    if (!meta) return "";

    const badges = [];
    const overall = bestOverall(meta);
    if (overall) {
      const conditional = overall.condition ? "*" : "";
      badges.push('<span class="destiny_priority_badge destiny_priority_badge--overall" title="Operator overall rating' +
        (overall.condition ? ": requires " + escapeHTML(operatorConditionLabel(overall.condition)) : "") + '">' +
        (meta.tradeOnly ? "★ " : "") + escapeHTML(overall.score + conditional) + "</span>");
    }
    if (meta.hit) {
      badges.push('<span class="destiny_priority_badge destiny_priority_badge--hit">Hit ' + escapeHTML(meta.hit) + "</span>");
    }
    if (meta.attribute) {
      badges.push('<span class="destiny_priority_badge destiny_priority_badge--attribute"><span data-i18n="catalog.operator.badge.attr">Attr</span> ' + escapeHTML(meta.attribute) + "</span>");
    }
    if (meta.endgameUnit) {
      badges.push('<span class="destiny_priority_badge destiny_priority_badge--unit">' +
        (meta.tradeOnly ? "★ " : "") + '<span data-i18n="catalog.operator.badge.endgame">End-game</span></span>');
    }

    return badges.length
      ? '<div class="destiny_priority_badges" aria-label="Operator priority" data-i18n-aria-label="catalog.operator.priorityHeading">' + badges.join("") + "</div>"
      : "";
  }

  function applyOperatorMetadata() {
    document.querySelectorAll(".destiny_item_slide").forEach((slide) => {
      const nameElement = slide.querySelector(".item_title .item_name") || slide.querySelector(".item_name");
      const inner = slide.querySelector(".item_inner");
      const title = slide.querySelector(".item_title");
      if (!nameElement || !inner || !title) return;

      const meta = getOperatorMeta(nameElement.textContent.trim());
      if (!meta) return;
      if (!inner.querySelector(".destiny_priority_badges")) {
        const host = document.createElement("div");
        host.innerHTML = operatorBadgeMarkup(meta.name);
        const badges = host.firstElementChild;
        if (badges) title.insertAdjacentElement("afterend", badges);
      }

      if (meta.hit) slide.dataset.hitPriority = meta.hit;
      if (meta.attribute) slide.dataset.attributePriority = meta.attribute;
      const overall = bestOverall(meta);
      if (overall) slide.dataset.overallRating = overall.score;
      if (meta.endgameUnit) slide.dataset.endgameUnit = "true";
    });
  }

  function mountOperatorPriorityOverview() {
    const container = document.querySelector(".destiny_item");
    const filters = container && container.querySelector(".destiny_item_filters");
    if (!container || !filters || container.querySelector(".destiny_priority_overview")) return;

    const ratedItems = (operatorData.items || []).filter((item) =>
      item.hit || item.attribute || (item.overall && item.overall.length) || item.endgameUnit
    ).length;
    const overview = document.createElement("aside");
    overview.className = "destiny_priority_overview";
    overview.setAttribute("aria-label", "Operator weapon priority and end-game ratings");
    overview.setAttribute("data-i18n-aria-label", "catalog.operator.aria");
    overview.innerHTML =
      '<div class="destiny_priority_overview_head">' +
        '<div><p class="destiny_priority_eyebrow" data-i18n="catalog.operator.eyebrow">OPERATOR CURATION</p>' +
        '<h2 data-i18n="catalog.operator.title">Weapon Priority &amp; End-game Rating</h2></div>' +
        '<time><span data-i18n="catalog.operator.lastUpdate">Last update:</span> ' + escapeHTML(operatorData.updatedAt || "10/11/2025") + "</time>" +
      "</div>" +
      '<div class="destiny_priority_overview_grid">' +
        '<div><strong data-i18n="catalog.operator.hitPriority">Hit% Priority</strong><span>S → C</span></div>' +
        '<div><strong data-i18n="catalog.operator.attributePriority">Attribute% Priority</strong><span>S → C</span></div>' +
        '<div><strong data-i18n="catalog.operator.overallRating">Overall Rating</strong><span>10 / 9.5 / 9.0</span></div>' +
        '<div><strong data-i18n="catalog.operator.ratedItems">Rated items</strong><span>' + escapeHTML(ratedItems) + ' <span data-i18n="catalog.operator.entries">entries</span></span></div>' +
      "</div>" +
      '<p class="destiny_priority_overview_note"><span data-i18n="catalog.operator.overviewNote">Open a rated item to see its exact priorities and required buff setup.</span> ' +
        '<span data-i18n="catalog.operator.legendCondition">' + escapeHTML(operatorData.legend?.condition || "") + '</span> ' +
        '<span data-i18n="catalog.operator.legendTrade">' + escapeHTML(operatorData.legend?.trade || "") + "</span></p>" +
      ((operatorData.legend?.genericUnits || []).length
        ? '<p class="destiny_priority_generic"><strong data-i18n="catalog.operator.genericUnits">Generic end-game unit entries:</strong> ' +
          (operatorData.legend.genericUnits || []).map(escapeHTML).join(" · ") + "</p>"
        : "");

    filters.insertAdjacentElement("afterend", overview);
  }

  function createCatalogCard(item) {
    const slide = document.createElement("div");
    slide.className = "swiper-slide destiny_item_slide destiny_catalog_card";

    const comboPattern = /\b(hits?|shots?|combo)\b|\d\s*[–-]\s*\d\s*[–-]\s*\d/i;
    const previewEntries = item.stats.slice(0, 4);
    const comboEntry = item.stats.find((entry) => comboPattern.test(entry.join(" ")));
    if (comboEntry && !previewEntries.includes(comboEntry)) previewEntries.push(comboEntry);

    // 라벨만 data-i18n 으로 감싼다. 값은 게임 수치라 번역을 거치지 않는다.
    // t() 로 미리 넣으면 사전이 늦게 도착할 때 영어로 굳는다.
    const previewStats = previewEntries
      .map((entry) =>
        '<p class="item_info"><span data-i18n="' + escapeHTML(statKey(entry[0])) + '">' +
        escapeHTML(entry[0]) + "</span>: " + escapeHTML(entry[1]) + "</p>")
      .join("");
    const combatRefs = (item.combat || []).map((_en, i) => proseRef(item, "combat", i));
    const comboDetails = combatRefs.filter((d) => comboPattern.test(d.en)).slice(0, 3);
    const previewDetails = comboDetails.length
      ? comboDetails
      : [combatRefs[0]
          || ((item.obtain || [])[0] ? proseRef(item, "obtain", 0) : null)
          || { key: "cat." + item.id + ".summary", en: item.summary || "" }];
    const authenticImage = hasAuthenticImage(item);
    const cardImage = authenticImage ? item.image : FALLBACK_IMAGE;
    const cardImageFit = authenticImage
      ? (item.cardImageFit || item.imageFit || "cover")
      : "cover";
    const cardImagePosition = authenticImage
      ? (item.cardImagePosition || item.imagePosition || "center center")
      : "center center";
    const cardImageFilter = authenticImage ? (item.imageFilter || "none") : "none";
    const imageMarkup =
      '<img class="destiny_catalog_card_image' + (authenticImage ? '' : ' destiny_catalog_fallback_image') +
      '" src="' + escapeHTML(cardImage) + '" alt="' + (authenticImage ? escapeHTML(item.name) : '') +
      '" style="object-fit:' + escapeHTML(cardImageFit) +
      ';object-position:' + escapeHTML(cardImagePosition) +
      ';filter:' + escapeHTML(cardImageFilter) + '">';

    slide.innerHTML =
      '<button type="button" class="item_section_aria" data-catalog-id="' + escapeHTML(item.id) + '">' +
        '<div class="item_inner">' +
          '<div class="item_img destiny_catalog_image">' +
            imageMarkup +
            '<span class="item_type">' + escapeHTML(item.type) + "</span>" +
          "</div>" +
          '<h4 class="item_title"><span class="item_name">' + escapeHTML(item.name) + "</span></h4>" +
          operatorBadgeMarkup(item.name) +
          previewStats +
          previewDetails.map((d) => '<p class="item_detail"' + (d.key ? ' data-i18n="' + escapeHTML(d.key) + '"' : "") + ">" + escapeHTML(d.en) + "</p>").join("") +
          '<span class="destiny_card_open_hint" data-i18n="catalog.card.hint">Click for full details</span>' +
        "</div>" +
      "</button>";

    return slide;
  }

  function appendCardsToExistingSections() {
    ["common", "hunter", "ranger", "force", "unit"].forEach((section) => {
      const swiperKey = section === "unit" ? "units" : section;
      const wrapper = document.querySelector('[data-destiny-swiper="' + swiperKey + '"] .swiper-wrapper');
      if (!wrapper) return;

      // The original HTML still owns a number of hand-authored cards. Do not
      // append a catalog version of the same item (VENUS BOW used to appear
      // twice, including an obsolete red-box preview).
      const existingNames = new Set(
        Array.from(wrapper.querySelectorAll(".item_name"))
          .map((element) => normalizeName(element.textContent))
          .filter(Boolean)
      );

      catalogItems
        .filter((item) => item.section === section && item.displayCard !== false)
        .filter((item) => !existingNames.has(normalizeName(item.name)))
        .forEach((item) => {
          wrapper.appendChild(createCatalogCard(item));
          existingNames.add(normalizeName(item.name));
        });
    });
  }

  function createNewSection(section) {
    const items = catalogItems.filter((item) => item.section === section && item.displayCard !== false);
    if (!items.length) return null;

    const meta = sectionLabels[section];
    const block = document.createElement("div");
    block.className = "destiny_item_block destiny_catalog_block";
    block.id = "destiny-" + section;
    block.dataset.category = section;
    block.innerHTML =
      '<header class="destiny_item_header">' +
        '<h3 class="destiny_item_title">' + escapeHTML(meta.title) +
          ' <span class="destiny_item_sub" data-i18n="' + escapeHTML(meta.subtitleKey) + '">' + escapeHTML(meta.subtitle) + "</span>" +
        "</h3>" +
        '<p class="destiny_item_desc" data-i18n="' + escapeHTML(meta.descriptionKey) + '">' + escapeHTML(meta.description) + "</p>" +
      "</header>" +
      '<div class="swiper destiny_item_swiper" data-destiny-swiper="' + escapeHTML(section) + '">' +
        '<div class="swiper-wrapper"></div>' +
        '<div class="destiny_item_pagination"><div class="swiper-pagination" data-destiny-pagination="' + escapeHTML(section) + '"></div></div>' +
      "</div>";

    const wrapper = block.querySelector(".swiper-wrapper");
    items.forEach((item) => wrapper.appendChild(createCatalogCard(item)));
    return block;
  }

  function mountCatalogSections() {
    appendCardsToExistingSections();

    const unitBlock = document.getElementById("destiny-units");
    const container = document.querySelector(".destiny_item");
    if (!container) return;

    ["armor", "shield"].forEach((section) => {
      const block = createNewSection(section);
      if (!block) return;
      if (unitBlock) container.insertBefore(block, unitBlock);
      else container.appendChild(block);
    });
  }

  function assignBlockCategories() {
    const categoryMap = {
      "destiny-Common": "common",
      "destiny-hunter": "hunter",
      "destiny-ranger": "ranger",
      "destiny-force": "force",
      "destiny-armor": "armor",
      "destiny-units": "unit",
      "destiny-shield": "shield"
    };

    Object.entries(categoryMap).forEach(([id, category]) => {
      const block = document.getElementById(id);
      if (block) block.dataset.category = category;
    });
  }

  function initFilters() {
    const buttons = Array.from(document.querySelectorAll("[data-destiny-filter]"));
    if (!buttons.length) return;

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.destinyFilter;
        buttons.forEach((candidate) => {
          const active = candidate === button;
          candidate.classList.toggle("is-active", active);
          candidate.setAttribute("aria-pressed", String(active));
        });

        document.querySelectorAll(".destiny_item_block").forEach((block) => {
          block.hidden = filter !== "all" && block.dataset.category !== filter;
        });

        window.requestAnimationFrame(() => {
          document.querySelectorAll(".destiny_item_swiper").forEach((swiperElement) => {
            if (swiperElement.swiper) swiperElement.swiper.update();
          });
        });
      });
    });
  }

  function readExistingCard(card) {
    const nameElement = card.querySelector(".item_title .item_name") || card.querySelector(".item_name");
    const name = nameElement ? nameElement.textContent.trim() : "Destiny Item";
    const matchingCatalogItem = catalogByName.get(normalizeName(name));
    if (matchingCatalogItem) return matchingCatalogItem;

    const block = card.closest(".destiny_item_block");
    const category = block ? block.dataset.category || "common" : "common";
    const typeElement = card.querySelector(".item_type");
    const imageElement = card.querySelector(".item_img img");
    const info = Array.from(card.querySelectorAll(".item_info"))
      .map((element) => element.textContent.trim())
      .filter(Boolean);
    const details = Array.from(card.querySelectorAll(".item_detail"))
      .map((element) => element.textContent.trim())
      .filter(Boolean);

    return {
      id: "existing-" + normalizeName(name).toLowerCase().replace(/\s+/g, "-"),
      name,
      category: category.charAt(0).toUpperCase() + category.slice(1),
      type: typeElement ? typeElement.textContent.trim() : "Item",
      image: imageElement ? imageElement.getAttribute("src") : "",
      imagePosition: "center center",
      // 모든 정적 카드가 공유하는 고정 문구다. 아이템별 키로 만들면 사전과 맞지 않는다.
      summary: "Expanded view of the information currently shown on this Destiny Items card.",
      summaryKey: "catalog.existing.summary",
      stats: info.map((line) => ["Info", line]),
      requirements: [],
      combat: details,
      obtain: [
        "A specific drop or crafting route is not listed on the current card."
      ],
      obtainKeys: ["catalog.existing.obtain"],
      required: []
    };
  }

  function renderDefinitionList(entries) {
    return entries.map((entry) =>
      "<div><dt>" + escapeHTML(statLabel(entry[0])) + "</dt><dd>" + escapeHTML(entry[1]) + "</dd></div>"
    ).join("");
  }

  function renderSection(title, values) {
    if (!values || !values.length) return "";
    return '<section class="destiny_detail_section">' +
      "<h3>" + escapeHTML(title) + "</h3>" +
      "<ul>" + values.map((value) => "<li>" + escapeHTML(value) + "</li>").join("") + "</ul>" +
    "</section>";
  }

  function renderOperatorSection(meta) {
    if (!meta) return "";
    const rows = [];
    if (meta.hit) rows.push([t("catalog.operator.hitPriority", "Hit% priority"), meta.hit]);
    if (meta.attribute) rows.push([t("catalog.operator.attributePriority", "Attribute% priority"), meta.attribute]);
    if (meta.endgameUnit) rows.push([
      t("catalog.operator.endgameUnit", "End-game unit"),
      t("catalog.operator.recommended", "Recommended")
    ]);

    const overall = (meta.overall || []).slice().sort((a, b) => scoreValue(b.score) - scoreValue(a.score));
    const overallMarkup = overall.length
      ? '<ul class="destiny_operator_ratings">' + overall.map((rating) =>
          '<li><strong>' + escapeHTML(rating.score) + "</strong>" +
          '<span>' + escapeHTML(operatorCategoryLabel(rating.category)) +
          (rating.condition ? " · " + escapeHTML(t("catalog.operator.requires", "Requires")) + " " + escapeHTML(operatorConditionLabel(rating.condition)) : "") + "</span></li>"
        ).join("") + "</ul>"
      : "";

    return '<section class="destiny_detail_section destiny_operator_section">' +
      '<div class="destiny_operator_heading"><h3>' + escapeHTML(t("catalog.operator.priorityHeading", "Operator priority")) + "</h3>" +
      '<span>' + escapeHTML(t("catalog.operator.updated", "Updated")) + " " + escapeHTML(operatorData.updatedAt || "10/11/2025") + "</span></div>" +
      (rows.length ? '<dl class="destiny_operator_stats">' + rows.map((row) =>
        '<div><dt>' + escapeHTML(row[0]) + "</dt><dd>" + escapeHTML(row[1]) + "</dd></div>"
      ).join("") + "</dl>" : "") +
      overallMarkup +
      (meta.tradeOnly ? '<p class="destiny_operator_note">' + escapeHTML(t("catalog.operator.noteTradeOnly", "★ Obtainable from the Trade NPC only.")) + "</p>" : "") +
      (overall.some((rating) => rating.condition)
        ? '<p class="destiny_operator_note">' + escapeHTML(t("catalog.operator.noteCondition", "* This rating requires the setup shown above.")) + "</p>"
        : "") +
    "</section>";
  }

  function initDetailModal() {
    const modal = document.getElementById("destinyDetailModal");
    if (!modal) return;

    const closeButton = modal.querySelector(".destiny_detail_close");
    const titleElement = modal.querySelector(".destiny_detail_title");
    const summaryElement = modal.querySelector(".destiny_detail_summary");
    const badgeElement = modal.querySelector(".destiny_detail_badges");
    const statsElement = modal.querySelector(".destiny_detail_stats");
    const sectionsElement = modal.querySelector(".destiny_detail_sections");
    const imageElement = modal.querySelector(".destiny_detail_image");
    const imageLink = modal.querySelector(".destiny_detail_image_link");
    const imageHint = modal.querySelector(".destiny_detail_image_hint");
    const missingImageElement = modal.querySelector(".destiny_detail_missing_image");
    const mediaElement = modal.querySelector(".destiny_detail_media");
    let previousFocus = null;

    const closeModal = () => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("destiny-detail-open");
      if (previousFocus) previousFocus.focus();
    };

    const openModal = (item, trigger) => {
      previousFocus = trigger;
      const operatorMeta = getOperatorMeta(item.name);
      const operatorOverall = bestOverall(operatorMeta);
      titleElement.textContent = item.name;
      summaryElement.textContent = prose(item, "summary");
      badgeElement.innerHTML =
        '<span class="destiny_detail_badge">' + escapeHTML(item.category || "Item") + "</span>" +
        '<span class="destiny_detail_badge destiny_detail_badge--type">' + escapeHTML(item.type || "Item") + "</span>" +
        (operatorOverall ? '<span class="destiny_detail_badge destiny_detail_badge--operator">' +
          (operatorMeta.tradeOnly ? "★ " : "") + escapeHTML(operatorOverall.score) + "</span>" : "") +
        (operatorMeta?.endgameUnit ? '<span class="destiny_detail_badge destiny_detail_badge--operator">' +
          (operatorMeta.tradeOnly ? "★ " : "") + escapeHTML(t("catalog.operator.badge.endgame", "End-game")) + "</span>" : "");
      statsElement.innerHTML = renderDefinitionList(item.stats || []);
      sectionsElement.innerHTML =
        renderOperatorSection(operatorMeta) +
        renderSection(t("catalog.detail.combat", "Special, targets & bonuses"), proseList(item, "combat")) +
        renderSection(t("catalog.detail.obtain", "How to obtain"), proseList(item, "obtain")) +
        renderSection(t("catalog.detail.required", "Required items"), item.required || []) +
        renderSection(t("catalog.detail.notes", "Additional notes"), proseList(item, "notes"));

      if (hasAuthenticImage(item)) {
        imageElement.src = item.image;
        imageElement.alt = item.name + " " + t("catalog.detail.imageAlt", "source image");
        imageElement.style.objectPosition = item.imagePosition || "center top";
        imageElement.style.objectFit = item.imageFit || "contain";
        imageElement.style.filter = item.imageFilter || "none";
        mediaElement.classList.remove("is-missing");
        imageLink.href = item.image;
        imageLink.hidden = false;
        imageHint.hidden = false;
        missingImageElement.hidden = true;
      } else {
        imageElement.src = FALLBACK_IMAGE;
        imageElement.alt = "Rare item box placeholder";
        imageElement.style.objectPosition = "center center";
        imageElement.style.objectFit = "cover";
        imageElement.style.filter = "none";
        mediaElement.classList.remove("is-missing");
        imageLink.href = FALLBACK_IMAGE;
        imageLink.hidden = false;
        imageHint.hidden = true;
        missingImageElement.hidden = true;
      }

      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("destiny-detail-open");
      closeButton.focus();
    };

    document.querySelectorAll(".destiny_item_slide .item_section_aria").forEach((card) => {
      card.setAttribute("aria-haspopup", "dialog");
      if (card.tagName === "A") card.removeAttribute("href");
      if (card.tagName !== "BUTTON") {
        card.setAttribute("role", "button");
        card.setAttribute("tabindex", "0");
      }
    });

    document.addEventListener("click", (event) => {
      const card = event.target.closest(".destiny_item_slide .item_section_aria");
      if (!card) return;
      const swiper = card.closest(".destiny_item_swiper")?.swiper;
      if (event.defaultPrevented || (swiper && !swiper.allowClick)) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      const item = card.dataset.catalogId
        ? catalogById.get(card.dataset.catalogId)
        : readExistingCard(card);
      if (item) openModal(item, card);
    });

    document.addEventListener("keydown", (event) => {
      if ((event.key === "Enter" || event.key === " ") && event.target.matches('.destiny_item_slide .item_section_aria[role="button"]')) {
        event.preventDefault();
        const card = event.target;
        const item = card.dataset.catalogId
          ? catalogById.get(card.dataset.catalogId)
          : readExistingCard(card);
        if (item) openModal(item, card);
      }

      if (event.key === "Escape" && modal.classList.contains("is-open")) closeModal();
    });

    modal.querySelectorAll("[data-destiny-detail-close]").forEach((element) => {
      element.addEventListener("click", closeModal);
    });

    return { open: openModal, close: closeModal };
  }

  mountCatalogSections();
  assignBlockCategories();
  mountOperatorPriorityOverview();
  applyOperatorMetadata();
  initFilters();
  const detailModal = initDetailModal();

  // 다른 가이드 페이지도 아이템 도감과 동일한 상세창을 재사용할 수 있게 한다.
  window.DestinyItemCatalog = {
    normalizeName,
    findByName(name) {
      return catalogByName.get(normalizeName(name)) || null;
    },
    fromCard: readExistingCard,
    open(item, trigger) {
      if (detailModal && item) detailModal.open(item, trigger);
    },
    close() {
      if (detailModal) detailModal.close();
    },
    isOpen() {
      return Boolean(detailModal && document.getElementById("destinyDetailModal")?.classList.contains("is-open"));
    }
  };

  // 카드와 섹션 헤더는 이 스크립트가 만들기 때문에 i18n.js 의 첫 적용 대상에 없다.
  // 만든 뒤 한 번 hydrate 해 주면 이후 언어 변경은 i18n.js 가 알아서 처리한다.
  window.DestinyI18n?.hydrate(document.querySelector(".destiny_item") || document);
})();
