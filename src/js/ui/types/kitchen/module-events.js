import {
  MODULE_COUNT,
  UPPER_COUNT,
  DEFAULT_COUNT,
  DISHWASHER_WIDTHS,
  DEFAULT_FRIDGE,
  TALL_ZONE_COUNT,
  DEFAULT_ZONE_COUNT,
  APPLIANCE_NICHE,
} from '../../../core/types/kitchen/constants.js';
import { store } from '../../../core/store.js';
import { clone } from '../../../utils/helpers.js';
import { $, $$ } from '../../../utils/dom.js';
import { runOf, isUpper, rowOf, minCount } from './row.js';

// Обробники карток модулів поточного ряду: модулі й зони пенала.

const box = () => $('#modules');
const NEW_MODULE = { width: 600, type: 'doors', count: 1 };
const NEW_TALL_ZONES = [
  { type: 'shelves', count: 3, height: 'auto' },
  { type: 'drawers', count: 2, height: 500 },
];

function onModuleAction(act, i) {
  const M = rowOf();
  const ui = store.ui;
  switch (act) {
    case 'modDup':
      M.splice(i + 1, 0, clone(M[i]));
      ui.sel = i + 1;
      break;
    case 'modDel':
      if (M.length > minCount()) {
        M.splice(i, 1);
        ui.sel = Math.max(0, Math.min(ui.sel, M.length - 1));
        // порожній верхній ряд не зберігаємо: проєкт збігається з проєктом без верхніх модулів
        if (isUpper() && !M.length) delete runOf().uppers;
      }
      break;
    case 'modLeft':
      if (i > 0) {
        [M[i - 1], M[i]] = [M[i], M[i - 1]];
        ui.sel = i - 1;
      }
      break;
    case 'modRight':
      if (i < M.length - 1) {
        [M[i + 1], M[i]] = [M[i], M[i + 1]];
        ui.sel = i + 1;
      }
      break;
  }
}

function onZoneAction(act, m, j) {
  const Z = m.zones;
  if (act === 'zAdd') Z.push({ type: 'shelves', count: DEFAULT_ZONE_COUNT.shelves, height: 'auto' });
  if (act === 'zDel' && Z.length > 1) Z.splice(j, 1);
  if (act === 'zUp' && j > 0) [Z[j - 1], Z[j]] = [Z[j], Z[j - 1]];
  if (act === 'zDown' && j < Z.length - 1) [Z[j + 1], Z[j]] = [Z[j], Z[j + 1]];
}

// Новий тип модуля — типові для нього поля; зайві прибираються.
// Посудомийка: ширина — найближча стандартна, що не більша за поточну (інакше найменша).
function resetModule(m) {
  const counts = isUpper() ? UPPER_COUNT : MODULE_COUNT;
  if (counts[m.type]) m.count = DEFAULT_COUNT[m.type];
  else delete m.count;
  delete m.zones;
  delete m.nicheH;
  delete m.nicheD;
  if (m.type === 'dishwasher') {
    const fit = DISHWASHER_WIDTHS.filter(w => w <= m.width);
    m.width = fit.length ? fit[fit.length - 1] : DISHWASHER_WIDTHS[0];
  }
  if (m.type === 'tall') m.zones = clone(NEW_TALL_ZONES);
  if (m.type === 'fridge') Object.assign(m, DEFAULT_FRIDGE);
}

// Новий тип зони — типова висота техніки, кількість лише там, де вона є
function resetZone(z) {
  if (TALL_ZONE_COUNT[z.type]) z.count = DEFAULT_ZONE_COUNT[z.type];
  else delete z.count;
  const need = APPLIANCE_NICHE[z.type];
  if (need) z.height = need.h;
}

// Індекси модуля й зони для елемента всередині картки
function position(el) {
  const zone = el.closest('[data-zone]');
  return { i: +el.closest('[data-module]').dataset.module, j: zone ? +zone.dataset.zone : -1 };
}

function onModuleInput(el, m, j) {
  const f = el.dataset.field;
  const v = parseInt(el.value);
  if (f === 'mWidth') m.width = isNaN(v) ? 0 : v;
  if (f === 'mCount') {
    const [min, max] = (isUpper() ? UPPER_COUNT : MODULE_COUNT)[m.type];
    m.count = Math.max(min, Math.min(max, isNaN(v) ? min : v));
  }
  if (f === 'fNicheH') m.nicheH = v > 0 ? v : DEFAULT_FRIDGE.nicheH;
  if (f === 'fNicheD') m.nicheD = v > 0 ? v : DEFAULT_FRIDGE.nicheD;
  if (f === 'zHeight') m.zones[j].height = el.value.trim() === '' ? 'auto' : v > 0 ? v : 1;
  if (f === 'zCount') {
    const [min, max] = TALL_ZONE_COUNT[m.zones[j].type];
    m.zones[j].count = Math.max(min, Math.min(max, isNaN(v) ? min : v));
  }
}

export function bindModules({ update, fit }) {
  box().addEventListener('click', e => {
    if (!e.target.closest('[data-module]')) return;
    const { i, j } = position(e.target);
    const b = e.target.closest('[data-act]');
    if (store.ui.sel !== i) {
      store.ui.sel = i;
      $$('[data-module]', box()).forEach(m => m.classList.toggle('is-selected', +m.dataset.module === i));
      if (!b) update(false);
    }
    if (!b) return;
    const act = b.dataset.act;
    if (act.startsWith('z')) onZoneAction(act, rowOf()[i], j);
    else onModuleAction(act, i);
    update(true);
  });

  box().addEventListener('input', e => {
    const f = e.target.dataset.field;
    if (!['mWidth', 'mCount', 'fNicheH', 'fNicheD', 'zCount', 'zHeight'].includes(f)) return;
    const { i, j } = position(e.target);
    onModuleInput(e.target, rowOf()[i], j);
    update(false);
  });

  box().addEventListener('change', e => {
    const f = e.target.dataset.field;
    if (f === 'mWidth' || f === 'fNicheH' || f === 'fNicheD') return fit();
    if (f !== 'mType' && f !== 'zType') return;
    const { i, j } = position(e.target);
    if (f === 'mType') {
      const m = rowOf()[i];
      m.type = e.target.value;
      resetModule(m);
      update(true);
      fit();
    } else {
      const z = rowOf()[i].zones[j];
      z.type = e.target.value;
      resetZone(z);
      update(true);
    }
  });

  $('#addModule').addEventListener('click', () => {
    const run = runOf();
    if (isUpper() && !run.uppers) run.uppers = [];
    rowOf().push(clone(NEW_MODULE));
    store.ui.sel = rowOf().length - 1;
    update(true);
    fit();
  });
}
