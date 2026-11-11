// Контекст екземпляра конфігуратора, який отримують модулі ui/ і форми типів (створює app/configurator.js).
// ui/ не імпортує стан чи розмітку напряму: усе — через цей об'єкт, тож копії на сторінці незалежні.

/**
 * @typedef {{
 *   root: HTMLElement,
 *   uid: string,
 *   store: import('../core/store.js').Store,
 *   presets: string[],
 *   $: (sel: string) => any,
 *   $$: (sel: string) => any[],
 *   ref: (name: string) => any,
 *   update: (full: boolean) => void,
 *   fit: () => void,
 *   loadProject: (project: import('../core/types.js').Project, preset?: string | null) => void,
 *   changeLocale: (code: string) => void,
 *   openModal: (options: import('./modal.js').ModalOptions) => void,
 *   toast: (msg: string) => void,
 *   viewer: any,
 * }} App
 *   uid — префікс id для ARIA (aria-controls тощо), унікальний для екземпляра
 *   presets — пресети, доступні екземпляру (опція presets); їхні типи — типи, з якими він працює
 *   $, $$ — пошук лише всередині root; ref(name) — елемент з data-ref="name" або null
 *   update(full) — після зміни стану: true — змінилась структура (форма перемальовується), false — лише значення
 */

/**
 * Пошук елементів лише всередині root
 * @param {HTMLElement} root
 */
export function createScope(root) {
  return {
    /** @param {string} sel */
    $: sel => root.querySelector(sel),
    /** @param {string} sel */
    $$: sel => Array.from(root.querySelectorAll(sel)),
    /** @param {string} name */
    ref: name => root.querySelector(`[data-ref="${name}"]`),
  };
}
