import { createStore } from '../core/store.js';
import { localStorageAdapter, memoryStorage } from '../core/storage.js';
import { resolvePresets } from '../core/presets.js';
import { projectReport } from '../core/export.js';
import { getType, registerType } from '../core/registry.js';
import { createViewer } from '../viewer/viewer.js';
import { getForm, registerForm } from '../ui/forms.js';
import { createScope } from '../ui/app.js';
import { shellMarkup } from '../ui/templates/shell.js';
import { createModal } from '../ui/modal.js';
import { createToast } from '../ui/toast.js';
import { createSidebar } from '../ui/sidebar.js';
import { createToolbar } from '../ui/toolbar.js';
import { createReport } from '../ui/report.js';
import { t, translateDom, setLocale, getLocale, LOCALES, addMessages } from '../i18n/index.js';

/**
 * @typedef {{
 *   storage?: import('../core/storage.js').StorageAdapter | false,
 *   storageKey?: string,
 *   presets?: string[],
 *   preset?: string,
 *   project?: object,
 *   locale?: string,
 *   messages?: Record<string, Record<string, any>>,
 *   types?: { type: import('../core/types.js').FurnitureType, form: import('../ui/forms.js').CreateForm }[],
 *   ui?: Partial<import('../ui/templates/shell.js').UiParts>,
 *   onLocaleChange?: (locale: string, t: (key: string, params?: object) => string) => void,
 * }} ConfiguratorOptions
 *   storage — де зберігати проєкт, пресет і мову: за замовчуванням localStorage (lego-project, lego-preset,
 *             lego-locale); false — нічого не зберігати; або свій адаптер { get(name), set(name, value) }
 *   storageKey — префікс ключів проєкту й пресета в localStorage замість lego (<storageKey>-project,
 *             <storageKey>-preset), щоб блоки на сайті пам'ятали кожен свій проєкт; мова лишається в lego-locale.
 *             Діє лише для сховища за замовчуванням
 *   presets — які пресети показувати й з якими типами працювати: типи ('kitchen') і/або пресети
 *             ('wardrobe.komod'); за замовчуванням — усі. Збережений проєкт чи файл іншого типу не відкривається
 *   preset  — стартовий пресет ('wardrobe.komod'), якщо збереженого проєкту немає
 *   project — стартовий проєкт (JSON формату проєкту), якщо збереженого немає; важливіший за preset
 *   locale  — мова, якщо збереженої немає (далі — мова браузера, uk)
 *   messages — власні тексти: { <мова>: { <namespace>: { <ключ>: 'текст' } } }, напр. для типів ззовні
 *   types   — типи меблів ззовні: модуль типу (контракт FurnitureType) і його форма (ui/forms.js)
 *   ui      — вимкнути частини інтерфейсу: { presets, export, files, locale } (усі true за замовчуванням)
 *   onLocaleChange(locale, t) — після старту й кожної зміни мови (напр. перекласти заголовок сторінки)
 */

const UI_DEFAULTS = { presets: true, export: true, files: true, locale: true };

// Мова спільна для сторінки: після її зміни перекладаються всі живі екземпляри
const live = new Set();
const mounted = new WeakSet();
let counter = 0;

function storageOf(option, prefix) {
  if (option === false) return memoryStorage();
  if (option) return option;
  return localStorageAdapter({ prefix });
}

// Збережена мова, якщо сховище доступне
function savedLocale(storage) {
  try {
    return storage.get('locale');
  } catch {
    return null;
  }
}

function registerTypes(types = []) {
  types.forEach(({ type, form }) => {
    registerType(type);
    registerForm(type.id, form);
  });
}

/**
 * Створює конфігуратор у root: розмітка, стан, 3D, форма, звіт. Кілька екземплярів на сторінці незалежні
 * (крім мови й реєстру типів — вони спільні).
 * @param {HTMLElement} root
 * @param {ConfiguratorOptions} [options]
 */
export function createConfigurator(root, options = {}) {
  if (!root || !root.nodeType) throw new Error('createConfigurator: потрібен елемент root');
  if (mounted.has(root)) throw new Error('createConfigurator: у цьому елементі вже є конфігуратор');
  if (options.messages) addMessages(options.messages);
  registerTypes(options.types);

  const presets = resolvePresets(options.presets);
  const storage = storageOf(options.storage, options.storageKey);
  const want = [savedLocale(storage), options.locale].find(code => code && LOCALES.includes(code));
  const localeChanged = want ? setLocale(want) : false;

  const uid = `lego${++counter}`;
  root.innerHTML = shellMarkup(uid, { ...UI_DEFAULTS, ...options.ui });
  translateDom(root);
  const scope = createScope(root);
  const { ref } = scope;
  const store = createStore({ storage, presets, start: { project: options.project, preset: options.preset } });

  const viewer = createViewer(ref('view'));
  if (!viewer) ref('nogl').classList.add('is-visible');

  const modal = createModal(ref);
  const toast = createToast(ref('toast'));
  let destroyed = false;

  let rebuildFrame = 0;
  function scheduleRebuild() {
    if (!viewer || rebuildFrame) return;
    rebuildFrame = requestAnimationFrame(() => {
      rebuildFrame = 0;
      const s = store.state;
      const type = getType(s.type);
      const L = type.layout(s);
      viewer.rebuild(
        { geometry: type.geometry(s, L), annotations: type.annotations(s, L, store.ui), bounds: L.bounds },
        store,
      );
    });
  }

  // Форма поточного типу меблів; створюється заново, коли змінюється тип проєкту
  let form = null;
  let formType = null;
  function ensureForm() {
    if (formType === store.state.type) return false;
    formType = store.state.type;
    form = getForm(formType)({ setup: ref('formSetup'), main: ref('formMain') }, app);
    form.sync();
    return true;
  }

  // Головний цикл оновлення. full=true — перемалювати форму повністю
  // (змінилась структура), false — лише розраховані значення.
  function update(full) {
    if (destroyed) return;
    const R = projectReport(store.state);
    if (ensureForm() || full) form.render(R.L);
    else form.refresh(R.L);
    scheduleRebuild();
    report.render(R);
    sidebar.markPreset();
    store.save();
  }

  function fit() {
    if (viewer && !destroyed) viewer.fit(getType(store.state.type).layout(store.state).bounds);
  }

  // Новий проєкт (пресет, файл): стан форми скидається, поля переписуються
  function loadProject(project, preset) {
    if (destroyed) return;
    store.setProject(project, preset);
    if (!ensureForm()) form.sync();
    update(true);
    fit();
  }

  // Після зміни мови: розмітка екземпляра, пресети, форма (створюється заново з тим самим проєктом
  // і store.ui), звіт і 3D-підписи — без перезавантаження сторінки
  function relocalize() {
    translateDom(root);
    sidebar.renderPresets();
    report.syncToggle();
    toolbar.syncLocale();
    formType = null;
    update(true);
    options.onLocaleChange?.(getLocale(), t);
  }

  function changeLocale(code) {
    if (!setLocale(code)) return;
    try {
      storage.set('locale', code);
    } catch {
      // сховище недоступне — мова діє до перезавантаження
    }
    live.forEach(inst => inst.relocalize());
  }

  /** @type {import('../ui/app.js').App} */
  const app = {
    root,
    uid,
    store,
    presets,
    ...scope,
    update,
    fit,
    loadProject,
    changeLocale,
    openModal: modal.open,
    toast,
    viewer,
  };
  const sidebar = createSidebar(app);
  const toolbar = createToolbar(app);
  const report = createReport(app);

  // Цей екземпляр змінив мову — інші перекладаються
  if (localeChanged) live.forEach(inst => inst.relocalize());
  const instance = { relocalize };
  live.add(instance);
  mounted.add(root);

  update(true);
  fit();
  options.onLocaleChange?.(getLocale(), t);

  return {
    // Знімає конфігуратор зі сторінки: WebGL, таймери, обробники (разом з розміткою root)
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(rebuildFrame);
      modal.close();
      toast.dispose();
      if (viewer) viewer.destroy();
      live.delete(instance);
      mounted.delete(root);
      root.innerHTML = '';
      root.removeAttribute('lang');
    },
  };
}
