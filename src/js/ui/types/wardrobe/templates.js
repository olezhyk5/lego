import { TOP_MOUNTS, TOP_OVERHANG_SIDES } from '../../../config/constants.js';
import { ZONE_TYPES, COUNTABLE_ZONES } from '../../../core/types/wardrobe/constants.js';
import { t } from '../../../i18n/index.js';
import { isAuto, round } from '../../../utils/helpers.js';
import { COPY_ICON, GEAR_ICON, iconBtn, calcMm, dimField } from '../../templates.js';

// HTML-шаблони форми шафи. Класи — для стилів, data-атрибути — для JS, тексти — лише через t().

export const DIMS = [
  { id: 'W', labelKey: 'sidebar.width', min: 300, max: 5000 },
  { id: 'H', labelKey: 'sidebar.height', min: 300, max: 3000 },
  { id: 'D', labelKey: 'sidebar.depth', min: 200, max: 900 },
  { id: 'plinth', labelKey: 'sidebar.plinth', min: 0, max: 200 },
];

// Над 3D на мобільному: габарити, основа (цоколь / регульовані опори) й кнопка налаштувань кришки
export const setupMarkup = () => `<section class="card">
    <h2 class="card__title">${t('sidebar.dimensions')}</h2>
    <div class="dims">${DIMS.map(dimField).join('')}</div>
    <label class="check">
      <input class="check__input" type="checkbox" id="baseLegs">
      <span>${t('sidebar.baseLegs')}</span>
    </label>
  </section>
  <section class="card">
    <button type="button" class="btn option-btn" id="topSettings">
      ${GEAR_ICON}
      <span>${t('sidebar.topSettings')}</span>
    </button>
  </section>`;

// Під 3D на мобільному: секції
export const mainMarkup = () => `<section class="card">
    <h2 class="card__title">${t('sidebar.sections')}</h2>
    <div id="sections"></div>
    <button class="btn" id="addSec">${t('sidebar.addSection')}</button>
    <p class="hint">${t('sidebar.hint')}</p>
  </section>`;

// Короткий підсумок у заголовку згорнутої секції
export const sectionSummary = lc => t('section.summary', { w: round(lc.w), n: lc.zones.length });

function zoneRow(z, i, j, lz, total) {
  const opts = ZONE_TYPES.map(
    k => `<option value="${k}"${k === z.type ? ' selected' : ''}>${t('zoneType.' + k)}</option>`,
  ).join('');
  const hasCnt = COUNTABLE_ZONES.includes(z.type);
  return `<div class="zone" data-zone="${j}">
    <select class="select zone__type" data-field="zType">${opts}</select>
    <input class="input zone__count" data-field="zCount" type="number" min="1" max="20" value="${hasCnt ? z.count || 1 : ''}" ${hasCnt ? '' : 'disabled'} title="${t('zone.countTitle')}">
    <input class="input" data-field="zHeight" inputmode="numeric" placeholder="${t('common.auto')}" value="${isAuto(z.height) ? '' : z.height}" title="${t('zone.heightTitle')}">
    <div class="zone__btns">
      ${iconBtn('zUp', 'zone.up', '↑', j === 0)}
      ${iconBtn('zDown', 'zone.down', '↓', j === total - 1)}
      ${iconBtn('zDel', 'zone.delete', '✕', total === 1)}
    </div>
    <span class="calc zone__calc" data-calc="z-${i}-${j}">${calcMm(lz.h)}</span>
  </div>`;
}

export function sectionCard(c, i, lc, { selected, collapsed, total }) {
  const toggleKey = collapsed ? 'section.expand' : 'section.collapse';
  return `<div class="section${selected ? ' is-selected' : ''}${collapsed ? ' is-collapsed' : ''}" data-section="${i}">
    <div class="section__head">
      <button class="section__toggle" data-act="secToggle" aria-expanded="${!collapsed}" aria-controls="section-body-${i}" title="${t(toggleKey)}">
        <span class="section__chevron" aria-hidden="true">▾</span>
        <b class="section__name">${t('section.name', { n: i + 1 })}</b>
        <span class="calc section__summary" data-calc="sum-${i}">${sectionSummary(lc)}</span>
      </button>
      ${iconBtn('secLeft', 'section.left', '←', i === 0)}
      ${iconBtn('secRight', 'section.right', '→', i === total - 1)}
      ${iconBtn('secDup', 'section.duplicate', COPY_ICON)}
      ${iconBtn('secDel', 'section.delete', '✕', total === 1)}
    </div>
    <div class="section__body" id="section-body-${i}"${collapsed ? ' hidden' : ''}>
    <div class="section__row">${t('section.width')} <input class="input section__width" data-field="secWidth" inputmode="numeric" placeholder="${t('common.auto')}" value="${isAuto(c.width) ? '' : c.width}"> <span class="calc" data-calc="s-${i}">${calcMm(lc.w)}</span></div>
    <div class="zones">
      <div class="zone-head"><span>${t('section.zonesHead')}</span><span>${t('section.count')}</span><span>${t('section.height')}</span></div>
      ${c.zones.map((z, j) => zoneRow(z, i, j, lc.zones[j], c.zones.length)).join('')}
    </div>
    <button class="btn" data-act="zAdd">${t('section.addZone')}</button>
    </div>
  </div>`;
}

// Вміст попапу «Налаштування кришки». c — поточний корпус: carcass(s)
export function topSettingsForm(c) {
  const opts = TOP_MOUNTS.map(
    k => `<label class="choice__option">
      <input class="choice__input" type="radio" name="topMount" data-field="topMount" value="${k}"${k === c.mount ? ' checked' : ''}>
      <span>${t('topMount.' + k)}</span>
    </label>`,
  ).join('');
  return `<label class="check">
    <input class="check__input" type="checkbox" data-field="topDouble"${c.double ? ' checked' : ''}>
    <span>${t('topSettings.double')}</span>
  </label>
  <fieldset class="choice">
    <legend class="choice__legend">${t('topSettings.mount')}</legend>
    <div class="choice__options">${opts}</div>
  </fieldset>
  ${overhangFields(c)}`;
}

// Виступи кришки — лише для «Над боковинами»: блок ховається, поки обрано інше кріплення
function overhangFields(c) {
  const fields = TOP_OVERHANG_SIDES.map(
    k => `<label class="field">${t('topOverhang.' + k)}
      <input class="input" type="number" min="0" step="1" inputmode="numeric" data-field="topOverhang" data-side="${k}" value="${round(c.overhang[k])}">
    </label>`,
  ).join('');
  return `<fieldset class="choice" data-overhang${c.mount === 'over' ? '' : ' hidden'}>
    <legend class="choice__legend">${t('topSettings.overhang')}</legend>
    <div class="field-grid">${fields}</div>
  </fieldset>`;
}
