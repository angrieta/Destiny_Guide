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
    var characterInput = document.querySelector("[data-rs-character]");
    var guildInput = document.querySelector("[data-rs-guild]");
    var hoursInput = document.querySelector("[data-rs-hours]");
    var countryInput = document.querySelector("[data-rs-country]");
    var noteInput = document.querySelector("[data-rs-note]");
    var passwordInput = document.querySelector("[data-rs-password]");
    var submitButton = document.querySelector("[data-rs-submit]");
    var cancelButton = document.querySelector("[data-rs-cancel]");
    var formMessage = document.querySelector("[data-rs-form-msg]");
    var searchInput = document.querySelector("[data-rs-search]");
    var countLabel = document.querySelector("[data-rs-count]");
    var moreButton = document.querySelector("[data-rs-more]");

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
      var facts = [
        entry.country ? '<span class="rs_fact">' + escapeHtml(entry.country) + "</span>" : "",
        entry.playHours ? '<span class="rs_fact">' + escapeHtml(entry.playHours) + "</span>" : "",
        entry.guildCard
          ? '<span class="rs_fact rs_fact_card"><b data-i18n="rst.row.card">Guild card</b> ' +
            escapeHtml(entry.guildCard) + "</span>"
          : "",
      ].join("");

      return (
        '<li class="rs_row">' +
        '<div class="rs_row_main">' +
        '<p class="rs_char">' + escapeHtml(entry.characterName) + "</p>" +
        '<p class="rs_discord"><span class="rs_at">@</span>' + escapeHtml(entry.discordName) + "</p>" +
        (facts ? '<p class="rs_facts">' + facts + "</p>" : "") +
        (entry.note ? '<p class="rs_note">' + escapeHtml(entry.note) + "</p>" : "") +
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
        characterName: characterInput.value.trim(),
        guildCard: guildInput.value.trim(),
        playHours: hoursInput.value.trim(),
        country: countryInput.value.trim(),
        note: noteInput.value.trim(),
      };

      if (!payload.discordName) { say(formMessage, explain("discord_required"), "bad"); return; }
      if (!payload.characterName) { say(formMessage, explain("character_required"), "bad"); return; }

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
        characterInput.value = entry.characterName;
        guildInput.value = entry.guildCard || "";
        hoursInput.value = entry.playHours || "";
        countryInput.value = entry.country || "";
        noteInput.value = entry.note || "";
        passwordInput.value = "";
        passwordInput.required = false;
        passwordInput.parentElement.hidden = true;
        cancelButton.hidden = false;
        submitButton.textContent = t("rst.form.save", "Save changes");
        submitButton.dataset.i18n = "rst.form.save";
        closeAsk();
        form.scrollIntoView({ block: "center", behavior: "smooth" });
        characterInput.focus();
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

    document.addEventListener("destiny-lang-change", function () { render(); });

    load(true);
  });
})();
