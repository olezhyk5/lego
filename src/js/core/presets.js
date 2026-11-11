import { clone, deepEqual } from '../utils/helpers.js';
import { typeIds, getType, DEFAULT_TYPE } from './registry.js';
import { createProject } from './project-format.js';

/** @typedef {import('./types.js').Project} Project */

// Пресети всіх типів. Ідентифікатор — '<тип>.<ключ>' (wardrobe.komod), назва — у словнику: preset.<ідентифікатор>

/**
 * @param {string | null} [type] лише пресети цього типу
 * @returns {string[]}
 */
export const presetIds = (type = null) =>
  (type ? [type] : typeIds()).flatMap(t => Object.keys(getType(t).presets).map(k => `${t}.${k}`));

export const DEFAULT_PRESET = `${DEFAULT_TYPE}.${getType(DEFAULT_TYPE).defaultPreset}`;

const split = id => {
  const i = String(id).indexOf('.');
  return i < 0 ? [null, null] : [id.slice(0, i), id.slice(i + 1)];
};

export const isPresetId = id => {
  const [type, key] = split(id);
  return !!type && typeIds().includes(type) && Object.hasOwn(getType(type).presets, key);
};

export const presetType = id => split(id)[0];

/**
 * Пресети, доступні екземпляру (опція presets): тип ('kitchen') — усі його пресети, '<тип>.<ключ>' — один.
 * Порядок — як у реєстрі. Без списку — усі пресети. Невідомий тип чи пресет або порожній результат — помилка
 * (це помилка інтеграції, а не користувача).
 * @param {string[]} [list]
 * @returns {string[]}
 */
export function resolvePresets(list) {
  if (list === undefined) return presetIds();
  if (!Array.isArray(list)) throw new Error('presets: очікується масив типів або пресетів');
  const unknown = list.filter(v => !typeIds().includes(v) && !isPresetId(v));
  if (unknown.length) throw new Error(`presets: невідомі типи або пресети: ${unknown.join(', ')}`);
  const ids = presetIds().filter(id => list.includes(id) || list.includes(presetType(id)));
  if (!ids.length) throw new Error('presets: порожній список');
  return ids;
}

/**
 * Типи меблів, до яких належать пресети (без повторів, у порядку пресетів)
 * @param {string[]} ids
 */
export const presetTypes = ids => [...new Set(ids.map(presetType))];

/**
 * Новий проєкт з пресета
 * @param {string} id
 * @returns {Project}
 */
export function presetProject(id) {
  const [type, key] = split(id);
  return createProject(type, clone(getType(type).presets[key].data));
}

/**
 * Ідентифікатор пресета, з яким проєкт збігається повністю, або null, якщо проєкт змінено
 * @param {Project} s
 */
export const matchPreset = s =>
  typeIds().includes(s.type) ? (presetIds(s.type).find(id => deepEqual(presetProject(id), s)) ?? null) : null;

// Старі значення 'lego-preset' (до реєстру типів) — без типу: 'komod' → 'wardrobe.komod'
export const upgradePresetId = id => (typeof id === 'string' && !id.includes('.') ? `${DEFAULT_TYPE}.${id}` : id);
