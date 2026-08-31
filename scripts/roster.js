/**
 * 닉네임 명부 (디스코드 닉 ↔ 캐릭터명)
 *
 * 사이트가 정적이라 데이터는 별도 Worker 에 있다. 이 파일은 그 API 를 부르고
 * 그리기만 한다. 서버 코드와 설치 안내는 api/ 에 있다.
 *
 * 로그인이 없다. 글마다 비밀번호가 붙고, 수정·삭제할 때 그 비밀번호를 묻는다.
 * 비밀번호는 화면에 잠깐 머물 뿐 어디에도 저장하지 않는다 — 브라우저에 남겨 두면
 * 같은 기기를 쓰는 다른 사람이 그대로 쓸 수 있다.
 */
(function () {
  "use strict";

  /** api/README.md 5번 단계에서 받은 Worker 주소로 바꿀 것. 끝에 슬래시 없이. */
  var API_BASE = "https://destiny-roster.weba44.workers.dev";

  /** 지금 화면이 쓰는 언어. 사전이 아직 안 붙었으면 영어로 본다. */
  function uiLang() {
    return (window.DestinyI18n && window.DestinyI18n.lang) || "en";
  }

  function t(key, fallback) {
    return (window.DestinyI18n && window.DestinyI18n.t(key, fallback)) || fallback;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function api(path, body) {
    return fetch(API_BASE + path, {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (response.ok) return data;
        var problem = new Error(data.error || "http_" + response.status);
        problem.code = data.error || "http_" + response.status;
        problem.status = response.status;
        throw problem;
      });
    });
  }

  /** 서버가 주는 코드를 사람이 읽을 문장으로. 모르는 코드는 일반 문구로 떨어진다. */
  function explain(code) {
    var messages = {
      discord_required: t("rst.err.discordRequired", "Type your Discord name."),
      character_required: t("rst.err.required", "Type a character name."),
      password_short: t("rst.err.pwShort", "The password needs at least 4 characters."),
      password_long: t("rst.err.pwLong", "That password is too long."),
      wrong_password: t("rst.err.wrongPw", "That password does not match."),
      too_many_tries: t("rst.err.tooManyTries", "Too many wrong passwords. Try again later."),
      slow_down: t("rst.err.slowDown", "Too many entries from here for now. Try again later."),
      not_found: t("rst.err.notFound", "That entry is already gone."),
    };
    return messages[code] || t("rst.err.generic", "That did not work. Try again in a moment.");
  }

  /** PSOBB 의 열두 클래스. 서버(api/src/index.ts)의 CLASSES 와 순서까지 같아야 한다. */
  var CLASSES = [
    "HUmar", "HUnewearl", "HUcast", "HUcaseal",
    "RAmar", "RAmarl", "RAcast", "RAcaseal",
    "FOmar", "FOmarl", "FOnewm", "FOnewearl",
  ];

  var MAX_WINDOWS = 3;

  var VIEW_ZONE_KEY = "destiny-guide-roster-viewzone";

  function readViewZone() {
    try {
      var saved = window.localStorage.getItem(VIEW_ZONE_KEY);
      if (!saved) return "";
      // 저장해 둔 값이 더 이상 유효하지 않을 수 있다. 그대로 쓰면 변환이 터진다.
      new Intl.DateTimeFormat("en-US", { timeZone: saved });
      return saved;
    } catch (error) { return ""; }
  }

  function writeViewZone(value) {
    try {
      if (value) window.localStorage.setItem(VIEW_ZONE_KEY, value);
      else window.localStorage.removeItem(VIEW_ZONE_KEY);
    } catch (error) { /* 사생활 보호 모드. 이번 방문에만 유지된다. */ }
  }

  /** 브라우저가 아는 이 사람의 시간대. 변환의 기준점이다. */
  function viewerZone() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; }
    catch (error) { return "UTC"; }
  }

  /**
   * 어떤 시각(UTC ms)에 그 시간대가 UTC 와 몇 밀리초 차이 나는지.
   *
   * 고정값을 표로 들고 있지 않는 이유는 서머타임 때문이다. 같은 도시라도 계절에
   * 따라 한 시간이 움직여서, 반드시 "그 날짜의" 차이를 물어봐야 한다.
   */
  function zoneOffset(utcMs, zone) {
    var dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: zone, hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    var parts = {};
    dtf.formatToParts(new Date(utcMs)).forEach(function (p) { parts[p.type] = p.value; });
    var asUtc = Date.UTC(
      Number(parts.year), Number(parts.month) - 1, Number(parts.day),
      Number(parts.hour) % 24, Number(parts.minute), Number(parts.second),
    );
    return asUtc - utcMs;
  }

  /**
   * "그 사람 시간대의 오늘 hh:mm" 이 실제로 몇 시(UTC)인지.
   *
   * 한 번 어림잡고 그 시점의 차이로 보정한다. 서머타임이 바뀌는 날 근처에서는
   * 첫 어림이 한 시간 어긋날 수 있어서 한 번 더 돌린다.
   */
  function wallTimeToUtc(minutes, zone, baseDate) {
    var y = baseDate.getUTCFullYear(), m = baseDate.getUTCMonth(), d = baseDate.getUTCDate();
    var guess = Date.UTC(y, m, d, Math.floor(minutes / 60), minutes % 60);
    for (var i = 0; i < 2; i += 1) guess = Date.UTC(y, m, d, Math.floor(minutes / 60), minutes % 60) - zoneOffset(guess, zone);
    return guess;
  }

  function pad2(n) { return String(n).padStart(2, "0"); }

  var minutesToHhmm = function (minutes) {
    return pad2(Math.floor(minutes / 60)) + ":" + pad2(minutes % 60);
  };

  /** "HH:MM" -> 자정으로부터 몇 분. 못 읽으면 null. */
  function hhmmToMinutes(value) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(value || "").trim());
    if (!m) return null;
    var h = Number(m[1]), mi = Number(m[2]);
    if (h > 23 || mi > 59) return null;
    return h * 60 + mi;
  }

  /**
   * 남이 적은 시간을 보는 사람 시계로 옮긴다.
   *
   * 날짜가 밀리는 경우가 흔하다 — 한국 저녁 9시는 유럽에서는 같은 날 낮이지만
   * 미국 서부에서는 전날 새벽이다. 그래서 며칠 밀렸는지도 같이 돌려준다.
   */
  function convertWindow(win, fromZone, toZone) {
    var base = new Date();
    var startUtc = wallTimeToUtc(win.start, fromZone, base);
    // 끝이 시작보다 이르면 자정을 넘긴 것이다 (22:00~02:00).
    var endUtc = wallTimeToUtc(win.end, fromZone, base) + (win.end <= win.start ? 86400000 : 0);

    function inViewer(utcMs) {
      var shifted = utcMs + zoneOffset(utcMs, toZone);
      var d = new Date(shifted);
      return { minutes: d.getUTCHours() * 60 + d.getUTCMinutes(), dayMs: Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) };
    }

    var a = inViewer(startUtc), b = inViewer(endUtc);
    var today = inViewer(wallTimeToUtc(0, toZone, base)).dayMs;
    return {
      start: a.minutes,
      end: b.minutes,
      // 시작이 보는 사람 기준 어제/내일이면 알려 준다.
      dayShift: Math.round((a.dayMs - today) / 86400000),
    };
  }

  function formatDate(ms) {
    var date = new Date(ms);
    if (isNaN(date.getTime())) return "";
    var pad = function (n) { return String(n).padStart(2, "0"); };
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }

  document.addEventListener("DOMContentLoaded", function () {
    var mount = document.querySelector("[data-rs-mount]");
    if (!mount) return;

    var form = document.querySelector("[data-rs-form]");
    var discordInput = document.querySelector("[data-rs-discord]");
    var charsBox = document.querySelector("[data-rs-chars]");
    var guildInput = document.querySelector("[data-rs-guild]");
    var zoneSelect = document.querySelector("[data-rs-timezone]");
    var windowsBox = document.querySelector("[data-rs-windows]");
    var windowsPreview = document.querySelector("[data-rs-windows-preview]");
    var noteInput = document.querySelector("[data-rs-note]");
    var passwordInput = document.querySelector("[data-rs-password]");
    var submitButton = document.querySelector("[data-rs-submit]");
    var cancelButton = document.querySelector("[data-rs-cancel]");
    var formMessage = document.querySelector("[data-rs-form-msg]");
    var searchInput = document.querySelector("[data-rs-search]");
    var countLabel = document.querySelector("[data-rs-count]");
    var moreButton = document.querySelector("[data-rs-more]");
    var viewZoneSelect = document.querySelector("[data-rs-viewzone]");
    var viewZoneReset = document.querySelector("[data-rs-viewzone-reset]");

    var ask = document.querySelector("[data-rs-ask]");
    var askForm = document.querySelector("[data-rs-ask-form]");
    var askTitle = document.querySelector("[data-rs-ask-title]");
    var askTarget = document.querySelector("[data-rs-ask-target]");
    var askPassword = document.querySelector("[data-rs-ask-password]");
    var askMessage = document.querySelector("[data-rs-ask-msg]");
    var askGo = document.querySelector("[data-rs-ask-go]");

    var entries = [];
    var nextCursor = null;
    var total = 0;
    var query = "";
    var searchTimer = null;
    /** 목록 요청 일련번호. 늦게 도착한 옛 응답을 버리는 데 쓴다. */
    var requestSeq = 0;

    /** 수정 중인 항목. { id, password } — 저장이 끝나면 즉시 버린다. */
    var editing = null;
    /** 비밀번호 창이 무엇을 하려는 중인지. { id, action, entry } */
    var pending = null;


    /** 이 브라우저가 있는 곳. 기본 보기 기준이자 "내 시간" 의 뜻. */
    var zone = viewerZone();
    /**
     * 실제로 시간을 그릴 때 쓰는 기준.
     *
     * 보통은 zone 과 같지만, 보는 사람이 다른 시계로 보고 싶을 때가 있다 — 기기 시계가
     * 안 맞거나, 곧 갈 지역 기준으로 미리 보고 싶거나. 그래서 따로 둔다.
     */
    var viewZone = readViewZone() || zone;

    /* ── 폼 조립 ───────────────────────────────────────────────────────── */

    /** 클래스 열두 칸. 서버가 아는 키와 같아야 해서 CLASSES 로만 만든다. */
    function buildCharacterInputs() {
      charsBox.innerHTML = CLASSES.map(function (cls) {
        return '<label class="rs_char_cell"><span>' + cls + "</span>" +
          '<input type="text" maxlength="24" autocomplete="off" data-rs-char="' + cls + '"></label>';
      }).join("");
    }

    function readCharacters() {
      var out = {};
      Array.prototype.forEach.call(charsBox.querySelectorAll("[data-rs-char]"), function (input) {
        var name = input.value.trim();
        if (name) out[input.getAttribute("data-rs-char")] = name;
      });
      return out;
    }

    function writeCharacters(characters) {
      Array.prototype.forEach.call(charsBox.querySelectorAll("[data-rs-char]"), function (input) {
        input.value = (characters && characters[input.getAttribute("data-rs-char")]) || "";
      });
    }

    /**
     * 시간대 목록.
     *
     * 브라우저가 아는 IANA 목록을 그대로 쓴다. 직접 표를 들고 있으면 서머타임 규칙이
     * 바뀔 때마다 낡는다. 목록을 못 주는 브라우저는 자기 시간대 하나만 고를 수 있다.
     */
    function buildZoneSelect() {
      var zones = [];
      try { zones = Intl.supportedValuesOf("timeZone") || []; } catch (error) { zones = []; }
      if (zones.indexOf(zone) < 0) zones.unshift(zone);

      /*
       * 대부분 자기 시간대를 고른다. 미리 맞춰 두면 손이 덜 간다.
       *
       * value 로만 맞추면 안 된다 — 등록 뒤 form.reset() 이 마크업의 기본 선택으로
       * 되돌려서, 두 번째 사람은 시간대가 "안 밝힘" 인 채로 올리게 된다.
       * selected 속성을 박아 두어야 reset 후에도 남는다.
       */
      zoneSelect.innerHTML = '<option value="">' +
        escapeHtml(t("rst.form.timezoneNone", "Not saying")) + "</option>" +
        zones.map(function (z) {
          return '<option value="' + escapeHtml(z) + '"' + (z === zone ? " selected" : "") + ">" +
            escapeHtml(z.replace(/_/g, " ")) + "</option>";
        }).join("");
    }

    function buildWindowRows() {
      var rows = [];
      for (var i = 0; i < MAX_WINDOWS; i += 1) {
        rows.push(
          '<div class="rs_window_row">' +
          '<input type="time" data-rs-win-start="' + i + '">' +
          '<span class="rs_window_dash">–</span>' +
          '<input type="time" data-rs-win-end="' + i + '">' +
          '<button type="button" class="rs_link_btn" data-rs-win-clear="' + i + '" ' +
          'data-i18n="rst.form.clearRow">Clear</button>' +
          "</div>",
        );
      }
      windowsBox.innerHTML = rows.join("");
    }

    function readWindows() {
      var out = [];
      for (var i = 0; i < MAX_WINDOWS; i += 1) {
        var start = hhmmToMinutes(windowsBox.querySelector('[data-rs-win-start="' + i + '"]').value);
        var end = hhmmToMinutes(windowsBox.querySelector('[data-rs-win-end="' + i + '"]').value);
        // 한쪽만 적힌 줄은 무시한다. 반쪽짜리 구간은 뜻이 없다.
        if (start === null || end === null || start === end) continue;
        out.push({ start: start, end: end });
      }
      return out;
    }

    function writeWindows(windows) {
      for (var i = 0; i < MAX_WINDOWS; i += 1) {
        var win = (windows || [])[i];
        windowsBox.querySelector('[data-rs-win-start="' + i + '"]').value = win ? minutesToHhmm(win.start) : "";
        windowsBox.querySelector('[data-rs-win-end="' + i + '"]').value = win ? minutesToHhmm(win.end) : "";
      }
    }

    /** 적는 동안 "남들에게는 이렇게 보입니다" 를 미리 알려 준다. */
    function refreshWindowPreview() {
      var chosen = zoneSelect.value;
      var windows = readWindows();
      if (!chosen || !windows.length) { windowsPreview.textContent = ""; return; }
      if (chosen === viewZone) {
        windowsPreview.textContent = t("rst.form.sameZone", "Visitors in other zones will see these converted to their own clock.");
        return;
      }
      windowsPreview.textContent = t("rst.form.yourClock", "On your own clock right now") + " (" + viewZone + "): " +
        windows.map(function (w) { return describeWindow(w, chosen); }).join(", ");
    }

    /* ── 시간 표시 ─────────────────────────────────────────────────────── */

    /**
     * 캐릭터를 클래스별로 그린다.
     *
     * characters 가 비어 있는 줄은 컬럼을 붙이기 전에 올라온 것이다. 그런 줄은
     * 예전 평문(character_name)을 그대로 보여 준다 — 지우거나 고치지 않는다.
     */
    function renderCharacters(entry) {
      var names = entry.characters || {};
      var listed = CLASSES.filter(function (cls) { return names[cls]; });
      if (!listed.length) return escapeHtml(entry.characterName || "");
      return listed.map(function (cls) {
        return '<span class="rs_one_char">' + escapeHtml(names[cls]) +
          '<em class="rs_cls">' + cls + "</em></span>";
      }).join("");
    }

    /**
     * 한 줄 소개를 지금 보고 있는 언어로.
     *
     * 기계 번역이라 어색할 때가 있다. 그래서 번역본만 두지 않고, 번역했다는 표시와
     * 원문을 함께 붙인다 — 이상하면 원문을 볼 수 있어야 한다.
     */
    function renderNote(entry) {
      if (!entry.note) return "";
      var lang = uiLang();
      var translated = (entry.noteI18n || {})[lang];
      var showTranslation = translated && entry.noteLang && entry.noteLang !== lang;

      if (!showTranslation) return '<p class="rs_note">' + escapeHtml(entry.note) + "</p>";

      return '<p class="rs_note">' + escapeHtml(translated) +
        '<button type="button" class="rs_note_src" data-rs-original="' + entry.id + '" ' +
        'title="' + escapeHtml(entry.note) + '">' +
        escapeHtml(t("rst.row.machine", "auto-translated") + " · " + t("rst.row.showOriginal", "original")) +
        "</button></p>";
    }

    /** 한 구간을 보는 사람 시계로 옮겨 문장으로. 날짜가 밀리면 그것도 붙인다. */
    function describeWindow(win, fromZone) {
      if (!fromZone || fromZone === viewZone) return minutesToHhmm(win.start) + "–" + minutesToHhmm(win.end);
      var moved = convertWindow(win, fromZone, viewZone);
      var text = minutesToHhmm(moved.start) + "–" + minutesToHhmm(moved.end);
      if (moved.dayShift < 0) text += " " + t("rst.row.dayBefore", "(prev day)");
      if (moved.dayShift > 0) text += " " + t("rst.row.dayAfter", "(next day)");
      return text;
    }


    /* ── 보기 기준 시간대 ─────────────────────────────────────────────── */

    function buildViewZoneSelect() {
      var zones = [];
      try { zones = Intl.supportedValuesOf("timeZone") || []; } catch (error) { zones = []; }
      if (zones.indexOf(zone) < 0) zones.unshift(zone);
      if (viewZone !== zone && zones.indexOf(viewZone) < 0) zones.unshift(viewZone);

      viewZoneSelect.innerHTML = zones.map(function (z) {
        return '<option value="' + escapeHtml(z) + '"' + (z === viewZone ? " selected" : "") + ">" +
          escapeHtml(z.replace(/_/g, " ")) + (z === zone ? " · " + t("rst.view.mine", "yours") : "") + "</option>";
      }).join("");
      viewZoneReset.hidden = viewZone === zone;
    }

    viewZoneSelect.addEventListener("change", function () {
      viewZone = viewZoneSelect.value || zone;
      writeViewZone(viewZone === zone ? "" : viewZone);
      viewZoneReset.hidden = viewZone === zone;
      render();
      refreshWindowPreview();
    });

    viewZoneReset.addEventListener("click", function () {
      viewZone = zone;
      writeViewZone("");
      viewZoneSelect.value = zone;
      viewZoneReset.hidden = true;
      render();
      refreshWindowPreview();
    });

    function say(target, message, kind) {
      target.textContent = message || "";
      target.dataset.kind = kind || "";
      if (message && target === formMessage) window.setTimeout(function () {
        if (target.textContent === message) target.textContent = "";
      }, 6000);
    }

    function applyI18n(node) {
      var api18n = window.DestinyI18n;
      if (api18n && typeof api18n.hydrate === "function" && node) api18n.hydrate(node);
    }

    /* ── 목록 ──────────────────────────────────────────────────────────── */

    function row(entry) {
      /* 선택 항목은 적은 사람만 나온다. 빈 칸을 자리만 잡아 두면 목록이 성기게 보인다. */
      var windows = entry.playWindows || [];
      var hours = windows.length
        ? windows.map(function (w) { return describeWindow(w, entry.timezone); }).join(", ")
        : "";
      // 남의 시간대를 내 시계로 바꿔 보여줬다면, 원래 시간도 같이 남긴다.
      var converted = hours && entry.timezone && entry.timezone !== viewZone;
      // 바뀐 값만 보이면 원래 몇 시라고 적었는지 알 수 없다. 마우스를 올리면 나오게 둔다.
      var original = windows.map(function (w) {
        return minutesToHhmm(w.start) + "–" + minutesToHhmm(w.end);
      }).join(", ");

      var facts = [
        entry.timezone ? '<span class="rs_fact">' + escapeHtml(entry.timezone.replace(/_/g, " ")) + "</span>" : "",
        hours
          ? '<span class="rs_fact rs_fact_time"' +
            (converted
              ? ' title="' + escapeHtml(t("rst.row.written", "As written") + ": " + original + " " + entry.timezone) + '"'
              : "") + ">" + escapeHtml(hours) +
            (converted
              // 보는 기준을 다른 시간대로 바꿔 놓았다면 "내 시간" 이 아니다. 그 이름을 적는다.
              ? '<em class="rs_fact_src">' + escapeHtml(
                  viewZone === zone ? t("rst.row.yourTime", "your time") : viewZone.replace(/_/g, " "),
                ) + "</em>"
              : "") +
            "</span>"
          : "",
        entry.guildCard
          ? '<span class="rs_fact rs_fact_card"><b data-i18n="rst.row.card">Guild card</b> ' +
            escapeHtml(entry.guildCard) + "</span>"
          : "",
      ].join("");

      return (
        '<li class="rs_row">' +
        '<div class="rs_row_main">' +
        '<p class="rs_char">' + renderCharacters(entry) + "</p>" +
        '<p class="rs_discord"><span class="rs_at">@</span>' + escapeHtml(entry.discordName) + "</p>" +
        (facts ? '<p class="rs_facts">' + facts + "</p>" : "") +
        renderNote(entry) +
        "</div>" +
        '<div class="rs_row_side">' +
        '<time class="rs_date">' + escapeHtml(formatDate(entry.createdAt)) + "</time>" +
        '<div class="rs_row_actions">' +
        '<button type="button" class="rs_link_btn" data-rs-edit="' + entry.id + '" data-i18n="rst.row.edit">Edit</button>' +
        '<button type="button" class="rs_link_btn is_danger" data-rs-delete="' + entry.id + '" data-i18n="rst.row.delete">Delete</button>' +
        "</div></div></li>"
      );
    }

    function render() {
      if (!entries.length) {
        mount.innerHTML = '<p class="rs_empty">' +
          escapeHtml(query
            ? t("rst.noMatch", "Nobody by that name yet.")
            : t("rst.emptyList", "Nobody has added themselves yet. Be first.")) + "</p>";
      } else {
        mount.innerHTML = '<ul class="rs_list">' + entries.map(row).join("") + "</ul>";
      }
      countLabel.textContent = entries.length + " / " + total;
      moreButton.hidden = nextCursor === null;
      applyI18n(mount);
      applyI18n(moreButton);
    }

    function load(reset) {
      if (reset) { entries = []; nextCursor = null; }
      var cursor = reset ? 0 : (nextCursor || 0);
      var url = "/api/entries?cursor=" + cursor + (query ? "&q=" + encodeURIComponent(query) : "");

      /*
       * 응답이 보낸 순서대로 온다는 보장이 없다. 검색어를 빠르게 고치면 먼저 보낸
       * 요청이 늦게 도착해 최신 결과를 덮어쓰고, 화면에는 한 박자 전 목록이 남는다.
       * 마지막으로 보낸 요청의 응답만 반영한다.
       */
      requestSeq += 1;
      var mySeq = requestSeq;

      return api(url).then(function (data) {
        if (mySeq !== requestSeq) return;
        entries = reset ? data.entries : entries.concat(data.entries);
        nextCursor = data.nextCursor;
        total = data.total;
        render();
      }).catch(function (error) {
        if (mySeq !== requestSeq) return;
        mount.innerHTML = '<p class="rs_empty">' + escapeHtml(
          error.status === undefined
            ? t("rst.offline", "Could not reach the directory. It may be down for a moment.")
            : explain(error.code)) + "</p>";
        countLabel.textContent = "—";
        moreButton.hidden = true;
      });
    }

    /* ── 등록 · 수정 ───────────────────────────────────────────────────── */

    function leaveEditMode() {
      editing = null;
      form.reset();
      // 앞사람 시간이 미리보기에 남아 있으면 다음 사람이 자기 것으로 읽는다.
      refreshWindowPreview();
      cancelButton.hidden = true;
      passwordInput.parentElement.hidden = false;
      passwordInput.required = true;
      submitButton.textContent = t("rst.form.add", "Add to the list");
      submitButton.dataset.i18n = "rst.form.add";
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var payload = {
        discordName: discordInput.value.trim(),
        characters: readCharacters(),
        guildCard: guildInput.value.trim(),
        timezone: zoneSelect.value,
        playWindows: readWindows(),
        note: noteInput.value.trim(),
        // 무슨 언어로 썼는지 서버가 짐작하는 데 쓰는 힌트. 한글·가나는 서버가 직접 안다.
        noteLang: uiLang(),
      };

      if (!payload.discordName) { say(formMessage, explain("discord_required"), "bad"); return; }
      if (!Object.keys(payload.characters).length) { say(formMessage, explain("character_required"), "bad"); return; }

      var path;
      if (editing) {
        // 수정은 아까 확인받은 비밀번호를 그대로 다시 보낸다. 서버가 매번 확인한다.
        payload.password = editing.password;
        path = "/api/entries/" + editing.id + "/update";
      } else {
        payload.password = passwordInput.value;
        if (payload.password.trim().length < 4) { say(formMessage, explain("password_short"), "bad"); return; }
        path = "/api/entries";
      }

      submitButton.disabled = true;
      api(path, payload).then(function (data) {
        var message = editing ? t("rst.saved", "Saved.") : t("rst.added", "Added.");
        // 같은 캐릭터명이 이미 있으면 알려만 준다. 동명이인이 실제로 있을 수 있다.
        if (data.duplicateName) message += " " + t("rst.dupeName", "Someone already listed that character name.");
        leaveEditMode();
        say(formMessage, message, "good");
        return load(true);
      }).catch(function (error) {
        say(formMessage, explain(error.code), "bad");
      }).then(function () {
        submitButton.disabled = false;
      });
    });

    cancelButton.addEventListener("click", leaveEditMode);

    /* ── 비밀번호 묻는 창 ──────────────────────────────────────────────── */

    function openAsk(action, entry) {
      pending = { id: entry.id, action: action, entry: entry };
      askTitle.textContent = action === "delete"
        ? t("rst.ask.deleteTitle", "Delete this entry")
        : t("rst.ask.editTitle", "Edit this entry");
      askTarget.textContent = entry.characterName + "  @" + entry.discordName;
      askGo.textContent = action === "delete"
        ? t("rst.ask.deleteGo", "Delete")
        : t("rst.ask.editGo", "Continue");
      askGo.classList.toggle("is_danger_btn", action === "delete");
      askPassword.value = "";
      say(askMessage, "", "");
      ask.hidden = false;
      document.body.classList.add("rs_ask_open");
      askPassword.focus();
    }

    function closeAsk() {
      ask.hidden = true;
      // 비밀번호를 입력칸에 남겨 두지 않는다.
      askPassword.value = "";
      pending = null;
      document.body.classList.remove("rs_ask_open");
    }

    askForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!pending) return;

      var password = askPassword.value;
      if (!password.trim()) { say(askMessage, explain("wrong_password"), "bad"); return; }

      askGo.disabled = true;
      var action = pending.action === "delete" ? "delete" : "verify";

      api("/api/entries/" + pending.id + "/" + action, { password: password }).then(function (data) {
        if (pending.action === "delete") {
          closeAsk();
          say(formMessage, t("rst.deleted", "Deleted."), "good");
          return load(true);
        }

        // 확인만 된 것이다. 위 폼을 수정 모드로 바꾸고 비밀번호를 들고 있는다.
        var entry = data.entry;
        editing = { id: entry.id, password: password };
        discordInput.value = entry.discordName;
        writeCharacters(entry.characters);
        guildInput.value = entry.guildCard || "";
        zoneSelect.value = entry.timezone || "";
        writeWindows(entry.playWindows);
        noteInput.value = entry.note || "";
        refreshWindowPreview();
        passwordInput.value = "";
        passwordInput.required = false;
        passwordInput.parentElement.hidden = true;
        cancelButton.hidden = false;
        submitButton.textContent = t("rst.form.save", "Save changes");
        submitButton.dataset.i18n = "rst.form.save";
        closeAsk();
        form.scrollIntoView({ block: "center", behavior: "smooth" });
        charsBox.querySelector("input").focus();
      }).catch(function (error) {
        say(askMessage, explain(error.code), "bad");
      }).then(function () {
        askGo.disabled = false;
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-rs-ask-close]"), function (button) {
      button.addEventListener("click", closeAsk);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !ask.hidden) closeAsk();
    });

    /* ── 목록에서 누른 것 ──────────────────────────────────────────────── */

    mount.addEventListener("click", function (event) {
      // 번역문 옆의 작은 단추. 누르면 그 자리에서 원문으로 바뀐다.
      var original = event.target.closest && event.target.closest("[data-rs-original]");
      if (original) {
        var id = original.getAttribute("data-rs-original");
        var found = entries.filter(function (item) { return String(item.id) === id; })[0];
        if (found) {
          var box = original.parentElement;
          box.textContent = found.note;
          box.className = "rs_note is_original";
        }
        return;
      }

      var target = event.target.closest && event.target.closest("[data-rs-edit], [data-rs-delete]");
      if (!target) return;

      var isDelete = target.hasAttribute("data-rs-delete");
      var id = target.getAttribute(isDelete ? "data-rs-delete" : "data-rs-edit");
      var entry = entries.filter(function (item) { return String(item.id) === id; })[0];
      if (!entry) return;

      openAsk(isDelete ? "delete" : "edit", entry);
    });

    /* ── 검색 · 더 보기 ───────────────────────────────────────────────── */

    searchInput.addEventListener("input", function () {
      window.clearTimeout(searchTimer);
      // 글자마다 부르면 서버가 시끄럽다. 멈춘 뒤에 한 번만 보낸다.
      searchTimer = window.setTimeout(function () {
        query = searchInput.value.trim();
        load(true);
      }, 250);
    });

    moreButton.addEventListener("click", function () {
      moreButton.disabled = true;
      load(false).then(function () { moreButton.disabled = false; });
    });

    // 언어를 바꾸면 소개문도 그 언어본으로 바뀌어야 한다.
    document.addEventListener("destiny-lang-change", function () { render(); });

    buildViewZoneSelect();
    buildCharacterInputs();
    buildZoneSelect();
    buildWindowRows();
    applyI18n(form);

    zoneSelect.addEventListener("change", refreshWindowPreview);
    windowsBox.addEventListener("input", refreshWindowPreview);
    windowsBox.addEventListener("click", function (event) {
      var clear = event.target.closest && event.target.closest("[data-rs-win-clear]");
      if (!clear) return;
      var i = clear.getAttribute("data-rs-win-clear");
      windowsBox.querySelector('[data-rs-win-start="' + i + '"]').value = "";
      windowsBox.querySelector('[data-rs-win-end="' + i + '"]').value = "";
      refreshWindowPreview();
    });

    load(true);
  });
})();
