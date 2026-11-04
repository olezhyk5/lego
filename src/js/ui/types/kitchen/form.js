import { store } from '../../../core/store.js';
import { $ } from '../../../utils/dom.js';
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

const box = () => $('#modules');

function bind(app) {
  const { update, fit } = app;
  DIMS.forEach(({ id }) =>
    $('#' + id).addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      store.state[id] = isNaN(v) ? 0 : v;
      update(false);
    }),
  );
  DIMS.forEach(({ id }) => $('#' + id).addEventListener('change', fit));
  bindModules(app);
  bindWalls(app);
  initSettings(app);
}

/** @type {import('../../forms.js').Form} */
export const kitchenForm = {
  mount({ setup, main }, app) {
    setup.innerHTML = setupMarkup();
    main.innerHTML = mainMarkup();
    bind(app);
  },

  sync() {
    DIMS.forEach(({ id }) => ($('#' + id).value = store.state[id]));
  },

  render(L) {
    const M = rowOf();
    const wall = L.walls[wallIndex()];
    const list = isUpper() ? wall.uppers : wall.modules;
    if (store.ui.sel >= M.length) store.ui.sel = Math.max(0, M.length - 1);
    $('#walls').innerHTML = wallTabs(L.walls.length, wallIndex());
    $('#tiers').innerHTML = tierTabs(tierOf());
    $('#corner').innerHTML = wallIndex() === 0 ? '' : cornerCard(runOf().corner);
    const empty = isUpper() ? 'kitchen.noUppers' : 'kitchen.noModules';
    box().innerHTML = M.length
      ? M.map((m, i) =>
          moduleCard(m, i, list[i], {
            selected: i === store.ui.sel,
            total: M.length,
            min: minCount(),
            tier: tierOf(),
            no: list[i].i + 1,
          }),
        ).join('')
      : `<p class="hint">${t(empty)}</p>`;
    $('#addModule').textContent = t(isUpper() ? 'kitchen.addUpper' : 'kitchen.addModule');
    this.refresh(L);
  },

  // Оновлює лише розраховані значення, не чіпаючи поля вводу (щоб не губився фокус).
  refresh(L) {
    const wall = L.walls[wallIndex()];
    $('[data-calc="totalW"]').textContent = totalWidthText(wall.end);
    $('[data-calc="totalH"]').textContent = totalHeightText(L.top);
    if (isUpper()) return;
    wall.modules.forEach((m, i) => {
      if (m.type === 'fridge') {
        const el = $(`[data-calc="fridge-${i}"]`, box());
        if (el) el.textContent = fridgeNote(m);
      }
      (m.zones || []).forEach((z, j) => {
        const el = $(`[data-calc="z-${i}-${j}"]`, box());
        if (el) el.textContent = calcMm(z.h);
      });
    });
  },
};
