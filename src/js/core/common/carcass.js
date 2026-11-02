import {
  T,
  TOP_MOUNTS,
  DEFAULT_TOP_MOUNT,
  TOP_OVERHANG_SIDES,
  CARCASS_BASES,
  DEFAULT_BASE,
} from '../../config/constants.js';
import { thickness } from './geometry-builder.js';

// Корпус (спільний для корпусних типів): боковини, кришка, дно, цоколь, задня стінка.
// s — поля проєкту: W, H, D, plinth, base?, top?

// Розміри, потрібні лише для моделі (у специфікації їх немає), мм
const PLINTH_SETBACK = 30; // відступ цоколя від передньої площини
const BACK_INSET = 2; // відступ задньої стінки від верху й боків корпусу (у специфікації W - 4); знизу — врівень із дном

// Виступи кришки: невідомі / від'ємні / нечислові значення → 0
function overhangOf(top, mount) {
  const src = mount === 'over' && top.overhang && typeof top.overhang === 'object' ? top.overhang : {};
  return Object.fromEntries(
    TOP_OVERHANG_SIDES.map(k => {
      const v = Number(src[k]);
      return [k, Number.isFinite(v) && v > 0 ? v : 0];
    }),
  );
}

// Кришка та її стик з боковинами.
// mount: between — боковини на всю висоту, кришка між ними; over — кришка на всю ширину, боковини під нею.
// double — кришка з двох плит: товщина topT = 2 × T, у специфікації topQ = 2.
// overhang (лише over) — виступи кришки за корпус: кришка (topW × topD) зсувається на topX / topZ
// (z = 0 — задня площина корпусу). Виступ ззаду → задня стінка закінчується під кришкою (backH).
// base (CARCASS_BASES) плит корпусу не змінює: на ніжках вони ті самі, додається лише фурнітура.
export function carcass(s) {
  const top = s.top && typeof s.top === 'object' ? s.top : {};
  const mount = TOP_MOUNTS.includes(top.mount) ? top.mount : DEFAULT_TOP_MOUNT;
  const double = top.double === true;
  const topT = double ? 2 * T : T;
  const overhang = overhangOf(top, mount);
  const base = CARCASS_BASES.includes(s.base) ? s.base : DEFAULT_BASE;
  const common = { base, mount, double, overhang, topT, topQ: double ? 2 : 1 };
  // задня стінка: від низу дна (y = plinth) до topY мінус відступ
  const backHTo = topY => topY - BACK_INSET - s.plinth;
  if (mount !== 'over')
    return { ...common, sideH: s.H, topW: s.W - 2 * T, topX: T, topD: s.D, topZ: 0, backH: backHTo(s.H) };
  const sideH = s.H - topT;
  return {
    ...common,
    sideH,
    topW: s.W + overhang.left + overhang.right,
    topX: 0 - overhang.left,
    topD: s.D + overhang.back + overhang.front,
    topZ: 0 - overhang.back,
    // при виступі ззаду — лише до верху боковин
    backH: backHTo(overhang.back > 0 ? sideH : s.H),
  };
}

/** @typedef {ReturnType<typeof carcass>} Carcass */

/**
 * Плити корпусу без задньої стінки (її додає addBackPanel — у специфікації вона йде останньою).
 * @param {import('./parts-builder.js').PartsBuilder} P
 * @param {Carcass} C
 */
export function addCarcassPanels(P, s, C) {
  P.panel('part.side', C.sideH, s.D, 2);
  P.panel('part.top', C.topW, C.topD, C.topQ);
  P.panel('part.bottom', s.W - 2 * T, s.D, 1);
  if (s.plinth > 0) P.panel('part.plinth', s.W - 2 * T, s.plinth, 1);
}

// z задньої площини цокольної планки (за нею — передні ніжки)
export const plinthZ = s => s.D - T - PLINTH_SETBACK;

/**
 * @param {import('./parts-builder.js').PartsBuilder} P
 * @param {Carcass} C
 */
export function addBackPanel(P, s, C) {
  P.panel('part.back', C.backH, s.W - 4, 1, 'hardboard');
}

/**
 * Геометрія корпусу разом із задньою стінкою. Кожна плита — окремий бокс, як у специфікації.
 * @param {import('./geometry-builder.js').GeometryBuilder} G
 * @param {Carcass} C
 */
export function addCarcassGeometry(G, s, C) {
  const { sideH, topW, topX, topD, topZ, topQ, backH } = C;
  G.panel('part.side', 'wood', 0, 0, 0, T, sideH, s.D);
  G.panel('part.side', 'wood', s.W - T, 0, 0, T, sideH, s.D);
  // потовщена кришка — дві плити одна на одній
  for (let k = 0; k < topQ; k++) G.panel('part.top', 'wood', topX, s.H - (topQ - k) * T, topZ, topW, T, topD);
  G.panel('part.bottom', 'wood', T, s.plinth, 0, s.W - 2 * T, T, s.D);
  if (s.plinth > 0) G.panel('part.plinth', 'wood', T, 0, plinthZ(s), s.W - 2 * T, s.plinth, T);
  const backT = thickness('hardboard');
  G.panel('part.back', 'back', BACK_INSET, s.plinth, -backT, s.W - 2 * BACK_INSET, backH, backT, 'hardboard');
}
