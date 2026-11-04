import { T } from '../../../config/constants.js';
import { geometryBuilder, thickness } from '../../common/geometry-builder.js';
import { drawerBox, addDrawerGeometry } from '../../common/drawers.js';
import { addLegGeometry } from '../../common/legs.js';
import { isNiche, isTall } from './base-module.js';
import { addSinkGeometry } from './sink.js';
import { addLShapeGeometry } from './corner-geometry.js';
import { SHELF_SETBACK } from './corner.js';
import { placedBuilder } from './walls.js';
import { RAIL_W, PLINTH_SETBACK } from './constants.js';

// Розміри, потрібні лише для моделі (у специфікації їх немає), мм
const BACK_INSET = 2;
const HANDLE = { w: 128, h: 12, d: 18, fromTop: 60 };
const DISHWASHER_CLEARANCE = 2; // техніка вужча за нішу з кожного боку
const FRIDGE_CLEARANCE = 2;
const APPLIANCE_INSET = 20; // техніка не доходить до задньої стінки
const APPLIANCE_GLASS = { side: 40, y: 0.15, h: 0.6 }; // скло дверцят техніки: відступ збоку, частки висоти

// Накладні фасади перед корпусом і ручки; шухляди — з корпусом і напрямними
function addFronts(G, m, innerW, leftX) {
  m.fronts.forEach(f => {
    G.panel(f.key, 'front', f.x, f.y, m.depth, f.w, f.h, T);
    const hw = Math.min(HANDLE.w, f.w * 0.6);
    const hy = f.handleY ?? (f.key === 'part.drawerFront' ? f.y + f.h * 0.62 : f.y + f.h - HANDLE.fromTop);
    G.hardware('part.handle', 'handle', f.x + f.w / 2 - hw / 2, hy, m.depth + T, hw, HANDLE.h, HANDLE.d);
    if (f.key === 'part.drawerFront') addDrawerGeometry(G, drawerBox(innerW, f.h, m.depth), leftX, f.y, m.depth);
  });
}

function addBack(G, m) {
  const backT = thickness('hardboard');
  G.panel('part.back', 'back', m.x + BACK_INSET, m.y0 + BACK_INSET, -backT, m.w - 4, m.h - 4, backT, 'hardboard');
}

// Звичайний корпус: боковини, дно, царги під стільницею (також глухий кутовий)
function addCabinet(G, s, m) {
  const { x, y0 } = m;
  const inner = m.w - 2 * T;
  const yTop = y0 + s.H;
  G.panel('part.side', 'wood', x, y0, 0, T, s.H, s.D);
  G.panel('part.side', 'wood', x + m.w - T, y0, 0, T, s.H, s.D);
  G.panel('part.bottom', 'wood', x + T, y0, 0, inner, T, s.D);
  G.panel('part.rail', 'wood', x + T, yTop - T, 0, inner, T, RAIL_W);
  G.panel('part.rail', 'wood', x + T, yTop - T, s.D - RAIL_W, inner, T, RAIL_W);
  addBack(G, m);
}

// Високий корпус: боковини, дно, кришка; пенал — із задньою стінкою й технікою, холодильник — без задньої
function addTallCarcass(G, m) {
  const { x, y0, h, depth } = m;
  const inner = m.w - 2 * T;
  G.panel('part.side', 'wood', x, y0, 0, T, h, depth);
  G.panel('part.side', 'wood', x + m.w - T, y0, 0, T, h, depth);
  G.panel('part.bottom', 'wood', x + T, y0, 0, inner, T, depth);
  G.panel('part.top', 'wood', x + T, y0 + h - T, 0, inner, T, depth);
  if (m.type === 'tall') {
    m.dividers.forEach(y => G.panel('part.zoneShelf', 'shelf', x + T, y, 0, inner, T, depth));
    m.appliances.forEach(a => {
      G.hardware(a.key, 'steel', a.x, a.y, APPLIANCE_INSET, a.w, a.h, depth + T - APPLIANCE_INSET);
      // темне скло дверцят, щоб техніку було видно окремо
      const { side, y, h } = APPLIANCE_GLASS;
      G.hardware(a.key, 'handle', a.x + side, a.y + a.h * y, depth + T, a.w - 2 * side, a.h * h, 1);
    });
    addBack(G, m);
    return;
  }
  if (m.yShelf !== null) G.panel('part.zoneShelf', 'shelf', x + T, m.yShelf, 0, inner, T, depth);
  const c = FRIDGE_CLEARANCE;
  G.hardware('part.fridge', 'handle', m.niche.x + c, y0 + T, 0, m.niche.w - 2 * c, m.niche.h - c, depth);
}

function addModule(G, s, L, m, holes) {
  const yTop = L.y0 + s.H;
  if (isNiche(m)) {
    // техніка на підлозі, за цокольною планкою; фасад (нижче) — на її дверці
    const depth = s.D - PLINTH_SETBACK - T;
    const c = DISHWASHER_CLEARANCE;
    G.hardware('part.dishwasher', 'handle', m.niche.x + c, 0, 0, m.niche.w - 2 * c, yTop, depth);
    m.endSides.forEach(sx => G.panel('part.side', 'wood', sx, 0, 0, T, yTop, s.D));
  } else if (isTall(m)) {
    addTallCarcass(G, m);
  } else {
    addCabinet(G, s, m);
  }
  const inner = m.w - 2 * T;
  m.shelves.forEach(y => G.panel('part.shelf', 'shelf', m.x + T, y, 0, inner, T, m.depth - SHELF_SETBACK));
  addFronts(G, m, inner, m.x + T);
  if (m.legs.length) addLegGeometry(G, m.legs, s.legs, m.depth - PLINTH_SETBACK - T);
  if (m.type === 'sink') holes.push(addSinkGeometry(G, { x: m.x, w: m.w, y: yTop + L.worktopSpec.t, D: s.D, H: s.H }));
}

function addUpper(G, L, m) {
  if (m.type === 'gap') return;
  const { H, D } = L.upper;
  const { x, y0 } = m;
  const inner = m.w - 2 * T;
  G.panel('part.side', 'wood', x, y0, 0, T, H, D);
  G.panel('part.side', 'wood', x + m.w - T, y0, 0, T, H, D);
  G.panel('part.bottom', 'wood', x + T, y0, 0, inner, T, D);
  G.panel('part.top', 'wood', x + T, y0 + H - T, 0, inner, T, D);
  m.shelves.forEach(y => G.panel('part.shelf', 'shelf', x + T, y, 0, inner, T, D - SHELF_SETBACK));
  addFronts(G, m, inner, x + T);
  addBack(G, m);
}

function addCorner(G, s, c) {
  if (c.type === 'lShape') return addLShapeGeometry(G, s, c);
  addCabinet(G, s, c);
  const inner = c.w - 2 * T;
  c.shelves.forEach(y => G.panel('part.shelf', 'shelf', c.x + T, y, 0, inner, T, s.D - SHELF_SETBACK));
  addFronts(G, c, inner, c.x + T);
  if (c.legs.length) addLegGeometry(G, c.legs, s.legs, s.D - PLINTH_SETBACK - T);
  c.fillers.forEach(f => G.panel('part.filler', 'front', f.x, c.y0, f.z, f.w, s.H, f.d));
}

// Геометрія кухні без Three.js, у мм; формат і координати — Geometry у core/types.js.
export function modelGeometry(s, L) {
  const root = geometryBuilder();
  const yTop = L.y0 + s.H;
  L.walls.forEach(wall => {
    const G = placedBuilder(root, wall.place);
    const holes = []; // вирізи під мийки в стільниці
    wall.modules.forEach(m => addModule(G, s, L, m, holes));
    if (wall.corner) addCorner(G, s, wall.corner);
    wall.uppers.forEach(m => addUpper(G, L, m));
    if (s.legs > 0)
      wall.plinths.forEach(p => G.panel('part.plinth', 'wood', p.x, 0, p.depth - PLINTH_SETBACK - T, p.w, s.legs, T));
    wall.worktops.forEach(p =>
      G.panel(
        'part.worktop',
        'worktop',
        p.x,
        yTop,
        0,
        p.w,
        p.t,
        p.d,
        'worktop',
        holes.filter(o => o.x >= p.x && o.x < p.x + p.w),
      ),
    );
  });
  return root.result();
}
