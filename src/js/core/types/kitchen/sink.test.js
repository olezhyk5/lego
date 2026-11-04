import { describe, it, expect } from 'vitest';
import { geometryBuilder } from '../../common/geometry-builder.js';
import { addSinkGeometry } from './sink.js';
import { computeLayout } from './layout.js';
import { modelGeometry } from './geometry.js';
import { partsList } from './parts.js';
import { kitchen, expectGeometryMatchesParts } from '../../test-fixtures.js';

// Модуль 800 від x = 600; стільниця зверху на y = 858; D 560, H 720
const build = (w = 800) => {
  const G = geometryBuilder();
  const hole = addSinkGeometry(G, { x: 600, w, y: 858, D: 560, H: 720 });
  return { hole, ...G.result() };
};

describe('addSinkGeometry', () => {
  it('виріз між царгами й боковинами', () => {
    // x: 600 + 100; w: 800 - 2*100; z: царга 100; d: 560 - 2*100
    expect(build().hole).toEqual({ x: 700, z: 100, w: 600, d: 360 });
  });

  it('вузький модуль: чаша лишається всередині', () => {
    // відступ 150 / 4 = 37.5; ширина 150 - 2*37.5
    expect(build(150).hole).toMatchObject({ x: 637.5, w: 75 });
  });

  it('чаша опущена під стільницю, бортик — над нею', () => {
    const { boxes } = build();
    const walls = boxes.filter(b => b.y < 858);
    expect(walls).toHaveLength(5); // дно + 4 стінки
    walls.forEach(b => expect(b.y).toBe(698)); // 858 - 160
    const rim = boxes.filter(b => b.y === 858);
    expect(rim).toHaveLength(4);
    rim.forEach(b => expect(b.h).toBe(3));
  });

  it('кран стоїть за бортиком, а носик виходить над чашу', () => {
    const { rods } = build();
    const spout = rods.find(r => r.axis === 'z');
    expect(spout.z).toBe(50); // за бортиком: 100 - 20 = 80, основа 50 + 22 = 72
    expect(spout.z + spout.len).toBe(250); // 50 + 200 — усередині чаші (100..460)
    expect(spout.y).toBe(1128); // 858 + 270
    expect(spout.x).toBe(1000); // центр модуля: 600 + 800 / 2
  });
});

describe('мийка в моделі кухні', () => {
  const s = kitchen([{ width: 800, type: 'sink' }]);
  const L = computeLayout(s);
  const G = modelGeometry(s, L);

  it('стільниця отримує виріз, специфікація не змінюється', () => {
    const wt = G.boxes.find(b => b.key === 'part.worktop');
    expect(wt.holes).toEqual([{ x: 100, z: 100, w: 600, d: 360 }]);
    expectGeometryMatchesParts(G, partsList(s, L));
  });

  it('без мийки стільниця без вирізу', () => {
    const noSink = kitchen([{ width: 600, type: 'doors', count: 1 }]);
    const wt = modelGeometry(noSink, computeLayout(noSink)).boxes.find(b => b.key === 'part.worktop');
    expect(wt.holes).toBeUndefined();
  });
});
