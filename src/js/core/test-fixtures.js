// Спільні дані для тестів core/. Не імпортувати в робочий код.
import { expect } from 'vitest';
import { MATERIALS } from '../config/materials.js';
import { PRESETS } from './types/wardrobe/presets.js';
import { PRESETS as KITCHEN_PRESETS } from './types/kitchen/presets.js';
import { clone } from '../utils/helpers.js';
import { createProject } from './project-format.js';

// Дані пресета шафи (поля без version/type)
export const preset = name => clone(PRESETS[name].data);

// Пресет шафи як проєкт поточної версії формату (version + type)
export const presetProject = name => createProject('wardrobe', preset(name));

// Проєкт шафи поточної версії з довільними секціями
export const project = (sections, dims = {}) =>
  createProject('wardrobe', { W: 1000, H: 2000, D: 600, plinth: 80, ...dims, sections });

export const keys = msgs => msgs.map(m => m.key);

// Плити специфікації поштучно і бокси-плити геометрії в однаковому вигляді:
// 'key|mat|більший×менший', для боксу два більші розміри — a × b, найменший — товщина.
const sortedPair = (a, b) => [Math.round(a), Math.round(b)].sort((x, y) => y - x).join('×');
const specPieces = P => P.panels.flatMap(p => Array(p.q).fill(`${p.key}|${p.mat}|${sortedPair(p.a, p.b)}`)).sort();
const geomPieces = G =>
  G.boxes
    .filter(b => b.kind === 'panel')
    .map(b => {
      const [a, c] = [b.w, b.h, b.d].sort((x, y) => y - x);
      return `${b.key}|${b.mat}|${sortedPair(a, c)}`;
    })
    .sort();

// Інваріант для експорту: кожна плита специфікації — рівно один бокс у геометрії, і навпаки
export function expectGeometryMatchesParts(G, P) {
  expect(geomPieces(G)).toEqual(specPieces(P));
  G.boxes
    .filter(b => b.kind === 'panel')
    .forEach(b => expect(Math.min(b.w, b.h, b.d), `${b.key}: товщина`).toBe(MATERIALS[b.mat].t));
}

// Кухня: пресет як проєкт і проєкт з довільними модулями
export const kitchenPreset = name => createProject('kitchen', clone(KITCHEN_PRESETS[name].data));
export const kitchen = (modules, fields = {}) =>
  createProject('kitchen', {
    H: 720,
    D: 560,
    legs: 100,
    worktop: { front: 30, left: 0, right: 0 },
    ...fields,
    modules,
  });
