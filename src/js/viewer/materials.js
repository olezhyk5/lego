import * as THREE from 'three';

export const SCENE_COLORS = {
  background: 0xf4f2ee,
  gridMain: 0xd3cec4,
  gridSub: 0xe4e0d8,
};

// Плити, що стають напівпрозорими в прозорому режимі; фурнітура (ручки, штанги) і ребра лишаються видимими.
const SHEET_MATERIALS = ['wood', 'shelf', 'back', 'front'];
const SHEET_OPACITY = 0.18;
const EDGE_OPACITY = { normal: 0.5, transparent: 0.9 };

export function setTransparent(M, on) {
  SHEET_MATERIALS.forEach(k => {
    M[k].transparent = on;
    M[k].opacity = on ? SHEET_OPACITY : 1;
    M[k].depthWrite = !on; // інакше передні плити ховають задні
    M[k].needsUpdate = true;
  });
  M.edge.opacity = on ? EDGE_OPACITY.transparent : EDGE_OPACITY.normal;
}

export function createMaterials() {
  return {
    wood: new THREE.MeshStandardMaterial({ color: 0xdcc29a, roughness: 0.85 }),
    shelf: new THREE.MeshStandardMaterial({ color: 0xe6d2ae, roughness: 0.85 }),
    back: new THREE.MeshStandardMaterial({ color: 0xc4ab86, roughness: 0.95 }),
    front: new THREE.MeshStandardMaterial({ color: 0xf2ebdf, roughness: 0.7 }),
    handle: new THREE.MeshStandardMaterial({ color: 0x4b5563, metalness: 0.6, roughness: 0.4 }),
    rod: new THREE.MeshStandardMaterial({ color: 0xa3a9b3, metalness: 0.75, roughness: 0.3 }),
    hl: new THREE.MeshBasicMaterial({ color: 0xea580c, transparent: true, opacity: 0.1, depthWrite: false }),
    edge: new THREE.LineBasicMaterial({ color: 0x7a5c34, transparent: true, opacity: EDGE_OPACITY.normal }),
    dim: new THREE.LineBasicMaterial({ color: 0x374151 }),
  };
}
