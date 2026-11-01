import * as THREE from 'three';
import { addLabel, addDim } from './annotations.js';
import { tm } from '../i18n/index.js';

// Ролі без контурних ребер (дрібна фурнітура)
const NO_EDGES = ['handle'];

// Стилі плашок-підписів з annotations().labels[].style
const LABEL_STYLES = {
  zone: { bg: 'rgba(255,247,237,.95)', border: 'rgba(194,65,12,.35)', color: '#7c2d12' },
};

const vec = ([x, y, z]) => new THREE.Vector3(x, y, z);
const lineText = l => (typeof l === 'string' ? l : tm(l));

// Будує модель з даних типу меблів: {geometry, annotations, bounds} (див. core/types.js).
// Viewer не знає типів: матеріал — за роллю look, підписи — готові дані.
// Повертає {model, dims}; dims — підгрупа з розмірами (вмикається окремо).
export function buildModel({ geometry, annotations, bounds }, { showDims, M }) {
  const model = new THREE.Group();
  const dims = new THREE.Group();
  dims.visible = showDims;
  model.add(dims);
  model.position.set(-bounds.W / 2, 0, -bounds.D / 2);

  function box({ x, y, z, w, h, d }, mat, edges = true) {
    w = Math.max(w, 1);
    h = Math.max(h, 1);
    d = Math.max(d, 1);
    const g = new THREE.BoxGeometry(w, h, d);
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
    m.rotation.z = Math.PI / 2;
    m.position.set(r.x + r.len / 2, r.y, r.z);
    model.add(m);
  });

  if (annotations.highlight) box(annotations.highlight, M.hl, false);

  annotations.dims.forEach(d => addDim(dims, M.dim, vec(d.from), vec(d.to), d.text, vec(d.tick), d.size));
  annotations.labels.forEach(l =>
    addLabel(dims, l.lines.map(lineText), vec(l.pos), l.size, LABEL_STYLES[l.style] || {}),
  );

  return { model, dims };
}
