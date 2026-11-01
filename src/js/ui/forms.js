import { wardrobeForm } from './types/wardrobe/form.js';
import { kitchenForm } from './types/kitchen/form.js';

// Форми типів меблів (UI-частина реєстру типів; core/ не може містити DOM).
// Ключ — той самий, що в core/registry.js.
//
// Контракт форми:
//   mount({setup, main}, app) — намалювати статичну частину у два слоти (setup — над 3D на мобільному,
//                               main — під ним) і повісити обробники; викликається при зміні типу
//   sync()                    — переписати значення полів зі store.state (після нового проєкту)
//   render(L)                 — перемалювати структуру (update(true))
//   refresh(L)                — оновити лише розраховані значення, не чіпаючи полів (update(false))
/**
 * @typedef {{
 *   mount: (slots: { setup: HTMLElement, main: HTMLElement }, app: any) => void,
 *   sync: () => void,
 *   render: (L: any) => void,
 *   refresh: (L: any) => void,
 * }} Form
 */

/** @type {Record<string, Form>} */
const FORMS = { wardrobe: wardrobeForm, kitchen: kitchenForm };

export const getForm = type => FORMS[type];
export const formTypes = () => Object.keys(FORMS);
