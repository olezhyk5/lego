// Кухня (type: 'kitchen'): ряд нижніх модулів зліва направо на ніжках, спільні стільниця й цокольна планка.
// Назви типів модулів — у словнику: moduleType.<тип>
export const MODULE_TYPES = ['doors', 'drawers', 'sink', 'open'];

// Межі кількості: двері, ящики, полиці відкритого модуля. Під мийку — без кількості (двері за шириною).
export const MODULE_COUNT = { doors: [1, 2], drawers: [1, 6], open: [0, 6] };
export const DEFAULT_COUNT = { doors: 1, drawers: 3, open: 2 };

// Виступи стільниці за модулі, мм (ззаду — стіна). Назви — у словнику: worktopSide.<бік>
export const WORKTOP_SIDES = ['front', 'left', 'right'];
export const DEFAULT_WORKTOP = { front: 30, left: 0, right: 0 };

export const RAIL_W = 100; // ширина царги (планки замість кришки під стільницею), мм
export const SINK_TWO_DOORS_FROM = 600; // модуль під мийку від цієї ширини — з двома дверима, мм

// Регульовані ніжки, мм. У плані ніжка LEG × LEG, відступ LEG_INSET від боків і задньої стінки.
// Ряди ніжок по ширині модуля — рівномірно, з кроком (між осями) не більше LEG_MAX_SPAN; у кожному ряду дві: спереду й ззаду.
export const LEG = 40;
export const LEG_INSET = 40;
export const LEG_MAX_SPAN = 700;
export const LEGS_MIN_H = 80; // нижче — не вміщується кріплення цоколя й незручно прибирати під модулем
