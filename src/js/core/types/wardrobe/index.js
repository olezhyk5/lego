import { PRESETS } from './presets.js';
import { computeLayout } from './layout.js';
import { partsList, describe, summary } from './parts.js';
import { modelGeometry } from './geometry.js';
import { annotations } from './annotations.js';
import { validateWardrobe } from './validate.js';

/** @type {import('../../types.js').FurnitureType} */
export const wardrobe = {
  id: 'wardrobe',
  presets: PRESETS,
  defaultPreset: 'wardrobe',
  validate: validateWardrobe,
  layout: computeLayout,
  parts: partsList,
  summary,
  describe,
  describeTitle: { report: 'report.describe.wardrobe', export: 'export.describe.wardrobe' },
  geometry: modelGeometry,
  annotations,
  fileBase: s => `shafa-${s.W}x${s.H}x${s.D}`,
};
