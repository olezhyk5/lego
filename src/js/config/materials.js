// Матеріали плит і формат листа, мм. Назви — у словнику: material.<id>
// Порядок ключів = порядок у підсумках специфікації.
export const MATERIALS = {
  chipboard: { sheet: { a: 2800, b: 2070 } }, // ДСП
  hardboard: { sheet: { a: 2800, b: 2070 } }, // ДВП
};

export const DEFAULT_MATERIAL = 'chipboard';
