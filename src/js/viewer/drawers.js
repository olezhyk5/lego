import * as THREE from 'three';

// Висування шухляд мишею: наведення — трохи, клік — наполовину, повторний клік засуває.
// Частки — від повного ходу (довжини напрямної), який задає геометрія типу.
const HOVER_OUT = 0.08;
const OPEN_OUT = 0.5;
const TAU = 0.07; // стала часу анімації, с
const CLICK_SLOP = 6; // зсув вказівника між натисканням і відпусканням, після якого це вже обертання, px
const EPS = 0.001;

/**
 * @param {{ dom: HTMLElement, container: HTMLElement, camera: THREE.Camera, requestRender: () => void }} p
 */
export function createDrawerMotion({ dom, container, camera, requestRender }) {
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  /** @type {THREE.Group[]} */
  let drawers = [];
  /** @type {THREE.Mesh[]} */
  let targets = []; // усі меші моделі: шухляду за дверкою чи боковиною не чіпляємо
  let hovered = null;
  let opened = null;
  let down = null;

  // шухляда під вказівником (найближчий меш має бути її)
  function pick(e) {
    if (!drawers.length) return null;
    const b = dom.getBoundingClientRect();
    ndc.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(targets, false)[0];
    return hit && drawers.includes(hit.object.parent) ? hit.object.parent : null;
  }

  function retarget() {
    drawers.forEach(g => {
      g.userData.target = g === opened ? OPEN_OUT : g === hovered ? HOVER_OUT : 0;
    });
    container.classList.toggle('is-pointer', Boolean(hovered));
    requestRender();
  }

  function setHovered(g) {
    if (g === hovered) return;
    hovered = g;
    retarget();
  }

  function onMove(e) {
    // наведення є лише в миші; під час обертання камери (затиснута кнопка) не підсвічуємо
    if (e.pointerType !== 'mouse' || e.buttons) return;
    setHovered(pick(e));
  }
  function onDown(e) {
    down = { x: e.clientX, y: e.clientY, id: e.pointerId };
  }
  function onUp(e) {
    const d = down;
    down = null;
    if (!d || d.id !== e.pointerId || Math.hypot(e.clientX - d.x, e.clientY - d.y) > CLICK_SLOP) return;
    const g = pick(e);
    if (!g) return;
    opened = opened === g ? null : g;
    retarget();
  }
  function onLeave() {
    setHovered(null);
  }

  dom.addEventListener('pointermove', onMove);
  dom.addEventListener('pointerdown', onDown);
  dom.addEventListener('pointerup', onUp);
  dom.addEventListener('pointerleave', onLeave);

  return {
    // нова модель: усі шухляди засунуті
    /** @param {THREE.Group} model @param {THREE.Object3D} dims @param {THREE.Group[]} list */
    setModel(model, dims, list) {
      drawers = list;
      drawers.forEach(g => Object.assign(g.userData, { t: 0, target: 0 }));
      hovered = opened = null;
      container.classList.remove('is-pointer');
      targets = [];
      model.traverse(o => {
        if (o instanceof THREE.Mesh && !isIn(o, dims)) targets.push(o);
      });
    },
    // крок анімації за dt секунд; true — ще рухаються, потрібен наступний кадр
    /** @param {number} dt */
    step(dt) {
      const k = 1 - Math.exp(-dt / TAU);
      let moving = false;
      drawers.forEach(g => {
        const u = g.userData;
        if (u.t === u.target) return;
        u.t += (u.target - u.t) * k;
        if (Math.abs(u.target - u.t) < EPS) u.t = u.target;
        else moving = true;
        g.position.copy(u.move.dir).multiplyScalar(u.move.travel * u.t);
      });
      return moving;
    },
    dispose() {
      dom.removeEventListener('pointermove', onMove);
      dom.removeEventListener('pointerdown', onDown);
      dom.removeEventListener('pointerup', onUp);
      dom.removeEventListener('pointerleave', onLeave);
      drawers = targets = [];
    },
  };
}

function isIn(o, root) {
  for (let p = o; p; p = p.parent) if (p === root) return true;
  return false;
}
