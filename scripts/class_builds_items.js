/* ==========================================================================
   클래스 빌드 장비 상세 팝업
   우선순위: Destiny Items 도감 -> 로컬 DB -> 빌드 카드 자체 정보
   ========================================================================== */
(function () {
    "use strict";

    var api = window.DestinyItemCatalog;
    if (!api) return;

    var RED_BOX = "./images/common/redbox.png";
    var DB_FILES = [1, 2, 3, 4, 5].map(function (id) {
        return "./data/database-" + id + ".json";
    });
    var activeRequest = 0;

    function t(key, fallback) {
        var i18n = window.DestinyI18n;
        return i18n && typeof i18n.t === "function" ? i18n.t(key, fallback) : fallback;
    }

    function normalize(value) {
        return api.normalizeName ? api.normalizeName(value) : String(value || "").toUpperCase().trim();
    }

    function cleanValue(value) {
        return value == null ? "" : String(value).trim();
    }

    function buildNotes(trigger) {
        var selector = trigger.classList.contains("cb_new_item")
            ? "p:not(.cb_chip_stat)"
            : ".cb_chip_note, .cb_chip_hint";
        return Array.from(trigger.querySelectorAll(selector))
            .map(function (node) { return node.textContent.trim(); })
            .filter(Boolean);
    }

    function triggerData(trigger) {
        return {
            name: trigger.dataset.itemName || "Item",
            dbName: trigger.dataset.dbName || trigger.dataset.itemName || "Item",
            category: trigger.dataset.itemCategory || "Item",
            stat: trigger.dataset.itemStat || "",
            notes: buildNotes(trigger)
        };
    }

    function fallbackItem(info, summary) {
        return {
            id: "build-" + normalize(info.name).toLowerCase().replace(/\s+/g, "-"),
            name: info.name,
            category: info.category || "Item",
            type: info.category ? info.category.replace(/s$/, "") : "Item",
            image: RED_BOX,
            imageFallback: true,
            imagePosition: "center center",
            imageFit: "contain",
            summary: summary || t(
                "ui.itemNoDatabase",
                "No detailed database entry was found. Showing the information recorded in this build."
            ),
            stats: info.stat ? [[t("ui.itemBuildStat", "Build summary"), info.stat]] : [],
            combat: [],
            obtain: [],
            required: [],
            notes: info.notes
        };
    }

    var guideCards = new Map();
    (window.DESTINY_GUIDE_CARDS || []).forEach(function (card) {
        var key = normalize(card.name);
        if (key && !guideCards.has(key)) guideCards.set(key, card);
    });

    var GUIDE_CATEGORIES = {
        "destiny-Common": "Common",
        "destiny-hunter": "Hunter",
        "destiny-ranger": "Ranger",
        "destiny-force": "Force",
        "destiny-armor": "Armor",
        "destiny-units": "Unit",
        "destiny-shield": "Shield"
    };

    function translatedDetail(detail) {
        var value = detail.key ? t(detail.key, detail.text) : detail.text;
        if (!detail.key) {
            (detail.labels || []).forEach(function (label) {
                value = value.replace(label.text, t(label.key, label.text));
            });
        }
        return value;
    }

    function guideStats(lines) {
        return (lines || []).map(function (line) {
            var splitAt = line.indexOf(":");
            if (splitAt < 0) return ["Info", line];
            return [line.slice(0, splitAt).trim(), line.slice(splitAt + 1).trim()];
        });
    }

    function guideItem(card) {
        return {
            id: "guide-" + normalize(card.name).toLowerCase().replace(/\s+/g, "-"),
            name: card.name,
            category: GUIDE_CATEGORIES[card.category] || "Item",
            type: card.type || "Item",
            image: card.image || "",
            imagePosition: "center center",
            imageFit: "contain",
            summary: t(
                "catalog.existing.summary",
                "Expanded view of the information currently shown on this Destiny Items card."
            ),
            stats: guideStats(card.info),
            combat: (card.details || []).map(translatedDetail),
            obtain: [t(
                "catalog.existing.obtain",
                "A specific drop or crafting route is not listed on the current card."
            )],
            required: [],
            notes: []
        };
    }

    function guideRecord(info) {
        return guideCards.get(normalize(info.name)) || guideCards.get(normalize(info.dbName)) || null;
    }

    var databasePromise = Promise.all(DB_FILES.map(function (path) {
        return fetch(path)
            .then(function (response) {
                if (!response.ok) throw new Error("Database request failed");
                return response.json();
            })
            .catch(function () { return null; });
    })).then(function (payloads) {
        var byCategory = new Map();
        var all = new Map();

        payloads.filter(Boolean).forEach(function (payload) {
            var rows = new Map();
            (payload.rows || []).forEach(function (row) {
                var key = normalize(row.Name);
                if (!key) return;
                if (!rows.has(key)) rows.set(key, row);
                if (!all.has(key)) all.set(key, { payload: payload, row: row });
            });
            byCategory.set(normalize(payload.name), { payload: payload, rows: rows });
        });

        return { byCategory: byCategory, all: all };
    });

    function databaseRecord(index, info) {
        var names = [info.dbName, info.name].map(normalize).filter(Boolean);
        var category = index.byCategory.get(normalize(info.category));
        var found = null;

        if (category) {
            names.some(function (name) {
                var row = category.rows.get(name);
                if (!row) return false;
                found = { payload: category.payload, row: row };
                return true;
            });
        }

        if (!found) {
            names.some(function (name) {
                found = index.all.get(name) || null;
                return Boolean(found);
            });
        }
        return found;
    }

    function databaseItem(record, info) {
        var payload = record.payload;
        var row = record.row;
        var ignored = { Name: true, Type: true, Description: true, Notes: true, Boosts: true };
        var stats = (payload.fields || Object.keys(row))
            .filter(function (field) { return !ignored[field]; })
            .map(function (field) { return [field, cleanValue(row[field])]; })
            .filter(function (entry) { return entry[1] !== ""; });

        var notes = [];
        if (cleanValue(row.Notes)) notes.push(cleanValue(row.Notes));
        info.notes.forEach(function (note) {
            if (notes.indexOf(note) < 0) notes.push(note);
        });

        var combat = [];
        var boosts = cleanValue(row.Boosts);
        if (boosts && boosts.toLowerCase() !== "none") combat.push(boosts);

        return {
            id: "database-" + normalize(payload.name + " " + row.Name).toLowerCase().replace(/\s+/g, "-"),
            name: row.Name || info.name,
            category: payload.name || info.category || "Item",
            type: row.Type || (payload.name || "Item").replace(/s$/, ""),
            image: RED_BOX,
            imageFallback: true,
            imagePosition: "center center",
            imageFit: "contain",
            summary: cleanValue(row.Description) || t(
                "ui.itemNoDatabase",
                "No detailed database entry was found. Showing the information recorded in this build."
            ),
            stats: stats,
            combat: combat,
            obtain: [],
            required: [],
            notes: notes
        };
    }

    function catalogItem(info) {
        return api.findByName(info.name) || api.findByName(info.dbName);
    }

    function resolveItem(info) {
        var direct = catalogItem(info);
        if (direct) return Promise.resolve(direct);

        var guide = guideRecord(info);
        if (guide) return Promise.resolve(guideItem(guide));

        return databasePromise.then(function (db) {
            var record = databaseRecord(db, info);
            return record ? databaseItem(record, info) : fallbackItem(info);
        });
    }

    // 페이지가 그려지는 동안 로컬 DB 를 미리 읽어 첫 클릭의 대기 시간을 줄인다.
    databasePromise.catch(function () {});

    document.addEventListener("click", function (event) {
        var trigger = event.target.closest && event.target.closest("[data-build-item]");
        if (!trigger) return;
        event.preventDefault();

        var info = triggerData(trigger);
        var direct = catalogItem(info);
        if (direct) {
            activeRequest += 1;
            api.open(direct, trigger);
            return;
        }

        var guide = guideRecord(info);
        if (guide) {
            activeRequest += 1;
            api.open(guideItem(guide), trigger);
            return;
        }

        var request = ++activeRequest;
        api.open(fallbackItem(info, t("ui.itemLoading", "Loading item details...")), trigger);
        resolveItem(info).then(function (item) {
            if (request === activeRequest && api.isOpen()) api.open(item, trigger);
        }).catch(function () {
            if (request === activeRequest && api.isOpen()) api.open(fallbackItem(info), trigger);
        });
    });
})();
