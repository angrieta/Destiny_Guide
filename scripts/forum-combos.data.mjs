/**
 * 원작 PSOBB + Destiny 서버의 조합 목록.
 *
 * 출처: playpso 포럼 topic/804 "List of Item Combinations" (Vapid Dominance 작성,
 * Orgodemirk 가 머지 계열 18개 보완, VEL(JP) 갱신). 손으로 옮긴 자료다.
 * destiny_catalog.js 는 서버 자체 아이템의 재료 목록만 갖고 있어서 이쪽이 빈칸이었다.
 *
 * 규칙 두 가지가 목록 전체에 걸린다.
 *   - 조합하려면 재료가 전부 최대 그라인드여야 한다.
 *   - 레벨 조건은 그 계열의 최상위 무기 기준이다 (Arms, Calibur, Striker 등).
 *
 * note 는 포럼에 적힌 개조 내용만 옮겼다. 포럼에서 굵게 표시한 "서버 전용 / 개조됨"
 * 표시는 붙여넣기 과정에서 사라져 복원하지 않았다. 추측으로 채우지 않는다.
 */

export const FORUM_COMBO_GROUPS = [
  {
    key: "weapon",
    label: "Weapons",
    combos: [
      { result: "Dark Flow", parts: ["Sword series", 'Parasitic Gene "Flow"'], level: 140, note: "Combo unlocked, buffed ATP, and the special attack keeps its swing damage." },
      { result: "Dark Meteor", parts: ["Shot series", 'Parasitic Gene "Flow"'], level: 140, note: "Combo unlocked, buffed ATP, and Normal and Heavy fire 7 bullets instead of 5." },
      { result: "Dark Bridge", parts: ["Rod series", 'Parasitic Gene "Flow"'], level: 130, note: "Supports every RA technique and Grants; the special casts Grants Lv22 three times." },
      { result: "Lavis Blade", parts: ["Lavis Cannon", "Syncesta"], level: 100 },
      { result: "Double Cannon", parts: ["Lavis Blade", "Syncesta"], level: 100 },
      { result: "Lavis Cannon", parts: ["Double Cannon", "Syncesta"], level: 100 },
      { result: "Ultimate Double Cannon", parts: ["Double Cannon", "Dark Matter"] },
      { result: "Nightmare", parts: ["Yamigarisu", "Dark Matter"] },
      { result: "Hell Needle", parts: ["Spread Needle", "Dark Matter"] },
      { result: "Iron Faust", parts: ["Panzer Faust", "Photon Booster"], note: "Combo unlocked and every RA class can equip it." },
      { result: "Burning Visit", parts: ["Flame Visit", "Photon Booster"] },
      { result: "Snow Queen", parts: ["Frozen Shooter", "Photon Booster"] },
      { result: "Power Maser", parts: ["Maser Beam", "Photon Booster"] },
      { result: "Egg Blaster", parts: ["Handgun series", "Parts of Egg Blaster"], level: 90 },
      { result: "Final Egg Blaster", parts: ["Egg Blaster", "Dr. Robotnik's Plan B"] },
      { result: "Arrest Needle", parts: ["Spread Needle", "Proof of Sonic Team"] },
      { result: "Summit Moon", parts: ["Cane series", 'Magic Rock "Moola"'], level: 130 },
      { result: "Magical Piece", parts: ["Wand series", 'Magic Rock "Heart Key"'], level: 130 },
      { result: "Sweetheart", parts: ["Love Heart", 'Magic Rock "Heart Key"'], level: 131, only: "female" },
      { result: "Rainbow Baton", parts: ["Slicer series", 'Magic Stone "Iritista"'], level: 140 },
      { result: "Black King Bar", parts: ["Monkey King Bar", "Blue-Black Stone"], level: 100 },
      { result: "Plantain Huge Fan", parts: ["Fatsia", "Magic Water"], level: 100 },
      { result: "Plantain Fan", parts: ["Plantain Leaf", "Magic Water"], level: 100 },
      { result: "Twinkle Star", parts: ["Wand series", "Star Amplifier"], level: 130 },
      { result: "S-Berrill's Hands #1", parts: ["S-Berrill's Hands #0", "Berill Photon"] },
      { result: "Sange & Yasha", parts: ["Sange", "Yasha"], level: 100 },
      { result: "Dancing Hitogata", parts: ["Hitogata", "Book of Hitogata"], level: 100 },
      { result: "Guld Milla", parts: ["Handgun: Guld", "Handgun: Milla"], level: 100 },
      { result: "Mille Marteaux", parts: ["Heaven Punisher", "Ophelie Seize"], level: 100 },
      { result: "Jizai", parts: ["Shouren", "Guren"] },
      { result: "Arctic Faust", parts: ["Iron Faust", "Cryo Warhead"], level: 200 },
      { result: "Celestial Fusion", parts: ["Taste of Affection", "Passion Haze"], note: "Either order works." },
      { result: "Dual Bird", parts: ["Master Raven", "Last Swan"] },
      { result: "Striker of Chao", parts: ["Branch of Paku Paku", "Chao (Mag)"], level: 100 },
    ],
  },
  {
    key: "armor",
    label: "Armor / Shield",
    combos: [
      { result: "Behemoth Armor", parts: ["Spirit Garment", "Dark Matter"] },
      { result: "Brightness Circle", parts: ["Spirit Garment", "Star Amplifier"], level: 111 },
      { result: "Aura Field", parts: ["Spirit Garment", 'Magic Rock "Moola"'], level: 152, only: "no casts" },
      { result: "Love Heart", parts: ["Spirit Garment", 'Magic Rock "Heart Key"'], level: 131, only: "female" },
      { result: "Safety Heart", parts: ["Invisible Guard", 'Magic Rock "Heart Key"'], level: 123, only: "female" },
      { result: "Parasite Wear: De Rol", parts: ["Stink Frame", "Parasitic Cell Type D"], level: 54, only: "no casts" },
      { result: "Parasite Wear: Nelgal", parts: ["Parasite Wear: De Rol", "Parasitic Cell Type D"], level: 66, only: "no casts" },
      { result: "Parasite Wear: Vajulla", parts: ["Parasite Wear: Nelgal", "Parasitic Cell Type D"], level: 89, only: "no casts" },
      { result: "Virus Armor: Lafuteria", parts: ["Parasite Wear: Vajulla", "Parasitic Cell Type D"], level: 156, only: "no casts" },
      { result: "Foie Merge", parts: ["Red Barrier", "Amplifier of Foie"], level: 6 },
      { result: "Zonde Merge", parts: ["Yellow Barrier", "Amplifier of Zonde"], level: 6 },
      { result: "Barta Merge", parts: ["Blue Barrier", "Amplifier of Barta"], level: 6 },
      { result: "Gifoie Merge", parts: ["Red Barrier", "Amplifier of Gifoie"], level: 12 },
      { result: "Gizonde Merge", parts: ["Yellow Barrier", "Amplifier of Gizonde"], level: 12 },
      { result: "Gibarta Merge", parts: ["Blue Barrier", "Amplifier of Gibarta"], level: 12 },
      { result: "Rafoie Merge", parts: ["Red Barrier", "Amplifier of Rafoie"], level: 18 },
      { result: "Razonde Merge", parts: ["Yellow Barrier", "Amplifier of Razonde"], level: 18 },
      { result: "Rabarta Merge", parts: ["Blue Barrier", "Amplifier of Rabarta"], level: 18 },
      { result: "Red Merge", parts: ["Red Barrier", "Amplifier of Red"], level: 24 },
      { result: "Yellow Merge", parts: ["Yellow Barrier", "Amplifier of Yellow"], level: 24 },
      { result: "Blue Merge", parts: ["Blue Barrier", "Amplifier of Blue"], level: 24 },
      { result: "Shifta Merge", parts: ["Assist Barrier", "Amplifier of Shifta"], level: 16 },
      { result: "Deband Merge", parts: ["Assist Barrier", "Amplifier of Deband"], level: 16 },
      { result: "Resta Merge", parts: ["Recovery Barrier", "Amplifier of Resta"], level: 11 },
      { result: "Anti Merge", parts: ["Recovery Barrier", "Amplifier of Anti"], level: 13 },
    ],
  },
  {
    key: "cosmetic",
    label: "Cosmetics",
    serverOnly: true,
    combos: [
      { result: "Nefarious Needle", parts: ["Orb of Illusions", "Grave Digger"] },
      { result: "Evil Aura", parts: ["Orb of Illusions", "Behemoth Armor"] },
      { result: "Lavis Storm", parts: ["Orb of Illusions", "Ultimate Double Cannon"], only: "HUmar / HUnewearl" },
      { result: "Double Fury", parts: ["Orb of Illusions", "Ultimate Double Cannon"], only: "HUcast / HUcaseal" },
      { result: "Hellfire Shield", parts: ["Orb of Illusions", "Cataclysm Shield"] },
      { result: "Profound Darkness", parts: ["Orb of Illusions", "Three Seals"] },
      { result: "Astral Halo", parts: ["Orb of Illusions", "Astral Wings"] },
      { result: "Terror Sawd", parts: ["4th Anniversary Orb", "Rathalos Great Sword"], note: "Bigger model than the regular Chain Sawd." },
      { result: "Act of War", parts: ["4th Anniversary Orb", "Christmas Spirit"], note: "Alternative laser bullet." },
      { result: "Twin Executioner", parts: ["4th Anniversary Orb", "Storm Render"], note: "Alternative effect." },
      { result: "Astral Dragon", parts: ["Blueprint: Astral Dragon", "Final Egg Blaster"] },
    ],
  },
  {
    key: "mag",
    label: "Mags",
    serverOnly: true,
    combos: [
      { result: "Recon", parts: ["6th Anniversary Cell", "Kama"], only: "Mag Lv50+" },
      { result: "Dark Chao", parts: ["Heart of Dark Chao", "Non-rare Mag"], only: "Mag Lv50+" },
      { result: "Twin Wraith", parts: ["Pandora's Box", "Naga"], only: "Mag Lv50+" },
      { result: "NiGHTS", parts: ["Ideya Cell", "Non-rare Mag"], only: "Mag Lv50+" },
      { result: "Twin Sato", parts: ["A New Friend", "Sato"] },
      { result: "Coelum", parts: ["Dragon Tear", "Non-rare Mag"], only: "Mag Lv50+" },
      { result: "Gael Giel", parts: ["D-Photon Core", "Kama"], only: "Mag Lv50+", note: "Buffed activation rate and movement compared with the standard version." },
    ],
  },
];
