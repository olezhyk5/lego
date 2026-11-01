// Матеріали плит: формат листа (sheet) і товщина (t), мм. Назви — у словнику: material.<id>
// Порядок ключів = порядок у підсумках специфікації. Товщину плит у 3D і експорті беремо звідси.
export const MATERIALS = {
  chipboard: { sheet: { a: 2800, b: 2070 }, t: 16 }, // ДСП
  hardboard: { sheet: { a: 2800, b: 2070 }, t: 3 }, // ДВП
  worktop: { sheet: { a: 3000, b: 600 }, t: 38 }, // стільниця (ДСП з покриттям), «лист» — стандартна довжина
};

export const DEFAULT_MATERIAL = 'chipboard';
