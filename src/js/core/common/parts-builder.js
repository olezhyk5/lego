import { DEFAULT_MATERIAL } from '../../config/materials.js';
import { round } from '../../utils/helpers.js';

/** @typedef {import('../types.js').PartsList} PartsList */

// Збирач специфікації: однакові деталі (ключ + матеріал + розміри) зливаються в один рядок.
export function partsBuilder() {
  /** @type {import('../types.js').Panel[]} */
  const panels = [];
  /** @type {import('../types.js').Item[]} */
  const items = [];
  return {
    /** Плита a × b мм, q штук */
    panel(key, a, b, q, mat = DEFAULT_MATERIAL) {
      if (q <= 0) return;
      a = round(a);
      b = round(b);
      const f = panels.find(p => p.key === key && p.mat === mat && p.a === a && p.b === b);
      f ? (f.q += q) : panels.push({ key, mat, a, b, q });
    },
    /** Фурнітура / блок; size — {key, params} */
    item(key, size, q) {
      if (q <= 0) return;
      const id = JSON.stringify(size);
      const f = items.find(p => p.key === key && JSON.stringify(p.size) === id);
      f ? (f.q += q) : items.push({ key, size, q });
    },
    /** @returns {PartsList} */
    result: () => ({ panels, items }),
  };
}

/** @typedef {ReturnType<typeof partsBuilder>} PartsBuilder */
