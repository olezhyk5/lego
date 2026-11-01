import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createMaterials, setTransparent, SCENE_COLORS } from './materials.js';
import { buildModel } from './builder.js';

function disposeGroup(g) {
  g.traverse(o => {
    if (o.isSprite) {
      o.material.map && o.material.map.dispose();
      o.material.dispose();
      return;
    } // геометрія спрайтів спільна
    if (o.geometry) o.geometry.dispose();
  });
}

// Створює 3D-в'юер у контейнері. Повертає null, якщо WebGL недоступний.
export function createViewer(container) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
  } catch (e) {
    return null;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SCENE_COLORS.background);
  const camera = new THREE.PerspectiveCamera(38, 1, 10, 60000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;

  // з r155 світло фізично коректне: множник π зберігає яскравість, підібрану під legacy-режим
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb5ad9f, 0.85 * Math.PI));
  const dl = new THREE.DirectionalLight(0xffffff, 0.55 * Math.PI);
  dl.position.set(2500, 4000, 3500);
  scene.add(dl);
  const dl2 = new THREE.DirectionalLight(0xffffff, 0.25 * Math.PI);
  dl2.position.set(-3000, 1500, -1000);
  scene.add(dl2);
  scene.add(new THREE.GridHelper(10000, 50, SCENE_COLORS.gridMain, SCENE_COLORS.gridSub));

  const M = createMaterials();
  let model = new THREE.Group();
  let dims = null;
  scene.add(model);

  // рендер лише на вимогу: коли камера рухається або модель змінилась
  let renderPending = false;
  function renderFrame() {
    renderPending = false;
    controls.update(); // при інерції сам викличе 'change' → наступний кадр
    renderer.render(scene, camera);
  }
  function requestRender() {
    if (renderPending) return;
    renderPending = true;
    requestAnimationFrame(renderFrame);
  }

  function resize() {
    const b = container.getBoundingClientRect();
    if (!b.width || !b.height) return;
    renderer.setSize(b.width, b.height);
    camera.aspect = b.width / b.height;
    camera.updateProjectionMatrix();
    requestRender();
  }
  controls.addEventListener('change', requestRender);
  new ResizeObserver(resize).observe(container);
  resize();

  return {
    // data — {geometry, annotations, bounds} з модуля типу (див. main.js)
    rebuild(data, { showDims }) {
      disposeGroup(model);
      scene.remove(model);
      ({ model, dims } = buildModel(data, { showDims, M }));
      scene.add(model);
      requestRender();
    },
    // b — габарити моделі {W, H, D}
    fit(b) {
      const size = Math.max(b.W, b.H, b.D);
      controls.target.set(0, b.H / 2, 0);
      camera.position.set(b.W * 0.45 + size * 0.25, b.H * 0.7, size * 1.85 + b.D);
      controls.update();
      requestRender();
    },
    setDimsVisible(v) {
      if (dims) dims.visible = v;
      requestRender();
    },
    // матеріали спільні для всіх перебудов, тож режим переживає rebuild
    setTransparent(v) {
      setTransparent(M, v);
      requestRender();
    },
    toBlob(cb) {
      renderer.render(scene, camera); // буфер очищається після кадру — рендеримо синхронно перед зняттям
      renderer.domElement.toBlob(cb);
    },
  };
}
