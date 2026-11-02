import { describe, it, expect } from 'vitest';
import { drawerWarnings, drawerDepth, drawerBox, addDrawerParts, addDrawerGeometry } from './drawers.js';
import { geometryBuilder } from './geometry-builder.js';
import { partsBuilder } from './parts-builder.js';

const name = { key: 'zone.name', params: { n: 1, z: 1 } };
const keysOf = p => drawerWarnings({ name, ...p }).map(m => m.key);

describe('drawerDepth — довжина напрямної зі стандартного ряду', () => {
  it.each([
    [600, 550], // 600 - 50
    [560, 500], // 510 → вниз до кратного 50
    [300, 250], // найкоротша напрямна
    [299, 200], // 249 → уже коротше за ряд, про це попереджає drawerWarnings
    [900, 550], // довших за 550 немає
    [40, 0], // від'ємна глибина не виходить
  ])('D %d → %d', (D, depth) => expect(drawerDepth(D)).toBe(depth));
});

describe('корпус шухляди', () => {
  // проріз 600, фасад 196, D 600
  const box = drawerBox(600, 196, 600);

  it('розміри: ширина 600 - 2*13, стінки 196 - 40, глибина 600 - 50', () => {
    expect(box).toEqual({ w: 574, h: 156, depth: 550 });
  });

  it('вузький проріз: ширина не менша за дві боковини, стінки не від’ємні', () => {
    expect(drawerBox(30, 20, 600)).toEqual({ w: 32, h: 0, depth: 550 });
  });

  it('специфікація: дві боковини, дві стінки, дно з ДВП, пара напрямних на шухляду', () => {
    const P = partsBuilder();
    addDrawerParts(P, box, 3);
    expect(P.result()).toEqual({
      panels: [
        { key: 'part.drawerSide', mat: 'chipboard', a: 550, b: 156, q: 6 },
        { key: 'part.drawerWall', mat: 'chipboard', a: 542, b: 156, q: 6 }, // 574 - 2*16
        { key: 'part.drawerBottom', mat: 'hardboard', a: 574, b: 550, q: 3 },
      ],
      items: [{ key: 'part.runner', size: { key: 'itemSize.runner', params: { l: 550 } }, q: 3 }],
    });
  });

  it('геометрія: корпус у прорізі, за фасадом, напрямні в зазорах', () => {
    const G = geometryBuilder();
    addDrawerGeometry(G, box, 600, 99, 584);
    const at = ({ key, x, y, z, w, h, d }) => ({ key, x, y, z, w, h, d });
    // left = 600 + 13; z = 584 - 550; дно на 99 + 20; стінки на 119 + 3 (ДВП)
    expect(G.result().boxes.map(at)).toEqual([
      { key: 'part.drawerBottom', x: 613, y: 119, z: 34, w: 574, h: 3, d: 550 },
      { key: 'part.drawerSide', x: 613, y: 122, z: 34, w: 16, h: 156, d: 550 },
      { key: 'part.drawerSide', x: 1171, y: 122, z: 34, w: 16, h: 156, d: 550 }, // 613 + 574 - 16
      { key: 'part.drawerWall', x: 629, y: 122, z: 34, w: 542, h: 156, d: 16 },
      { key: 'part.drawerWall', x: 629, y: 122, z: 568, w: 542, h: 156, d: 16 }, // 584 - 16
      { key: 'part.runner', x: 600, y: 177.5, z: 34, w: 13, h: 45, d: 550 }, // 122 + (156 - 45) / 2
      { key: 'part.runner', x: 1187, y: 177.5, z: 34, w: 13, h: 45, d: 550 }, // 613 + 574
    ]);
  });
});

describe('drawerWarnings', () => {
  it.each([
    [{ frontW: 500, depth: 250 }, []], // межі включно — без попереджень
    [{ frontW: 500, depth: 249 }, ['check.drawerShallow']],
    [{ frontW: 200, depth: 400 }, []],
    [{ frontW: 199, depth: 400 }, ['check.drawerNarrow']],
    [{ frontW: 1000, depth: 400 }, []],
    [{ frontW: 1001, depth: 400 }, ['check.drawerWide']],
  ])('%j → %j', (p, keys) => expect(keysOf(p)).toEqual(keys));
});
