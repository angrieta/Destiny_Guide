/**
 * 패치 버전 전환.
 *
 * 버전 탭을 누르면 그 버전의 패널만 남기고 주소를 #v0945 로 바꾼다. 주소를 그대로
 * 복사해 보내면 상대도 같은 버전을 열게 된다. 스크립트가 죽어도 첫 패널은 이미
 * 열려 있고 나머지는 hidden 이라, 최신 버전은 어떤 경우에도 읽힌다.
 */
(function () {
    "use strict";

    function ready(run) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", run, { once: true });
        } else {
            run();
        }
    }

    ready(function () {
        var list = document.querySelector(".up_vers");
        if (!list) return;

        var tabs = Array.prototype.slice.call(list.querySelectorAll(".up_ver_tab"));
        var panels = Array.prototype.slice.call(document.querySelectorAll(".up_ver"));
        if (!tabs.length || !panels.length) return;

        function panelOf(version) {
            for (var i = 0; i < panels.length; i += 1) {
                if (panels[i].dataset.ver === version) return panels[i];
            }
            return null;
        }

        // focus 는 탭을 눌렀을 때만 옮긴다. 주소로 들어온 경우까지 옮기면
        // 페이지가 열리자마자 탭 줄로 스크롤이 튄다.
        function show(version, moveFocus) {
            if (!panelOf(version)) return false;

            tabs.forEach(function (tab) {
                var on = tab.dataset.ver === version;
                tab.classList.toggle("is-on", on);
                tab.setAttribute("aria-selected", String(on));
                tab.tabIndex = on ? 0 : -1;
                if (on && moveFocus) tab.focus();
            });

            panels.forEach(function (panel) {
                panel.hidden = panel.dataset.ver !== version;
            });

            return true;
        }

        list.addEventListener("click", function (event) {
            var tab = event.target.closest(".up_ver_tab");
            if (!tab || !show(tab.dataset.ver, false)) return;
            // 스크롤을 건드리지 않고 주소만 바꾼다. 탭은 제자리에 있어야 계속 누를 수 있다.
            history.replaceState(null, "", "#v" + tab.dataset.ver);
        });

        // 좌우 방향키로 버전을 넘긴다. Home/End 는 최신/최고참으로 간다.
        list.addEventListener("keydown", function (event) {
            var current = tabs.indexOf(document.activeElement.closest(".up_ver_tab"));
            if (current === -1) return;

            var next = null;
            if (event.key === "ArrowRight") next = (current + 1) % tabs.length;
            else if (event.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = tabs.length - 1;
            if (next === null) return;

            event.preventDefault();
            show(tabs[next].dataset.ver, true);
            history.replaceState(null, "", "#v" + tabs[next].dataset.ver);
        });

        function fromHash() {
            var match = /^#v(\d{4})$/.exec(location.hash);
            if (match) show(match[1], false);
        }

        window.addEventListener("hashchange", fromHash);
        fromHash();
    });
})();
