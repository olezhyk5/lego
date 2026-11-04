import * as THREE from 'three';
import { addLabel, addDim } from './annotations.js';
import { tm } from '../i18n/index.js';

// Ролі без контурних ребер (дрібна фурнітура й метал)
const NO_EDGES = ['handle', 'steel'];

// Стилі плашок-підписів з annotations().labels[].style
const LABEL_STYLES = {
  zone: { bg: 'rgba(255,247,237,.95)', border: 'rgba(194,65,12,.35)', color: '#7c2d12' },
};

const vec = ([x, y, z]) => new THREE.Vector3(x, y, z);
const lineText = l => (typeof l === 'string' ? l : tm(l));

const rectPath = (path, x, y, w, h) =>
  path
    .moveTo(x, y)
    .lineTo(x + w, y)
    .lineTo(x + w, y + h)
    .lineTo(x, y + h)
    .closePath();

// Контур плити w × d з вирізом n у куті (координати від кута плити)
function notchedShape(w, d, n) {
  const [x0, x1, z0, z1] = [n.x, n.x + n.w, n.z, n.z + n.d];
  const inNotch = (x, z) => x >= x0 - 0.01 && x <= x1 + 0.01 && z >= z0 - 0.01 && z <= z1 + 0.01;
  const pts = [
    [
      [0, 0],
      [
        [0, z1],
        [x1, z1],
        [x1, 0],
      ],
    ],
    [
      [w, 0],
      [
        [x0, 0],
        [x0, z1],
        [w, z1],
      ],
    ],
    [
      [w, d],
      [
        [w, z0],
        [x0, z0],
        [x0, d],
      ],
    ],
    [
      [0, d],
      [
        [x1, d],
        [x1, z0],
        [0, z0],
      ],
    ],
  ].flatMap(([c, cut]) => (inNotch(c[0], c[1]) ? cut : [c]));
  const shape = new THREE.Shape();
  pts.forEach(([x, z], i) => (i ? shape.lineTo(x, z) : shape.moveTo(x, z)));
  return shape.closePath();
}

// Плита з наскрізними вирізами або вирізом у куті, центрована як BoxGeometry; вирізи — у координатах моделі
function slabWithHoles({ x, z, w, h, d, holes = [], notch }) {
  const shape = notch
    ? notchedShape(w, d, { ...notch, x: notch.x - x, z: notch.z - z })
    : rectPath(new THREE.Shape(), 0, 0, w, d);
  holes.forEach(o => shape.holes.push(rectPath(new THREE.Path(), o.x - x, o.z - z, o.w, o.d)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false });
  g.rotateX(Math.PI / 2); // контур лягає в площину xz, товщина — вниз
  g.translate(-w / 2, h / 2, -d / 2);
  return g;
}

// Будує модель з даних типу меблів: {geometry, annotations, bounds} (див. core/types.js).
// Viewer не знає типів: матеріал — за роллю look, підписи — готові дані.
// Повертає {model, dims}; dims — підгрупа з розмірами (вмикається окремо).
export function buildModel({ geometry, annotations, bounds }, { showDims, M }) {
  const model = new THREE.Group();
  const dims = new THREE.Group();
  dims.visible = showDims;
  model.add(dims);
  model.position.set(-bounds.W / 2, 0, -bounds.D / 2);

  function box({ x, y, z, w, h, d, holes, notch }, mat, edges = true) {
    w = Math.max(w, 1);
    h = Math.max(h, 1);
    d = Math.max(d, 1);
    const g = holes || notch ? slabWithHoles({ x, z, w, h, d, holes, notch }) : new THREE.BoxGeometry(w, h, d);
    const m = new THREE.Mesh(g, mat);
    m.position.set(x + w / 2, y + h / 2, z + d / 2);
    model.add(m);
    if (edges) {
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(g), M.edge);
      e.position.copy(m.position);
      model.add(e);
    }
    return m;
  }

  geometry.boxes.forEach(b => box(b, M[b.look], !NO_EDGES.includes(b.look)));
  geometry.rods.forEach(r => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r.r, r.r, Math.max(r.len, 1), 20), M[r.look]);
    const axis = r.axis || 'x';
    if (axis === 'x') m.rotation.z = Math.PI / 2;
    if (axis === 'z') m.rotation.x = Math.PI / 2;
    m.position.set(r.x, r.y, r.z);
    m.position[axis] += r.len / 2;
    model.add(m);
  });

  if (annotations.highlight) box(annotations.highlight, M.hl, false);

  annotations.dims.forEach(d => addDim(dims, M.dim, vec(d.from), vec(d.to), d.text, vec(d.tick), d.size));
  annotations.labels.forEach(l =>
    addLabel(dims, l.lines.map(lineText), vec(l.pos), l.size, LABEL_STYLES[l.style] || {}),
  );

  return { model, dims };
}
