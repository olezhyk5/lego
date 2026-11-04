import { DEFAULT_MATERIAL, MATERIALS } from '../../config/materials.js';
import { round } from '../../utils/helpers.js';

/** @typedef {import('../types.js').PartsList} PartsList */

// Збирач специфікації: однакові деталі (ключ + матеріал + розміри + товщина) зливаються в один рядок.
export function partsBuilder() {
  /** @type {import('../types.js').Panel[]} */
  const panels = [];
  /** @type {import('../types.js').Item[]} */
  const items = [];
  return {
    /** Плита a × b мм, q штук; t потрапляє в рядок, лише коли відрізняється від товщини матеріалу */
    panel(key, a, b, q, mat = DEFAULT_MATERIAL, t = MATERIALS[mat].t) {
      if (q <= 0) return;
      a = round(a);
      b = round(b);
      const own = t === MATERIALS[mat].t ? undefined : t;
      const f = panels.find(p => p.key === key && p.mat === mat && p.a === a && p.b === b && p.t === own);
      f ? (f.q += q) : panels.push({ key, mat, a, b, q, ...(own === undefined ? {} : { t: own }) });
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
