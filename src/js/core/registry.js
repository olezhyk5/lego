import { wardrobe } from './types/wardrobe/index.js';
import { kitchen } from './types/kitchen/index.js';

// Реєстр типів меблів: ключ типу (project.type) → модуль типу (контракт — FurnitureType у types.js).
// Новий тип = папка core/types/<тип>/ + рядок тут (+ форма в ui/forms.js). Загальні модулі звертаються
// до типів лише через цей файл.
/** @type {Record<string, import('./types.js').FurnitureType>} */
const TYPES = { wardrobe, kitchen };

export const DEFAULT_TYPE = 'wardrobe';

export const typeIds = () => Object.keys(TYPES);
export const hasType = id => Object.hasOwn(TYPES, id);
/** @returns {import('./types.js').FurnitureType} */
export const getType = id => TYPES[id];

/**
 * Перевіряє проєкт поточної версії (після upgradeProject) за правилами його типу.
 * @param {import('./types.js').Project} project
 * @returns {import('./validate.js').ValidationResult}
 */
export const validateProject = project => getType(project.type).validate(project);
