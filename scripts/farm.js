/**
 * 조합 브라우저와 Section ID 파밍 추천.
 *
 * 두 페이지가 데이터 모양만 다르고 동작이 비슷해서 한 파일로 둔다.
 * 페이지에 어떤 마운트 지점이 있는지 보고 필요한 쪽만 켠다.
 *
 * 데이터를 못 받으면 표 대신 안내를 남긴다. 빈 화면으로 두지 않는다.
 */
(function () {
  "use strict";

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

  function normalize(value) {
    return String(value == null ? "" : value)
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function failed(mount, key, fallback) {
    mount.innerHTML = '<p class="fm_empty">' + escapeHtml(t(key, fallback)) + "</p>";
  }

  /* ── 조합 브라우저 ──────────────────────────────────────────────────── */

  function setupRecipes() {
    var mount = document.querySelector("[data-recipe-mount]");
    if (!mount) return;

    var reverseMount = document.querySelector("[data-reverse-mount]");
    var searchEl = document.querySelector("[data-recipe-search]");
    var countEl = document.querySelector("[data-recipe-count]");
    var forumMount = document.querySelector("[data-forum-mount]");
    var forumCountEl = document.querySelector("[data-forum-count]");
    var forumReverseMount = document.querySelector("[data-forum-reverse-mount]");
    var data = null;
    var forumGroup = "all";

    /**
     * 포럼 조합표. 서버 자체 레시피와 달리 재료 수량이 없고 항상 두 개짜리라
     * 카드가 아니라 표로 둔다. 79줄이라 카드로 깔면 화면이 끝없이 길어진다.
     */
    function renderForum() {
      if (!forumMount || !data || !data.forumGroups) return;
      var query = normalize(searchEl ? searchEl.value : "");

      var total = 0;
      var shown = 0;
      var html = "";

      data.forumGroups.forEach(function (group) {
        total += group.combos.length;
        if (forumGroup !== "all" && forumGroup !== group.key) return;

        // 검색어는 결과물과 재료 양쪽에 걸린다. 조합 페이지에서 가장 잦은 질문이
        // "이 재료 어디 쓰나" 라서 재료로도 찾을 수 있어야 한다.
        var combos = group.combos.filter(function (combo) {
          if (!query) return true;
          if (normalize(combo.result).indexOf(query) >= 0) return true;
          return combo.parts.some(function (part) {
            return normalize(part).indexOf(query) >= 0;
          });
        });
        if (!combos.length) return;
        shown += combos.length;

        html +=
          '<h4 class="fm_group_title">' +
          escapeHtml(group.label) +
          '<span class="fm_group_n">' + combos.length + "</span>" +
          (group.serverOnly
            ? '<span class="fm_badge fm_badge_soft">' + escapeHtml(t("fm.r.serverOnly", "Destiny only")) + "</span>"
            : "") +
          "</h4>" +
          '<div class="g_scroll"><table class="g_table g_mid fm_combo_table">' +
          "<thead><tr>" +
          "<th>" + escapeHtml(t("fm.th.result", "Result")) + "</th>" +
          "<th>" + escapeHtml(t("fm.th.parts", "Materials")) + "</th>" +
          "<th>" + escapeHtml(t("fm.th.needs", "Requires")) + "</th>" +
          "</tr></thead><tbody>" +
          combos
            .map(function (combo) {
              var parts = combo.parts
                .map(function (part) {
                  var uses = data.forumUsedIn[normalize(part)];
                  var shared = uses && uses.results.length > 1;
                  // 배지는 수량이 아니라 "이 재료가 들어가는 조합 수"다. 옆 카드에서는
                  // 수량을 ×25 로 쓰기 때문에 무엇을 세는지 짚어 주지 않으면 오해한다.
                  var label = shared
                    ? t("fm.usedInN", "used in # combinations").replace("#", uses.results.length)
                    : "";
                  return (
                    '<span class="fm_part' + (shared ? " is_shared" : "") + '">' +
                    escapeHtml(part) +
                    (shared
                      ? '<span class="fm_ing_shared" title="' +
                        escapeHtml(label + ": " + uses.results.join(", ")) +
                        '">' + uses.results.length + "</span>"
                      : "") +
                    "</span>"
                  );
                })
                .join('<span class="fm_plus">+</span>');

              var needs = [];
              if (combo.level) needs.push('<span class="fm_lv">Lv ' + combo.level + "</span>");
              if (combo.only) needs.push('<span class="fm_only">' + escapeHtml(combo.only) + "</span>");

              return (
                "<tr>" +
                "<td><strong>" + escapeHtml(combo.result) + "</strong>" +
                (combo.note ? '<span class="fm_note">' + escapeHtml(t(combo.noteKey, combo.note)) + "</span>" : "") +
                "</td>" +
                '<td class="fm_parts">' + parts + "</td>" +
                '<td class="fm_needs">' + (needs.length ? needs.join(" ") : "—") + "</td>" +
                "</tr>"
              );
            })
            .join("") +
          "</tbody></table></div>";
      });

      if (forumCountEl) forumCountEl.textContent = shown + " / " + total;
      forumMount.innerHTML =
        html || '<p class="fm_empty">' + escapeHtml(t("fm.empty", "Nothing matched.")) + "</p>";

      if (!forumReverseMount) return;

      // 두 개 이상의 조합에 들어가는 재료만. Orb of Illusions 하나로 7개가 나온다.
      var shared = Object.keys(data.forumUsedIn)
        .map(function (key) {
          return data.forumUsedIn[key];
        })
        .filter(function (entry) {
          return entry.results.length > 1;
        })
        .filter(function (entry) {
          return !query || normalize(entry.label).indexOf(query) >= 0;
        })
        .sort(function (a, b) {
          return b.results.length - a.results.length || a.label.localeCompare(b.label);
        });

      forumReverseMount.innerHTML = shared.length
        ? '<div class="fm_reverse">' +
          shared
            .map(function (entry) {
              return (
                '<div class="fm_rev_item">' +
                '<h4 class="fm_rev_name">' + escapeHtml(entry.label) +
                '<span class="fm_ing_shared">' + entry.results.length + "</span></h4>" +
                '<p class="fm_rev_uses">' +
                entry.results
                  .map(function (name) {
                    return "<strong>" + escapeHtml(name) + "</strong>";
                  })
                  .join("<br>") +
                "</p></div>"
              );
            })
            .join("") +
          "</div>"
        : '<p class="fm_empty">' + escapeHtml(t("fm.empty", "Nothing matched.")) + "</p>";
    }

    var groupChips = Array.prototype.slice.call(document.querySelectorAll("[data-fm-group]"));
    groupChips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        forumGroup = chip.getAttribute("data-fm-group");
        groupChips.forEach(function (other) {
          other.setAttribute("aria-pressed", String(other === chip));
        });
        renderForum();
      });
    });

    function render() {
      if (!data) return;
      renderForum();
      var query = normalize(searchEl ? searchEl.value : "");

      // 검색어는 결과물 이름과 재료 이름 양쪽에 걸린다.
      // "이 재료가 들어가는 레시피" 를 찾는 쓰임이 더 잦기 때문이다.
      var recipes = data.recipes.filter(function (recipe) {
        if (!query) return true;
        if (normalize(recipe.name).indexOf(query) >= 0) return true;
        return recipe.ingredients.some(function (ing) {
          return normalize(ing.item).indexOf(query) >= 0;
        });
      });

      if (countEl) countEl.textContent = recipes.length + " / " + data.recipes.length;

      if (!recipes.length) {
        mount.innerHTML = '<p class="fm_empty">' + escapeHtml(t("fm.empty", "Nothing matched.")) + "</p>";
      } else {
        mount.innerHTML =
          '<div class="fm_cards">' +
          recipes
            .map(function (recipe) {
              var rows = recipe.ingredients
                .map(function (ing) {
                  var key = normalize(ing.item);
                  var uses = data.usedIn[key];
                  var shared = uses && uses.results.length > 1;
                  // 오른쪽 ×25 는 수량이고, 이 배지는 쓰이는 레시피 수다. 둘이 헷갈리기 쉬워
                  // 배지에서는 × 를 뺐다.
                  var label = shared
                    ? t("fm.usedInN", "used in # combinations").replace("#", uses.results.length)
                    : "";
                  return (
                    '<div class="fm_ing">' +
                    '<span class="fm_ing_name' + (shared ? " is_shared" : "") + '">' +
                    escapeHtml(ing.item) +
                    (shared
                      ? '<span class="fm_ing_shared" title="' +
                        escapeHtml(
                          label + ": " + uses.results.map(function (use) { return use.name; }).join(", "),
                        ) +
                        '">' + uses.results.length + "</span>"
                      : "") +
                    "</span>" +
                    '<span class="fm_qty">×' + ing.qty + "</span>" +
                    "</div>"
                  );
                })
                .join("");

              var obtain = (recipe.obtain || []).length
                ? '<p class="fm_obtain">' + escapeHtml(recipe.obtain.join(" ")) + "</p>"
                : "";

              return (
                '<article class="fm_card">' +
                '<div class="fm_card_head">' +
                '<h3 class="fm_card_name">' + escapeHtml(recipe.name) + "</h3>" +
                (recipe.type ? '<span class="fm_badge">' + escapeHtml(recipe.type) + "</span>" : "") +
                '<span class="fm_badge">' + recipe.ingredients.length + " " + escapeHtml(t("fm.parts", "parts")) + "</span>" +
                "</div>" +
                rows +
                obtain +
                "</article>"
              );
            })
            .join("") +
          "</div>";
      }

      if (!reverseMount) return;

      // 역검색: 두 개 이상의 레시피에 쓰이는 재료만 보여준다.
      // 하나에만 쓰이는 재료는 레시피 카드에서 이미 보이므로 중복이다.
      var shared = Object.keys(data.usedIn)
        .map(function (key) {
          return data.usedIn[key];
        })
        .filter(function (entry) {
          return entry.results.length > 1;
        })
        .filter(function (entry) {
          return !query || normalize(entry.label).indexOf(query) >= 0;
        })
        .sort(function (a, b) {
          return b.results.length - a.results.length || a.label.localeCompare(b.label);
        });

      reverseMount.innerHTML = shared.length
        ? '<div class="fm_reverse">' +
          shared
            .map(function (entry) {
              return (
                '<div class="fm_rev_item">' +
                '<h4 class="fm_rev_name">' + escapeHtml(entry.label) + "</h4>" +
                '<p class="fm_rev_uses">' +
                entry.results
                  .map(function (use) {
                    return "<strong>" + escapeHtml(use.name) + "</strong> ×" + use.qty;
                  })
                  .join("<br>") +
                "</p></div>"
              );
            })
            .join("") +
          "</div>"
        : '<p class="fm_empty">' + escapeHtml(t("fm.empty", "Nothing matched.")) + "</p>";
    }

    if (searchEl) searchEl.addEventListener("input", render);

    fetch("./data/item-recipes.json", { cache: "no-cache" })
      .then(function (response) {
        if (!response.ok) throw new Error("recipes " + response.status);
        return response.json();
      })
      .then(function (payload) {
        data = payload;
        var notes = document.querySelector("[data-obtain-mount]");
        if (notes && payload.obtainNotes.length) {
          notes.innerHTML =
            '<div class="fm_reverse">' +
            payload.obtainNotes
              .map(function (entry) {
                return (
                  '<div class="fm_rev_item">' +
                  '<h4 class="fm_rev_name">' + escapeHtml(entry.name) + "</h4>" +
                  '<p class="fm_rev_uses">' + escapeHtml((entry.obtain || []).join(" ")) + "</p></div>"
                );
              })
              .join("") +
            "</div>";
        }
        render();
        document.addEventListener("destiny-lang-change", render);
      })
      .catch(function (error) {
        console.warn("[farm] 레시피를 불러오지 못했습니다.", error);
        failed(mount, "fm.loadFail", "The data could not be loaded.");
      });
  }

  /* ── Section ID 파밍 ────────────────────────────────────────────────── */

  function setupSectionIds() {
    var mount = document.querySelector("[data-section-mount]");
    if (!mount) return;

    var countEl = document.querySelector("[data-section-count]");
    var searchEl = document.querySelector("[data-section-search]");
    var data = null;
    var state = {
      difficulty: "Ultimate",
      sectionId: "Viridia",
      onlyExclusive: false,
      cat: "all",
      focus: "all",
    };

    /**
     * "우선 보기" 필터. 전부 실제 자료에 근거한 것만 둔다 —
     * 점수와 Hit 등급은 우선순위표, 조합 재료는 조합표에서 온다.
     */
    var FOCUS = {
      all: function () {
        return true;
      },
      top: function (row) {
        return row.score >= 9.5;
      },
      rated: function (row) {
        return Boolean(row.score);
      },
      hit: function (row) {
        return Boolean(row.hit);
      },
      endgame: function (row) {
        return Boolean(row.endgame);
      },
      makes: function (row) {
        return Boolean(row.makes);
      },
    };

    function render() {
      if (!data) return;
      var rows = data.sections[state.difficulty + "|" + state.sectionId] || [];
      var query = normalize(searchEl ? searchEl.value : "");
      var focus = FOCUS[state.focus] || FOCUS.all;

      var visible = rows.filter(function (row) {
        if (state.onlyExclusive && !row.exclusive) return false;
        if (state.cat !== "all" && row.cat !== state.cat) return false;
        if (!focus(row)) return false;
        if (!query) return true;
        // 아이템 이름만으로는 부족하다. "지금 여기서 뭐가 나오나" 를 보려고
        // 몬스터나 지역으로 찾는 쓰임이 실제로 많다.
        return (
          normalize(row.item).indexOf(query) >= 0 ||
          normalize(row.enemy).indexOf(query) >= 0 ||
          normalize(row.area).indexOf(query) >= 0 ||
          (row.makes || []).some(function (name) {
            return normalize(name).indexOf(query) >= 0;
          })
        );
      });

      if (countEl) countEl.textContent = visible.length + " / " + rows.length;

      if (!visible.length) {
        if (rows.length) failed(mount, "fm.empty", "Nothing matched.");
        else failed(mount, "fm.noneHere", "No notable drops recorded for this combination.");
        return;
      }

      mount.innerHTML =
        '<div class="g_scroll"><table class="g_table g_mid">' +
        "<thead><tr>" +
        "<th>" + escapeHtml(t("fm.th.item", "Item")) + "</th>" +
        "<th>" + escapeHtml(t("fm.th.rate", "Rate")) + "</th>" +
        "<th>" + escapeHtml(t("fm.th.enemy", "Enemy")) + "</th>" +
        "<th>" + escapeHtml(t("fm.th.where", "Where")) + "</th>" +
        "<th>" + escapeHtml(t("fm.th.dar", "DAR")) + "</th>" +
        "</tr></thead><tbody>" +
        visible
          .map(function (row) {
            var marks = "";
            if (row.exclusive) marks += ' <span class="fm_excl">' + escapeHtml(t("fm.exclusive", "ID only")) + "</span>";
            if (row.score) marks += ' <span class="fm_score">' + row.score + "</span>";
            if (row.hit) marks += ' <span class="fm_hit">Hit ' + escapeHtml(row.hit) + "</span>";
            if (row.endgame) marks += ' <span class="fm_tag">' + escapeHtml(t("fm.endgame", "Endgame unit")) + "</span>";

            // 조합 재료라면 무엇이 되는지까지 적는다. 이름만 봐서는 알 수 없고,
            // 그게 이 아이템을 주울 이유 전부인 경우가 많다.
            var makes = row.makes
              ? '<span class="fm_makes">→ ' + escapeHtml(row.makes.join(", ")) + "</span>"
              : "";

            return (
              "<tr>" +
              "<td><strong>" + escapeHtml(row.item) + "</strong>" + marks + makes +
              "</td>" +
              '<td class="fm_rate">1/' + row.denominator + "</td>" +
              "<td>" + escapeHtml(row.enemy) + "</td>" +
              '<td class="fm_where">EP' + row.episode + " · " + escapeHtml(row.area) + "</td>" +
              "<td>" + (row.dar ? row.dar + "%" : "—") + "</td>" +
              "</tr>"
            );
          })
          .join("") +
        "</tbody></table></div>";
    }

    [
      ["difficulty", "data-fm-difficulty"],
      ["sectionId", "data-fm-sid"],
      ["cat", "data-fm-cat"],
      ["focus", "data-fm-focus"],
    ].forEach(function (pair) {
      var chips = Array.prototype.slice.call(document.querySelectorAll("[" + pair[1] + "]"));
      chips.forEach(function (chip) {
        chip.addEventListener("click", function () {
          state[pair[0]] = chip.getAttribute(pair[1]);
          chips.forEach(function (other) {
            other.setAttribute("aria-pressed", String(other === chip));
          });
          render();
        });
      });
    });

    if (searchEl) searchEl.addEventListener("input", render);

    var exclusiveToggle = document.querySelector("[data-fm-exclusive]");
    if (exclusiveToggle) {
      exclusiveToggle.addEventListener("click", function () {
        state.onlyExclusive = !state.onlyExclusive;
        exclusiveToggle.setAttribute("aria-pressed", String(state.onlyExclusive));
        render();
      });
    }

    fetch("./data/section-id.json", { cache: "no-cache" })
      .then(function (response) {
        if (!response.ok) throw new Error("section data " + response.status);
        return response.json();
      })
      .then(function (payload) {
        data = payload;
        render();
        document.addEventListener("destiny-lang-change", render);
      })
      .catch(function (error) {
        console.warn("[farm] Section ID 자료를 불러오지 못했습니다.", error);
        failed(mount, "fm.loadFail", "The data could not be loaded.");
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupRecipes();
    setupSectionIds();
  });
})();
