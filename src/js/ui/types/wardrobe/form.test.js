// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupDom, typeInto, click } from '../../test-dom.js';
import { wardrobeForm } from './form.js';
import { store, setProject } from '../../../core/store.js';
import { presetProject } from '../../../core/presets.js';
import { projectReport } from '../../../core/export.js';
import { $, $$ } from '../../../utils/dom.js';

let app;
const render = () => wardrobeForm.render(projectReport(store.state).L);
const sec = (i, sel) => $(`[data-section="${i}"] ${sel}`);

beforeEach(() => {
  setupDom();
  setProject(presetProject('wardrobe.wardrobe2'), 'wardrobe.wardrobe2');
  app = { update: vi.fn(), fit: vi.fn() };
  wardrobeForm.mount({ setup: $('#formSetup'), main: $('#formMain') }, app);
  wardrobeForm.sync();
  render();
});

describe('форма шафи', () => {
  it('габарити й картки секцій і зон', () => {
    expect($('#W').value).toBe('1200');
    expect($$('[data-section]')).toHaveLength(2);
    expect($$('[data-section="1"] [data-zone]')).toHaveLength(3);
    expect(sec(0, '').classList.contains('is-selected')).toBe(true);
  });

  it('введення габариту → store, update(false)', () => {
    typeInto($('#W'), '1300');
    expect(store.state.W).toBe(1300);
    expect(app.update).toHaveBeenLastCalledWith(false);
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

  it('тип зони → ящики з типовою кількістю, update(true)', () => {
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
