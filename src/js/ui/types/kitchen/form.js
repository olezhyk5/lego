import { t } from '../../../i18n/index.js';
import { calcMm } from '../../templates.js';
import {
  DIMS,
  setupMarkup,
  mainMarkup,
  moduleCard,
  cornerCard,
  wallTabs,
  tierTabs,
  fridgeNote,
  totalWidthText,
  totalHeightText,
} from './templates.js';
import { initSettings } from './settings.js';
import { wallIndex, tierOf, runOf, isUpper, rowOf, minCount } from './row.js';
import { bindModules } from './module-events.js';
import { bindWalls } from './wall-events.js';

// Форма кухні: корпус, стільниця, верхні модулі, стіни й кути, модулі. Контракт форми — див. ui/forms.js.

function bind(app) {
  const { store, ref, update, fit } = app;
  DIMS.forEach(({ id }) =>
    ref(id).addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      store.state[id] = isNaN(v) ? 0 : v;
      update(false);
    }),
  );
  DIMS.forEach(({ id }) => ref(id).addEventListener('change', fit));
  bindModules(app);
  bindWalls(app);
  initSettings(app);
}

/** @type {import('../../forms.js').CreateForm} */
export function createKitchenForm({ setup, main }, app) {
  const { store, ref } = app;
  setup.innerHTML = setupMarkup();
  main.innerHTML = mainMarkup();
  bind(app);
  const box = ref('modules');
  const calc = key => app.$(`[data-calc="${key}"]`);

  // Оновлює лише розраховані значення, не чіпаючи поля вводу (щоб не губився фокус).
  function refresh(L) {
    const wall = L.walls[wallIndex(store)];
    calc('totalW').textContent = totalWidthText(wall.end);
    calc('totalH').textContent = totalHeightText(L.top);
    if (isUpper(store)) return;
    wall.modules.forEach((m, i) => {
      if (m.type === 'fridge') {
        const el = box.querySelector(`[data-calc="fridge-${i}"]`);
        if (el) el.textContent = fridgeNote(m);
      }
      (m.zones || []).forEach((z, j) => {
        const el = box.querySelector(`[data-calc="z-${i}-${j}"]`);
        if (el) el.textContent = calcMm(z.h);
      });
    });
  }

  return {
    sync() {
      DIMS.forEach(({ id }) => (ref(id).value = store.state[id]));
    },

    render(L) {
      const M = rowOf(store);
      const k = wallIndex(store);
      const upper = isUpper(store);
      const wall = L.walls[k];
      const list = upper ? wall.uppers : wall.modules;
      if (store.ui.sel >= M.length) store.ui.sel = Math.max(0, M.length - 1);
      ref('walls').innerHTML = wallTabs(L.walls.length, k);
      ref('tiers').innerHTML = tierTabs(tierOf(store));
      ref('corner').innerHTML = k === 0 ? '' : cornerCard(runOf(store).corner);
      const empty = upper ? 'kitchen.noUppers' : 'kitchen.noModules';
      box.innerHTML = M.length
        ? M.map((m, i) =>
            moduleCard(m, i, list[i], {
              selected: i === store.ui.sel,
              total: M.length,
              min: minCount(store),
              tier: tierOf(store),
              no: list[i].i + 1,
            }),
          ).join('')
        : `<p class="hint">${t(empty)}</p>`;
      ref('addModule').textContent = t(upper ? 'kitchen.addUpper' : 'kitchen.addModule');
      refresh(L);
    },

    refresh,
  };
}
