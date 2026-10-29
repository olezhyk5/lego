import { partsList, describe } from '../core/parts.js';
import { panelSize, describeText } from '../core/export.js';
import { t, tm } from '../i18n/index.js';
import { $ } from '../utils/dom.js';

const row = cells => `<tr>${cells}</tr>`;
const head = (first, size) =>
  row(`<th>${t(first)}</th><th>${t(size)}</th><th class="table__qty">${t('report.qty')}</th>`);
const dataRow = (name, size, q) => row(`<td>${name}</td><td>${size}</td><td class="table__qty">${q}</td>`);

export function renderReport(s, L) {
  const P = partsList(s, L);
  $('#msgs').innerHTML =
    L.errs.map(e => `<div class="message message--error">⛔ ${tm(e)}</div>`).join('') +
    L.warns.map(w => `<div class="message message--warn">⚠ ${tm(w)}</div>`).join('');
  $('#tP').innerHTML =
    head('report.part', 'report.sizeMm') + P.panels.map(p => dataRow(t(p.key), panelSize(p), p.q)).join('');
  $('#tI').innerHTML = P.items.length
    ? head('report.item', 'report.size') + P.items.map(p => dataRow(t(p.key), tm(p.size), p.q)).join('')
    : row(`<td class="table__empty">${t('report.noItems')}</td>`);
  $('#desc').innerHTML = describe(L)
    .map(d => `<li>${describeText(d)}</li>`)
    .join('');
}
