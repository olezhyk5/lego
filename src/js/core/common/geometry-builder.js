import { MATERIALS, DEFAULT_MATERIAL } from '../../config/materials.js';

/** @typedef {import('../types.js').Geometry} Geometry */

// Збирач геометрії моделі (мм), формат — Geometry у types.js. look — роль матеріалу в 3D (LOOKS).
// Плита (panel) відповідає рівно одній деталі специфікації: той самий key і mat, два розміри — a × b,
// третій — товщина (t плити специфікації, а якщо її немає — MATERIALS[mat].t). Фурнітура (hardware) у плити не входить.
export function geometryBuilder() {
  /** @type {import('../types.js').GeometryBox[]} */
  const boxes = [];
  /** @type {import('../types.js').GeometryRod[]} */
  const rods = [];
  /** @type {import('../types.js').GeometryMove[]} */
  const moves = [];
  /** @type {number | null} */
  let move = null; // індекс рухомої групи, яку зараз заповнюємо
  const tag = () => (move === null ? {} : { move });
  return {
    panel(key, look, x, y, z, w, h, d, mat = DEFAULT_MATERIAL, holes = [], notch = null) {
      boxes.push({
        key,
        kind: 'panel',
        mat,
        look,
        x,
        y,
        z,
        w,
        h,
        d,
        ...(holes.length ? { holes } : {}),
        ...(notch ? { notch } : {}),
        ...tag(),
      });
    },
    hardware(key, look, x, y, z, w, h, d) {
      boxes.push({ key, kind: 'hardware', look, x, y, z, w, h, d, ...tag() });
    },
    /** @param {'x' | 'y' | 'z'} [axis] */
    rod(key, look, x, y, z, len, r, axis = 'x') {
      /** @type {import('../types.js').GeometryRod} */
      const rod = { key, look, x, y, z, len, r };
      if (axis !== 'x') rod.axis = axis;
      if (move !== null) rod.move = move;
      rods.push(rod);
    },
    /**
     * Рухома група (шухляда): усе, що додає fn, у 3D висувається разом у напрямку dir на частку travel.
     * @param {import('../types.js').Vec3} dir одиничний вектор висування
     * @param {number} travel повний хід, мм
     * @param {() => void} fn
     */
    moving(dir, travel, fn) {
      const prev = move;
      move = moves.push({ dir, travel }) - 1;
      try {
        fn();
      } finally {
        move = prev;
      }
    },
    /** @returns {Geometry} */
    result: () => ({ boxes, rods, moves }),
  };
}

/** @typedef {ReturnType<typeof geometryBuilder>} GeometryBuilder */

/** Товщина плити матеріалу, мм */
export const thickness = (mat = DEFAULT_MATERIAL) => MATERIALS[mat].t;
