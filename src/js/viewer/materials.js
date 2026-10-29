import * as THREE from 'three';

export const SCENE_COLORS = {
  background: 0xf4f2ee,
  gridMain: 0xd3cec4,
  gridSub: 0xe4e0d8,
};

export function createMaterials() {
  return {
    wood: new THREE.MeshStandardMaterial({ color: 0xdcc29a, roughness: 0.85 }),
    shelf: new THREE.MeshStandardMaterial({ color: 0xe6d2ae, roughness: 0.85 }),
    back: new THREE.MeshStandardMaterial({ color: 0xc4ab86, roughness: 0.95 }),
    front: new THREE.MeshStandardMaterial({ color: 0xf2ebdf, roughness: 0.7 }),
    handle: new THREE.MeshStandardMaterial({ color: 0x4b5563, metalness: 0.6, roughness: 0.4 }),
    rod: new THREE.MeshStandardMaterial({ color: 0xa3a9b3, metalness: 0.75, roughness: 0.3 }),
    hl: new THREE.MeshBasicMaterial({ color: 0xea580c, transparent: true, opacity: 0.1, depthWrite: false }),
    edge: new THREE.LineBasicMaterial({ color: 0x7a5c34, transparent: true, opacity: 0.5 }),
    dim: new THREE.LineBasicMaterial({ color: 0x374151 }),
  };
}
