import { describe, it, expect } from 'vitest';
import { geometryBuilder } from './geometry-builder.js';

describe('geometryBuilder — рухомі групи', () => {
  it('бокси й циліндри всередині moving отримують індекс групи, поза нею — ні', () => {
    const G = geometryBuilder();
    G.panel('part.side', 'wood', 0, 0, 0, 16, 100, 100);
    G.moving([0, 0, 1], 400, () => {
      G.panel('part.drawerFront', 'front', 0, 0, 0, 100, 100, 16);
      G.hardware('part.handle', 'handle', 0, 0, 16, 50, 12, 18);
      G.rod('part.rod', 'rod', 0, 0, 0, 100, 12);
    });
    G.moving([1, 0, 0], 250, () => G.hardware('part.handle', 'handle', 0, 0, 0, 1, 1, 1));
    G.hardware('part.leg', 'steel', 0, 0, 0, 1, 1, 1);
    const { boxes, rods, moves } = G.result();
    expect(moves).toEqual([
      { dir: [0, 0, 1], travel: 400 },
      { dir: [1, 0, 0], travel: 250 },
    ]);
    expect(boxes.map(b => b.move)).toEqual([undefined, 0, 0, 1, undefined]);
    expect(rods[0].move).toBe(0);
  });

  it('без рухомих груп — порожній список і жодного поля move', () => {
    const G = geometryBuilder();
    G.panel('part.side', 'wood', 0, 0, 0, 16, 100, 100);
    const { boxes, moves } = G.result();
    expect(moves).toEqual([]);
    expect('move' in boxes[0]).toBe(false);
  });
});
