(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        var popup = document.getElementById("gPopup");
        if (!popup) return;
        popup.setAttribute("role", "dialog");
        popup.setAttribute("aria-modal", "true");
        popup.setAttribute("aria-hidden", "true");
        if (!popup.hasAttribute("aria-label")) popup.setAttribute("aria-label", "Image preview");

        var popupImage = popup.querySelector("img");
        var closeButton = popup.querySelector(".g_popup_close");
        var backdrop = popup.querySelector(".g_popup_dim");
        var lastTrigger = null;

        function showPopup(trigger) {
            lastTrigger = trigger;
            popupImage.src = trigger.currentSrc || trigger.src;
            popupImage.alt = trigger.alt || "";
            popup.classList.add("active");
            popup.setAttribute("aria-hidden", "false");
            document.body.style.overflow = "hidden";
            closeButton.focus({ preventScroll: true });
        }

        function hidePopup() {
            if (!popup.classList.contains("active")) return;
            popup.classList.remove("active");
            popup.setAttribute("aria-hidden", "true");
            document.body.style.overflow = "";
            if (lastTrigger) lastTrigger.focus({ preventScroll: true });
        }

        var historyDialog = window.DestinyModalHistory?.bind('guide-image', showPopup, hidePopup, popup);
        var openPopup = historyDialog ? (...args) => historyDialog.open(...args) : showPopup;
        var closePopup = historyDialog ? () => historyDialog.close() : hidePopup;

        document.querySelectorAll(".g_fig img").forEach(function (image) {
            image.setAttribute("tabindex", "0");
            image.setAttribute("role", "button");
            image.addEventListener("click", function () { openPopup(image); });
            image.addEventListener("keydown", function (event) {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openPopup(image);
                }
            });
        });

        closeButton.addEventListener("click", closePopup);
        backdrop.addEventListener("click", closePopup);
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") closePopup();
        });
    });
})();
