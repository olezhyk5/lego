import { T, GAP } from '../config/constants.js';
import { round } from '../utils/helpers.js';
import { drawerFront } from './layout.js';

// Специфікація без тексту (перекладає ui/ або core/export.js):
//   panels — плити {key, a, b, q}, розміри в мм;
//   items  — фурнітура/блоки {key, size: {key, params}, q}.
export function partsList(s, L) {
  const panels = [],
    items = [];
  const addP = (key, a, b, q) => {
    if (q <= 0) return;
    a = round(a);
    b = round(b);
    const f = panels.find(p => p.key === key && p.a === a && p.b === b);
    f ? (f.q += q) : panels.push({ key, a, b, q });
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
  addP('part.back', s.H - 4, s.W - 4, 1);
  return { panels, items };
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
