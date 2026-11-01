// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupDom, typeInto, click } from '../../test-dom.js';
import { kitchenForm } from './form.js';
import { initModal } from '../../modal.js';
import { store, setProject } from '../../../core/store.js';
import { presetProject } from '../../../core/presets.js';
import { projectReport } from '../../../core/export.js';
import { $, $$ } from '../../../utils/dom.js';

let app;
const render = () => kitchenForm.render(projectReport(store.state).L);
const mod = (i, sel) => $(`[data-module="${i}"] ${sel}`);

beforeEach(() => {
  setupDom();
  initModal();
  setProject(presetProject('kitchen.line240'), 'kitchen.line240');
  app = { update: vi.fn(), fit: vi.fn() };
  kitchenForm.mount({ setup: $('#formSetup'), main: $('#formMain') }, app);
  kitchenForm.sync();
  render();
});

describe('форма кухні', () => {
  it('корпус, модулі, загальна ширина', () => {
    expect($('#H').value).toBe('720');
    expect($('#legs').value).toBe('100');
    expect($$('[data-module]')).toHaveLength(4);
    expect($('[data-calc="totalW"]').textContent).toContain('2400');
  });

  it('у модуля під мийку поле кількості вимкнене', () => {
    expect(mod(1, '[data-field="mCount"]').disabled).toBe(true);
    expect(mod(0, '[data-field="mCount"]').disabled).toBe(false);
  });

  it('ширина й кількість (у межах типу) → store, update(false)', () => {
    typeInto(mod(0, '[data-field="mWidth"]'), '450');
    expect(store.state.modules[0].width).toBe(450);
    typeInto(mod(2, '[data-field="mCount"]'), '5'); // двері: не більше 2
    expect(store.state.modules[2].count).toBe(2);
    expect(app.update).toHaveBeenLastCalledWith(false);
  });

  it('зміна типу скидає кількість до типової; під мийку — без кількості', () => {
    typeInto(mod(2, '[data-field="mType"]'), 'drawers', 'change');
    expect(store.state.modules[2]).toEqual({ width: 600, type: 'drawers', count: 3 });
    typeInto(mod(2, '[data-field="mType"]'), 'sink', 'change');
    expect(store.state.modules[2]).toEqual({ width: 600, type: 'sink' });
    expect(app.update).toHaveBeenLastCalledWith(true);
  });

  it('додати, дублювати, перемістити, видалити модуль', () => {
    click($('#addModule'));
    expect(store.state.modules).toHaveLength(5);
    expect(store.ui.sel).toBe(4);
    render();
    click(mod(0, '[data-act="modDup"]'));
    expect(store.state.modules).toHaveLength(6);
    render();
    click(mod(1, '[data-act="modRight"]'));
    expect(store.state.modules[2]).toEqual({ width: 600, type: 'drawers', count: 3 });
    render();
    click(mod(5, '[data-act="modDel"]'));
    expect(store.state.modules).toHaveLength(5);
  });

  it('модалка стільниці зберігає виступи (порожнє / від’ємне → 0)', () => {
    click($('#worktopSettings'));
    expect($('#modal').open).toBe(true);
    typeInto($('[data-side="front"]'), '40');
    typeInto($('[data-side="left"]'), '-5');
    typeInto($('[data-side="right"]'), '');
    $('#modalForm').dispatchEvent(new Event('submit', { cancelable: true }));
    expect(store.state.worktop).toEqual({ front: 40, left: 0, right: 0 });
    expect(app.update).toHaveBeenLastCalledWith(false);
  });
});
