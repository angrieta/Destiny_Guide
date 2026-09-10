(function () {
  'use strict';
  var key = 'destiny-start-checklist-v1', state = {};
  try { state = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (_) {}
  document.querySelectorAll('[data-guide-check]').forEach(function (input) {
    input.checked = state[input.dataset.guideCheck] === true;
    input.addEventListener('change', function () {
      state[input.dataset.guideCheck] = input.checked;
      try { localStorage.setItem(key, JSON.stringify(state)); } catch (_) {}
    });
  });
})();
