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
};
