// Перевірка формату проєкту (а не конструктивної доцільності — це check.* у розрахунку).
// Офіційний опис формату — schema/project.v2.schema.json; тест звіряє його з цим валідатором.

/** @typedef {import('./types.js').Msg} Msg */
/** @typedef {import('./types.js').Project} Project */
/** @typedef {{ key: string, params?: Record<string, any>, path: (string | number)[] }} ValidationError */

export const MAX_ERRORS = 10;

export const isPlainObject = v => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * Набір перевірок, що збирає помилки. field — Msg з людською назвою місця (validate.field.*).
 * Кожна перевірка повертає true, якщо значення коректне.
 */
export function createChecker() {
  /** @type {ValidationError[]} */
  const errors = [];
  const fail = (key, params, path) => {
    if (errors.length < MAX_ERRORS) errors.push({ key, params, path });
    return false;
  };
  return {
    errors,
    /** скінченне число в межах [min, max] */
    number(v, path, field, min, max) {
      if (typeof v !== 'number' || !Number.isFinite(v)) return fail('validate.number', { field }, path);
      if (v < min || v > max) return fail('validate.range', { field, min, max }, path);
      return true;
    },
    integer(v, path, field, min, max) {
      if (!Number.isInteger(v)) return fail('validate.integer', { field }, path);
      if (v < min || v > max) return fail('validate.range', { field, min, max }, path);
      return true;
    },
    /** 'auto' або число в межах */
    autoOrNumber(v, path, field, min, max) {
      return v === 'auto' || this.number(v, path, field, min, max);
    },
    oneOf(v, list, path, field) {
      return list.includes(v) || fail('validate.enum', { field, value: String(v) }, path);
    },
    boolean(v, path, field) {
      return typeof v === 'boolean' || fail('validate.boolean', { field }, path);
    },
    object(v, path, field) {
      return isPlainObject(v) || fail('validate.object', { field }, path);
    },
    array(v, path, field, min, max) {
      if (!Array.isArray(v)) return fail('validate.array', { field }, path);
      if (v.length < min || v.length > max) return fail('validate.arrayLength', { field, min, max }, path);
      return true;
    },
  };
}

/** @typedef {ReturnType<typeof createChecker>} Checker */

/**
 * Результат валідації: нормалізований проєкт (лише відомі поля) або список помилок (≤ MAX_ERRORS).
 * @typedef {{ ok: true, project: Project } | { ok: false, errors: ValidationError[] }} ValidationResult
 */

/**
 * Загальна частина + поля типу. normalize(project, check) перевіряє поля типу і повертає
 * нормалізовані поля (без невідомих) — це робить модуль типу.
 * @param {Project} project проєкт поточної версії (після upgradeProject)
 * @param {(p: any, check: Checker) => Record<string, any>} normalize
 * @returns {ValidationResult}
 */
export function runValidation(project, normalize) {
  const check = createChecker();
  if (!check.object(project, [], { key: 'validate.field.project' })) return { ok: false, errors: check.errors };
  const fields = normalize(project, check);
  if (check.errors.length) return { ok: false, errors: check.errors };
  return { ok: true, project: { version: project.version, type: project.type, ...fields } };
}
