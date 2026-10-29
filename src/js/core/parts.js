import { T, GAP } from '../config/constants.js';
import { MATERIALS, DEFAULT_MATERIAL } from '../config/materials.js';
import { round } from '../utils/helpers.js';
import { drawerFront } from './layout.js';

// Специфікація без тексту (перекладає ui/ або core/export.js):
//   panels — плити {key, mat, a, b, q}, розміри в мм, mat — ключ з MATERIALS;
//   items  — фурнітура/блоки {key, size: {key, params}, q}.
export function partsList(s, L) {
  const panels = [],
    items = [];
  const addP = (key, a, b, q, mat = DEFAULT_MATERIAL) => {
    if (q <= 0) return;
    a = round(a);
    b = round(b);
    const f = panels.find(p => p.key === key && p.mat === mat && p.a === a && p.b === b);
    f ? (f.q += q) : panels.push({ key, mat, a, b, q });
  };
  const addI = (key, size, q) => {
    if (q <= 0) return;
    const id = JSON.stringify(size);
    const f = items.find(p => p.key === key && JSON.stringify(p.size) === id);
    f ? (f.q += q) : items.push({ key, size, q });
  };
  addP('part.side', s.H, s.D, 2);
  addP('part.top', s.W - 2 * T, s.D, 1);
  addP('part.bottom', s.W - 2 * T, s.D, 1);
  if (s.plinth > 0) addP('part.plinth', s.W - 2 * T, s.plinth, 1);
  addP('part.divider', L.Hin, s.D, L.secs.length - 1);
  L.secs.forEach(c =>
    c.zones.forEach((z, j) => {
      if (j < c.zones.length - 1) addP('part.zoneShelf', c.w, s.D, 1);
      if (z.type === 'shelves') addP('part.shelf', c.w, s.D - 20, z.cnt);
      if (z.type === 'rod') addI('part.rod', { key: 'itemSize.rod', params: { w: round(c.w) } }, 1);
      if (z.type === 'drawers')
        addI(
          'part.drawer',
          {
            key: 'itemSize.drawer',
            params: { w: round(c.w - 2 * GAP), h: round(drawerFront(z.h, z.cnt)), d: round(s.D - 50) },
          },
          z.cnt,
        );
    }),
  );
  addP('part.back', s.H - 4, s.W - 4, 1, 'hardboard');
  return { panels, items };
}

// Підсумок по матеріалах: [{mat, area, sheet: {a, b}, sheets}].
// area — сумарна площа деталей, м² (до сотих); sheets — скільки листів покриває цю площу.
// Це нижня межа: розкрій (обрізки, напрям різу, деталі, що не влазять у лист) не враховано.
export function sheetTotals(panels) {
  return Object.entries(MATERIALS)
    .map(([mat, { sheet }]) => {
      const mm2 = panels.filter(p => p.mat === mat).reduce((sum, p) => sum + p.a * p.b * p.q, 0);
      return {
        mat,
        area: Math.round(mm2 / 1e4) / 100,
        sheet: { ...sheet },
        sheets: Math.ceil(mm2 / (sheet.a * sheet.b)),
      };
    })
    .filter(r => r.sheets > 0);
}

function zoneMsg(z) {
  const h = round(z.h);
  switch (z.type) {
    case 'empty':
      return { key: 'describe.empty', params: { h } };
    case 'shelves':
      return { key: 'describe.shelves', params: { cnt: z.cnt, h } };
    case 'rod':
      return { key: 'describe.rod', params: { h } };
    case 'drawers':
      return { key: 'describe.drawers', params: { cnt: z.cnt, front: round(drawerFront(z.h, z.cnt)), h } };
  }
  return null;
}

// Опис секцій: [{key, params, zones: [{key, params}]}]
export function describe(L) {
  return L.secs.map(c => ({
    key: 'describe.section',
    params: { n: c.i + 1, w: round(c.w) },
    zones: c.zones.map(zoneMsg).filter(Boolean),
  }));
}
