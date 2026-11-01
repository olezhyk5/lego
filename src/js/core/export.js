import { t, tm, formatNumber } from '../i18n/index.js';
import { getType } from './registry.js';
import { sheetTotals } from './common/sheets.js';

export const panelSize = p => `${p.a} × ${p.b}`;
export const sheetLabel = r =>
  t('material.sheet', {
    name: t(`material.${r.mat}`),
    ...r.sheet,
    area: formatNumber((r.sheet.a * r.sheet.b) / 1e6, 2),
  });
export const areaText = r => formatNumber(r.area, 2);
// Значення з summary(): повідомлення {key, params}, число або готовий рядок без тексту
export const valueText = v => (v && typeof v === 'object' ? tm(v) : v);
// Рядок опису: дочірні повідомлення (зони тощо) — через «→»
export const describeText = d => t(d.key, { ...d.params, children: (d.children || []).map(tm).join(' → ') });

/**
 * Усе, що показують звіт і експорт, для проєкту будь-якого типу (без тексту).
 * @param {import('./types.js').Project} s
 */
export function projectReport(s) {
  const type = getType(s.type);
  const L = type.layout(s);
  const P = type.parts(s, L);
  return {
    type,
    L,
    P,
    sheets: sheetTotals(P.panels),
    summary: type.summary(s, L),
    describe: type.describe(s, L),
  };
}

// Рядки таблиці для CSV / буфера обміну (поточною мовою).
export function exportRows(s) {
  const R = projectReport(s);
  return [
    ...R.summary.map(r => [tm(r.label), valueText(r.value), '']),
    [],
    [t('report.part'), t('report.sizeMm'), t('report.qty')],
    ...R.P.panels.map(p => [t(p.key), panelSize(p), p.q]),
    [],
    [t('report.material'), t('report.area'), t('report.sheets')],
    ...R.sheets.map(r => [sheetLabel(r), areaText(r), r.sheets]),
    [],
    [t('report.item'), t('report.size'), t('report.qty')],
    ...R.P.items.map(p => [t(p.key), tm(p.size), p.q]),
    [],
    [t(R.type.describeTitle.export)],
    ...R.describe.map(d => [describeText(d)]),
  ];
}

export const toCsv = rows =>
  '﻿' + rows.map(row => row.map(v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`).join(';')).join('\r\n');
export const toTsv = rows => rows.map(row => row.join('\t')).join('\n');

export const fileBase = s => getType(s.type).fileBase(s);
