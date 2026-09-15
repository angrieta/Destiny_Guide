/* One history entry per open dialog: Back closes it, Forward restores it. */
(function () {
  "use strict";
  if (typeof window === "undefined" || window.DestinyModalHistory) return;
  const key = "__destinyDialog";
  const page = Math.random().toString(36).slice(2);
  const entries = new Map();
  let active = [], sequence = 0, pending = false, queued = [];

  function syncLock() {
    document.documentElement.classList.toggle("destiny-dialog-open", active.length > 0);
  }
  function tokens(state) {
    return state?.[key]?.page === page ? state[key].tokens : [];
  }
  function stateWith(ids) {
    const state = { ...window.history.state };
    if (ids.length) state[key] = { page, tokens: ids };
    else delete state[key];
    return state;
  }
  // A reload must not keep an entry referring to callbacks from the old document.
  if (window.history.state?.[key]) window.history.replaceState(stateWith([]), "");

  window.addEventListener("popstate", function (event) {
    const previous = active;
    active = tokens(event.state).filter(id => entries.has(id));
    pending = false;
    syncLock();
    previous.slice().reverse().forEach(id => {
      if (!active.includes(id)) entries.get(id).hide();
    });
    active.forEach(id => {
      if (!previous.includes(id)) {
        const entry = entries.get(id);
        entry.show(...entry.args);
      }
    });
    const work = queued;
    queued = [];
    work.forEach(run => run());
  });

  const api = {
    get pending() { return pending; },
    bind(id, show, hide, root) {
      const controls = {
        open(...args) {
          if (pending) { queued.push(() => controls.open(...args)); return; }
          const current = active.find(token => entries.get(token).id === id);
          if (current) {
            entries.get(current).args = args;
            show(...args);
            return;
          }
          if (show(...args) === false) return;
          const token = ++sequence;
          entries.set(token, { id, show, hide, args, root });
          active = [...active, token];
          syncLock();
          window.history.pushState(stateWith(active), "", window.location.href);
        },
        close() {
          if (pending) return;
          const token = active.at(-1);
          if (!token || entries.get(token).id !== id) return;
          hide();
          if (tokens(window.history.state).at(-1) === token) {
            pending = true;
            window.history.back();
          } else {
            active = active.filter(value => value !== token);
            syncLock();
          }
        }
      };
      return controls;
    },
    // Follow an in-dialog link after consuming dialog entries, never race Back
    // against a new page navigation. Modified clicks still use native behavior.
    navigate(url) {
      if (!active.length) { window.location.assign(url); return; }
      queued.push(() => api.navigate(url));
      if (pending) return;
      const token = active.at(-1);
      entries.get(token).hide();
      pending = true;
      window.history.back();
    }
  };
  document.addEventListener("click", function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.("a[href]");
    const entry = entries.get(active.at(-1));
    if (!link || !entry?.root?.contains(link) || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
    if (!/^https?:$/.test(new URL(link.href).protocol)) return;
    event.preventDefault();
    api.navigate(link.href);
  });
  window.DestinyModalHistory = api;
})();
