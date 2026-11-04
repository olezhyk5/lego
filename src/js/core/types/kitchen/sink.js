import { T } from '../../../config/constants.js';
import { RAIL_W } from './constants.js';

// Розміри лише для моделі (у специфікації їх немає), мм
const BOWL = { side: 100, depth: 160, wall: 2 }; // чаша: відступ від боків модуля, глибина від поверхні стільниці
const RIM = { w: 20, h: 3 }; // бортик навколо вирізу
const DRAIN_R = 25;
const FAUCET = {
  z: 50, // вісь крана від задньої площини: за бортиком
  base: { r: 22, h: 40 },
  column: { r: 11, h: 270 },
  spout: { r: 9, len: 200 },
  tip: { r: 11, len: 35 },
  lever: { r: 6, len: 70, y: 28 },
};

// Мийка з краном: чаша, бортик, злив і змішувач. Лише візуалізація: у специфікації — один рядок part.sink.
// y — поверхня стільниці. Чаша стоїть між царгами й боковинами. Повертає виріз у стільниці: {x, z, w, d}.
export function addSinkGeometry(G, { x, w, y, D, H }) {
  const side = Math.min(BOWL.side, w / 4);
  const hole = { x: x + side, z: RAIL_W, w: w - 2 * side, d: Math.max(D - 2 * RAIL_W, 1) };
  const depth = Math.min(BOWL.depth, H - 2 * T);
  const low = y - depth;
  const { wall } = BOWL;
  const right = hole.x + hole.w;
  const front = hole.z + hole.d;

  G.hardware('part.sink', 'steel', hole.x, low, hole.z, hole.w, wall, hole.d); // дно
  G.hardware('part.sink', 'steel', hole.x, low, hole.z, wall, depth, hole.d);
  G.hardware('part.sink', 'steel', right - wall, low, hole.z, wall, depth, hole.d);
  G.hardware('part.sink', 'steel', hole.x, low, hole.z, hole.w, depth, wall);
  G.hardware('part.sink', 'steel', hole.x, low, front - wall, hole.w, depth, wall);

  const rim = RIM.w;
  G.hardware('part.sink', 'steel', hole.x - rim, y, hole.z - rim, hole.w + 2 * rim, RIM.h, rim);
  G.hardware('part.sink', 'steel', hole.x - rim, y, front, hole.w + 2 * rim, RIM.h, rim);
  G.hardware('part.sink', 'steel', hole.x - rim, y, hole.z, rim, RIM.h, hole.d);
  G.hardware('part.sink', 'steel', right, y, hole.z, rim, RIM.h, hole.d);

  const cx = hole.x + hole.w / 2;
  G.rod('part.sink', 'handle', cx, low + wall, hole.z + hole.d / 2, 1, DRAIN_R, 'y');

  const { base, column, spout, tip, lever } = FAUCET;
  const z = FAUCET.z;
  const spoutY = y + column.h;
  G.rod('part.sink', 'steel', cx, y, z, base.h, base.r, 'y');
  G.rod('part.sink', 'steel', cx, y, z, column.h + spout.r, column.r, 'y');
  G.rod('part.sink', 'steel', cx, spoutY, z, spout.len, spout.r, 'z');
  G.rod('part.sink', 'steel', cx, spoutY - tip.len, z + spout.len, tip.len + spout.r, tip.r, 'y');
  G.rod('part.sink', 'handle', cx, y + lever.y, z, lever.len, lever.r);

  return hole;
}
