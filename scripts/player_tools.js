(function () {
    "use strict";

    var HH_DATA_URL = "./data/happy-hour.json";
    var HH_TIMEZONE_STORAGE_KEY = "destiny-guide-hh-time-zone";
    var HH_TIMEZONES = ["local", "Asia/Seoul", "Asia/Tokyo", "Europe/Madrid", "Europe/Paris", "Europe/London", "America/New_York", "America/Los_Angeles", "America/Mexico_City", "America/Sao_Paulo", "America/Argentina/Buenos_Aires", "Australia/Sydney", "Asia/Singapore"];
    var hhCycleMs = 15.5 * 60 * 60 * 1000;
    var hhDurationMs = 3 * 60 * 60 * 1000;
    var questData = [];
    var enemyNames = [];
    var hhAnchor = null;
    var hhData = null;
    var hhLoadState = "loading";
    var hhTimeZone = "local";
    var hhTimer = null;
    var hhRefreshTimer = null;

    function t(key, fallback) {
        return window.DestinyI18n ? window.DestinyI18n.t(key, fallback) : fallback;
    }

    function escapeHtml(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function normalize(value) {
        return String(value || "")
            .normalize("NFKD")
            .toLowerCase()
            .replace(/[’']/g, "")
            .replace(/[^a-z0-9]+/g, " ")
            .trim();
    }

    function questKey(name) {
        return normalize(String(name || "").replace(/\[EP[124]\]/gi, ""));
    }

    function parseQuestPage(html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var byKey = new Map();
        var eventPattern = /\[(Halloween|Easter|Summer|April Fool|Valentine|Anniversary|Xmas|Christmas)\]/i;

        doc.querySelectorAll("#difficulty .g_table tbody tr").forEach(function (row) {
            var cells = row.querySelectorAll("td");
            if (cells.length < 2) return;
            cells[1].textContent.split(/\s*·\s*/).forEach(function (entry) {
                var title = entry.trim();
                if (!title) return;
                var episodeMatch = title.match(/\[EP([124])\]/i);
                byKey.set(questKey(title), {
                    name: title,
                    episode: episodeMatch ? Number(episodeMatch[1]) : null,
                    eventOnly: eventPattern.test(title),
                    total: null,
                    enemies: []
                });
            });
        });

        doc.querySelectorAll("#monsters > .g_scroll .g_table tbody tr").forEach(function (row) {
            var cells = row.querySelectorAll("td");
            if (cells.length < 3) return;
            var quest = byKey.get(questKey(cells[0].textContent.trim()));
            if (!quest) return;
            quest.total = Number(cells[2].textContent.replace(/,/g, "")) || null;
        });

        doc.querySelectorAll("#monsters details.g_details").forEach(function (details) {
            var nameNode = details.querySelector("summary b");
            if (!nameNode) return;
            var quest = byKey.get(questKey(nameNode.textContent.trim()));
            if (!quest) return;
            var totalNode = details.querySelector("summary .g_dcount");
            if (totalNode) quest.total = Number(totalNode.textContent.replace(/,/g, "")) || quest.total;
            details.querySelectorAll("table tbody tr").forEach(function (row) {
                var cells = row.querySelectorAll("td");
                if (cells.length < 2) return;
                var name = cells[0].textContent.trim();
                var count = Number(cells[1].textContent.replace(/,/g, ""));
                if (name && Number.isFinite(count)) quest.enemies.push({ name: name, normalized: normalize(name), count: count });
            });
        });

        return Array.from(byKey.values()).filter(function (quest) { return quest.enemies.length > 0; });
    }

    function displayQuestName(name) {
        return String(name || "").replace(/\s*\[EP[124]\]/gi, "").trim();
    }

    function matchQuest(quest, query) {
        var matches = quest.enemies.filter(function (enemy) { return enemy.normalized.includes(query); });
        return {
            quest: quest,
            matches: matches,
            count: matches.reduce(function (sum, enemy) { return sum + enemy.count; }, 0)
        };
    }

    function renderEnemySuggestions() {
        var datalist = document.getElementById("enemy-options");
        datalist.innerHTML = enemyNames.map(function (name) { return '<option value="' + escapeHtml(name) + '"></option>'; }).join("");

        var preferred = ["Epsilon", "Del Lily", "Sinow Blue", "Ill Gill", "Dorphon", "Goran Detonator", "Zu", "Shambertin"];
        var exact = new Map(enemyNames.map(function (name) { return [normalize(name), name]; }));
        var visible = preferred.map(function (name) { return exact.get(normalize(name)); }).filter(Boolean).slice(0, 6);
        document.getElementById("enemy-suggestions").innerHTML = visible.map(function (name) {
            return '<button type="button" data-enemy="' + escapeHtml(name) + '">' + escapeHtml(name) + '</button>';
        }).join("");
    }

    function renderMonsterCounter() {
        if (!questData.length) return;
        var queryText = document.getElementById("quest-enemy").value.trim();
        var query = normalize(queryText);
        var episode = document.getElementById("quest-episode").value;
        var includeEvents = document.getElementById("quest-events").checked;
        var container = document.getElementById("quest-results");
        var summary = document.getElementById("quest-result-summary");
        var totalBadge = document.getElementById("quest-result-total");
        container.setAttribute("aria-busy", "false");

        if (!query) {
            summary.textContent = t("lab.t040", "Search for a monster to see quest counts.");
            totalBadge.hidden = true;
            container.innerHTML = '<div class="lab_empty"><h3>' + escapeHtml(t("lab.t041", "Enter a monster name")) + '</h3><p>' + escapeHtml(t("lab.t042", "Results show how many matching monsters appear in one run of each quest.")) + '</p></div>';
            return;
        }

        var results = questData
            .filter(function (quest) {
                if (!includeEvents && quest.eventOnly) return false;
                if (episode !== "all" && quest.episode !== Number(episode)) return false;
                return true;
            })
            .map(function (quest) { return matchQuest(quest, query); })
            .filter(function (entry) { return entry.count > 0; })
            .sort(function (a, b) { return b.count - a.count || (b.quest.total || 0) - (a.quest.total || 0); });

        var combinedTotal = results.reduce(function (sum, entry) { return sum + entry.count; }, 0);
        summary.textContent = t("lab.t043", "{name}: {quests} quests found")
            .replace("{name}", queryText)
            .replace("{quests}", results.length.toLocaleString());
        totalBadge.hidden = results.length === 0;
        totalBadge.textContent = t("lab.t044", "{count} total in one run of each quest").replace("{count}", combinedTotal.toLocaleString());

        if (!results.length) {
            container.innerHTML = '<div class="lab_empty"><h3>' + escapeHtml(t("lab.t045", "No registered quest contains this monster")) + '</h3><p>' + escapeHtml(t("lab.t046", "Try part of the name or include event-only quests.")) + '</p></div>';
            return;
        }

        container.innerHTML = results.slice(0, 20).map(function (entry, index) {
            var quest = entry.quest;
            var matchedNames = entry.matches.map(function (enemy) {
                return enemy.name + " " + enemy.count.toLocaleString();
            }).join(" + ");
            var meta = [quest.episode ? "EP" + quest.episode : t("lab.t047", "Episode not listed")];
            if (quest.total) meta.push(t("lab.t048", "{count} monsters in quest").replace("{count}", quest.total.toLocaleString()));
            if (quest.eventOnly) meta.push(t("lab.t049", "Event only"));
            return '<article class="lab_quest_card">' +
                '<div class="lab_quest_rank">' + String(index + 1).padStart(2, "0") + '</div>' +
                '<div class="lab_quest_copy"><h3>' + escapeHtml(displayQuestName(quest.name)) + '</h3><p>' + escapeHtml(matchedNames) + '</p><div class="lab_quest_meta">' + meta.map(function (item) { return '<span>' + escapeHtml(item) + '</span>'; }).join("") + '</div></div>' +
                '<div class="lab_monster_count"><strong>' + entry.count.toLocaleString() + '</strong><span>' + escapeHtml(t("lab.t050", "per run")) + '</span></div>' +
                '</article>';
        }).join("");
    }

    function showQuestError() {
        document.getElementById("quest-results").setAttribute("aria-busy", "false");
        document.getElementById("quest-result-summary").textContent = t("lab.t051", "Quest count data could not be loaded");
        document.getElementById("quest-results").innerHTML = '<div class="lab_error"><h3>' + escapeHtml(t("lab.t052", "Monster search is unavailable")) + '</h3><p>' + escapeHtml(t("lab.t053", "Refresh the page or open the full quest data page.")) + '</p></div>';
    }

    function loadQuestData() {
        return fetch("./quest_data_page.html", { cache: "no-store" })
            .then(function (response) {
                if (!response.ok) throw new Error("Quest data request failed");
                return response.text();
            })
            .then(function (html) {
                questData = parseQuestPage(html);
                if (!questData.length) throw new Error("Quest data parse failed");
                enemyNames = Array.from(new Set(questData.flatMap(function (quest) { return quest.enemies.map(function (enemy) { return enemy.name; }); })))
                    .sort(function (a, b) { return a.localeCompare(b); });
                renderEnemySuggestions();
                renderMonsterCounter();
            })
            .catch(showQuestError);
    }

    function bindMonsterCounter() {
        document.getElementById("quest-enemy").addEventListener("input", renderMonsterCounter);
        document.getElementById("quest-episode").addEventListener("change", renderMonsterCounter);
        document.getElementById("quest-events").addEventListener("change", renderMonsterCounter);
        document.getElementById("quest-reset").addEventListener("click", function () {
            document.getElementById("quest-enemy").value = "";
            document.getElementById("quest-episode").value = "all";
            document.getElementById("quest-events").checked = false;
            renderMonsterCounter();
            document.getElementById("quest-enemy").focus();
        });
        document.getElementById("enemy-suggestions").addEventListener("click", function (event) {
            var button = event.target.closest("button[data-enemy]");
            if (!button) return;
            document.getElementById("quest-enemy").value = button.dataset.enemy;
            renderMonsterCounter();
        });
        loadQuestData();
    }

    function getLocale() {
        var language = String(document.documentElement.lang || "en").toLowerCase().split("-")[0];
        return { ko: "ko-KR", ja: "ja-JP", es: "es-ES", fr: "fr-FR" }[language] || "en-US";
    }

    function getDisplayTimeZone() {
        return hhTimeZone === "local" ? undefined : hhTimeZone;
    }

    function getDisplayTimeZoneLabel() {
        return getDisplayTimeZone() || Intl.DateTimeFormat().resolvedOptions().timeZone || t("lab.t060", "Local time");
    }

    function formatDateTime(timestamp) {
        return new Intl.DateTimeFormat(getLocale(), {
            month: "short", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit",
            timeZone: getDisplayTimeZone()
        }).format(new Date(timestamp));
    }

    function formatClock(milliseconds) {
        var totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
        var hours = Math.floor(totalSeconds / 3600);
        var minutes = Math.floor((totalSeconds % 3600) / 60);
        var seconds = totalSeconds % 60;
        return [hours, minutes, seconds].map(function (value) { return String(value).padStart(2, "0"); }).join(":");
    }

    function getScheduleState(now) {
        if (!Number.isFinite(hhAnchor)) return null;
        if (now < hhAnchor) return { active: false, currentStart: null, nextStart: hhAnchor };
        var cycleIndex = Math.floor((now - hhAnchor) / hhCycleMs);
        var lastStart = hhAnchor + cycleIndex * hhCycleMs;
        var active = now < lastStart + hhDurationMs;
        return {
            active: active,
            currentStart: active ? lastStart : null,
            nextStart: lastStart + hhCycleMs
        };
    }

    function renderScheduleSource() {
        var status = document.getElementById("hh-data-status");
        var observed = document.getElementById("hh-observed-at");
        var remaining = document.getElementById("hh-announced-remaining");
        var source = document.getElementById("hh-source");

        if (!hhData) {
            observed.textContent = "—";
            remaining.textContent = "—";
            source.textContent = "—";
            status.dataset.state = hhLoadState;
            status.textContent = hhLoadState === "error"
                ? t("lab.t065", "Schedule data could not be loaded")
                : t("lab.t029", "Loading synchronized data...");
            return;
        }

        observed.textContent = formatDateTime(Date.parse(hhData.observedAt));
        remaining.textContent = t("lab.t064", "{minutes} min").replace("{minutes}", Number(hhData.remainingMinutes).toLocaleString());
        source.textContent = hhData.source;
        status.dataset.state = "ready";
        status.textContent = t("lab.t063", "Synchronized from the Discord announcement");
    }

    function renderSchedule() {
        var now = Date.now();
        var state = getScheduleState(now);
        var statusLabel = document.getElementById("hh-status-label");
        var countdown = document.getElementById("hh-countdown");
        var nextLabel = document.getElementById("hh-next-label");
        var list = document.getElementById("hh-schedule-list");

        if (!state) {
            statusLabel.textContent = hhLoadState === "error"
                ? t("lab.t065", "Schedule data could not be loaded")
                : t("lab.t031", "Loading schedule data");
            countdown.textContent = "--:--:--";
            nextLabel.textContent = t("lab.t032", "Waiting for the administrator sync.");
            list.innerHTML = '<div class="lab_empty"><h3>' + escapeHtml(t("lab.t035", "Waiting for schedule data")) + '</h3><p>' + escapeHtml(t("lab.t036", "An administrator must publish the latest Discord announcement.")) + '</p></div>';
            return;
        }

        var target = state.active ? state.currentStart + hhDurationMs : state.nextStart;
        statusLabel.textContent = state.active ? t("lab.t054", "Happy Hour active") : t("lab.t055", "Until next Happy Hour");
        countdown.textContent = formatClock(target - now);
        nextLabel.textContent = state.active
            ? t("lab.t056", "Ends at {time}").replace("{time}", formatDateTime(target))
            : t("lab.t057", "Starts at {time}").replace("{time}", formatDateTime(target));

        var firstStart = state.active ? state.currentStart : state.nextStart;
        var windows = Array.from({ length: 6 }, function (_, index) { return firstStart + index * hhCycleMs; });
        list.innerHTML = windows.map(function (start, index) {
            var end = start + hhDurationMs;
            var active = start <= now && now < end;
            return '<article class="lab_schedule_row' + (active ? ' is_active' : '') + '">' +
                '<span>' + (active ? escapeHtml(t("lab.t058", "NOW")) : String(index + 1).padStart(2, "0")) + '</span>' +
                '<strong>' + escapeHtml(formatDateTime(start)) + '</strong>' +
                '<p>' + escapeHtml(t("lab.t059", "Ends {time}").replace("{time}", formatDateTime(end))) + '</p>' +
                '</article>';
        }).join("");
    }

    function loadScheduleData() {
        return fetch(HH_DATA_URL + "?v=" + Date.now(), { cache: "no-store" })
            .then(function (response) {
                if (!response.ok) throw new Error("Happy Hour data request failed");
                return response.json();
            })
            .then(function (data) {
                var start = Date.parse(data.windowStart);
                var cycleMinutes = Number(data.cycleMinutes);
                var durationMinutes = Number(data.durationMinutes);
                var observed = Date.parse(data.observedAt);
                var remaining = Number(data.remainingMinutes);
                if (!Number.isFinite(start) || !Number.isFinite(observed) || !Number.isFinite(cycleMinutes) || cycleMinutes <= 0 || !Number.isFinite(durationMinutes) || durationMinutes <= 0 || !Number.isFinite(remaining)) {
                    throw new Error("Happy Hour data is invalid");
                }
                hhData = data;
                hhAnchor = start;
                hhCycleMs = cycleMinutes * 60 * 1000;
                hhDurationMs = durationMinutes * 60 * 1000;
                hhLoadState = "ready";
                renderScheduleSource();
                renderSchedule();
            })
            .catch(function () {
                if (!hhData) {
                    hhAnchor = null;
                    hhLoadState = "error";
                }
                renderScheduleSource();
                renderSchedule();
            });
    }

    function bindSchedule() {
        var timezoneSelect = document.getElementById("hh-timezone-select");
        try {
            var savedTimeZone = localStorage.getItem(HH_TIMEZONE_STORAGE_KEY);
            if (HH_TIMEZONES.includes(savedTimeZone)) hhTimeZone = savedTimeZone;
        } catch (error) { /* Automatic browser time remains available. */ }
        timezoneSelect.value = hhTimeZone;
        document.getElementById("hh-timezone").textContent = t("lab.t061", "Displayed in {zone}").replace("{zone}", getDisplayTimeZoneLabel());
        timezoneSelect.addEventListener("change", function () {
            hhTimeZone = HH_TIMEZONES.includes(timezoneSelect.value) ? timezoneSelect.value : "local";
            try { localStorage.setItem(HH_TIMEZONE_STORAGE_KEY, hhTimeZone); } catch (error) { /* Selection still works for this tab. */ }
            document.getElementById("hh-timezone").textContent = t("lab.t061", "Displayed in {zone}").replace("{zone}", getDisplayTimeZoneLabel());
            renderScheduleSource();
            renderSchedule();
        });
        renderScheduleSource();
        renderSchedule();
        loadScheduleData();
        hhTimer = window.setInterval(renderSchedule, 1000);
        hhRefreshTimer = window.setInterval(loadScheduleData, 60 * 1000);
    }

    function rerenderLanguage() {
        renderMonsterCounter();
        document.getElementById("hh-timezone").textContent = t("lab.t061", "Displayed in {zone}").replace("{zone}", getDisplayTimeZoneLabel());
        renderScheduleSource();
        renderSchedule();
    }

    document.addEventListener("DOMContentLoaded", function () {
        bindMonsterCounter();
        bindSchedule();
    });
    document.addEventListener("destiny-lang-change", rerenderLanguage);
    window.addEventListener("beforeunload", function () {
        if (hhTimer) window.clearInterval(hhTimer);
        if (hhRefreshTimer) window.clearInterval(hhRefreshTimer);
    });
})();
