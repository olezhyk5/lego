// Пресети кухні: поля проєкту без version/type. Назва — у словнику: preset.kitchen.<ключ>
const BASE = { H: 720, D: 560, legs: 100, worktop: { front: 30, left: 0, right: 0 } };

export const PRESETS = {
  line240: {
    data: {
      ...BASE,
      modules: [
        { width: 600, type: 'drawers', count: 3 },
        { width: 800, type: 'sink' },
        { width: 600, type: 'doors', count: 1 },
        { width: 400, type: 'open', count: 2 },
      ],
    },
  },
  line180: {
    data: {
      ...BASE,
      modules: [
        { width: 600, type: 'drawers', count: 4 },
        { width: 600, type: 'sink' },
        { width: 600, type: 'doors', count: 2 },
      ],
    },
  },
  base60: {
    data: { ...BASE, modules: [{ width: 600, type: 'doors', count: 1 }] },
  },
  full: {
    data: {
      ...BASE,
      modules: [
        { width: 600, type: 'fridge', nicheH: 1800, nicheD: 550 },
        { width: 600, type: 'drawers', count: 3 },
        { width: 800, type: 'sink' },
        { width: 600, type: 'doors', count: 1 },
        {
          width: 600,
          type: 'tall',
          zones: [
            { type: 'shelves', count: 1, height: 'auto' },
            { type: 'microwave', height: 400 },
            { type: 'oven', height: 600 },
            { type: 'drawers', count: 2, height: 'auto' },
          ],
        },
      ],
      uppers: [
        { width: 600, type: 'doors', count: 1 },
        { width: 800, type: 'doors', count: 2 },
        { width: 600, type: 'doors', count: 1 },
      ],
    },
  },
  cornerL: {
    data: {
      ...BASE,
      modules: [
        { width: 600, type: 'drawers', count: 3 },
        { width: 800, type: 'sink' },
      ],
      uppers: [{ width: 800, type: 'doors', count: 2 }],
      walls: [
        {
          corner: { type: 'lShape', a: 900, b: 900, count: 1 },
          modules: [
            { width: 600, type: 'doors', count: 1 },
            { width: 600, type: 'drawers', count: 3 },
          ],
          uppers: [{ width: 600, type: 'doors', count: 1 }],
        },
      ],
    },
  },
  cornerU: {
    data: {
      ...BASE,
      modules: [
        { width: 600, type: 'doors', count: 1 },
        { width: 600, type: 'drawers', count: 3 },
      ],
      walls: [
        {
          corner: { type: 'blind', width: 1100, filler: 70, count: 0 },
          modules: [{ width: 800, type: 'sink' }],
        },
        {
          corner: { type: 'lShape', a: 900, b: 900, count: 1 },
          modules: [
            { width: 600, type: 'drawers', count: 3 },
            { width: 600, type: 'doors', count: 1 },
          ],
        },
      ],
    },
  },
};
