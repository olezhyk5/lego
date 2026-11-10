import {
  MODULE_TYPES,
  MODULE_COUNT,
  UPPER_TYPES,
  UPPER_COUNT,
  TALL_TYPES,
  TALL_ZONE_TYPES,
  TALL_ZONE_COUNT,
  CORNER_TYPES,
  CORNER_COUNT,
  WORKTOP_SIDES,
  DISHWASHER_WIDTHS,
  MAX_WALLS,
} from '../../../core/types/kitchen/constants.js';
import { t } from '../../../i18n/index.js';
import { isAuto, round } from '../../../utils/helpers.js';
import { COPY_ICON, GEAR_ICON, iconBtn, calcMm, dimField } from '../../templates.js';

// HTML-шаблони форми кухні. Класи — для стилів (картки модулів повторюють вигляд секцій шафи),
// data-атрибути — для JS, тексти — лише через t().

export const DIMS = [
  { id: 'H', labelKey: 'kitchen.height', min: 300, max: 1200 },
  { id: 'D', labelKey: 'kitchen.depth', min: 200, max: 900 },
  { id: 'legs', labelKey: 'kitchen.plinth', min: 0, max: 200 },
];

// Межі поля товщини стільниці, мм
export const WORKTOP_T = { min: 10, max: 100 };

export const totalWidthText = w => t('kitchen.totalWidth', { w: round(w) });
export const totalHeightText = h => t('kitchen.totalHeight', { h: round(h) });
export const fridgeNote = m => (m.antresolH ? t('module.antresol', { h: round(m.antresolH) }) : t('module.noAntresol'));

const settingsBtn = (ref, key) => `<button type="button" class="btn option-btn" data-ref="${ref}">
      ${GEAR_ICON}
      <span>${t(key)}</span>
    </button>`;

// Над 3D на мобільному: корпус і кнопки налаштувань стільниці та верхніх модулів
export const setupMarkup = () => `<section class="card">
    <h2 class="card__title">${t('kitchen.dimensions')}</h2>
    <div class="dims">${DIMS.map(dimField).join('')}</div>
    <p class="hint" data-calc="totalW"></p>
    <p class="hint" data-calc="totalH"></p>
  </section>
  <section class="card">
    ${settingsBtn('worktopSettings', 'kitchen.worktopSettings')}
    ${settingsBtn('upperSettings', 'kitchen.upperSettings')}
  </section>`;

// Під 3D на мобільному: стіни, кут, ряди, модулі
export const mainMarkup = () => `<section class="card">
    <h2 class="card__title">${t('kitchen.modules')}</h2>
    <div class="tabs" data-ref="walls" role="group" aria-label="${t('kitchen.wallsLabel')}"></div>
    <div data-ref="corner"></div>
    <div class="tabs" data-ref="tiers" role="group" aria-label="${t('kitchen.tierLabel')}"></div>
    <div data-ref="modules"></div>
    <button class="btn" data-ref="addModule"></button>
    <p class="hint">${t('kitchen.hint')}</p>
  </section>`;

const tab = (attr, value, text, on) =>
  `<button type="button" class="tabs__tab${on ? ' is-selected' : ''}" ${attr}="${value}" aria-pressed="${on}">${text}</button>`;

export function wallTabs(total, active) {
  const tabs = Array.from({ length: total }, (_, k) =>
    tab('data-wall', k, t('kitchen.wall', { n: k + 1 }), k === active),
  ).join('');
  const add =
    total < MAX_WALLS
      ? `<button type="button" class="tabs__tab" data-ref="addWall">${t('kitchen.addWall')}</button>`
      : '';
  return tabs + add;
}

export const tierTabs = tier =>
  tab('data-tier', 'base', t('kitchen.tierBase'), tier === 'base') +
  tab('data-tier', 'upper', t('kitchen.tierUpper'), tier === 'upper');

const numField = (field, key, value, min = 0) => `<label class="field">${t(key)}
      <input class="input" data-field="${field}" type="number" inputmode="numeric" min="${min}" step="10" value="${value}">
    </label>`;

// Картка стику перед поточною стіною: тип кутового модуля й розміри
export function cornerCard(c) {
  const opts = CORNER_TYPES.map(
    k => `<option value="${k}"${k === c.type ? ' selected' : ''}>${t('cornerType.' + k)}</option>`,
  ).join('');
  const size =
    c.type === 'blind'
      ? numField('cWidth', 'kitchen.cornerWidth', c.width) + numField('cFiller', 'kitchen.cornerFiller', c.filler)
      : numField('cA', 'kitchen.cornerA', c.a) + numField('cB', 'kitchen.cornerB', c.b);
  return `<div class="section" data-corner>
    <div class="section__head">
      <span class="section__label"><b class="section__name">${t('kitchen.corner')}</b></span>
      ${iconBtn('wallDel', 'kitchen.deleteWall', '✕')}
    </div>
    <div class="field-grid">
      <label class="field">${t('kitchen.cornerType')}
        <select class="select" data-field="cType">${opts}</select>
      </label>
      ${size}
      <label class="field">${t('kitchen.cornerShelves')}
        <input class="input" data-field="cCount" type="number" inputmode="numeric" min="${CORNER_COUNT[0]}" max="${CORNER_COUNT[1]}" value="${c.count}">
      </label>
    </div>
    <p class="hint">${t('kitchen.cornerHint')}</p>
  </div>`;
}

// Список типів модуля нижнього ряду: високі — окремою групою
function baseTypeOptions(type) {
  const option = k => `<option value="${k}"${k === type ? ' selected' : ''}>${t('moduleType.' + k)}</option>`;
  const low = MODULE_TYPES.filter(k => !TALL_TYPES.includes(k));
  return `${low.map(option).join('')}<optgroup label="${t('module.groupTall')}">${TALL_TYPES.map(option).join('')}</optgroup>`;
}

const upperTypeOptions = type =>
  UPPER_TYPES.map(k => `<option value="${k}"${k === type ? ' selected' : ''}>${t('moduleType.' + k)}</option>`).join(
    '',
  );

function zoneRow(z, i, j, lz, total) {
  const opts = TALL_ZONE_TYPES.map(
    k => `<option value="${k}"${k === z.type ? ' selected' : ''}>${t('tallZoneType.' + k)}</option>`,
  ).join('');
  const range = TALL_ZONE_COUNT[z.type];
  const count = range
    ? `<input class="input zone__count" data-field="zCount" type="number" min="${range[0]}" max="${range[1]}" value="${z.count}" title="${t('module.countTitle')}">`
    : `<input class="input zone__count" data-field="zCount" type="number" value="" disabled>`;
  return `<div class="zone" data-zone="${j}">
    <select class="select zone__type" data-field="zType">${opts}</select>
    ${count}
    <input class="input" data-field="zHeight" inputmode="numeric" placeholder="${t('common.auto')}" value="${isAuto(z.height) ? '' : z.height}">
    <div class="zone__btns">
      ${iconBtn('zUp', 'zone.up', '↑', j === 0)}
      ${iconBtn('zDown', 'zone.down', '↓', j === total - 1)}
      ${iconBtn('zDel', 'zone.delete', '✕', total === 1)}
    </div>
    <span class="calc zone__calc" data-calc="z-${i}-${j}">${calcMm(lz.h)}</span>
  </div>`;
}

const moduleHead = (name, i, total, min) => `<div class="section__head">
      <span class="section__label"><b class="section__name">${name}</b></span>
      ${iconBtn('modLeft', 'module.left', '←', i === 0)}
      ${iconBtn('modRight', 'module.right', '→', i === total - 1)}
      ${iconBtn('modDup', 'module.duplicate', COPY_ICON)}
      ${iconBtn('modDel', 'module.delete', '✕', total <= min)}
    </div>`;

// Вибір типу, кількість і ширина — рядком зони: без кількості колонка лишається порожньою
const typeRow = (options, count, width, showCount) => `<div class="zones">
      <div class="zone-head"><span>${t('module.type')}</span><span>${showCount ? t('module.count') : ''}</span><span>${t('module.width')}</span></div>
      <div class="zone">
        <select class="select zone__type" data-field="mType">${options}</select>
        ${count}
        ${width}
      </div>
    </div>`;

const widthInput = value =>
  `<input class="input" data-field="mWidth" type="number" inputmode="numeric" min="150" max="1200" step="50" value="${value}">`;
const noCount = () =>
  `<input class="input zone__count" data-field="mCount" type="number" value="" disabled title="${t('module.noCount')}">`;

const tallBody = (m, i, lm) => `<div class="zones">
      <div class="zone-head"><span>${t('module.zonesHead')}</span><span>${t('module.count')}</span><span>${t('module.zoneHeight')}</span></div>
      ${m.zones.map((z, j) => zoneRow(z, i, j, lm.zones[j], m.zones.length)).join('')}
    </div>
    <button class="btn" data-act="zAdd">${t('module.addZone')}</button>`;

const fridgeBody = (m, i, lm) => `<div class="field-grid">
      ${numField('fNicheH', 'module.nicheHeight', m.nicheH)}
      ${numField('fNicheD', 'module.nicheDepth', m.nicheD)}
    </div>
    <p class="hint" data-calc="fridge-${i}">${fridgeNote(lm)}</p>`;

/**
 * Картка модуля.
 * @param {any} m модуль проєкту
 * @param {number} i індекс у поточному ряду
 * @param {any} lm розрахунок модуля
 * @param {{ selected: boolean, total: number, min: number, tier: string, no: number }} o
 */
export function moduleCard(m, i, lm, { selected, total, min, tier, no }) {
  const upper = tier === 'upper';
  const range = (upper ? UPPER_COUNT : MODULE_COUNT)[m.type];
  const count = range
    ? `<input class="input zone__count" data-field="mCount" type="number" min="${range[0]}" max="${range[1]}" value="${lm.cnt}" title="${t('module.countTitle')}">`
    : noCount();
  // посудомийка — лише стандартні ширини ніші
  const width =
    m.type === 'dishwasher'
      ? `<select class="select" data-field="mWidth">${DISHWASHER_WIDTHS.map(
          w => `<option value="${w}"${w === m.width ? ' selected' : ''}>${w}</option>`,
        ).join('')}</select>`
      : widthInput(m.width);
  const options = upper ? upperTypeOptions(m.type) : baseTypeOptions(m.type);
  const body = m.type === 'tall' ? tallBody(m, i, lm) : m.type === 'fridge' ? fridgeBody(m, i, lm) : '';
  const name = t(upper ? 'module.upperName' : 'module.name', { n: no });
  return `<div class="section${selected ? ' is-selected' : ''}" data-module="${i}">
    ${moduleHead(name, i, total, min)}
    ${typeRow(options, count, width, !!range)}
    ${body}
  </div>`;
}

// Вміст попапу «Налаштування стільниці». wt — worktopOf(s), thick — worktopThickness(s)
export function worktopSettingsForm(wt, thick) {
  const fields = WORKTOP_SIDES.map(
    k => `<label class="field">${t('worktopSide.' + k)}
      <input class="input" type="number" min="0" step="1" inputmode="numeric" data-field="worktopSide" data-side="${k}" value="${round(wt[k])}">
    </label>`,
  ).join('');
  return `<label class="field">${t('kitchen.worktopThickness')}
    <input class="input" type="number" min="${WORKTOP_T.min}" max="${WORKTOP_T.max}" step="1" inputmode="numeric" data-field="worktopT" value="${round(thick)}">
  </label>
  <fieldset class="choice">
    <legend class="choice__legend">${t('kitchen.worktopOverhang')}</legend>
    <div class="field-grid">${fields}</div>
  </fieldset>`;
}

// Вміст попапу «Налаштування верхніх модулів». up — upperOf(s)
export const upperSettingsForm = up => `<div class="field-grid">
    ${numField('upperH', 'kitchen.upperHeight', round(up.H), 1)}
    ${numField('upperD', 'kitchen.upperDepth', round(up.D), 1)}
    ${numField('upperGap', 'kitchen.upperGap', round(up.gap))}
  </div>`;
