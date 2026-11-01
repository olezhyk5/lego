// Спільні типи (JSDoc, перевіряє `npm run typecheck`). Лише @typedef, без коду.
// Використання: /** @param {import('./types.js').Project} s */

/**
 * Повідомлення без тексту: перекладає ui/ (tm) або експорт. Параметр може бути вкладеним Msg.
 * @typedef {{ key: string, params?: Record<string, any> }} Msg
 */

/**
 * Проєкт у поточному форматі. Поля, крім version і type, визначає тип меблів.
 * @typedef {{ version: number, type: string, [field: string]: any }} Project
 */

/**
 * Плита специфікації: розміри в мм (цілі), mat — ключ з MATERIALS.
 * @typedef {{ key: string, mat: string, a: number, b: number, q: number }} Panel
 */

/**
 * Фурнітура / блок специфікації.
 * @typedef {{ key: string, size: Msg, q: number }} Item
 */

/** @typedef {{ panels: Panel[], items: Item[] }} PartsList */

/**
 * Бокс геометрії (мм). (x, y, z) — мінімальний кут; x — від лівої площини, y — від підлоги,
 * z — від задньої площини до фасаду. key — ключ деталі (part.*), той самий, що в специфікації.
 * kind: panel — плита (є в специфікації рівно один раз), hardware — фурнітура.
 * look — роль матеріалу в 3D (див. LOOKS).
 * @typedef {{ key: string, kind: 'panel' | 'hardware', mat?: string, look: string,
 *   x: number, y: number, z: number, w: number, h: number, d: number }} GeometryBox
 */

/**
 * Циліндр уздовж x від x до x + len; (y, z) — його вісь.
 * @typedef {{ key: string, look: string, x: number, y: number, z: number, len: number, r: number }} GeometryRod
 */

/** @typedef {{ boxes: GeometryBox[], rods: GeometryRod[] }} Geometry */

/** @typedef {{ W: number, H: number, D: number }} Bounds */

/**
 * Розрахунок типу: структура довільна, але обов'язково — помилки, попередження й габарити моделі.
 * @typedef {{ errs: Msg[], warns: Msg[], bounds: Bounds, [field: string]: any }} Layout
 */

/** @typedef {[number, number, number]} Vec3 */

/**
 * Підписи в 3D (мм сцени): розмірні лінії, плашки, підсвітка вибраної групи.
 * Рядок підпису — готовий рядок без тексту (числа) або Msg.
 * @typedef {{
 *   dims: { from: Vec3, to: Vec3, text: string, tick: Vec3, size: number }[],
 *   labels: { lines: (string | Msg)[], pos: Vec3, size: number, style: string }[],
 *   highlight: { x: number, y: number, z: number, w: number, h: number, d: number } | null,
 * }} Annotations
 */

/**
 * Рядок шапки звіту/CSV. value — Msg, число або рядок без тексту.
 * @typedef {{ label: Msg, value: Msg | number | string }} SummaryRow
 */

/** @typedef {Msg & { children?: Msg[] }} DescribeRow */

/**
 * Тип меблів (core/types/<тип>/index.js). Усі функції чисті: без DOM і Three.js, повертають ключі й числа.
 * @typedef {{
 *   id: string,
 *   presets: Record<string, { data: Record<string, any> }>,
 *   defaultPreset: string,
 *   validate: (project: Project) => import('./validate.js').ValidationResult,
 *   layout: (project: Project) => Layout,
 *   parts: (project: Project, L: Layout) => PartsList,
 *   summary: (project: Project, L: Layout) => SummaryRow[],
 *   describe: (project: Project, L: Layout) => DescribeRow[],
 *   describeTitle: { report: string, export: string },
 *   geometry: (project: Project, L: Layout) => Geometry,
 *   annotations: (project: Project, L: Layout, ui: { sel: number }) => Annotations,
 *   fileBase: (project: Project) => string,
 * }} FurnitureType
 */

export {};
