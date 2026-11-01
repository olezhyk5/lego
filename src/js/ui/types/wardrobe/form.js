import { COUNTABLE_ZONES } from '../../../core/types/wardrobe/constants.js';
import { store } from '../../../core/store.js';
import { LEGS_MIN_H, LEGS_DEFAULT_H } from '../../../core/common/legs.js';
import { clone } from '../../../utils/helpers.js';
import { $, $$ } from '../../../utils/dom.js';
import { calcMm } from '../../templates.js';
import { DIMS, setupMarkup, mainMarkup, sectionCard, sectionSummary } from './templates.js';
import { initTopSettings } from './top-settings.js';

// Форма шафи: габарити, кришка, секції й зони. Контракт форми — див. ui/forms.js.

const secBox = () => $('#sections');

function onSectionAction(act, i, j) {
  const S = store.state.sections;
  const Z = S[i].zones;
  const ui = store.ui;
  switch (act) {
    case 'secToggle':
      if (ui.collapsed.has(S[i])) ui.collapsed.delete(S[i]);
      else ui.collapsed.add(S[i]);
      break;
    case 'secDup':
      // копія стає одразу праворуч від оригіналу й вибирається
      S.splice(i + 1, 0, clone(S[i]));
      ui.sel = i + 1;
      break;
    case 'secDel':
      // остання секція/зона не видаляється: кнопка вимкнена в шаблоні, тут — лише захист
      if (S.length > 1) {
        S.splice(i, 1);
        ui.sel = Math.max(0, Math.min(ui.sel, S.length - 1));
      }
      break;
    case 'secLeft':
      if (i > 0) {
        [S[i - 1], S[i]] = [S[i], S[i - 1]];
        ui.sel = i - 1;
      }
      break;
    case 'secRight':
      if (i < S.length - 1) {
        [S[i + 1], S[i]] = [S[i], S[i + 1]];
        ui.sel = i + 1;
      }
      break;
    case 'zAdd':
      Z.push({ type: 'shelves', count: 2, height: 'auto' });
      break;
    case 'zDel':
      if (Z.length > 1) Z.splice(j, 1);
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

function bind({ update, fit }) {
  const box = secBox();

  DIMS.forEach(({ id }) =>
    $('#' + id).addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      store.state[id] = isNaN(v) ? 0 : v;
      update(false);
    }),
  );
  ['W', 'H', 'D'].forEach(k => $('#' + k).addEventListener('change', fit));

  // Основа: без галочки поля base немає (= цоколь), щоб проєкт збігався з пресетами без нього.
  // Ніжки нижчі за мінімум не вмикаємо: піднімаємо основу до типової висоти.
  $('#baseLegs').addEventListener('change', e => {
    const s = store.state;
    if (e.target.checked) {
      s.base = 'legs';
      if (s.plinth < LEGS_MIN_H) $('#plinth').value = s.plinth = LEGS_DEFAULT_H;
    } else delete s.base;
    update(false);
  });

  box.addEventListener('click', e => {
    const { secEl, i, j } = position(e.target);
    if (!secEl) return;
    const b = e.target.closest('[data-act]');
    if (store.ui.sel !== i) {
      store.ui.sel = i;
      $$('[data-section]', box).forEach(el => el.classList.toggle('is-selected', +el.dataset.section === i));
      if (!b) update(false);
    }
    if (!b) return;
    const act = b.dataset.act;
    onSectionAction(act, i, j);
    update(true);
    // сайдбар перемальовано — повертаємо фокус на перемикач, щоб не губився з клавіатури
    if (act === 'secToggle') $(`[data-section="${i}"] [data-act="secToggle"]`, box).focus();
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
    store.ui.sel = store.state.sections.length - 1;
    update(true);
  });
}

/** @type {import('../../forms.js').Form} */
export const wardrobeForm = {
  mount({ setup, main }, app) {
    setup.innerHTML = setupMarkup();
    main.innerHTML = mainMarkup();
    bind(app);
    initTopSettings(app);
  },

  sync() {
    DIMS.forEach(({ id }) => ($('#' + id).value = store.state[id]));
    $('#baseLegs').checked = store.state.base === 'legs';
  },

  render(L) {
    const S = store.state.sections;
    if (store.ui.sel >= S.length) store.ui.sel = S.length - 1;
    secBox().innerHTML = S.map((c, i) =>
      sectionCard(c, i, L.secs[i], {
        selected: i === store.ui.sel,
        collapsed: store.ui.collapsed.has(c),
        total: S.length,
      }),
    ).join('');
  },

  // Оновлює лише розраховані значення, не чіпаючи поля вводу (щоб не губився фокус).
  refresh(L) {
    const box = secBox();
    L.secs.forEach((c, i) => {
      const s = $(`[data-calc="s-${i}"]`, box);
      if (s) s.textContent = calcMm(c.w);
      const sum = $(`[data-calc="sum-${i}"]`, box);
      if (sum) sum.textContent = sectionSummary(c);
      c.zones.forEach((z, j) => {
        const e = $(`[data-calc="z-${i}-${j}"]`, box);
        if (e) e.textContent = calcMm(z.h);
      });
    });
  },
};
