import { wardrobe } from './types/wardrobe/index.js';
import { kitchen } from './types/kitchen/index.js';

/** @typedef {import('./types.js').FurnitureType} FurnitureType */

// Реєстр типів меблів: ключ типу (project.type) → модуль типу (контракт — FurnitureType у types.js).
// Вбудовані типи — тут; типи ззовні додає registerType (createConfigurator з опцією types).
// Загальні модулі звертаються до типів лише через цей файл.
/** @type {Record<string, FurnitureType>} */
const TYPES = { wardrobe, kitchen };

export const DEFAULT_TYPE = 'wardrobe';

export const typeIds = () => Object.keys(TYPES);
export const hasType = id => Object.hasOwn(TYPES, id);
/** @returns {FurnitureType} */
export const getType = id => TYPES[id];

/**
 * Додає тип меблів у реєстр. Той самий об'єкт повторно — нічого не змінює; інший тип із зайнятим id — помилка.
 * Реєстр спільний для всіх екземплярів на сторінці.
 * @param {FurnitureType} type
 */
export function registerType(type) {
  if (!type || typeof type.id !== 'string' || !/^[a-z][a-zA-Z0-9]*$/.test(type.id))
    throw new Error('registerType: тип повинен мати id (латиниця й цифри, з малої літери)');
  if (TYPES[type.id] === type) return;
  if (hasType(type.id)) throw new Error(`registerType: тип «${type.id}» уже зареєстровано`);
  TYPES[type.id] = type;
}

/**
 * Перевіряє проєкт поточної версії (після upgradeProject) за правилами його типу.
 * @param {import('./types.js').Project} project
 * @returns {import('./validate.js').ValidationResult}
 */
export const validateProject = project => getType(project.type).validate(project);
