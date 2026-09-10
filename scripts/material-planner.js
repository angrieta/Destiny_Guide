(function () {
  'use strict';
  var mount = document.querySelector('[data-planner]');
  if (!mount) return;
  var routes = {}, recipes = [], selected = '', inventory = {}, saved = true;
  var storageKey = 'destiny-material-inventory-v1';
  try { inventory = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch (_) { saved = false; }
  var t = function (key, fallback) { return window.DestinyI18n ? window.DestinyI18n.t(key, fallback) : fallback; };
  var norm = function (value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); };
  var esc = function (value) { return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
  var qty = function (value) { return Math.min(99999, Math.max(0, Math.floor(Number(value) || 0))); };
  function recipe() { return recipes.find(function (item) { return item.id === selected; }); }
  function updateCounts() {
    var current = recipe(), remaining = 0;
    if (!current) return;
    current.ingredients.forEach(function (ingredient, i) {
      var missing = Math.max(0, ingredient.qty - qty(inventory[norm(ingredient.item)]));
      remaining += missing;
      var output = mount.querySelector('[data-missing="' + i + '"]');
      output.textContent = String(missing);
      output.closest('tr').classList.toggle('is-complete', missing === 0);
    });
    var summary = mount.querySelector('[data-plan-summary]');
    summary.textContent = t('planner.remaining', 'Materials still needed') + ': ' + remaining +
      (current.recipeComplete === false ? ' · ' + t('verified.partialShort', 'Partial list') : '') +
      (current.status === 'planned' ? ' · ' + t('verified.planned', 'Announced · not yet available') : '');
    mount.querySelector('[data-plan-storage]').textContent = t(saved ? 'planner.saved' : 'planner.unsaved', saved ? 'Saved in this browser. Shared links contain the target, not your inventory.' : 'Browser storage is unavailable. Counts will last only while this page stays open.');
  }
  function render() {
    var current = recipe();
    if (!current) return;
    mount.innerHTML = '<label for="plan-target">' + esc(t('planner.target', 'Target item')) + '</label>' +
      '<select id="plan-target">' + recipes.map(function (item) {
        return '<option value="' + esc(item.id) + '"' + (item.id === selected ? ' selected' : '') + '>' + esc(item.name) + (item.status === 'planned' ? ' — ' + esc(t('verified.plannedShort','Planned')) : '') + '</option>';
      }).join('') + '</select>' +
      '<p class="g_source">' + esc((current.obtain || []).map(function (line, i) { return t('cat.' + current.id + '.obtain.' + i, line); }).join(' ')) + '</p>' +
      (current.status === 'issue' ? '<p class="verified_note" data-status="issue">' + esc(t('verified.issue','Known issue') + ': ' + (current.notes || []).map(function (line, i) { return t('cat.' + current.id + '.notes.' + i, line); }).join(' ')) + '</p>' : '') +
      (current.recipeComplete === false ? '<p class="verified_note" data-status="issue">' + esc(t('verified.partial', 'Partial material list. Confirm the missing materials with the NPC before farming.')) + '</p>' : '') +
      (current.baseItem ? '<p class="verified_note">' + esc(t('planner.secondStep', 'After crafting the ore, combine it with the base weapon:')) + ' <strong>' + esc(current.baseItem) + '</strong> → <strong>' + esc(current.resultItem) + '</strong></p>' : '') +
      '<div class="g_scroll"><table class="g_table plan_table"><thead><tr>' +
      ['material','need','owned','missing','find'].map(function (key, i) { return '<th scope="col">' + esc(t('planner.'+key,['Material','Required','Owned','Missing','Find'][i])) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      current.ingredients.map(function (ingredient, i) {
        return '<tr><th scope="row"><label for="plan-owned-' + i + '">' + esc(ingredient.item) + '</label></th><td data-label="' + esc(t('planner.need','Required')) + '">' + ingredient.qty + '</td><td data-label="' + esc(t('planner.owned','Owned')) + '"><input id="plan-owned-' + i + '" data-owned="' + i + '" aria-label="' + esc(ingredient.item + ' · ' + t('planner.owned','Owned')) + '" type="number" inputmode="numeric" min="0" max="99999" step="1" value="' + qty(inventory[norm(ingredient.item)]) + '"></td><td data-label="' + esc(t('planner.missing','Missing')) + '"><strong data-missing="' + i + '"></strong></td><td><a href="./' + esc(routes[norm(ingredient.item)] || ('drop-tables/?item=' + encodeURIComponent(ingredient.item))) + '">' + esc(t('planner.find','Find')) + ' →</a></td></tr>';
      }).join('') + '</tbody></table></div><p class="g_source">' + esc(t('planner.dropNote','The drop table covers normal drops. Check the recipe source for quest rewards and NPC exchanges.')) + '</p>' +
      '<p data-plan-summary role="status" aria-live="polite"></p><p class="g_source" data-plan-storage></p>' +
      '<div class="guide_actions"><button type="button" data-plan-share>' + esc(t('planner.share','Copy target link')) + '</button>' +
      (current.source ? '<a href="' + esc(current.source) + '" target="_blank" rel="noreferrer">' + esc(t('verified.source','Official source')) + '</a>' : '') +
      (current.scheduleSource ? '<a href="' + esc(current.scheduleSource) + '" target="_blank" rel="noreferrer">' + esc(t('planner.schedule','Release schedule')) + '</a>' : '') + '</div><p role="status" data-plan-copy></p>';
    updateCounts();
  }
  mount.addEventListener('change', function (event) {
    if (event.target.id !== 'plan-target') return;
    selected = event.target.value;
    var url = new URL(location.href); url.searchParams.set('target', selected); url.hash = 'planner';
    history.replaceState(null, '', url); render();
  });
  mount.addEventListener('input', function (event) {
    if (!event.target.matches('[data-owned]')) return;
    var ingredient = recipe().ingredients[Number(event.target.dataset.owned)];
    inventory[norm(ingredient.item)] = qty(event.target.value);
    try { localStorage.setItem(storageKey, JSON.stringify(inventory)); saved = true; } catch (_) { saved = false; }
    updateCounts();
  });
  mount.addEventListener('click', async function (event) {
    if (!event.target.closest('[data-plan-share]')) return;
    var url = new URL(location.href); url.searchParams.set('target', selected); url.hash = 'planner';
    var status = mount.querySelector('[data-plan-copy]');
    try { await navigator.clipboard.writeText(url.href); status.textContent = t('planner.copied','Target link copied.'); }
    catch (_) { status.textContent = url.href; }
  });
  document.addEventListener('destiny-recipes-ready', function (event) {
    recipes = event.detail.recipes;
    routes = event.detail.materialRoutes || {};
    selected = new URL(location.href).searchParams.get('target') || 'miracle-chain';
    if (!recipe()) selected = recipes[0]?.id;
    render();
  });
  document.addEventListener('destiny-lang-change', render);
})();
