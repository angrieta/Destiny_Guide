const THEME_STORAGE_KEY = "destiny-guide-theme";

function getPreferredTheme() {
    let savedTheme = null;
    try {
        savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    } catch (error) {
        console.warn("Theme preference storage is unavailable.", error);
    }
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function updateThemeToggle(theme) {
    const toggle = document.querySelector(".theme_toggle");
    if (!toggle) return;

    const isDark = theme === "dark";
    toggle.setAttribute("aria-pressed", String(isDark));
    toggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");

    const label = toggle.querySelector(".theme_toggle_label");
    if (label) label.textContent = isDark ? "Light" : "Dark";
}

function applyTheme(theme, persist = false) {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    if (persist) {
        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch (error) {
            console.warn("Theme preference could not be saved.", error);
        }
    }
    updateThemeToggle(theme);
}

applyTheme(getPreferredTheme());

document.addEventListener("DOMContentLoaded", async () => {
    const mount = document.getElementById("site-header");
    if (!mount) return;

    try {
        const res = await fetch("./header.html");
        if (!res.ok) throw new Error(`Header request failed: ${res.status}`);

        mount.innerHTML = await res.text();
        updateThemeToggle(document.documentElement.dataset.theme);

        const toggle = mount.querySelector(".theme_toggle");
        toggle?.addEventListener("click", () => {
            const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
            applyTheme(nextTheme, true);
        });
    } catch (error) {
        console.error("Unable to load the site header.", error);
    }
});
