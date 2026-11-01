import { PRESETS } from './presets.js';
import { computeLayout } from './layout.js';
import { partsList, describe, summary } from './parts.js';
import { modelGeometry } from './geometry.js';
import { annotations } from './annotations.js';
import { validateKitchen } from './validate.js';

/** @type {import('../../types.js').FurnitureType} */
export const kitchen = {
  id: 'kitchen',
  presets: PRESETS,
  defaultPreset: 'line240',
  validate: validateKitchen,
  layout: computeLayout,
  parts: partsList,
  summary,
  describe,
  describeTitle: { report: 'report.describe.kitchen', export: 'export.describe.kitchen' },
  geometry: modelGeometry,
  annotations,
  fileBase: s => {
    const L = computeLayout(s);
    return `kukhnia-${Math.round(L.bounds.W)}x${Math.round(L.bounds.H)}x${Math.round(L.bounds.D)}`;
  },
};
