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

  it('заголовок «К-сть» лише в модулів, де є кількість', () => {
    expect($('[data-module="0"]').textContent).toContain('К-сть'); // шухляди
    expect($('[data-module="1"]').textContent).not.toContain('К-сть'); // мийка
    typeInto(mod(0, '[data-field="mType"]'), 'dishwasher', 'change');
    render();
    expect($('[data-module="0"]').textContent).not.toContain('К-сть');
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

  it('посудомийка: ширина лише зі списку, без кількості', () => {
    typeInto(mod(0, '[data-field="mWidth"]'), '500');
    typeInto(mod(0, '[data-field="mType"]'), 'dishwasher', 'change');
    expect(store.state.modules[0]).toEqual({ width: 450, type: 'dishwasher' }); // 500 → 450
    render();
    const width = mod(0, '[data-field="mWidth"]');
    expect(width.tagName).toBe('SELECT');
    expect($$('option', width).map(o => o.value)).toEqual(['450', '600']);
    expect(mod(0, '[data-field="mCount"]').disabled).toBe(true);
    typeInto(width, '600');
    expect(store.state.modules[0].width).toBe(600);
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

  it('верхній ряд: перемикач, додавання, порожній ряд не зберігається', () => {
    click($('[data-tier="upper"]'));
    render();
    expect($$('[data-module]')).toHaveLength(0);
    click($('#addModule'));
    expect(store.state.uppers).toEqual([{ width: 600, type: 'doors', count: 1 }]);
    render();
    const types = $$('option', mod(0, '[data-field="mType"]')).map(o => o.value);
    expect(types).toEqual(['doors', 'open', 'gap']);
    typeInto(mod(0, '[data-field="mType"]'), 'gap', 'change');
    expect(store.state.uppers[0]).toEqual({ width: 600, type: 'gap' });
    render();
    click(mod(0, '[data-act="modDel"]'));
    expect(store.state.uppers).toBeUndefined();
  });

  it('налаштування верхніх: зберігаються; типові — поля немає', () => {
    const save = (h, d, gap) => {
      click($('#upperSettings'));
      typeInto($('[data-field="upperH"]'), h);
      typeInto($('[data-field="upperD"]'), d);
      typeInto($('[data-field="upperGap"]'), gap);
      $('#modalForm').dispatchEvent(new Event('submit', { cancelable: true }));
    };
    save('600', '300', '0');
    expect(store.state.upper).toEqual({ H: 600, D: 300, gap: 0 });
    save('720', '320', '550');
    expect(store.state.upper).toBeUndefined();
  });

  it('висота кухні в підказці', () => {
    expect($('[data-calc="totalH"]').textContent).toContain('2128'); // 100 + 720 + 38 + 550 + 720
  });

  it('холодильник: типові поля, глибина ніші, антресоль у підказці', () => {
    typeInto(mod(0, '[data-field="mType"]'), 'fridge', 'change');
    expect(store.state.modules[0]).toEqual({ width: 600, type: 'fridge', nicheH: 1800, nicheD: 550 });
    render();
    expect($('[data-calc="fridge-0"]').textContent).toContain('180'); // 2028 - 1832 - 16
    typeInto(mod(0, '[data-field="fNicheD"]'), '560');
    expect(store.state.modules[0].nicheD).toBe(560);
    typeInto(mod(0, '[data-field="mType"]'), 'doors', 'change');
    expect(store.state.modules[0]).toEqual({ width: 600, type: 'doors', count: 1 });
  });

  it('пенал: зони додаються, змінюються й переставляються', () => {
    typeInto(mod(0, '[data-field="mType"]'), 'tall', 'change');
    render();
    expect($$('[data-module="0"] [data-zone]')).toHaveLength(2);
    click(mod(0, '[data-act="zAdd"]'));
    render();
    const zones = () => store.state.modules[0].zones;
    expect(zones()).toHaveLength(3);
    typeInto($('[data-module="0"] [data-zone="2"] [data-field="zType"]'), 'oven', 'change');
    expect(zones()[2]).toEqual({ type: 'oven', height: 600 });
    render();
    click($('[data-module="0"] [data-zone="2"] [data-act="zUp"]'));
    expect(zones()[1].type).toBe('oven');
    render();
    typeInto($('[data-module="0"] [data-zone="1"] [data-field="zHeight"]'), '650');
    expect(zones()[1].height).toBe(650);
    typeInto($('[data-module="0"] [data-zone="1"] [data-field="zHeight"]'), '');
    expect(zones()[1].height).toBe('auto');
  });

  it('стіни: додати кут, змінити тип, видалити', () => {
    click($('#addWall'));
    render();
    expect(store.state.walls).toHaveLength(1);
    expect($('[data-wall="1"]').getAttribute('aria-pressed')).toBe('true');
    expect($$('[data-module]')).toHaveLength(1);
    expect($('[data-field="cWidth"]').value).toBe('1100');
    typeInto($('[data-field="cType"]'), 'lShape', 'change');
    expect(store.state.walls[0].corner).toEqual({ type: 'lShape', a: 900, b: 900, count: 1 });
    render();
    typeInto($('[data-field="cA"]'), '1000');
    expect(store.state.walls[0].corner.a).toBe(1000);
    click($('#addModule'));
    expect(store.state.walls[0].modules).toHaveLength(2);
    render();
    click($('[data-act="wallDel"]'));
    expect(store.state.walls).toBeUndefined();
    render();
    expect($('[data-wall="0"]').getAttribute('aria-pressed')).toBe('true');
    expect($('[data-corner]')).toBeNull();
  });

  it('не більше трьох стін', () => {
    click($('#addWall'));
    render();
    click($('#addWall'));
    render();
    expect(store.state.walls).toHaveLength(2);
    expect($('#addWall')).toBeNull();
  });

  const saveThickness = value => {
    click($('#worktopSettings'));
    typeInto($('[data-field="worktopT"]'), value);
    $('#modalForm').dispatchEvent(new Event('submit', { cancelable: true }));
  };

  it('товщини немає в основній формі, у модалці — типова', () => {
    expect($('[data-field="worktopT"]')).toBeNull();
    click($('#worktopSettings'));
    expect($('[data-field="worktopT"]').value).toBe('38');
  });

  it('модалка стільниці зберігає товщину й показує її при наступному відкритті', () => {
    saveThickness('28');
    expect(store.state.worktop).toEqual({ front: 30, left: 0, right: 0, t: 28 });
    expect(app.update).toHaveBeenLastCalledWith(false);
    click($('#worktopSettings'));
    expect($('[data-field="worktopT"]').value).toBe('28');
  });

  it.each([
    ['порожня', ''],
    ['від’ємна', '-5'],
    ['типова', '38'],
  ])('товщина %s → поля в проєкті немає', (_, value) => {
    saveThickness('28');
    saveThickness(value);
    expect(store.state.worktop).toEqual({ front: 30, left: 0, right: 0 });
  });

  it.each([
    ['5', 10],
    ['2000', 100],
  ])('товщина %s обмежується межами поля → %i', (value, thick) => {
    saveThickness(value);
    expect(store.state.worktop.t).toBe(thick);
  });

  it('у проєкті без worktop типові виступи не обнуляються', () => {
    delete store.state.worktop;
    saveThickness('28');
    expect(store.state.worktop).toEqual({ front: 30, left: 0, right: 0, t: 28 });
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
