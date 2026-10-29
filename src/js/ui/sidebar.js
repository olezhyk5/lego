import { PRESETS } from '../config/presets.js';
import { COUNTABLE_ZONES } from '../config/constants.js';
import { store, setProject } from '../core/store.js';
import { clone } from '../utils/helpers.js';
import { $, $$ } from '../utils/dom.js';
import { presetButtons, sectionCard, calcMm } from './templates.js';
import { t } from '../i18n/index.js';
import { toast } from './toast.js';

const DIM_KEYS = ['W', 'H', 'D', 'plinth'];
const secBox = () => $('#sections');

export function syncDims() {
  DIM_KEYS.forEach(k => ($('#' + k).value = store.state[k]));
}

export function renderSections(L) {
  secBox().innerHTML = store.state.sections.map((c, i) => sectionCard(c, i, L.secs[i], i === store.sel)).join('');
}

// Оновлює лише розраховані значення, не чіпаючи поля вводу (щоб не губився фокус).
export function refreshCalc(L) {
  const box = secBox();
  L.secs.forEach((c, i) => {
    const s = $(`[data-calc="s-${i}"]`, box);
    if (s) s.textContent = calcMm(c.w);
    c.zones.forEach((z, j) => {
      const e = $(`[data-calc="z-${i}-${j}"]`, box);
      if (e) e.textContent = calcMm(z.h);
    });
  });
}

function onSectionAction(act, i, j) {
  const S = store.state.sections;
  const Z = S[i].zones;
  switch (act) {
    case 'secDel':
      if (S.length > 1) {
        S.splice(i, 1);
        store.sel = Math.max(0, Math.min(store.sel, S.length - 1));
      } else toast(t('toast.lastSection'));
      break;
    case 'secLeft':
      if (i > 0) {
        [S[i - 1], S[i]] = [S[i], S[i - 1]];
        store.sel = i - 1;
      }
      break;
    case 'secRight':
      if (i < S.length - 1) {
        [S[i + 1], S[i]] = [S[i], S[i + 1]];
        store.sel = i + 1;
      }
      break;
    case 'zAdd':
      Z.push({ type: 'shelves', count: 2, height: 'auto' });
      break;
    case 'zDel':
      if (Z.length > 1) Z.splice(j, 1);
      else toast(t('toast.lastZone'));
      break;
    case 'zUp':
      if (j > 0) [Z[j - 1], Z[j]] = [Z[j], Z[j - 1]];
      break;
    case 'zDown':
      if (j < Z.length - 1) [Z[j + 1], Z[j]] = [Z[j], Z[j + 1]];
      break;
  }
}

// Індекси секції/зони для елемента всередині картки секції.
function position(el) {
  const secEl = el.closest('[data-section]');
  const zEl = el.closest('[data-zone]');
  return { secEl, i: secEl ? +secEl.dataset.section : -1, j: zEl ? +zEl.dataset.zone : -1 };
}

export function initSidebar({ update, fit }) {
  const box = secBox();
  $('#presets').innerHTML = presetButtons();

  $('#presets').addEventListener('click', e => {
    const b = e.target.closest('[data-preset]');
    if (!b) return;
    setProject(clone(PRESETS[b.dataset.preset].data));
    syncDims();
    update(true);
    fit();
  });

  DIM_KEYS.forEach(k =>
    $('#' + k).addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      store.state[k] = isNaN(v) ? 0 : v;
      update(false);
    }),
  );
  ['W', 'H', 'D'].forEach(k => $('#' + k).addEventListener('change', fit));

  box.addEventListener('click', e => {
    const { secEl, i, j } = position(e.target);
    if (!secEl) return;
    const b = e.target.closest('[data-act]');
    if (store.sel !== i) {
      store.sel = i;
      $$('[data-section]', box).forEach(el => el.classList.toggle('is-selected', +el.dataset.section === i));
      if (!b) update(false);
    }
    if (!b) return;
    onSectionAction(b.dataset.act, i, j);
    update(true);
  });

  box.addEventListener('input', e => {
    const f = e.target.dataset.field;
    if (!f || f === 'zType') return;
    const { i, j } = position(e.target);
    const sec = store.state.sections[i];
    const v = e.target.value.trim();
    if (f === 'secWidth') sec.width = v === '' ? 'auto' : parseFloat(v) || 0;
    if (f === 'zHeight') sec.zones[j].height = v === '' ? 'auto' : parseFloat(v) || 0;
    if (f === 'zCount') sec.zones[j].count = Math.max(1, Math.min(20, parseInt(v) || 1));
    update(false);
  });

  box.addEventListener('change', e => {
    if (e.target.dataset.field !== 'zType') return;
    const { i, j } = position(e.target);
    const z = store.state.sections[i].zones[j];
    z.type = e.target.value;
    if (COUNTABLE_ZONES.includes(z.type) && !z.count) z.count = z.type === 'drawers' ? 3 : 2;
    update(true);
  });

  $('#addSec').addEventListener('click', () => {
    store.state.sections.push({ width: 'auto', zones: [{ type: 'shelves', count: 3, height: 'auto' }] });
    store.sel = store.state.sections.length - 1;
    update(true);
  });
}
