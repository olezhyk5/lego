import { ZONE_TYPES, COUNTABLE_ZONES, TOP_MOUNTS, TOP_OVERHANG_SIDES } from '../config/constants.js';
import { PRESETS } from '../config/presets.js';
import { t } from '../i18n/index.js';
import { isAuto, round } from '../utils/helpers.js';

// HTML-шаблони сайдбару. Класи — для стилів, data-атрибути — для JS, тексти — лише через t().

export const presetButtons = () =>
  Object.keys(PRESETS)
    .map(k => `<button class="btn" data-preset="${k}">${t('preset.' + k)}</button>`)
    .join('');

// Іконка «копіювати»: символ ⧉ у системних шрифтах помітно дрібніший за стрілки, тож SVG під розмір тексту
const COPY_ICON = `<svg class="btn__svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
  <rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 3.5v-.5a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5"/>
</svg>`;

// disabled — дія зараз неможлива (напр. зсунути крайню секцію)
const iconBtn = (act, titleKey, icon, disabled = false) =>
  `<button class="btn btn--icon" data-act="${act}" title="${t(titleKey)}" aria-label="${t(titleKey)}"${disabled ? ' disabled' : ''}>${icon}</button>`;

const calcMm = v => t('common.calcMm', { value: round(v) });

// Короткий підсумок у заголовку згорнутої секції
const sectionSummary = lc => t('section.summary', { w: round(lc.w), n: lc.zones.length });

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

export { calcMm, sectionSummary };
