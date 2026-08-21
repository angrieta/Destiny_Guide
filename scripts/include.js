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
    if (label) {
        // 언어가 바뀌어도 맞는 라벨이 나오도록 키를 갱신하고 i18n 에 다시 맡긴다
        const key = isDark ? "header.theme.light" : "header.theme.dark";
        label.dataset.i18n = key;
        label.dataset.i18nOriginal = isDark ? "Light" : "Dark";
        label.textContent = label.dataset.i18nOriginal;
        window.DestinyI18n?.hydrate(label.parentElement ?? label);
    }
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

function formatHappyHourClock(milliseconds) {
    const secondsTotal = Math.max(0, Math.ceil(milliseconds / 1000));
    const hours = Math.floor(secondsTotal / 3600);
    const minutes = Math.floor((secondsTotal % 3600) / 60);
    const seconds = secondsTotal % 60;
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function getHappyHourHeaderState(data, now) {
    const anchor = Date.parse(data?.windowStart);
    const cycle = Number(data?.cycleMinutes) * 60 * 1000;
    const duration = Number(data?.durationMinutes) * 60 * 1000;
    if (!Number.isFinite(anchor) || !Number.isFinite(cycle) || cycle <= 0 || !Number.isFinite(duration) || duration <= 0) return null;
    if (now < anchor) return { active: false, target: anchor };

    const cycleIndex = Math.floor((now - anchor) / cycle);
    const currentStart = anchor + cycleIndex * cycle;
    const active = now < currentStart + duration;
    return {
        active,
        target: active ? currentStart + duration : currentStart + cycle
    };
}

function setupHappyHourHeader(mount) {
    const widget = mount.querySelector("#header-hh");
    if (!widget) return;

    const label = widget.querySelector(".happy_hour_header_label");
    const time = widget.querySelector(".happy_hour_header_time");
    let data = null;

    const translate = (key, fallback) => window.DestinyI18n?.t(key, fallback) ?? fallback;
    const render = () => {
        const state = getHappyHourHeaderState(data, Date.now());
        if (!state) {
            widget.dataset.state = "unavailable";
            label.textContent = "HH";
            time.textContent = "--:--:--";
            widget.setAttribute("aria-label", translate("header.hh.unavailable", "Open Happy Hour schedule"));
            return;
        }

        widget.dataset.state = state.active ? "active" : "upcoming";
        label.textContent = state.active ? "HH" : "NEXT HH";
        time.textContent = formatHappyHourClock(state.target - Date.now());
        widget.setAttribute("aria-label", state.active
            ? translate("header.hh.active", "Happy Hour active, open schedule")
            : translate("header.hh.next", "Time until next Happy Hour, open schedule"));
    };

    const refresh = () => fetch("./data/happy-hour.json?v=" + Date.now(), { cache: "no-store" })
        .then((response) => {
            if (!response.ok) throw new Error(`Happy Hour request failed: ${response.status}`);
            return response.json();
        })
        .then((payload) => {
            data = payload;
            render();
        })
        .catch(() => render());

    refresh();
    window.setInterval(render, 1000);
    window.setInterval(refresh, 60 * 1000);
    document.addEventListener("destiny-lang-change", render);
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

        // 헤더는 여기서 처음 DOM 에 들어오므로, 번역과 언어 선택기를 지금 연결한다.
        // i18n.js 가 먼저 로드되지 않았더라도(순서 문제) 아래에서 안전하게 넘어간다.
        window.DestinyI18n?.hydrate(mount);
        setupHappyHourHeader(mount);

        const toggle = mount.querySelector(".theme_toggle");
        toggle?.addEventListener("click", () => {
            const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
            applyTheme(nextTheme, true);
        });
    } catch (error) {
        console.error("Unable to load the site header.", error);
    }
});
