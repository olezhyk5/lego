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
