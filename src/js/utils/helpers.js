export const clone = o => JSON.parse(JSON.stringify(o));
export const isAuto = v => v == null || v === '' || v === 'auto';
export const round = v => Math.round(v);
// Глибоке порівняння JSON-подібних значень; порядок ключів не важливий
export function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  return ka.length === Object.keys(b).length && ka.every(k => Object.hasOwn(b, k) && deepEqual(a[k], b[k]));
}
