import { T, GAP, TOP_MOUNTS, DEFAULT_TOP_MOUNT, TOP_OVERHANG_SIDES } from '../config/constants.js';
import { isAuto, round } from '../utils/helpers.js';

export function drawerFront(h, cnt) {
  return (h - (cnt + 1) * GAP) / cnt;
}

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

// Корпус: кришка та її стик з боковинами.
// mount: between — боковини на всю висоту, кришка між ними; over — кришка на всю ширину, боковини під нею.
// double — кришка з двох плит: товщина topT = 2 × T, у специфікації topQ = 2.
// overhang (лише over) — виступи кришки за корпус: кришка (topW × topD) зсувається на topX / topZ
// (z = 0 — задня площина корпусу). Виступ ззаду → задня стінка закінчується під кришкою (backH).
export function carcass(s) {
  const top = s.top && typeof s.top === 'object' ? s.top : {};
  const mount = TOP_MOUNTS.includes(top.mount) ? top.mount : DEFAULT_TOP_MOUNT;
  const double = top.double === true;
  const topT = double ? 2 * T : T;
  const overhang = overhangOf(top, mount);
  const base = { mount, double, overhang, topT, topQ: double ? 2 : 1 };
  if (mount !== 'over') return { ...base, sideH: s.H, topW: s.W - 2 * T, topX: T, topD: s.D, topZ: 0, backH: s.H - 4 };
  const sideH = s.H - topT;
  return {
    ...base,
    sideH,
    topW: s.W + overhang.left + overhang.right,
    topX: 0 - overhang.left,
    topD: s.D + overhang.back + overhang.front,
    topZ: 0 - overhang.back,
    // задня стінка з відступом 2 мм від країв; при виступі ззаду — по висоті боковин
    backH: (overhang.back > 0 ? sideH : s.H) - 4,
  };
}

// Повідомлення — {key, params} без тексту: перекладає ui/ через tm().
// Параметр-повідомлення (name) перекладається рекурсивно.
const msg = (key, params) => ({ key, params });

// Розраховує фактичні розміри секцій і зон + помилки/попередження.
export function computeLayout(s) {
  const errs = [],
    warns = [];
  const n = s.sections.length;
  if (s.W < 300 || s.H < 300 || s.D < 200) errs.push(msg('check.tooSmall'));
  const innerW = s.W - 2 * T - Math.max(0, n - 1) * T;
  let fW = 0,
    aW = 0;
  s.sections.forEach(c => (isAuto(c.width) ? aW++ : (fW += +c.width || 0)));
  const autoW = aW ? (innerW - fW) / aW : 0;
  if (aW && autoW < 100) errs.push(msg('check.widthsOverflow', { auto: round(autoW) }));
  if (!aW && Math.abs(fW - innerW) > 1)
    errs.push(msg('check.widthsMismatch', { sum: round(fW), avail: round(innerW) }));

  const C = carcass(s);
  const y0 = s.plinth + T,
    yTop = s.H - C.topT,
    Hin = yTop - y0;
  let x = T;
  const secs = s.sections.map((c, i) => {
    const name = { key: 'section.name', params: { n: i + 1 } };
    const w = isAuto(c.width) ? autoW : +c.width || 0;
    let fH = 0,
      aH = 0;
    c.zones.forEach(z => (isAuto(z.height) ? aH++ : (fH += +z.height || 0)));
    const avail = Hin - Math.max(0, c.zones.length - 1) * T;
    const autoH = aH ? (avail - fH) / aH : 0;
    if (aH && autoH < 60) errs.push(msg('check.heightsOverflow', { name, auto: round(autoH) }));
    if (!aH && c.zones.length && Math.abs(fH - avail) > 1)
      errs.push(msg('check.heightsMismatch', { name, sum: round(fH), avail: round(avail) }));
    if (w > 0 && w < 250) warns.push(msg('check.narrowSection', { name, w: round(w) }));
    if (w > 1000) warns.push(msg('check.wideSection', { name, w: round(w) }));

    let y = yTop;
    const zones = c.zones.map((z, j) => {
      const h = isAuto(z.height) ? autoH : +z.height || 0;
      const top = y,
        bottom = y - h;
      y = bottom - T;
      const zn = { key: 'zone.name', params: { n: i + 1, z: j + 1 } };
      const cnt = Math.max(1, +z.count || 1);
      if (z.type === 'rod' && h < 900) warns.push(msg('check.rodLow', { name: zn, h: round(h) }));
      if (z.type === 'rod' && w > 1000) warns.push(msg('check.rodLong', { name: zn, w: round(w) }));
      if (z.type === 'drawers') {
        const fh = drawerFront(h, cnt);
        if (fh < 100) warns.push(msg('check.drawerSmall', { name: zn, h: round(fh) }));
        if (fh > 350) warns.push(msg('check.drawerLarge', { name: zn, h: round(fh) }));
        if (top > 1300) warns.push(msg('check.drawersHigh', { name: zn, top: round(top) }));
      }
      if (z.type === 'shelves') {
        const gap = (h - cnt * T) / (cnt + 1);
        if (gap < 150) warns.push(msg('check.shelvesTight', { name: zn, gap: round(gap) }));
      }
      return Object.assign({}, z, { h, top, bottom, cnt });
    });
    const out = { i, x, w, zones };
    x += w + T;
    return out;
  });
  return { secs, innerW, Hin, y0, yTop, carcass: C, errs, warns };
}
