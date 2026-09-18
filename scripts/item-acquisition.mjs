import {acquisitionKey, isAcquisitionPlaceholder} from './acquisition-core.mjs';

const copy = {
  drops: ['Drop routes','드랍 경로','ドロップ経路','Fuentes de drops','Sources de drops'],
  recipes: ['Crafting / exchange','조합 / 교환','合成 / 交換','Combinación / intercambio','Combinaison / échange'],
  materials: ['Material sources','재료 획득 경로','素材の入手方法','Fuentes de materiales','Sources des matériaux'],
  all: ['All Section IDs','전 Section ID','全 Section ID','Todas las Section ID','Toutes les Section ID'],
  source: ['Source','출처','出典','Fuente','Source'],
  more: ['All routes','전체 경로','全経路','Todas las rutas','Toutes les sources'],
  partial: ['Partial material list — confirm the remaining requirements with the NPC.','일부 재료만 확인된 목록입니다. 나머지 조건은 NPC에게 확인하세요.','一部の素材のみ確認済みです。残りの条件は NPC に確認してください。','Lista parcial: confirma el resto con el NPC.','Liste partielle : confirmez le reste auprès du PNJ.'],
  planned: ['Announced — not yet available','발표됨 · 아직 획득 불가','発表済み・未実装','Anunciado; aún no disponible','Annoncé ; pas encore disponible'],
  grind: ['Max grind required; level is based on the highest weapon in its series.','최대 그라인드가 필요합니다. 레벨 조건은 해당 무기 계열의 최상위 무기 기준입니다.','最大グラインドが必要。レベル条件は系列の最上位武器が基準です。','Grindeo máximo; el nivel corresponde al arma superior de la serie.','Grind maximal ; le niveau correspond à la meilleure arme de la série.'],
  unknown: ['No verified route in the linked drop tables or recipes yet.','연결된 드랍표·조합 자료에서 아직 확인하지 못한 경로입니다.','参照したドロップ表・レシピでは未確認です。','Aún no hay una fuente verificada en las tablas o recetas.','Aucune source confirmée dans les tables ou recettes consultées.'],
  snapshot: ['Base rates in the saved drop table; event and quest conditions still apply. Snapshot:','저장된 드랍표의 기본 확률입니다. 이벤트·퀘스트 전용 조건은 별도로 적용됩니다. 자료 기준:','保存した表の基本確率です。イベント・クエスト条件も適用されます。取得日:','Tasas base guardadas; se aplican condiciones de evento y misión. Fecha:','Taux de base enregistrés ; conditions d’événement et de quête applicables. Date :'],
  loading: ['Loading acquisition routes…','획득 경로를 불러오는 중…','入手方法を読み込み中…','Cargando fuentes…','Chargement des sources…'],
  failed: ['Could not load acquisition routes. Reopen the card to retry.','획득 경로를 불러오지 못했습니다. 카드를 다시 열면 재시도합니다.','読み込めませんでした。カードを開き直してください。','No se pudieron cargar. Vuelve a abrir la tarjeta.','Chargement impossible. Rouvrez la fiche.'],
};
const languages = ['en','ko','ja','es','fr'];
export function acquisitionText(key) {
  const index = languages.indexOf(document.documentElement.lang);
  return copy[key][Math.max(0,index)];
}
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link = (href,text) => `<a href="${esc(href)}">${esc(text)}</a>`;
const lookup = name => './drop-tables/?item=' + encodeURIComponent(name);
let pending;
export function loadAcquisition() {
  if (!pending) pending = fetch('./data/item-acquisition.json', {cache:'no-cache'}).then(async response => {
    if (!response.ok) throw new Error('Acquisition data unavailable');
    const data = await response.json();
    if (data.schemaVersion !== 1 || !data.items) throw new Error('Invalid acquisition data');
    return data;
  }).catch(error => {pending = null; throw error;});
  return pending;
}
export function renderAcquisition(data, item, translatedNotes = []) {
  const t = acquisitionText;
  function details(name, seen = new Set()) {
    const key = acquisitionKey(name), entry = data.items[key];
    if (!entry || seen.has(key)) return '<p>' + (!entry ? esc(t('unknown')) + ' ' : '') + link(lookup(name), t('more') + ' →') + '</p>';
    const next = new Set([...seen,key]);
    let html = '';
    if (entry.notes.length) html += '<ul>' + entry.notes.map(note => '<li>' + esc(note[document.documentElement.lang] || note.en) + ' ' + link(note.source,t('source')) + '</li>').join('') + '</ul>';
    if (entry.recipes.length) html += `<h4>${esc(t('recipes'))}</h4>` + entry.recipes.map(recipe => {
      let body = recipe.status === 'planned' ? `<p class="acquisition_notice">${esc(t('planned'))}</p>` : '';
      body += '<p>' + recipe.ingredients.map(part => esc(part.item) + ' ×' + part.qty).join(' + ') + ' → <strong>' + esc(name) + '</strong></p>';
      if (recipe.level || recipe.only) body += '<p>' + esc([recipe.level ? 'Lv ' + recipe.level : '', recipe.only].filter(Boolean).join(' · ')) + '</p>';
      if (recipe.kind === 'combination') body += `<p>${esc(t('grind'))}</p>`;
      if (recipe.recipeComplete === false) body += `<p class="acquisition_notice">${esc(t('partial'))}</p>`;
      // Root prose is localized by the catalog. Nested recipes also need their shop/location.
      if (seen.size || !translatedNotes.length) body += '<ul>' + (recipe.obtain || []).filter(n=>!isAcquisitionPlaceholder(n)).map(n=>'<li>'+esc(n)+'</li>').join('') + '</ul>';
      if (recipe.source) body += '<p>' + link(recipe.source,t('source')) + '</p>';
      if (recipe.id) body += '<p>' + link('./recipe_page.html?target=' + encodeURIComponent(recipe.id) + '#planner',t('materials') + ' →') + '</p>';
      if (seen.size < 3) body += `<details class="acquisition_materials"><summary>${esc(t('materials'))}</summary>` + recipe.ingredients.map(part => `<details><summary>${esc(part.item)} ×${part.qty}</summary>${details(part.item,next)}</details>`).join('') + '</details>';
      return '<div class="acquisition_recipe">' + body + '</div>';
    }).join('');
    if (entry.drops.length) {
      const route = drop => {
        const params = new URLSearchParams({item:drop.name,difficulty:['Normal','Hard','Very Hard','Ultimate'][drop.difficulty],episode:String(drop.episode),enemy:drop.enemy,rate:'1'});
        return '<li><strong>' + esc(drop.enemy) + '</strong><br>' + esc(['Normal','Hard','Very Hard','Ultimate'][drop.difficulty]) + ' · EP' + drop.episode + ' · ' + esc(drop.rate) + '<br><span>' + esc(drop.sections.length === 10 ? t('all') : drop.sections.join(', ')) + '</span> · ' + link('./drop-tables/?'+params,t('more')+' →') + '</li>';
      };
      html += `<h4>${esc(t('drops'))}</h4><ul class="acquisition_drops">` + entry.drops.slice(0,5).map(route).join('') + '</ul>';
      if (entry.drops.length > 5) html += `<details><summary>${esc(t('more'))} (${entry.drops.length})</summary><ul class="acquisition_drops">` + entry.drops.slice(5).map(route).join('') + '</ul></details>';
      const dates = [...new Set(entry.drops.map(r=>r.syncedAt?.slice(0,10)).filter(Boolean))];
      html += `<p class="acquisition_meta">${esc(t('snapshot'))} ${esc(dates.join(', '))} · ` + link(entry.drops[0].source,t('source')) + '</p>';
    }
    return html || link(lookup(name),t('more')+' →');
  }
  const entry = data.items[acquisitionKey(item.name)];
  // Filter the English originals, not translated text, so every language agrees.
  const notes = (item.obtain || []).flatMap((original,index) => isAcquisitionPlaceholder(original) ? [] : [translatedNotes[index] || original]);
  const hasData = entry && (entry.drops.length || entry.recipes.length || entry.notes.length);
  return (notes.length ? '<ul>'+notes.map(n=>'<li>'+esc(n)+'</li>').join('')+'</ul>' : '') +
    (hasData ? details(item.name) : (!notes.length ? '<p>'+esc(t('unknown'))+'</p>' : '') + '<p>'+link(lookup(item.name),t('drops')+' →')+'</p>');
}
