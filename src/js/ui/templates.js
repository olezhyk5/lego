import { ZONE_TYPES, COUNTABLE_ZONES } from '../config/constants.js';
import { PRESETS } from '../config/presets.js';
import { t } from '../i18n/index.js';
import { isAuto, round } from '../utils/helpers.js';

// HTML-шаблони сайдбару. Класи — для стилів, data-атрибути — для JS, тексти — лише через t().

export const presetButtons = () =>
  Object.keys(PRESETS)
    .map(k => `<button class="btn" data-preset="${k}">${t('preset.' + k)}</button>`)
    .join('');

const iconBtn = (act, titleKey, icon) =>
  `<button class="btn btn--icon" data-act="${act}" title="${t(titleKey)}" aria-label="${t(titleKey)}">${icon}</button>`;

const calcMm = v => t('common.calcMm', { value: round(v) });

function zoneRow(z, i, j, lz) {
  const opts = ZONE_TYPES.map(
    k => `<option value="${k}"${k === z.type ? ' selected' : ''}>${t('zoneType.' + k)}</option>`,
  ).join('');
  const hasCnt = COUNTABLE_ZONES.includes(z.type);
  return `<div class="zone" data-zone="${j}">
    <select class="select zone__type" data-field="zType">${opts}</select>
    <input class="input zone__count" data-field="zCount" type="number" min="1" max="20" value="${hasCnt ? z.count || 1 : ''}" ${hasCnt ? '' : 'disabled'} title="${t('zone.countTitle')}">
    <input class="input" data-field="zHeight" inputmode="numeric" placeholder="${t('common.auto')}" value="${isAuto(z.height) ? '' : z.height}" title="${t('zone.heightTitle')}">
    <div class="zone__btns">
      ${iconBtn('zUp', 'zone.up', '↑')}
      ${iconBtn('zDown', 'zone.down', '↓')}
      ${iconBtn('zDel', 'zone.delete', '✕')}
    </div>
    <span class="calc zone__calc" data-calc="z-${i}-${j}">${calcMm(lz.h)}</span>
  </div>`;
}

export function sectionCard(c, i, lc, selected) {
  return `<div class="section${selected ? ' is-selected' : ''}" data-section="${i}">
    <div class="section__head">
      <b class="section__name">${t('section.name', { n: i + 1 })}</b>
      ${iconBtn('secLeft', 'section.left', '←')}
      ${iconBtn('secRight', 'section.right', '→')}
      ${iconBtn('secDel', 'section.delete', '✕')}
    </div>
    <div class="section__row">${t('section.width')} <input class="input section__width" data-field="secWidth" inputmode="numeric" placeholder="${t('common.auto')}" value="${isAuto(c.width) ? '' : c.width}"> <span class="calc" data-calc="s-${i}">${calcMm(lc.w)}</span></div>
    <div class="zones">
      <div class="zone-head"><span>${t('section.zonesHead')}</span><span>${t('section.count')}</span><span>${t('section.height')}</span></div>
      ${c.zones.map((z, j) => zoneRow(z, i, j, lc.zones[j])).join('')}
    </div>
    <button class="btn" data-act="zAdd">${t('section.addZone')}</button>
  </div>`;
}

export { calcMm };
