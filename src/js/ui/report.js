import { panelSize, sheetLabel, areaText, describeText } from '../core/export.js';
import { store } from '../core/store.js';
import { t, tm } from '../i18n/index.js';
import { $ } from '../utils/dom.js';

const row = cells => `<tr>${cells}</tr>`;
const head = (first, size, qty = 'report.qty') =>
  row(`<th>${t(first)}</th><th>${t(size)}</th><th class="table__qty">${t(qty)}</th>`);
const dataRow = (name, size, q) => row(`<td>${name}</td><td>${size}</td><td class="table__qty">${q}</td>`);

// R — projectReport(s) з core/export.js
export function renderReport(R) {
  const { P } = R;
  $('#msgs').innerHTML =
    R.errs.map(e => `<div class="message message--error" data-msg="error">⛔ ${tm(e)}</div>`).join('') +
    R.warns.map(w => `<div class="message message--warn" data-msg="warn">⚠ ${tm(w)}</div>`).join('');
  $('#tP').innerHTML =
    head('report.part', 'report.sizeMm') + P.panels.map(p => dataRow(t(p.key), panelSize(p), p.q)).join('');
  $('#tS').innerHTML =
    head('report.material', 'report.area', 'report.sheets') +
    R.sheets.map(r => dataRow(sheetLabel(r), areaText(r), r.sheets)).join('');
  $('#tI').innerHTML = P.items.length
    ? head('report.item', 'report.size') + P.items.map(p => dataRow(t(p.key), tm(p.size), p.q)).join('')
    : row(`<td class="table__empty">${t('report.noItems')}</td>`);
  $('#descTitle').textContent = t(R.type.describeTitle.report);
  $('#desc').innerHTML = R.describe.map(d => `<li>${describeText(d)}</li>`).join('');
}

// Стан кнопки згортання (і після зміни мови — підказка перекладається)
export function syncReportToggle() {
  const collapsed = store.reportCollapsed;
  $('#reportCols').hidden = collapsed;
  $('#reportToggle').setAttribute('aria-expanded', String(!collapsed));
  $('#reportToggle').title = t(collapsed ? 'report.expand' : 'report.collapse');
}

// Згортання списків плит і елементів однією кнопкою; стан лише на час сесії.
export function initReport() {
  $('#reportToggle').addEventListener('click', () => {
    store.reportCollapsed = !store.reportCollapsed;
    syncReportToggle();
  });
  syncReportToggle();
}
