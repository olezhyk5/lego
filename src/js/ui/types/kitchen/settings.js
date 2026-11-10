import { DEFAULT_UPPER } from '../../../core/types/kitchen/constants.js';
import { worktopOf, worktopThickness, upperOf } from '../../../core/types/kitchen/layout.js';
import { MATERIALS } from '../../../config/materials.js';
import { t } from '../../../i18n/index.js';
import { WORKTOP_T, worktopSettingsForm, upperSettingsForm } from './templates.js';

// Попапи налаштувань кухні: стільниця й верхні модулі.

// Пошук у тілі попапу
const $ = (sel, body) => body.querySelector(sel);
const $$ = (sel, body) => Array.from(body.querySelectorAll(sel));

// Поле товщини → частина worktop. Порожнє / не додатне або типове → поля немає, інше — у межах WORKTOP_T
// (модалка novalidate, а значення поза форматом не відкрилося б після перезавантаження).
function thicknessField(el) {
  const v = Math.round(parseFloat(el.value));
  if (!(v > 0)) return {};
  const thick = Math.max(WORKTOP_T.min, Math.min(WORKTOP_T.max, v));
  return thick === MATERIALS.worktop.t ? {} : { t: thick };
}

function initWorktopSettings({ store, ref, update, openModal }) {
  ref('worktopSettings').addEventListener('click', () => {
    openModal({
      title: t('kitchen.worktopSettings'),
      body: worktopSettingsForm(worktopOf(store.state), worktopThickness(store.state)),
      onSave: body => {
        // порожній / від'ємний виступ → 0
        store.state.worktop = {
          ...Object.fromEntries(
            $$('[data-field="worktopSide"]', body).map(el => [
              el.dataset.side,
              Math.max(0, Math.round(+el.value || 0)),
            ]),
          ),
          ...thicknessField($('[data-field="worktopT"]', body)),
        };
        update(false);
      },
    });
  });
}

// Порожнє / не додатне поле → типове
const positive = (el, fallback) => {
  const v = Math.round(parseFloat(el.value));
  return v > 0 ? v : fallback;
};

function initUpperSettings({ store, ref, update, fit, openModal }) {
  ref('upperSettings').addEventListener('click', () => {
    openModal({
      title: t('kitchen.upperSettings'),
      body: upperSettingsForm(upperOf(store.state)),
      onSave: body => {
        const gap = Math.round(parseFloat($('[data-field="upperGap"]', body).value));
        const up = {
          H: positive($('[data-field="upperH"]', body), DEFAULT_UPPER.H),
          D: positive($('[data-field="upperD"]', body), DEFAULT_UPPER.D),
          gap: gap >= 0 ? gap : DEFAULT_UPPER.gap, // відступ може бути нульовим
        };
        // типові значення не зберігаємо: проєкт лишається таким самим, як пресет
        if (Object.keys(up).every(k => up[k] === DEFAULT_UPPER[k])) delete store.state.upper;
        else store.state.upper = up;
        update(false);
        fit();
      },
    });
  });
}

/** @param {import('../../app.js').App} app */
export function initSettings(app) {
  initWorktopSettings(app);
  initUpperSettings(app);
}
