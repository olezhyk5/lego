// Стіни кухні. Перша стіна — поля проєкту modules / uppers, наступні — walls[], кожна зі стиком corner.
// Рух завжди йде вздовж стін кімнати за годинниковою стрілкою, тож Г- і П-подібні кухні (і дзеркальні) —
// той самий запис, лише з іншого боку кімнати; окремого напряму повороту немає.

export const runsOf = s => [
  { modules: s.modules, uppers: s.uppers || [], corner: null },
  ...(s.walls || []).map(w => ({ modules: w.modules, uppers: w.uppers || [], corner: w.corner })),
];

// Напрям осі x стіни в координатах моделі: кожна наступна стіна — поворот на 90°
const DIRS = [
  [1, 0],
  [0, 1],
  [-1, 0],
];

/**
 * Розміщення стін: r — кількість поворотів, (ox, oz) — початок стіни.
 * @param {number[]} lens довжини стін
 */
export function placements(lens) {
  let ox = 0,
    oz = 0;
  const out = lens.map((len, r) => {
    const p = { r, ox, oz };
    ox += DIRS[r][0] * len;
    oz += DIRS[r][1] * len;
    return p;
  });
  // третя стіна довша за першу виходила б у від'ємний x
  const shift = Math.max(0, ...out.map((p, r) => -(p.ox + DIRS[r][0] * lens[r])));
  return out.map(p => ({ ...p, ox: p.ox + shift }));
}

/** Прямокутник стіни (x, z, w, d) → координати моделі */
export function placeRect({ r, ox, oz }, { x, z, w, d }) {
  if (r === 1) return { x: ox - z - d, z: oz + x, w: d, d: w };
  if (r === 2) return { x: ox - x - w, z: oz - z - d, w, d };
  return { x: ox + x, z: oz + z, w, d };
}

/** Точка стіни [x, y, z] → координати моделі */
export function placePoint(p, [x, y, z]) {
  const q = placeRect(p, { x, z, w: 0, d: 0 });
  return /** @type {[number, number, number]} */ ([q.x, y, q.z]);
}

/** Напрямок (без зсуву) у координатах стіни → координати моделі */
export function placeDir({ r }, [x, y, z]) {
  if (r === 1) return /** @type {[number, number, number]} */ ([-z, y, x]);
  if (r === 2) return /** @type {[number, number, number]} */ ([-x, y, -z]);
  return /** @type {[number, number, number]} */ ([x, y, z]);
}

/**
 * Збирач геометрії в координатах стіни: кладе бокси й циліндри в координати моделі.
 * Поворот кратний 90°, тож бокси лишаються осьовими.
 * @param {import('../../common/geometry-builder.js').GeometryBuilder} G
 * @param {{ r: number, ox: number, oz: number }} p
 */
export function placedBuilder(G, p) {
  const rect = q => placeRect(p, q);
  return {
    panel(key, look, x, y, z, w, h, d, mat, holes = [], notch = null) {
      const q = rect({ x, z, w, d });
      G.panel(key, look, q.x, y, q.z, q.w, h, q.d, mat, holes.map(rect), notch && rect(notch));
    },
    hardware(key, look, x, y, z, w, h, d) {
      const q = rect({ x, z, w, d });
      G.hardware(key, look, q.x, y, q.z, q.w, h, q.d);
    },
    /** @param {'x' | 'y' | 'z'} [axis] */
    rod(key, look, x, y, z, len, r, axis = 'x') {
      if (axis === 'y') {
        const q = rect({ x, z, w: 0, d: 0 });
        return G.rod(key, look, q.x, y, q.z, len, r, 'y');
      }
      const q = rect(axis === 'x' ? { x, z, w: len, d: 0 } : { x, z, w: 0, d: len });
      G.rod(key, look, q.x, y, q.z, len, r, q.w > 0 ? 'x' : 'z');
    },
    /** @param {[number, number, number]} dir @param {number} travel @param {() => void} fn */
    moving(dir, travel, fn) {
      G.moving(placeDir(p, dir), travel, fn);
    },
  };
}
