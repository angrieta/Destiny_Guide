/* 초보자 진행은 레벨 제한과 파밍 난도를 분리한다. 원문 엔드게임 데이터는 그대로 둔다. */
(function () {
    "use strict";
    var data = window.DESTINY_LEVELING;
    Object.assign(data.ui, window.DESTINY_REVISION_COPY);
    function unit(name, effect, section, enemy, rate, area, tip, extra) {
        return Object.assign({name: name, dbName: name, cat: "Units", exactItem: true,
            roleKey: "b2.unit", effect: effect, difficulty: "Very Hard", episode: "EP4",
            section: section, enemy: enemy, rate: rate, area: area, tipKey: tip}, extra || {});
    }
    Object.assign(data.routes, {
        v101: unit("V101", "Attack speed +40%; ATP/DFP/EVP/LCK +15", "Viridia / Purplenum / Oran / Yellowboze / Whitill", "Zu", "1/393.85", "Crater / Subterranean Desert", "b2.v101"),
        heavenlyBattle: unit("Heavenly/Battle", "Attack speed +40%", "Greenill", "Pazuzu", "1/3.2", "Crater / Subterranean Desert", "b2.heavenlyBattle", {rare: true}),
        v801: unit("V801", "Technique cast speed +30%; MST +5", "Bluefull / Pinkal", "Astark", "1/370.68", "Crater", "b2.v801"),
        v501: unit("V501", "Freeze / Paralyze / Confuse / Hell +50%", "Bluefull / Oran", "Merissa A", "1/237.04", "Subterranean Desert", "b2.v501"),
        v502: unit("V502", "Freeze / Paralyze / Confuse +50%; Hell +100%", "Redria", "Garanz", "1/370.68", "Mines", "b2.v502", {episode:"EP1"}),
        heavenlyArms: unit("Heavenly/Arms", "ATA +25", "Viridia / Greenill / Skyly / Bluefull / Purplenum / Pinkal / Redria / Oran / Whitill", "De Rol Le", "1/16", "Caves", "b2.arms", {episode:"EP1"}),
        smartlink: unit("SMARTLINK", "Hunter / Force ranged ATA", "Oran", "Garanz", "1/370.68", "Mines", "b2.smartlink", {episode:"EP1"}),
        v503: unit("V503", "Freeze / Paralyze / Confuse / Hell +100%; Smartlink", "Pinkal / Redria", "Goran Detonator", "1/975.24", "Subterranean Desert", "b2.v503", {difficulty:"Ultimate"}),
        immortalBattle: unit("Immortal/Battle", "Attack speed +120%", "Bluefull / Purplenum", "Saint Million", "1/73.14", "Subterranean Desert", "b2.immortalBattle", {difficulty:"Ultimate"}),
        maintenance: unit("State/Maintenance", "Cures All", "Oran", "Gal Gryphon", "1/102.4", "Central Control Area", "b2.maintenance", {difficulty:"Ultimate", episode:"EP2"}),
        pbFlow: unit("PB/Flow", "PB +1 / 5 sec", "Whitill", "Vol Opt ver. 2", "1/102.4", "Mines", "b2.pbFlow", {difficulty:"Ultimate", episode:"EP1"})
    });
    data.routes.graveDigger.section = "Bluefull";
    data.routes.graveDigger.enemy = "Goran Detonator";
    data.routes.graveDigger.rate = "1/1800.44";
    data.routes.graveDigger.area = "Subterranean Desert";
    data.routes.graveDigger.quest = "Mop Up Operation 3";
    data.routes.graveDigger.tipKey = "b2.graveDigger";
    data.routes.rainbowShield.area = "Subterranean Desert";
    data.routes.motherGarb.required = "LV 101";
    data.routes.primalNexus.required = "LV 200";
    data.routes.vjaya.effect = "Charge";
    data.routes.v802.effect = "Technique cast speed +100%; MST +80";
    data.routes.v802.tipKey = "b2.v802";
    data.routes.cureUnits.tipKey = "b2.cure";
    data.routes.bluePhantom.tipKey = "b2.bluePhantom";
    data.routes.frozenShooter.rare = true;
    data.routes.cureUnits.rare = true;
    ["v101","heavenlyBattle","immortalBattle"].forEach(function (id) {
        data.routes[id].effectKey = "b2.speedEffect";
        data.routes[id].effect = data.routes[id].effect.replace("Attack speed ","");
    });
    ["v801","v802"].forEach(function (id) {
        data.routes[id].effectKey = "b2.castEffect";
        data.routes[id].effect = data.routes[id].effect.replace("Technique cast speed ","");
    });
    ["v501","v502","v503"].forEach(function (id) { data.routes[id].effectKey = "b2.specialEffect"; });
    data.routes.smartlink.effect = "HU / FO · ATA";

    function stage(level, family, equip, farm, units) {
        return {level:level, summaryKey:"b2." + family + level, equip:equip, farm:farm,
            units:units, endgame:level === 200};
    }
    data.families = {
        HU: [
            stage(100,"hu",["chargeHandgun","chargeCalibur","starterEventGear"],["vjaya","heavenlyArms","v101","heavenlyBattle"],"b2.slotsHu100"),
            stage(150,"hu",["vjaya","chargeMechguns","v101","heavenlyArms"],["cureUnits","smartlink","v501","rainbowShield","yunchang"],"b2.slotsHu150"),
            stage(180,"hu",["vjaya","chargeMechguns","v101","rainbowShield"],["v502","bluePhantom","maintenance","twinCyclone"],"b2.slotsHu180"),
            stage(200,"hu",["vjaya","chargeMechguns","v101","bluePhantom"],["immortalBattle","v503","pbFlow","twinCyclone"],"b2.slotsHu200")
        ],
        RA: [
            stage(100,"ra",["chargeVulcans","chargeArms","rangerWall"],["heavenlyArms","v101","heavenlyBattle","cureUnits"],"b2.slotsRa100"),
            stage(150,"ra",["chargeVulcans","chargeArms","v101","heavenlyArms"],["frozenShooter","tormentor","v501","v502","rainbowShield"],"b2.slotsRa150"),
            stage(180,"ra",["frozenShooter","tormentor","chargeVulcans","v502"],["bluePhantom","maintenance","graveDigger","typeShotHell"],"b2.slotsRa180"),
            stage(200,"ra",["frozenShooter","tormentor","chargeVulcans","bluePhantom"],["immortalBattle","graveDigger","v503","arrestNeedle"],"b2.slotsRa200")
        ],
        FO: [
            stage(100,"fo",["mindMag","techDisks"],["v801","cureUnits","motherGarb"],"b2.slotsFo100"),
            stage(150,"fo",["v801","mindMag","motherGarb","techDisks"],["glideDivine","threeSeals","psychoWand"],"b2.slotsFo150"),
            stage(180,"fo",["v801","motherGarb","psychoWand","threeSeals"],["v802","maintenance","primalNexus"],"b2.slotsFo180"),
            stage(200,"fo",["v802","motherGarb","psychoWand","threeSeals"],["primalNexus","skyfall","darkBridge"],"b2.slotsFo200")
        ]
    };
    // 인간 HU/RA의 지원 테크닉용 선택지. 안드로이드에는 표시하지 않는다.
    data.classExtras = {
        humar: ["v801"], hunewearl: ["v801"], ramar: ["v801"], ramarl: ["v801"],
        fomar: ["v101","smartlink","v502"], fomarl: ["v101","smartlink","v502"]
    };
})();
