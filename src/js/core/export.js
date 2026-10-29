import { t, tm, formatNumber } from '../i18n/index.js';
import { computeLayout } from './layout.js';
import { partsList, sheetTotals, describe } from './parts.js';

export const panelSize = p => `${p.a} × ${p.b}`;
export const sheetLabel = r =>
  t('material.sheet', {
    name: t(`material.${r.mat}`),
    ...r.sheet,
    area: formatNumber((r.sheet.a * r.sheet.b) / 1e6, 2),
  });
export const areaText = r => formatNumber(r.area, 2);
export const describeText = d => t(d.key, { ...d.params, zones: d.zones.map(tm).join(' → ') });

// Рядки таблиці для CSV / буфера обміну (поточною мовою).
export function exportRows(s) {
  const L = computeLayout(s),
    P = partsList(s, L);
  return [
    [t('export.overall'), `${s.W} × ${s.H} × ${s.D}`, ''],
    [t('export.plinth'), s.plinth, ''],
    [],
    [t('report.part'), t('report.sizeMm'), t('report.qty')],
    ...P.panels.map(p => [t(p.key), panelSize(p), p.q]),
    [],
    [t('report.material'), t('report.area'), t('report.sheets')],
    ...sheetTotals(P.panels).map(r => [sheetLabel(r), areaText(r), r.sheets]),
    [],
    [t('report.item'), t('report.size'), t('report.qty')],
    ...P.items.map(p => [t(p.key), tm(p.size), p.q]),
    [],
    [t('export.description')],
    ...describe(L).map(d => [describeText(d)]),
  ];
}

export const toCsv = rows =>
  '﻿' + rows.map(row => row.map(v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`).join(';')).join('\r\n');
export const toTsv = rows => rows.map(row => row.join('\t')).join('\n');

export const fileBase = s => `shafa-${s.W}x${s.H}x${s.D}`;
