import * as THREE from 'three';

const LABEL_FONT_SIZE = 44;
const LABEL_FONT = `600 ${LABEL_FONT_SIZE}px system-ui,-apple-system,Segoe UI,Roboto,sans-serif`;

function roundRect(ctx, x, y, w, h, rad) {
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

// Текстова плашка-спрайт, завжди повернута до камери. lh — висота рядка у мм сцени.
export function addLabel(group, lines, pos, lh, opt = {}) {
  const fs = LABEL_FONT_SIZE,
    pad = 14,
    lineH = fs * 1.18;
  const c = document.createElement('canvas'),
    x = c.getContext('2d');
  x.font = LABEL_FONT;
  const tw = Math.max.apply(
    null,
    lines.map(l => x.measureText(l).width),
  );
  c.width = Math.ceil(tw + pad * 2);
  c.height = Math.ceil(lines.length * lineH + pad * 2 - (lineH - fs));
  x.font = LABEL_FONT;
  roundRect(x, 1.5, 1.5, c.width - 3, c.height - 3, 12);
  x.fillStyle = opt.bg || 'rgba(255,255,255,.93)';
  x.fill();
  x.lineWidth = 3;
  x.strokeStyle = opt.border || 'rgba(31,35,40,.18)';
  x.stroke();
  x.fillStyle = opt.color || '#1f2328';
  x.textAlign = 'center';
  x.textBaseline = 'top';
  lines.forEach((l, i) => x.fillText(l, c.width / 2, pad + i * lineH));
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  sp.scale.set((c.width / fs) * lh, (c.height / fs) * lh, 1);
  sp.position.copy(pos);
  sp.renderOrder = 999;
  group.add(sp);
}

// Розмірна лінія від a до b з засічками вздовж tick і підписом посередині.
export function addDim(group, mat, a, b, text, tick, lh) {
  const t = tick.clone().multiplyScalar(lh * 0.45);
  const pts = [a, b, a.clone().add(t), a.clone().sub(t), b.clone().add(t), b.clone().sub(t)];
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  const l = new THREE.LineSegments(g, mat);
  l.renderOrder = 998;
  group.add(l);
  addLabel(group, [text], a.clone().add(b).multiplyScalar(0.5), lh, { color: '#111827' });
}
