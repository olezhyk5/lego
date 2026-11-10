import { createWardrobeForm } from './types/wardrobe/form.js';
import { createKitchenForm } from './types/kitchen/form.js';

// Форми типів меблів (UI-частина реєстру типів; core/ не може містити DOM).
// Ключ — той самий, що в core/registry.js. Вбудовані форми — тут; форми типів ззовні додає registerForm.
//
// Контракт: createForm({setup, main}, app) — намалювати статичну частину у два слоти (setup — над 3D
// на мобільному, main — під ним), повісити обробники й повернути об'єкт форми. Викликається при зміні типу;
// app — контекст екземпляра (ui/app.js): стан, пошук у root, update, fit, попап.
//   sync()     — переписати значення полів зі store.state (після нового проєкту)
//   render(L)  — перемалювати структуру (update(true))
//   refresh(L) — оновити лише розраховані значення, не чіпаючи полів (update(false))
/**
 * @typedef {{ sync: () => void, render: (L: any) => void, refresh: (L: any) => void }} Form
 * @typedef {(slots: { setup: HTMLElement, main: HTMLElement }, app: import('./app.js').App) => Form} CreateForm
 */

/** @type {Record<string, CreateForm>} */
const FORMS = { wardrobe: createWardrobeForm, kitchen: createKitchenForm };

export const getForm = type => FORMS[type];
export const formTypes = () => Object.keys(FORMS);

/**
 * Додає форму типу меблів. Та сама функція повторно — нічого не змінює; інша з зайнятим id — помилка.
 * @param {string} id
 * @param {CreateForm} createForm
 */
export function registerForm(id, createForm) {
  if (typeof createForm !== 'function') throw new Error(`registerForm: форма «${id}» має бути функцією`);
  if (FORMS[id] === createForm) return;
  if (FORMS[id]) throw new Error(`registerForm: форму «${id}» уже зареєстровано`);
  FORMS[id] = createForm;
}
