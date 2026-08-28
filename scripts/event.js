/**
 * 이벤트 페이지 탭.
 *
 * - 주소의 #해시로 특정 이벤트를 바로 열 수 있다. 디스코드에 링크를 붙일 때 필요하다.
 * - 좌우 방향키로 탭을 옮길 수 있게 해 둔다(WAI-ARIA 탭 패턴).
 * - JS 가 실패해도 내용은 남아야 하므로, 숨기는 일은 여기서 처음 시작한다.
 *   HTML 에는 모든 패널이 펼쳐진 채로 들어 있다.
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var tablist = document.querySelector("[data-event-tablist]");
    if (!tablist) return;

    var tabs = Array.prototype.slice.call(tablist.querySelectorAll("[data-event-tab]"));
    var panels = Array.prototype.slice.call(document.querySelectorAll("[data-event-panel]"));
    if (!tabs.length || !panels.length) return;

    function panelFor(id) {
      for (var i = 0; i < panels.length; i += 1) {
        if (panels[i].dataset.eventPanel === id) return panels[i];
      }
      return null;
    }

    function select(id, options) {
      var target = panelFor(id);
      if (!target) return false;

      tabs.forEach(function (tab) {
        var on = tab.dataset.eventTab === id;
        tab.setAttribute("aria-selected", String(on));
        // 선택된 탭만 Tab 키 순회에 남긴다. 나머지는 방향키로 옮긴다.
        tab.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (panel) {
        panel.hidden = panel.dataset.eventPanel !== id;
      });

      if (options && options.focus) {
        var active = tablist.querySelector('[data-event-tab="' + id + '"]');
        if (active) active.focus();
      }
      if (options && options.push && window.history.replaceState) {
        window.history.replaceState(null, "", "#" + id);
      }
      return true;
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        select(tab.dataset.eventTab, { push: true });
      });
    });

    tablist.addEventListener("keydown", function (event) {
      var index = tabs.indexOf(document.activeElement);
      if (index < 0) return;

      var next = null;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      if (next === null) return;

      event.preventDefault();
      select(tabs[next].dataset.eventTab, { focus: true, push: true });
    });

    // 해시가 있으면 그 이벤트를, 없으면 첫 번째(가장 최근)를 연다.
    var fromHash = window.location.hash.replace(/^#/, "");
    if (!fromHash || !select(fromHash)) select(tabs[0].dataset.eventTab);

    window.addEventListener("hashchange", function () {
      var id = window.location.hash.replace(/^#/, "");
      if (id) select(id);
    });
  });
})();
