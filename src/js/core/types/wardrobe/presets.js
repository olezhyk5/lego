// Пресети шафи: поля проєкту без version/type. Назва — у словнику: preset.wardrobe.<ключ>
export const PRESETS = {
  wardrobe: {
    data: {
      W: 1800,
      H: 2400,
      D: 600,
      plinth: 80,
      sections: [
        {
          width: 'auto',
          zones: [
            { type: 'empty', height: 400 },
            { type: 'rod', height: 'auto' },
            { type: 'rod', height: 'auto' },
          ],
        },
        {
          width: 600,
          zones: [
            { type: 'shelves', count: 3, height: 'auto' },
            { type: 'drawers', count: 3, height: 600 },
          ],
        },
        {
          width: 'auto',
          zones: [
            { type: 'empty', height: 400 },
            { type: 'rod', height: 'auto' },
          ],
        },
      ],
    },
  },
  wardrobe2: {
    data: {
      W: 1200,
      H: 2200,
      D: 600,
      plinth: 80,
      sections: [
        {
          width: 'auto',
          zones: [
            { type: 'empty', height: 350 },
            { type: 'rod', height: 'auto' },
          ],
        },
        {
          width: 'auto',
          zones: [
            { type: 'empty', height: 350 },
            { type: 'shelves', count: 3, height: 'auto' },
            { type: 'drawers', count: 2, height: 400 },
          ],
        },
      ],
    },
  },
  komod: {
    data: {
      W: 1000,
      H: 900,
      D: 450,
      plinth: 60,
      sections: [{ width: 'auto', zones: [{ type: 'drawers', count: 4, height: 'auto' }] }],
    },
  },
  tumba: {
    data: {
      W: 600,
      H: 700,
      D: 400,
      plinth: 0,
      sections: [{ width: 'auto', zones: [{ type: 'shelves', count: 2, height: 'auto' }] }],
    },
  },
  penal: {
    data: {
      W: 450,
      H: 2100,
      D: 400,
      plinth: 80,
      sections: [
        {
          width: 'auto',
          zones: [
            { type: 'shelves', count: 4, height: 'auto' },
            { type: 'drawers', count: 2, height: 400 },
          ],
        },
      ],
    },
  },
};
