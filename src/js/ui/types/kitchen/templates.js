import { MODULE_TYPES, MODULE_COUNT, WORKTOP_SIDES } from '../../../core/types/kitchen/constants.js';
import { t } from '../../../i18n/index.js';
import { round } from '../../../utils/helpers.js';
import { COPY_ICON, GEAR_ICON, iconBtn, dimField } from '../../templates.js';

// HTML-шаблони форми кухні. Класи — для стилів (картки модулів повторюють вигляд секцій шафи),
// data-атрибути — для JS, тексти — лише через t().

export const DIMS = [
  { id: 'H', labelKey: 'kitchen.height', min: 300, max: 1200 },
  { id: 'D', labelKey: 'kitchen.depth', min: 200, max: 900 },
  { id: 'legs', labelKey: 'kitchen.legs', min: 0, max: 200 },
];

export const totalWidthText = w => t('kitchen.totalWidth', { w: round(w) });

// Над 3D на мобільному: корпус і кнопка налаштувань стільниці
export const setupMarkup = () => `<section class="card">
    <h2 class="card__title">${t('kitchen.dimensions')}</h2>
    <div class="dims">${DIMS.map(dimField).join('')}</div>
    <p class="hint" data-calc="totalW"></p>
  </section>
  <section class="card">
    <button type="button" class="btn option-btn" id="worktopSettings">
      ${GEAR_ICON}
      <span>${t('kitchen.worktopSettings')}</span>
    </button>
  </section>`;

// Під 3D на мобільному: модулі
export const mainMarkup = () => `<section class="card">
    <h2 class="card__title">${t('kitchen.modules')}</h2>
    <div id="modules"></div>
    <button class="btn" id="addModule">${t('kitchen.addModule')}</button>
    <p class="hint">${t('kitchen.hint')}</p>
  </section>`;

export function moduleCard(m, i, lm, { selected, total }) {
  const opts = MODULE_TYPES.map(
    k => `<option value="${k}"${k === m.type ? ' selected' : ''}>${t('moduleType.' + k)}</option>`,
  ).join('');
  const range = MODULE_COUNT[m.type];
  const count = range
    ? `<input class="input zone__count" data-field="mCount" type="number" min="${range[0]}" max="${range[1]}" value="${lm.cnt}" title="${t('module.countTitle')}">`
    : `<input class="input zone__count" data-field="mCount" type="number" value="" disabled title="${t('module.noCount')}">`;
  return `<div class="section${selected ? ' is-selected' : ''}" data-module="${i}">
    <div class="section__head">
      <span class="section__label"><b class="section__name">${t('module.name', { n: i + 1 })}</b></span>
      ${iconBtn('modLeft', 'module.left', '←', i === 0)}
      ${iconBtn('modRight', 'module.right', '→', i === total - 1)}
      ${iconBtn('modDup', 'module.duplicate', COPY_ICON)}
      ${iconBtn('modDel', 'module.delete', '✕', total === 1)}
    </div>
    <div class="zones">
      <div class="zone-head"><span>${t('module.type')}</span><span>${t('module.count')}</span><span>${t('module.width')}</span></div>
      <div class="zone">
        <select class="select zone__type" data-field="mType">${opts}</select>
        ${count}
        <input class="input" data-field="mWidth" type="number" inputmode="numeric" min="150" max="1200" step="50" value="${m.width}">
      </div>
    </div>
  </div>`;
}

// Вміст попапу «Налаштування стільниці». wt — worktopOf(s)
export function worktopSettingsForm(wt) {
  const fields = WORKTOP_SIDES.map(
    k => `<label class="field">${t('worktopSide.' + k)}
      <input class="input" type="number" min="0" step="1" inputmode="numeric" data-field="worktopSide" data-side="${k}" value="${round(wt[k])}">
    </label>`,
  ).join('');
  return `<fieldset class="choice">
    <legend class="choice__legend">${t('kitchen.worktopOverhang')}</legend>
    <div class="field-grid">${fields}</div>
  </fieldset>`;
}
