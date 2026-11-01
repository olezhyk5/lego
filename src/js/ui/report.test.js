// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { setupDom } from './test-dom.js';
import { renderReport } from './report.js';
import { projectReport } from '../core/export.js';
import { presetProject } from '../core/presets.js';
import { $, $$ } from '../utils/dom.js';

beforeEach(setupDom);

describe('renderReport', () => {
  it('таблиці плит, листів, фурнітури й опис для шафи', () => {
    const R = projectReport(presetProject('wardrobe.wardrobe'));
    renderReport(R);
    expect($$('#tP tr')).toHaveLength(R.P.panels.length + 1); // + заголовок
    expect($$('#tS tr')).toHaveLength(R.sheets.length + 1);
    expect($$('#tI tr')).toHaveLength(R.P.items.length + 1);
    expect($$('#desc li')).toHaveLength(3); // три секції
    expect($('#descTitle').textContent).toBe('Опис секцій (зверху вниз)');
    expect($$('[data-msg]')).toHaveLength(0);
  });

  it('повідомлення з data-msg і заголовок опису кухні', () => {
    const s = presetProject('kitchen.line240');
    s.modules[0].width = 100; // вузький модуль — помилка
    renderReport(projectReport(s));
    expect($$('[data-msg="error"]')).toHaveLength(1);
    expect($('#descTitle').textContent).toBe('Опис модулів (зліва направо)');
  });

  it('без фурнітури — рядок-заглушка', () => {
    renderReport(projectReport(presetProject('wardrobe.tumba')));
    expect($$('#tI tr')).toHaveLength(1);
  });
});
