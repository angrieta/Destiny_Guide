(function () {
    "use strict";
    var step = 1, buttons = Array.from(document.querySelectorAll("[data-step]"));
    function t(key) {
        var en = (window.DESTINY_REVISION_COPY || {})[key] || key;
        return window.DestinyI18n ? window.DestinyI18n.t(key,en) : en;
    }
    function render() {
        buttons.forEach(function (button) {
            var active = Number(button.dataset.step) === step;
            button.classList.toggle("is-active",active); button.setAttribute("aria-pressed",String(active));
        });
        document.getElementById("pb-step-title").textContent = t("pb.step"+step);
        document.getElementById("pb-step-body").textContent = t("pb.step"+step+"Body");
    }
    buttons.forEach(function (button) { button.addEventListener("click",function () { step=Number(button.dataset.step); render(); }); });
    document.addEventListener("destiny-lang-change",render);
    render();
})();
