import { describe, it, expect } from 'vitest';
import { clone, isAuto, round } from './helpers.js';

describe('isAuto', () => {
  it.each([undefined, null, '', 'auto'])('%j → true', v => expect(isAuto(v)).toBe(true));
  it.each([0, 400, '400', 'abc'])('%j → false', v => expect(isAuto(v)).toBe(false));
});

describe('round', () => {
  it('округлює до цілого', () => {
    expect(round(567.5)).toBe(568);
    expect(round(-63.6)).toBe(-64);
  });
});

describe('clone', () => {
  it('робить глибоку копію', () => {
    const src = { a: { b: [1, 2] } };
    const copy = clone(src);
    copy.a.b.push(3);
    expect(src.a.b).toEqual([1, 2]);
  });
});
