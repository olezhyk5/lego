import { MODULE_COUNT, DEFAULT_COUNT } from '../../../core/types/kitchen/constants.js';
import { worktopOf } from '../../../core/types/kitchen/layout.js';
import { store } from '../../../core/store.js';
import { clone } from '../../../utils/helpers.js';
import { $, $$ } from '../../../utils/dom.js';
import { t } from '../../../i18n/index.js';
import { openModal } from '../../modal.js';
import { DIMS, setupMarkup, mainMarkup, moduleCard, totalWidthText, worktopSettingsForm } from './templates.js';

// Форма кухні: корпус, стільниця, модулі. Контракт форми — див. ui/forms.js.

const box = () => $('#modules');
const NEW_MODULE = { width: 600, type: 'doors', count: 1 };

function onModuleAction(act, i) {
  const M = store.state.modules;
  const ui = store.ui;
  switch (act) {
    case 'modDup':
      M.splice(i + 1, 0, clone(M[i]));
      ui.sel = i + 1;
      break;
    case 'modDel':
      if (M.length > 1) {
        M.splice(i, 1);
        ui.sel = Math.max(0, Math.min(ui.sel, M.length - 1));
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

// Новий тип модуля — типова для нього кількість; під мийку поле прибирається (двері за шириною)
function resetCount(m) {
  if (MODULE_COUNT[m.type]) m.count = DEFAULT_COUNT[m.type];
  else delete m.count;
}

function initWorktopSettings({ update }) {
  $('#worktopSettings').addEventListener('click', () => {
    openModal({
      title: t('kitchen.worktopSettings'),
      body: worktopSettingsForm(worktopOf(store.state)),
      onSave: body => {
        // порожнє / від'ємне поле → 0
        store.state.worktop = Object.fromEntries(
          $$('[data-field="worktopSide"]', body).map(el => [el.dataset.side, Math.max(0, Math.round(+el.value || 0))]),
        );
        update(false);
      },
    });
  });
}

function bind({ update, fit }) {
  DIMS.forEach(({ id }) =>
    $('#' + id).addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      store.state[id] = isNaN(v) ? 0 : v;
      update(false);
    }),
  );
  DIMS.forEach(({ id }) => $('#' + id).addEventListener('change', fit));

  box().addEventListener('click', e => {
    const el = e.target.closest('[data-module]');
    if (!el) return;
    const i = +el.dataset.module;
    const b = e.target.closest('[data-act]');
    if (store.ui.sel !== i) {
      store.ui.sel = i;
      $$('[data-module]', box()).forEach(m => m.classList.toggle('is-selected', +m.dataset.module === i));
      if (!b) update(false);
    }
    if (!b) return;
    onModuleAction(b.dataset.act, i);
    update(true);
  });

  box().addEventListener('input', e => {
    const f = e.target.dataset.field;
    if (f !== 'mWidth' && f !== 'mCount') return;
    const m = store.state.modules[+e.target.closest('[data-module]').dataset.module];
    const v = parseInt(e.target.value);
    if (f === 'mWidth') m.width = isNaN(v) ? 0 : v;
    if (f === 'mCount') {
      const [min, max] = MODULE_COUNT[m.type];
      m.count = Math.max(min, Math.min(max, isNaN(v) ? min : v));
    }
    update(false);
  });

  box().addEventListener('change', e => {
    if (e.target.dataset.field === 'mWidth') return fit();
    if (e.target.dataset.field !== 'mType') return;
    const m = store.state.modules[+e.target.closest('[data-module]').dataset.module];
    m.type = e.target.value;
    resetCount(m);
    update(true);
  });

  $('#addModule').addEventListener('click', () => {
    store.state.modules.push(clone(NEW_MODULE));
    store.ui.sel = store.state.modules.length - 1;
    update(true);
    fit();
  });

  initWorktopSettings({ update });
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
    const M = store.state.modules;
    if (store.ui.sel >= M.length) store.ui.sel = M.length - 1;
    box().innerHTML = M.map((m, i) =>
      moduleCard(m, i, L.modules[i], { selected: i === store.ui.sel, total: M.length }),
    ).join('');
    this.refresh(L);
  },

  refresh(L) {
    $('[data-calc="totalW"]').textContent = totalWidthText(L.W);
  },
};
