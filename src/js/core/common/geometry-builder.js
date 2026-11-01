import { MATERIALS, DEFAULT_MATERIAL } from '../../config/materials.js';

/** @typedef {import('../types.js').Geometry} Geometry */

// Збирач геометрії моделі (мм), формат — Geometry у types.js. look — роль матеріалу в 3D (LOOKS).
// Плита (panel) відповідає рівно одній деталі специфікації: той самий key і mat, два розміри — a × b,
// третій — товщина матеріалу (MATERIALS[mat].t). Фурнітура (hardware) у плити не входить.
export function geometryBuilder() {
  /** @type {import('../types.js').GeometryBox[]} */
  const boxes = [];
  /** @type {import('../types.js').GeometryRod[]} */
  const rods = [];
  return {
    panel(key, look, x, y, z, w, h, d, mat = DEFAULT_MATERIAL) {
      boxes.push({ key, kind: 'panel', mat, look, x, y, z, w, h, d });
    },
    hardware(key, look, x, y, z, w, h, d) {
      boxes.push({ key, kind: 'hardware', look, x, y, z, w, h, d });
    },
    rod(key, look, x, y, z, len, r) {
      rods.push({ key, look, x, y, z, len, r });
    },
    /** @returns {Geometry} */
    result: () => ({ boxes, rods }),
  };
}

/** @typedef {ReturnType<typeof geometryBuilder>} GeometryBuilder */

/** Товщина плити матеріалу, мм */
export const thickness = (mat = DEFAULT_MATERIAL) => MATERIALS[mat].t;
