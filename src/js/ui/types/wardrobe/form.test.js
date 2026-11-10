// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { setupDom, createTestApp, ref, typeInto, click } from '../../test-dom.js';
import { createWardrobeForm } from './form.js';
import { presetProject } from '../../../core/presets.js';
import { projectReport } from '../../../core/export.js';
import { $, $$ } from '../../../utils/dom.js';

let app, store, form;
const render = () => form.render(projectReport(store.state).L);
const sec = (i, sel) => $(`[data-section="${i}"] ${sel}`);

beforeEach(() => {
  setupDom();
  app = createTestApp();
  store = app.store;
  store.setProject(presetProject('wardrobe.wardrobe2'), 'wardrobe.wardrobe2');
  form = createWardrobeForm({ setup: ref('formSetup'), main: ref('formMain') }, app);
  form.sync();
  render();
});

describe('форма шафи', () => {
  it('габарити й картки секцій і зон', () => {
    expect(ref('W').value).toBe('1200');
    expect($$('[data-section]')).toHaveLength(2);
    expect($$('[data-section="1"] [data-zone]')).toHaveLength(3);
    expect(sec(0, '').classList.contains('is-selected')).toBe(true);
  });

  it('налаштування дверей: порожній попап, проєкт не змінюється', () => {
    const before = structuredClone(store.state);
    click(ref('doorSettings'));
    expect(ref('modal').open).toBe(true);
    expect(ref('modalTitle').textContent).toBe('Налаштування дверей');
    expect(ref('modalBody').innerHTML).toBe('');
    expect(store.state).toEqual(before);
    expect(app.update).not.toHaveBeenCalled();
  });

  it('введення габариту → store, update(false)', () => {
    typeInto(ref('W'), '1300');
    expect(store.state.W).toBe(1300);
    expect(app.update).toHaveBeenLastCalledWith(false);
  });

  it('опори: галочка з пресета; на тумбі (цоколь 0) вмикання піднімає основу до 100', () => {
    const toggle = on => {
      ref('baseLegs').checked = on;
      ref('baseLegs').dispatchEvent(new Event('change', { bubbles: true }));
    };
    expect(ref('baseLegs').checked).toBe(true); // wardrobe2 — на опорах

    store.setProject(presetProject('wardrobe.tumba'), 'wardrobe.tumba');
    form.sync();
    expect(ref('baseLegs').checked).toBe(false);
    toggle(true);
    expect(store.state).toMatchObject({ base: 'legs', plinth: 100 });
    expect(ref('plinth').value).toBe('100');
    expect(app.update).toHaveBeenLastCalledWith(false);

    // вимкнули — поля немає (= цоколь), висота лишається
    toggle(false);
    expect('base' in store.state).toBe(false);
    expect(store.state.plinth).toBe(100);
  });

  it('опори при достатній висоті: висота не змінюється', () => {
    typeInto(ref('plinth'), '90');
    ref('baseLegs').checked = false;
    ref('baseLegs').dispatchEvent(new Event('change'));
    ref('baseLegs').checked = true;
    ref('baseLegs').dispatchEvent(new Event('change'));
    expect(store.state.plinth).toBe(90);
  });

  it('ширина секції: число або порожньо = auto', () => {
    typeInto(sec(1, '[data-field="secWidth"]'), '500');
    expect(store.state.sections[1].width).toBe(500);
    typeInto(sec(1, '[data-field="secWidth"]'), '');
    expect(store.state.sections[1].width).toBe('auto');
    expect(app.update).toHaveBeenLastCalledWith(false);
  });

  it('висота й кількість зони (кількість у межах 1…20)', () => {
    typeInto(sec(1, '[data-zone="1"] [data-field="zHeight"]'), '700');
    expect(store.state.sections[1].zones[1].height).toBe(700);
    typeInto(sec(1, '[data-zone="1"] [data-field="zCount"]'), '99');
    expect(store.state.sections[1].zones[1].count).toBe(20);
  });

  it('тип зони → шухляди з типовою кількістю, update(true)', () => {
    typeInto(sec(0, '[data-zone="0"] [data-field="zType"]'), 'drawers', 'change');
    expect(store.state.sections[0].zones[0]).toMatchObject({ type: 'drawers', count: 3 });
    expect(app.update).toHaveBeenLastCalledWith(true);
  });

  it('дії зі структурою: дублювати, додати й видалити зону, видалити секцію', () => {
    click(sec(0, '[data-act="secDup"]'));
    expect(store.state.sections).toHaveLength(3);
    expect(store.ui.sel).toBe(1);
    render();
    click(sec(2, '[data-act="zAdd"]'));
    expect(store.state.sections[2].zones).toHaveLength(4);
    render();
    click(sec(2, '[data-zone="3"] [data-act="zDel"]'));
    expect(store.state.sections[2].zones).toHaveLength(3);
    click(sec(2, '[data-act="secDel"]'));
    expect(store.state.sections).toHaveLength(2);
    expect(app.update).toHaveBeenLastCalledWith(true);
  });

  it('клік по секції вибирає її', () => {
    click($('[data-section="1"]'));
    expect(store.ui.sel).toBe(1);
    expect(sec(1, '').classList.contains('is-selected')).toBe(true);
  });
});
