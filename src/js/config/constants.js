export const T = 16; // умовна товщина плити, мм
export const GAP = 3; // зазор між фасадами ящиків, мм
// проєкт у localStorage; старі ключі читаються (з міграцією), якщо нового ще немає
export const STORAGE_KEY = 'lego-project';
export const LEGACY_STORAGE_KEYS = ['wardrobe-cfg-v1'];
// останній вибраний пресет (<тип>.<ключ>) — окремо від проєкту, у JSON не потрапляє
export const PRESET_STORAGE_KEY = 'lego-preset';

// Кришка в проєкті: top: { mount, double, overhang? }. Немає поля (старі файли) → між боковинами, одинарна.
// mount — між боковинами (боковини на всю висоту) або над ними (кришка на всю ширину);
// назви — у словнику: topMount.<тип>. double — потовщена кришка з двох плит (2 × T)
export const TOP_MOUNTS = ['between', 'over'];
export const DEFAULT_TOP_MOUNT = 'between';

// Виступи кришки за корпус, мм: top.overhang: { back, front, left, right }. Лише для mount = 'over';
// немає поля → 0. Назви — у словнику: topOverhang.<бік>
export const TOP_OVERHANG_SIDES = ['back', 'front', 'left', 'right'];

// Ролі матеріалів у 3D (look у геометрії типу): viewer/materials.js має матеріал для кожної
export const LOOKS = ['wood', 'shelf', 'back', 'front', 'handle', 'rod', 'worktop'];
