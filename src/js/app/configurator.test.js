// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createConfigurator } from './configurator.js';
import { memoryStorage } from '../core/storage.js';
import { presetProject } from '../core/presets.js';
import { getType, hasType } from '../core/registry.js';
import { getForm } from '../ui/forms.js';
import { createWardrobeForm } from '../ui/types/wardrobe/form.js';
import { setLocale, getLocale } from '../i18n/index.js';
import { typeInto, click } from '../ui/test-dom.js';

// У jsdom немає WebGL: в'юер не створюється (показується заглушка), решта екземпляра працює.

function polyfillDialog() {
  const proto = window.HTMLDialogElement.prototype;
  if (proto.showModal) return;
  proto.showModal = function () {
    this.open = true;
  };
  proto.close = function () {
    this.open = false;
  };
}

const ref = (root, name) => root.querySelector(`[data-ref="${name}"]`);
const instances = [];
function mount(options = {}) {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const inst = createConfigurator(root, { storage: false, ...options });
  instances.push(inst);
  return { root, inst };
}

beforeEach(() => {
  polyfillDialog();
  vi.spyOn(console, 'error').mockImplementation(() => {}); // three: «Error creating WebGL context»
  localStorage.clear();
  document.body.innerHTML = '';
});
afterEach(() => {
  instances.splice(0).forEach(inst => inst.destroy());
  setLocale('uk');
  vi.restoreAllMocks();
});

describe('createConfigurator', () => {
  it('малює розмітку в root: пресети, форму, звіт, заглушку без WebGL', () => {
    const { root } = mount();
    expect(root.querySelectorAll('[data-preset]').length).toBeGreaterThan(0);
    expect(ref(root, 'W').value).toBe('1800'); // пресет за замовчуванням — шафа 1800 мм
    expect(root.querySelectorAll('[data-section]')).toHaveLength(3);
    expect(ref(root, 'tP').querySelectorAll('tr').length).toBeGreaterThan(1);
    expect(ref(root, 'nogl').classList.contains('is-visible')).toBe(true);
    expect(root.lang).toBe('uk');
  });

  it('без root або вдруге в той самий root — помилка', () => {
    expect(() => createConfigurator(null)).toThrow();
    const { root } = mount();
    expect(() => createConfigurator(root, { storage: false })).toThrow();
  });

  it('два екземпляри незалежні: стан, вибір пресета, id', () => {
    const a = mount();
    const b = mount();
    typeInto(ref(a.root, 'W'), '1300');
    click(b.root.querySelector('[data-preset="wardrobe.komod"]'));
    expect(ref(a.root, 'W').value).toBe('1300');
    expect(ref(b.root, 'W').value).toBe('1000'); // комод
    // вибраний пресет лишається підсвіченим і після змін
    expect(a.root.querySelector('[aria-pressed="true"]').dataset.preset).toBe('wardrobe.wardrobe');
    expect(b.root.querySelector('[aria-pressed="true"]').dataset.preset).toBe('wardrobe.komod');
    const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('попап відкривається лише у своєму екземплярі', () => {
    const a = mount();
    const b = mount();
    click(ref(a.root, 'doorSettings'));
    expect(ref(a.root, 'modal').open).toBe(true);
    expect(ref(b.root, 'modal').open).toBeFalsy();
  });

  it('destroy очищає root і дозволяє створити екземпляр знову', () => {
    const { root, inst } = mount();
    inst.destroy();
    expect(root.innerHTML).toBe('');
    expect(root.hasAttribute('lang')).toBe(false);
    inst.destroy(); // повторно — без помилок
    const again = createConfigurator(root, { storage: false });
    instances.push(again);
    expect(ref(root, 'W').value).toBe('1800');
  });
});

describe('сховище', () => {
  it('за замовчуванням — localStorage (lego-project, lego-preset), і проєкт відновлюється', () => {
    const { root } = mount({ storage: undefined });
    typeInto(ref(root, 'W'), '1300');
    expect(JSON.parse(localStorage.getItem('lego-project')).W).toBe(1300);
    expect(JSON.parse(localStorage.getItem('lego-preset'))).toBe('wardrobe.wardrobe');
    const other = mount({ storage: undefined });
    expect(ref(other.root, 'W').value).toBe('1300');
  });

  it('storage: false — у localStorage нічого не пишеться', () => {
    const { root } = mount();
    typeInto(ref(root, 'W'), '1300');
    expect(localStorage.length).toBe(0);
  });

  it('свій адаптер: проєкт і мова читаються й пишуться через нього', () => {
    const storage = memoryStorage();
    storage.set('project', JSON.stringify(presetProject('wardrobe.komod')));
    const set = vi.spyOn(storage, 'set');
    const { root } = mount({ storage });
    expect(ref(root, 'W').value).toBe('1000');
    typeInto(ref(root, 'locale'), 'en', 'change');
    expect(set).toHaveBeenCalledWith('locale', 'en');
    expect(localStorage.length).toBe(0);
  });
});

describe('мова', () => {
  it('opція locale, якщо збереженої немає; onLocaleChange — після старту й після зміни', () => {
    const onLocaleChange = vi.fn();
    const { root } = mount({ locale: 'en', onLocaleChange });
    expect(getLocale()).toBe('en');
    expect(ref(root, 'csv').textContent).toBe('CSV for designer');
    expect(onLocaleChange).toHaveBeenLastCalledWith('en', expect.any(Function));
    expect(onLocaleChange.mock.lastCall[1]('app.title')).toBe('Furniture builder');
    typeInto(ref(root, 'locale'), 'uk', 'change');
    expect(onLocaleChange).toHaveBeenLastCalledWith('uk', expect.any(Function));
  });

  it('збережена мова важливіша за опцію locale', () => {
    const storage = memoryStorage();
    storage.set('locale', 'uk');
    mount({ storage, locale: 'en' });
    expect(getLocale()).toBe('uk');
  });

  it('зміна мови в одному екземплярі перекладає й інші', () => {
    const a = mount();
    const b = mount();
    typeInto(ref(a.root, 'locale'), 'en', 'change');
    expect(ref(b.root, 'csv').textContent).toBe('CSV for designer');
    expect(ref(b.root, 'locale').value).toBe('en');
    expect(b.root.lang).toBe('en');
  });
});

describe('опція ui', () => {
  it('вимкнені частини не малюються, решта працює', () => {
    const { root } = mount({ ui: { presets: false, export: false, files: false, locale: false } });
    ['presets', 'png', 'copy', 'csv', 'saveJson', 'loadJson', 'fileIn', 'locale'].forEach(name =>
      expect(ref(root, name), name).toBe(null),
    );
    expect(ref(root, 'resetView')).not.toBe(null);
    typeInto(ref(root, 'W'), '1300');
    expect(ref(root, 'W').value).toBe('1300');
  });
});

describe('типи меблів ззовні', () => {
  // Тип поза core/types/: модуль шафи під іншим id, зі своїми назвами в словнику
  const shelf = {
    ...getType('wardrobe'),
    id: 'shelf',
    presets: { small: { data: getType('wardrobe').presets.komod.data } },
    defaultPreset: 'small',
  };

  it('опція types реєструє тип і форму; пресети типу з’являються в сайдбарі', () => {
    const { root } = mount({
      types: [{ type: shelf, form: createWardrobeForm }],
      messages: { uk: { type: { shelf: 'Стелаж' }, preset: { shelf: { small: 'Малий' } } } },
    });
    expect(hasType('shelf')).toBe(true);
    expect(getForm('shelf')).toBe(createWardrobeForm);
    const btn = root.querySelector('[data-preset="shelf.small"]');
    expect(btn.textContent).toBe('Малий');
    click(btn);
    expect(ref(root, 'W').value).toBe('1000');
    // повторна реєстрація того самого типу — без помилки, інший тип з тим самим id — помилка
    expect(() => mount({ types: [{ type: shelf, form: createWardrobeForm }] })).not.toThrow();
    expect(() => mount({ types: [{ type: { ...shelf }, form: createWardrobeForm }] })).toThrow();
  });
});
