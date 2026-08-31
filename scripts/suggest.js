/**
 * 건의사항
 *
 * 명부(roster.js)와 같은 방식이다. 데이터는 같은 Worker 에 있고, 로그인 없이
 * 글마다 비밀번호가 붙는다. 공감만 비밀번호가 없다 — 아무나 한 번씩 누른다.
 *
 * 본문은 어느 언어로 쓰든 나머지 언어로 옮겨 저장된다. 기계 번역이라 어색할 수
 * 있어서, 번역본에는 표시를 달고 원문을 볼 수 있게 둔다.
 */
(function () {
  "use strict";

  /** api/README.md 5번 단계에서 받은 Worker 주소. roster.js 와 같은 곳이다. */
  var API_BASE = "https://destiny-roster.weba44.workers.dev";

  /** 서버(api/src/index.ts)의 STATUSES 와 같아야 한다. */
  var STATUSES = ["open", "planned", "done", "declined"];

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

  function explain(code) {
    var messages = {
      title_required: t("sug.err.title", "Write the request itself first."),
      body_required: t("sug.err.body", "Add a little more about it."),
      password_short: t("sug.err.pwShort", "The password needs at least 4 characters."),
      password_long: t("sug.err.pwLong", "That password is too long."),
      wrong_password: t("sug.err.wrongPw", "That password does not match."),
      too_many_tries: t("sug.err.tooManyTries", "Too many wrong passwords. Try again later."),
      slow_down: t("sug.err.slowDown", "Too many posts from here for now. Try again later."),
      admin_only: t("sug.err.adminOnly", "That is the staff password, and it does not match."),
      bad_status: t("sug.err.badStatus", "Pick one of the listed states."),
      not_found: t("sug.err.notFound", "That post is already gone."),
    };
    return messages[code] || t("sug.err.generic", "That did not work. Try again in a moment.");
  }

  function formatDate(ms) {
    var date = new Date(ms);
    if (isNaN(date.getTime())) return "";
    var pad = function (n) { return String(n).padStart(2, "0"); };
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }

  function statusLabel(status) {
    var labels = {
      open: t("sug.status.open", "Open"),
      planned: t("sug.status.planned", "Planned"),
      done: t("sug.status.done", "Done"),
      declined: t("sug.status.declined", "Not doing"),
    };
    return labels[status] || status;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var mount = document.querySelector("[data-sg-mount]");
    if (!mount) return;

    var form = document.querySelector("[data-sg-form]");
    var titleInput = document.querySelector("[data-sg-title]");
    var bodyInput = document.querySelector("[data-sg-body]");
    var nicknameInput = document.querySelector("[data-sg-nickname]");
    var passwordInput = document.querySelector("[data-sg-password]");
    var submitButton = document.querySelector("[data-sg-submit]");
    var cancelButton = document.querySelector("[data-sg-cancel]");
    var formMessage = document.querySelector("[data-sg-form-msg]");
    var filtersBox = document.querySelector("[data-sg-filters]");
    var countLabel = document.querySelector("[data-sg-count]");
    var moreButton = document.querySelector("[data-sg-more]");

    var ask = document.querySelector("[data-sg-ask]");
    var askForm = document.querySelector("[data-sg-ask-form]");
    var askTitle = document.querySelector("[data-sg-ask-title]");
    var askTarget = document.querySelector("[data-sg-ask-target]");
    var askPassword = document.querySelector("[data-sg-ask-password]");
    var askPwLabel = document.querySelector("[data-sg-ask-pw-label]");
    var askMessage = document.querySelector("[data-sg-ask-msg]");
    var askGo = document.querySelector("[data-sg-ask-go]");
    var adminFields = document.querySelector("[data-sg-admin-fields]");
    var statusSelect = document.querySelector("[data-sg-status-select]");
    var replyInput = document.querySelector("[data-sg-reply]");

    var items = [];
    var nextCursor = null;
    var total = 0;
    var sort = "top";
    var filter = "";
    /** 목록 요청 일련번호. 늦게 도착한 옛 응답을 버린다. */
    var requestSeq = 0;

    var editing = null;
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

    /** 제목·본문을 지금 언어로. 원문 언어와 같으면 그대로 둔다. */
    function pick(item, field) {
      var lang = uiLang();
      var map = field === "title" ? item.titleI18n : item.bodyI18n;
      var translated = (map || {})[lang];
      var original = field === "title" ? item.title : item.body;
      var use = translated && item.lang && item.lang !== lang;
      return { text: use ? translated : original, translated: Boolean(use), original: original };
    }

    function card(item) {
      var title = pick(item, "title");
      var body = pick(item, "body");
      // 줄바꿈을 살린다. 사람들은 줄을 나눠 쓴다.
      var bodyHtml = escapeHtml(body.text).replace(/\n/g, "<br>");

      var badge = '<span class="sg_status is_' + escapeHtml(item.status) + '">' +
        escapeHtml(statusLabel(item.status)) + "</span>";

      var mark = title.translated || body.translated
        ? '<button type="button" class="rs_note_src" data-sg-original="' + item.id + '">' +
          escapeHtml(t("sug.row.machine", "auto-translated") + " · " + t("sug.row.showOriginal", "original")) +
          "</button>"
        : "";

      return (
        '<article class="sg_card">' +
        '<button type="button" class="sg_vote' + (item.voted ? " is_on" : "") + '" data-sg-vote="' + item.id + '" ' +
        'aria-pressed="' + (item.voted ? "true" : "false") + '" ' +
        'title="' + escapeHtml(t("sug.row.voteHint", "Back this")) + '">' +
        '<span class="sg_vote_mark" aria-hidden="true">▲</span>' +
        '<span class="sg_vote_n">' + item.votes + "</span></button>" +

        '<div class="sg_card_main">' +
        '<h3 class="sg_title">' + escapeHtml(title.text) + badge + "</h3>" +
        '<p class="sg_body" data-sg-body-of="' + item.id + '">' + bodyHtml + "</p>" +
        (mark ? '<p class="sg_marks">' + mark + "</p>" : "") +
        (item.reply
          ? '<p class="sg_reply"><b data-i18n="sug.row.staff">Staff</b> ' + escapeHtml(item.reply) + "</p>"
          : "") +
        '<p class="sg_meta">' +
        '<span class="sg_who">' + escapeHtml(item.nickname || t("sug.row.anon", "Anonymous")) + "</span>" +
        '<time class="rs_date">' + escapeHtml(formatDate(item.createdAt)) + "</time>" +
        '<button type="button" class="rs_link_btn" data-sg-edit="' + item.id + '" data-i18n="sug.row.edit">Edit</button>' +
        '<button type="button" class="rs_link_btn is_danger" data-sg-delete="' + item.id + '" data-i18n="sug.row.delete">Delete</button>' +
        '<button type="button" class="rs_link_btn" data-sg-status="' + item.id + '" data-i18n="sug.row.setStatus">Staff</button>' +
        "</p></div></article>"
      );
    }

    function render() {
      if (!items.length) {
        mount.innerHTML = '<p class="rs_empty">' +
          escapeHtml(filter
            ? t("sug.noneInFilter", "Nothing in this state yet.")
            : t("sug.empty", "Nothing suggested yet. Go first.")) + "</p>";
      } else {
        mount.innerHTML = '<div class="sg_list">' + items.map(card).join("") + "</div>";
      }
      countLabel.textContent = items.length + " / " + total;
      moreButton.hidden = nextCursor === null;
      applyI18n(mount);
      applyI18n(moreButton);
    }

    function load(reset) {
      if (reset) { items = []; nextCursor = null; }
      var cursor = reset ? 0 : (nextCursor || 0);
      var url = "/api/suggestions?sort=" + sort + "&cursor=" + cursor + (filter ? "&status=" + filter : "");

      // 응답이 보낸 순서대로 온다는 보장이 없다. 마지막 요청의 것만 반영한다.
      requestSeq += 1;
      var mySeq = requestSeq;

      return api(url).then(function (data) {
        if (mySeq !== requestSeq) return;
        items = reset ? data.suggestions : items.concat(data.suggestions);
        nextCursor = data.nextCursor;
        total = data.total;
        render();
      }).catch(function (error) {
        if (mySeq !== requestSeq) return;
        mount.innerHTML = '<p class="rs_empty">' + escapeHtml(
          error.status === undefined
            ? t("sug.offline", "Could not reach the board. It may be down for a moment.")
            : explain(error.code)) + "</p>";
        countLabel.textContent = "—";
        moreButton.hidden = true;
      });
    }

    /* ── 쓰기 ──────────────────────────────────────────────────────────── */

    function leaveEditMode() {
      editing = null;
      form.reset();
      cancelButton.hidden = true;
      passwordInput.parentElement.hidden = false;
      passwordInput.required = true;
      submitButton.textContent = t("sug.form.post", "Post it");
      submitButton.dataset.i18n = "sug.form.post";
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var payload = {
        nickname: nicknameInput.value.trim(),
        title: titleInput.value.trim(),
        body: bodyInput.value.trim(),
        lang: uiLang(),
      };
      if (!payload.title) { say(formMessage, explain("title_required"), "bad"); return; }
      if (!payload.body) { say(formMessage, explain("body_required"), "bad"); return; }

      var path;
      if (editing) {
        payload.password = editing.password;
        path = "/api/suggestions/" + editing.id + "/update";
      } else {
        payload.password = passwordInput.value;
        if (payload.password.trim().length < 4) { say(formMessage, explain("password_short"), "bad"); return; }
        path = "/api/suggestions";
      }

      submitButton.disabled = true;
      api(path, payload).then(function () {
        var message = editing ? t("sug.saved", "Saved.") : t("sug.posted", "Posted.");
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

    /* ── 비밀번호 창 ───────────────────────────────────────────────────── */

    function openAsk(action, item) {
      pending = { id: item.id, action: action, item: item };
      var isStatus = action === "status";

      askTitle.textContent = isStatus
        ? t("sug.ask.statusTitle", "Staff: mark this post")
        : action === "delete"
          ? t("sug.ask.deleteTitle", "Delete this post")
          : t("sug.ask.editTitle", "Edit this post");
      askTarget.textContent = item.title;
      askGo.textContent = isStatus
        ? t("sug.ask.statusGo", "Save")
        : action === "delete"
          ? t("sug.ask.deleteGo", "Delete")
          : t("sug.ask.editGo", "Continue");
      askGo.classList.toggle("is_danger_btn", action === "delete");

      adminFields.hidden = !isStatus;
      // 운영자 칸일 때는 무슨 비밀번호를 묻는지 분명히 한다.
      askPwLabel.dataset.i18n = isStatus ? "sug.ask.adminLabel" : "sug.ask.label";
      askPwLabel.textContent = isStatus
        ? t("sug.ask.adminLabel", "Staff password")
        : t("sug.ask.label", "Password for this post");

      if (isStatus) {
        statusSelect.innerHTML = STATUSES.map(function (s) {
          return '<option value="' + s + '"' + (s === item.status ? " selected" : "") + ">" +
            escapeHtml(statusLabel(s)) + "</option>";
        }).join("");
        replyInput.value = item.reply || "";
      }

      askPassword.value = "";
      say(askMessage, "", "");
      ask.hidden = false;
      document.body.classList.add("rs_ask_open");
      askPassword.focus();
    }

    function closeAsk() {
      ask.hidden = true;
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
      var action = pending.action;
      var path = "/api/suggestions/" + pending.id + "/" +
        (action === "edit" ? "verify" : action);
      var payload = { password: password };
      if (action === "status") {
        payload.status = statusSelect.value;
        payload.reply = replyInput.value.trim();
      }

      api(path, payload).then(function (data) {
        if (action === "edit") {
          var item = data.suggestion;
          editing = { id: item.id, password: password };
          titleInput.value = item.title;
          bodyInput.value = item.body;
          nicknameInput.value = item.nickname || "";
          passwordInput.value = "";
          passwordInput.required = false;
          passwordInput.parentElement.hidden = true;
          cancelButton.hidden = false;
          submitButton.textContent = t("sug.form.save", "Save changes");
          submitButton.dataset.i18n = "sug.form.save";
          closeAsk();
          form.scrollIntoView({ block: "center", behavior: "smooth" });
          titleInput.focus();
          return;
        }

        closeAsk();
        say(formMessage, action === "delete"
          ? t("sug.deleted", "Deleted.")
          : t("sug.saved", "Saved."), "good");
        return load(true);
      }).catch(function (error) {
        say(askMessage, explain(error.code), "bad");
      }).then(function () {
        askGo.disabled = false;
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-sg-ask-close]"), function (button) {
      button.addEventListener("click", closeAsk);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !ask.hidden) closeAsk();
    });

    /* ── 목록에서 누른 것 ──────────────────────────────────────────────── */

    mount.addEventListener("click", function (event) {
      var find = function (attr) {
        var el = event.target.closest && event.target.closest("[" + attr + "]");
        if (!el) return null;
        var id = el.getAttribute(attr);
        return { el: el, id: id, item: items.filter(function (x) { return String(x.id) === id; })[0] };
      };

      var vote = find("data-sg-vote");
      if (vote) {
        vote.el.disabled = true;
        api("/api/suggestions/" + vote.id + "/vote", {}).then(function (data) {
          // 목록을 통째로 다시 받지 않는다. 숫자 하나 때문에 순서가 튀면 어지럽다.
          if (vote.item) { vote.item.votes = data.votes; vote.item.voted = data.voted; }
          vote.el.classList.toggle("is_on", data.voted);
          vote.el.setAttribute("aria-pressed", String(data.voted));
          vote.el.querySelector(".sg_vote_n").textContent = data.votes;
        }).catch(function (error) {
          say(formMessage, explain(error.code), "bad");
        }).then(function () { vote.el.disabled = false; });
        return;
      }

      var original = find("data-sg-original");
      if (original && original.item) {
        var box = mount.querySelector('[data-sg-body-of="' + original.id + '"]');
        var head = original.el.closest(".sg_card").querySelector(".sg_title");
        // 제목은 배지를 남기고 글자만 되돌린다.
        head.childNodes[0].nodeValue = original.item.title;
        box.innerHTML = escapeHtml(original.item.body).replace(/\n/g, "<br>");
        box.classList.add("is_original");
        original.el.remove();
        return;
      }

      var edit = find("data-sg-edit");
      if (edit && edit.item) { openAsk("edit", edit.item); return; }

      var remove = find("data-sg-delete");
      if (remove && remove.item) { openAsk("delete", remove.item); return; }

      var status = find("data-sg-status");
      if (status && status.item) openAsk("status", status.item);
    });

    /* ── 정렬 · 거르기 ─────────────────────────────────────────────────── */

    function buildFilters() {
      var all = '<button type="button" class="sg_tab is_on" data-sg-filter="" data-i18n="sug.filter.all">All</button>';
      filtersBox.innerHTML = all + STATUSES.map(function (s) {
        return '<button type="button" class="sg_tab" data-sg-filter="' + s + '">' +
          escapeHtml(statusLabel(s)) + "</button>";
      }).join("");
    }

    filtersBox.addEventListener("click", function (event) {
      var button = event.target.closest && event.target.closest("[data-sg-filter]");
      if (!button) return;
      filter = button.getAttribute("data-sg-filter");
      Array.prototype.forEach.call(filtersBox.children, function (b) {
        b.classList.toggle("is_on", b === button);
      });
      load(true);
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-sg-sort]"), function (button) {
      button.addEventListener("click", function () {
        sort = button.getAttribute("data-sg-sort");
        Array.prototype.forEach.call(document.querySelectorAll("[data-sg-sort]"), function (b) {
          b.classList.toggle("is_on", b === button);
        });
        load(true);
      });
    });

    moreButton.addEventListener("click", function () {
      moreButton.disabled = true;
      load(false).then(function () { moreButton.disabled = false; });
    });

    // 언어를 바꾸면 번역본과 상태 이름이 그 언어로 다시 그려져야 한다.
    document.addEventListener("destiny-lang-change", function () {
      buildFilters();
      applyI18n(filtersBox);
      render();
    });

    buildFilters();
    applyI18n(filtersBox);
    load(true);
  });
})();
