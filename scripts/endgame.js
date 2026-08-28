/**
 * 퀘스트 난이도 인덱스.
 *
 * 표를 HTML 에 손으로 쓰지 않고 data/quest-difficulty.json 에서 그린다.
 * 목록이 100줄에 가깝고 원본(디스코드 #difficulty-of-quests)이 계속 갱신되므로,
 * 갱신할 때 JSON 한 곳만 고치면 되게 해 둔다.
 *
 * 데이터를 못 받으면 표 대신 안내와 원본 링크를 남긴다. 빈 화면으로 두지 않는다.
 */
(function () {
  "use strict";

  var DATA_URL = "./data/quest-difficulty.json";
  var VIDEO_URL = "./data/quest-videos.json";
  var DISCORD_BASE = "https://discord.com/channels/363947585154580480/";

  function t(key, fallback) {
    return (window.DestinyI18n && window.DestinyI18n.t(key, fallback)) || fallback;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function tierOf(star) {
    if (star >= 9) return "high";
    if (star >= 6) return "mid";
    if (star >= 3) return "low";
    return "starter";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var mount = document.querySelector("[data-endgame-mount]");
    if (!mount) return;

    var countEl = document.querySelector("[data-endgame-count]");
    var quests = [];
    var videosByQuest = {};
    var videoChannels = {};
    var state = { tier: "all", ep: "all", kind: "all", sort: "star", direction: "desc" };

    function matches(quest) {
      if (state.tier !== "all" && tierOf(quest.star) !== state.tier) return false;
      if (state.ep !== "all" && (quest.ep || "") !== state.ep) return false;
      if (state.kind === "raid" && !quest.raid) return false;
      if (state.kind === "event" && !quest.tag) return false;
      // 상시 콘텐츠 = 이벤트 태그가 없는 것. 지금 바로 갈 수 있는 것만 보고 싶을 때 쓴다.
      if (state.kind === "year" && quest.tag) return false;
      if (state.kind === "guide" && !quest.guide) return false;
      if (state.kind === "video" && !videosByQuest[quest.name]) return false;
      return true;
    }

    function sorted(list) {
      var copy = list.slice();
      copy.sort(function (a, b) {
        if (state.sort === "name") {
          var byName = a.name.localeCompare(b.name);
          return state.direction === "asc" ? byName : -byName;
        }
        if (a.star !== b.star) return state.direction === "asc" ? a.star - b.star : b.star - a.star;
        // 같은 난이도 안에서는 이름순으로 고정해야 다시 그릴 때 순서가 흔들리지 않는다.
        return a.name.localeCompare(b.name);
      });
      return copy;
    }

    function render() {
      var visible = sorted(quests.filter(matches));

      if (countEl) countEl.textContent = visible.length + " / " + quests.length;

      if (!visible.length) {
        mount.innerHTML = '<p class="eg_empty">' + escapeHtml(t("eg.empty", "Nothing matches this combination of filters.")) + "</p>";
        return;
      }

      var rows = visible
        .map(function (quest) {
          var tier = tierOf(quest.star);
          var tags = [];
          if (quest.raid) tags.push('<span class="eg_type eg_type_raid">' + escapeHtml(t("eg.type.raid", "Raid")) + "</span>");
          if (quest.tag) tags.push('<span class="eg_type eg_type_event">' + escapeHtml(quest.tag) + "</span>");
          if (!quest.raid && !quest.tag) tags.push('<span class="eg_type">' + escapeHtml(t("eg.type.year", "Year-round")) + "</span>");

          var note = quest.note === "secretRoute6" ? t("eg.note.secret6", "Secret route is rated 6") : "";

          // 영상은 디스코드 메시지로 나간다. 첨부파일이라 사이트에 임베드할 방법이 없다.
          var clips = videosByQuest[quest.name] || [];
          var videoCell = clips.length
            ? clips
                .map(function (clip) {
                  var url = DISCORD_BASE + (videoChannels[clip.ch] || "") + "/" + clip.msg;
                  var title = clip.label + (clip.credit ? " — " + clip.credit : "");
                  return (
                    '<a class="eg_clip" href="' + escapeHtml(url) + '" target="_blank" rel="noreferrer" title="' +
                    escapeHtml(title) + '">▶ ' + escapeHtml(clip.label) + "</a>"
                  );
                })
                .join(" ")
            : "—";

          return (
            '<tr class="eg_row">' +
            '<td><span class="eg_star" data-tier="' + tier + '">★' + quest.star + "</span></td>" +
            '<td class="eg_name">' + escapeHtml(quest.name) + "</td>" +
            "<td>" + (quest.ep ? escapeHtml(quest.ep) : "—") + "</td>" +
            '<td class="eg_tags">' + tags.join(" ") + "</td>" +
            '<td class="eg_clips">' + videoCell + "</td>" +
            '<td class="eg_note">' + escapeHtml(note) + "</td>" +
            "<td>" +
            (quest.guide
              ? '<a class="eg_link" href="' + escapeHtml(quest.guide) + '">' + escapeHtml(t("eg.open", "Open")) + "</a>"
              : "—") +
            "</td>" +
            "</tr>"
          );
        })
        .join("");

      mount.innerHTML =
        '<div class="g_scroll"><table class="g_table g_mid eg_table">' +
        "<thead><tr>" +
        '<th data-sort="star" aria-sort="' + (state.sort === "star" ? (state.direction === "asc" ? "ascending" : "descending") : "none") + '">★</th>' +
        '<th data-sort="name" aria-sort="' + (state.sort === "name" ? (state.direction === "asc" ? "ascending" : "descending") : "none") + '">' + escapeHtml(t("eg.th.name", "Quest")) + "</th>" +
        "<th>" + escapeHtml(t("eg.th.ep", "Episode")) + "</th>" +
        "<th>" + escapeHtml(t("eg.th.kind", "Availability")) + "</th>" +
        "<th>" + escapeHtml(t("eg.th.video", "Video")) + "</th>" +
        "<th>" + escapeHtml(t("eg.th.notes", "Notes")) + "</th>" +
        "<th>" + escapeHtml(t("eg.th.guide", "Guide")) + "</th>" +
        "</tr></thead><tbody>" +
        rows +
        "</tbody></table></div>";

      mount.querySelectorAll("th[data-sort]").forEach(function (header) {
        header.addEventListener("click", function () {
          var key = header.dataset.sort;
          if (state.sort === key) state.direction = state.direction === "asc" ? "desc" : "asc";
          else {
            state.sort = key;
            state.direction = key === "star" ? "desc" : "asc";
          }
          render();
        });
      });
    }

    // 칩 묶음마다 하나만 선택되게 한다.
    ["tier", "ep", "kind"].forEach(function (group) {
      var chips = Array.prototype.slice.call(document.querySelectorAll("[data-endgame-" + group + "]"));
      chips.forEach(function (chip) {
        chip.addEventListener("click", function () {
          state[group] = chip.dataset["endgame" + group.charAt(0).toUpperCase() + group.slice(1)];
          chips.forEach(function (other) {
            other.setAttribute("aria-pressed", String(other === chip));
          });
          render();
        });
      });
    });

    // 영상 목록은 있으면 좋은 정보다. 못 받아도 난이도 표는 그대로 나와야 하므로
    // 실패를 삼키고 빈 맵으로 넘어간다.
    var videoLoad = fetch(VIDEO_URL, { cache: "no-cache" })
      .then(function (response) {
        if (!response.ok) throw new Error("video data " + response.status);
        return response.json();
      })
      .then(function (payload) {
        videoChannels = payload.channels || {};
        (payload.videos || []).forEach(function (clip) {
          (videosByQuest[clip.quest] = videosByQuest[clip.quest] || []).push(clip);
        });
        var stamp = document.querySelector("[data-video-updated]");
        if (stamp && payload.indexUpdated) stamp.textContent = payload.indexUpdated;
        var total = document.querySelector("[data-video-count]");
        if (total) total.textContent = String((payload.videos || []).length + (payload.hunts || []).length);
      })
      .catch(function (error) {
        console.warn("[endgame] 영상 색인을 불러오지 못했습니다.", error);
      });

    Promise.all([
      fetch(DATA_URL, { cache: "no-cache" }).then(function (response) {
        if (!response.ok) throw new Error("quest data " + response.status);
        return response.json();
      }),
      videoLoad,
    ])
      .then(function (results) {
        var payload = results[0];
        quests = payload.quests || [];
        var stamp = document.querySelector("[data-endgame-updated]");
        if (stamp && payload.updated) stamp.textContent = payload.updated;
        render();
        document.addEventListener("destiny-lang-change", render);
      })
      .catch(function (error) {
        console.warn("[endgame] 난이도 표를 불러오지 못했습니다.", error);
        mount.innerHTML =
          '<p class="eg_empty">' +
          escapeHtml(t("eg.loadFail", "The difficulty table could not be loaded. The original list lives in the difficulty-of-quests channel on Discord.")) +
          "</p>";
      });
  });
})();
