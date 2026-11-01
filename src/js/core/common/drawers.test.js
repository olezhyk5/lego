import { describe, it, expect } from 'vitest';
import { drawerWarnings, drawerDepth } from './drawers.js';

const name = { key: 'zone.name', params: { n: 1, z: 1 } };
const keysOf = p => drawerWarnings({ name, ...p }).map(m => m.key);

describe('drawerWarnings', () => {
  it('глибина ящика = глибина корпусу - 50', () => expect(drawerDepth(600)).toBe(550));

  it.each([
    [{ frontW: 500, depth: 250 }, []], // межі включно — без попереджень
    [{ frontW: 500, depth: 249 }, ['check.drawerShallow']],
    [{ frontW: 200, depth: 400 }, []],
    [{ frontW: 199, depth: 400 }, ['check.drawerNarrow']],
    [{ frontW: 1000, depth: 400 }, []],
    [{ frontW: 1001, depth: 400 }, ['check.drawerWide']],
  ])('%j → %j', (p, keys) => expect(keysOf(p)).toEqual(keys));
});
