// Спільні дані для тестів core/. Не імпортувати в робочий код.
import { PRESETS } from '../config/presets.js';
import { clone } from '../utils/helpers.js';

export const preset = name => clone(PRESETS[name].data);

export const project = (sections, dims = {}) => ({ W: 1000, H: 2000, D: 600, plinth: 80, ...dims, sections });

export const keys = msgs => msgs.map(m => m.key);
