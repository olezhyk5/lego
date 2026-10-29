import { describe, it, expect } from 'vitest';
import { t, tm, formatNumber, DEFAULT_LOCALE } from './index.js';

describe('t', () => {
  it('повертає рядок за ключем', () => {
    expect(t('toolbar.copy')).toBe('Копіювати список');
  });

  it('підставляє параметри', () => {
    expect(t('section.name', { n: 2 })).toBe('Секція 2');
  });

  it('перекладає вкладене повідомлення в параметрі', () => {
    const name = { key: 'zone.name', params: { n: 1, z: 3 } };
    expect(t('check.rodLow', { name, h: 700 })).toBe(
      'Секція 1, зона 3: під штангу 700 мм — для одягу потрібно від ~900 мм (довгий одяг ~1500).',
    );
  });

  it('невідомий параметр лишає плейсхолдер', () => {
    expect(t('section.name', {})).toBe('Секція {n}');
  });

  it('невідомий ключ повертає сам ключ', () => {
    expect(t('nope.missing')).toBe('nope.missing');
  });

  it('ключ на гілку (не рядок) повертає сам ключ', () => {
    expect(t('toolbar')).toBe('toolbar');
  });
});

describe('tm', () => {
  it('перекладає {key, params}', () => {
    expect(tm({ key: 'common.calcMm', params: { value: 568 } })).toBe('= 568 мм');
  });
});

describe('formatNumber', () => {
  it('десяткова кома й фіксована кількість знаків (uk)', () => {
    expect(formatNumber(10.3, 2)).toBe('10,30');
    expect(formatNumber(2)).toBe('2');
  });
});

describe('мова за замовчуванням', () => {
  it('uk', () => expect(DEFAULT_LOCALE).toBe('uk'));
});
