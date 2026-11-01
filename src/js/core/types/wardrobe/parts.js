import { GAP } from '../../../config/constants.js';
import { round } from '../../../utils/helpers.js';
import { partsBuilder } from '../../common/parts-builder.js';
import { addCarcassPanels, addBackPanel } from '../../common/carcass.js';
import { msg } from '../../common/msg.js';
import { drawerDepth } from '../../common/drawers.js';
import { drawerFront } from './layout.js';

// Специфікація без тексту (перекладає ui/ або core/export.js):
//   panels — плити {key, mat, a, b, q}, розміри в мм, mat — ключ з MATERIALS;
//   items  — фурнітура/блоки {key, size: {key, params}, q}.
// Кожна плита має рівно один бокс у geometry.js (перевіряє core/registry.test.js).
export function partsList(s, L) {
  const P = partsBuilder();
  addCarcassPanels(P, s, L.carcass);
  P.panel('part.divider', L.Hin, s.D, L.secs.length - 1);
  L.secs.forEach(c =>
    c.zones.forEach((z, j) => {
      if (j < c.zones.length - 1) P.panel('part.zoneShelf', c.w, s.D, 1);
      if (z.type === 'shelves') P.panel('part.shelf', c.w, s.D - 20, z.cnt);
      if (z.type === 'rod') P.item('part.rod', msg('itemSize.rod', { w: round(c.w) }), 1);
      if (z.type === 'drawers') {
        const fw = c.w - 2 * GAP,
          fh = drawerFront(z.h, z.cnt);
        P.panel('part.drawerFront', fw, fh, z.cnt);
        P.item(
          'part.drawer',
          msg('itemSize.drawer', { w: round(fw), h: round(fh), d: round(drawerDepth(s.D)) }),
          z.cnt,
        );
        P.item('part.handle', msg('itemSize.handle'), z.cnt); // по одній на фасад
      }
    }),
  );
  addBackPanel(P, s, L.carcass);
  return P.result();
}

function zoneMsg(z) {
  const h = round(z.h);
  switch (z.type) {
    case 'empty':
      return msg('describe.empty', { h });
    case 'shelves':
      return msg('describe.shelves', { cnt: z.cnt, h });
    case 'rod':
      return msg('describe.rod', { h });
    case 'drawers':
      return msg('describe.drawers', { cnt: z.cnt, front: round(drawerFront(z.h, z.cnt)), h });
  }
  return null;
}

// Опис секцій: [{key, params, children: [{key, params}]}]
export function describe(s, L) {
  return L.secs.map(c => ({
    key: 'describe.section',
    params: { n: c.i + 1, w: round(c.w) },
    children: c.zones.map(zoneMsg).filter(Boolean),
  }));
}

// Кришка одним повідомленням: «Над боковинами», «…, потовщена (2 плити)», + виступи, якщо є
function topMsg(c) {
  const mount = msg(`topMount.${c.mount}`);
  const top = c.double ? msg('export.topDouble', { mount }) : mount;
  return Object.values(c.overhang).some(v => v > 0) ? msg('export.topOverhang', { top, ...c.overhang }) : top;
}

// Шапка CSV: [{label, value}]
export function summary(s, L) {
  return [
    { label: msg('export.overall'), value: `${s.W} × ${s.H} × ${s.D}` },
    { label: msg('export.plinth'), value: s.plinth },
    { label: msg('export.top'), value: topMsg(L.carcass) },
  ];
}
