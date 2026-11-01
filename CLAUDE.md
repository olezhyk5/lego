# lego — конструктор меблів

Окремий фронтенд-застосунок (не WordPress-тема) для конструювання корпусних меблів. Користувач задає габарити, секції та зони, бачить 3D-модель (Three.js) і отримує специфікацію деталей (CSV / JSON / PNG).

Фізично лежить у `wp-content/themes/lego` сайту Local `ideal-health`, але WP його лише хостить: **не додаємо PHP, `style.css`-заголовок теми чи залежності від WP**. Точка входу — статичний `index.html`.
Відкривати: http://ideal-health.local/wp-content/themes/lego/index.html
Репозиторій: `git@github.com:olezhyk5/lego.git`

## Куди рухається проєкт

Враховуй це в кожному рішенні:

- **Інші типи меблів** (зараз шафа — з пресетами шафи, комода, тумби, пенала — і кухня). Код під конкретний тип не повинен «протікати» в загальні модулі (див. «Типи меблів»).
- **Матеріали, кольори, ціни.** Вартість рахуватиме зовнішній **API**. Специфікація (`core/parts.js`) має лишатися машиночитною (ключі + числа, без тексту), бо саме вона піде в API.
- **Зберігання.** Зараз це JSON-файли та localStorage. Пізніше той самий JSON зберігатиметься в базі, а файли лишаться. Формат проєкту — публічний контракт, тож міняємо його обережно (див. «Модель даних»).
- **Багатомовність**: усі тексти лише через i18n (див. нижче).
- Кабінет, замовлення тощо робитимуться **окремо**, у цьому репозиторії їх не буде.

## TODO

Відкладені задачі ведемо в [TODO.md](TODO.md). Перед новою задачею переглянь його: можливо, там є пов'язаний пункт або залежність. Якщо щось свідомо відкладаєш («зробимо пізніше», «після X»), одразу додай пункт у TODO.md. Виконане позначай `- [x]`.

## Команди

```bash
npm install          # один раз (+ ставить git-хуки husky)
npm run dev          # збірка + browser-sync + watch
npm run build        # продакшн-збірка (мініфікація, без sourcemap)
npm run lint         # ESLint + Stylelint
npm run lint:fix     # автовиправлення
npm run typecheck    # перевірка типів JSDoc (tsc, без збірки)
npm run format       # Prettier
npm test             # тести (Vitest), один прогін
npm run test:watch   # тести в режимі спостереження
npm run check        # lint + typecheck + format:check + test + build — запускати перед комітом
npm run test:e2e     # e2e (Playwright): збірка + сервер на :4173 + тести в Chromium і WebKit
npm run test:e2e:golden  # перезаписати еталонні CSV/JSON (e2e/golden/) — лише коли зміна навмисна
npm run check:full   # check + e2e — перед великими змінами й перед пушем
```

`npm run dev` піднімає статичний сервер з кореня. Через сайт Local: `BS_PROXY=http://ideal-health.local npm run dev`.
Pre-commit хук (husky, `.husky/pre-commit`) запускає `npm run lint`, `npm run typecheck`, `npm run format:check` і `npm test`. Якщо він падає, виправ (`npm run lint:fix`, `npm run format`), а **не обходь через `--no-verify`**.

## Головні правила

- **Редагуємо лише `src/`** (і `index.html`). `assets/css`, `assets/js` генерує gulp, вони в `.gitignore`.
- Ніяких інлайн `<style>`, `<script>`, `style=""` і CDN-скриптів. Залежності — через npm.
- Ніякого тексту для користувача в коді, тільки ключі i18n.
- Після змін `npm run check` має пройти без помилок, а сторінка має працювати на десктопі й на телефоні (див. «Перевірка змін»).

## Структура

```
index.html               розмітка; статичні тексти через data-i18n*
gulpfile.js              clean, styles, scripts, watch, build, default
eslint.config.js         правила JS + заборона імпортів між шарами
.stylelintrc.json        правила SCSS (BEM, вкладеність, кольори, порядок властивостей)
.prettierrc.json         форматування
src/
  scss/
    main.scss            точка входу, лише @use; порядок: base → layout → components
    abstracts/           змінні, функції, міксини; самі CSS не генерують
      _variables.scss    $colors, шрифти, радіуси, розміри, $breakpoints, $touch-target
      _functions.scss    color(name)
      _mixins.scss       mq-down(bp), touch, focus-ring
    base/                :root-змінні, reset, типографіка (лише селектори тегів)
    layout/              каркас сторінки: topbar, app (сітка, сайдбар, main)
    components/          один BEM-блок = один файл
  js/
    main.js              точка входу: i18n → в'юер → UI; містить update() і loadProject()
    config/              спільні константи (T, GAP, кришка, ролі матеріалів 3D, ключі localStorage), матеріали
    i18n/                t(), tm(), translateDom(); locales/<мова>.js
    core/                чиста логіка — без DOM і Three.js
      registry.js        реєстр типів меблів: getType(project.type)
      types.js           JSDoc-типи, у т.ч. контракт типу FurnitureType
      store.js presets.js project-format.js validate.js export.js   — загальні, працюють через реєстр
      common/            спільні блоки для типів: корпус, збирачі специфікації й геометрії, листи
      types/<тип>/       модуль типу: presets, layout, parts, geometry, annotations, validate, index.js
    viewer/              Three.js: сцена, матеріали, побудова моделі з даних типу (типів не знає)
    ui/                  DOM: оболонка (пресети, тулбар, звіт, модалка), шаблони
      forms.js           реєстр форм типів
      types/<тип>/       форма типу: шаблони, обробники, попапи
    utils/               дрібні універсальні хелпери
schema/                  JSON Schema формату проєкту (контракт для бекенду)
e2e/                     Playwright: сценарії, еталонні CSV/JSON (golden/), тестові файли
assets/                  результат збірки
```

Кожен файл у корені `src/scss/` без `_` і кожен файл у корені `src/js/` — окремий бандл з тим самим іменем в `assets/`. Усе інше — партіали/модулі в підпапках.

## SCSS

- **Вкладеність обов'язкова**: `&__elem`, `&--mod`, `&.is-*`, `&:hover`. Медіа-запити (`@include mq-down(md)`, `@include touch`) пишемо **всередині** блоку чи елемента, якого вони стосуються, а не окремим блоком у кінці файлу.
- Вкладеність ≤ 3 рівнів, у складеному селекторі ≤ 3 частин (Stylelint). Не вкладай «для структури», якщо це лише підвищує специфічність.
- **BEM**: `.block`, `.block__element`, `.block--modifier`. Стани — `.is-selected`, `.is-visible`… (тільки їх перемикає JS). Шаблон імені класу перевіряє Stylelint.
- **Один блок = один файл** `components/_block-name.scss`. Новий файл додаємо в `_index.scss` своєї папки через `@forward`.
- Тільки `@use` / `@forward`, `@import` заборонений. У партіалі: `@use "../abstracts" as *;`
- **Кольори лише через `color(name)`.** Hex/rgb/іменовані кольори дозволені тільки в `abstracts/_variables.scss` (так налаштований Stylelint). Новий колір спочатку додаємо в `$colors`.
- Брейкпоінти — `mq-down(sm|md)`. Без `id`-селекторів і без `!important`.
- Порядок властивостей задає `stylelint-config-recess-order` (`npm run lint:fix` розставляє його сам).
- Вендорні префікси додає autoprefixer.

## JavaScript

- **Типи — JSDoc, а не TypeScript-файли** (рішення: файли лишаються `.js`, `tsc --noEmit` з `checkJs` лише перевіряє). Спільні типи — `core/types.js` (`Msg`, `Project`, `Panel`, `PartsList`, `Geometry`, `FurnitureType`…), підключаємо через `/** @param {import('./types.js').Project} s */`. Перевіряються `config/`, `utils/`, `core/`, `i18n/` (без тестів); `ui/` і `viewer/` поки ні. Публічні функції `core/` і контракти типів меблів мають JSDoc-типи. Переходимо на `.ts`, якщо з'явиться друга людина в команді або клієнт API, згенерований з OpenAPI.
- ES-модулі, іменовані експорти (без `export default`; виняток — словники в `i18n/locales/`). esbuild збирає один IIFE-бандл під `browserslist`.
- **Шари** (ESLint забороняє імпорти, що їх порушують):
  `main.js` → `ui/`, `viewer/` → `core/`, `i18n/` → `config/`, `utils/`.
  `core/` і `i18n/` не торкаються DOM і Three.js. `ui/` не імпортує `viewer/` і Three.js, з в'юером працює лише через API, яке передає `main.js`. `viewer/` не імпортує `ui/`.
  Типи меблів незалежні: `core/types/<a>/` і `ui/types/<a>/` не імпортують інших типів; `core/common/` не імпортує типів і реєстру. Загальні модулі звертаються до типів лише через `core/registry.js` (і `ui/forms.js` для форм).
- **Стан** зберігається лише в `core/store.js` (`store.state` — проєкт, `store.ui` — стан форми типу: `sel`, `collapsed`; `store.showDims`…). Після зміни стану викликаємо `update(full)`: `true`, якщо змінилась структура (форма перемальовується), `false`, якщо змінились лише значення (щоб зберегти фокус у полі). Новий проєкт (пресет, файл) — лише через `loadProject(project, preset)` з `main.js`.
- **DOM-хуки**: `id` для статичної розмітки, `data-*` для згенерованої (`data-section`, `data-zone`, `data-field`, `data-act`, `data-preset`, `data-calc`). JS ніколи не шукає елементи за BEM-класами.
- HTML-шаблони живуть в `ui/templates.js` (коли їх стане багато, у `ui/templates/*.js`), а не в обробниках подій.
- Один модуль — одна відповідальність. Файл понад ~200 рядків або з двома задачами розділяємо.
- Іменування: файли `kebab-case.js`, функції/змінні `camelCase`, константи `UPPER_SNAKE_CASE`.
- 3D рендеримо лише на вимогу (`requestRender`), без постійного циклу. Перебудова моделі звільняє геометрії (`disposeGroup`).
- Three.js — остання версія (зараз 0.186, точна версія в `package.json`). Додатки імпортуємо з `three/addons/...`. Світло фізично коректне: інтенсивності з legacy-режиму множимо на `Math.PI`. Canvas-текстурам з текстом ставимо `colorSpace = SRGBColorSpace`.

## Типи меблів

Кожен тип — модуль, що реалізує контракт `FurnitureType` (`core/types.js`): `presets`, `validate`, `layout`, `parts`, `summary`, `describe`, `geometry`, `annotations`, `fileBase`. Усі функції чисті й повертають ключі та числа. Ядро, viewer, звіт і експорт працюють через реєстр і про конкретні типи нічого не знають: **не пишемо `if (type === …)` у загальних модулях**. Якщо типу бракує можливості ядра — розширюємо контракт або `core/common/`.

Як додати тип `<id>`:

1. `core/types/<id>/`: `presets.js`, `layout.js` (обов'язково `errs`, `warns`, `bounds`), `parts.js` (специфікація, `summary`, `describe`), `geometry.js` (`look` з `LOOKS`), `annotations.js`, `validate.js`, `index.js` (збирає об'єкт типу) + тести поряд. Спільні деталі корпусу — з `core/common/`.
2. Рядок у `TYPES` (`core/registry.js`).
3. `ui/types/<id>/form.js` (+ `templates.js`) за контрактом з `ui/forms.js` і рядок у `FORMS`. Хуки — `id`/`data-*`.
4. `schema/types/<id>.v2.schema.json` + гілка `if/then` у `schema/project.v2.schema.json` + фікстури `core/fixtures/validation/`.
5. i18n: `type.<id>`, `preset.<id>.<ключ>`, заголовки опису (`describeTitle`), деталі `part.*`, перевірки `check.*`.
6. e2e-сценарій і еталони для пресетів.

`core/registry.test.js` автоматично перевіряє контракт кожного типу (пресети валідні й без помилок, ключі є в словнику, матеріали й ролі 3D відомі).

## i18n

- Усі тексти зберігаються в `src/js/i18n/locales/<мова>.js`. `uk.js` — еталон і fallback: новий ключ спершу з'являється там.
- У JS: `t('section.name', {n: 2})`. Параметр може бути вкладеним повідомленням `{key, params}`, і воно теж перекладеться.
- У розмітці: `data-i18n="key"` (текст), `data-i18n-title`, `data-i18n-placeholder`, `data-i18n-aria-label`. Текст у HTML — лише fallback до запуску JS.
- `core/` **не повертає готових рядків**: помилки, попередження, назви деталей і опис — це `{key, params}`. Перекладає `ui/` (через `tm()`) або експорт. Так ці ж дані можна віддати в API чи базу без прив'язки до мови.
- Нова мова: файл `locales/<код>.js` з тією ж структурою ключів + рядок у `DICTIONARIES` в `i18n/index.js`. Мова обирається так: `localStorage['lego-locale']` → мова браузера → `uk`.
- Ключі групуємо за місцем використання (`toolbar.*`, `section.*`, `check.*`, `part.*`…), стиль — `camelCase`.

## Браузери та мобільні

- Цільові браузери: останні 2 версії Chrome, Firefox, Safari, Edge, iOS Safari, Chrome Android, Samsung Internet (`browserslist` у `package.json`; з нього беруть ціль autoprefixer і esbuild).
- **Мобільні обов'язкові.** Будь-який новий UI перевіряємо на ширині 375px: без горизонтального скролу сторінки, нічого не обрізається.
- На сенсорних пристроях (`@include touch`): кнопки й поля ≥ `$touch-target` (40px), шрифт полів ≥ 16px (інакше iOS зумить сторінку при фокусі).
- Широкі таблиці загортаємо в обгортку з горизонтальним скролом (`.report__scroll`), а не дозволяємо їм розтягувати сторінку.
- 3D-в'юпорт на мобільному займає не всю висоту екрана, щоб лишалось місце прокрутити сторінку повз нього (OrbitControls забирає жести).

## Тести

Vitest, середовище `node`. Тести лежать **поряд з модулем**: `core/layout.js` → `core/layout.test.js`. Спільні дані для тестів `core/` — у `core/test-fixtures.js`, у робочий код його не імпортуємо.

- **`core/` — зміна логіки лише разом з тестом.** Новий розрахунок, перевірка (`check.*`), деталь у специфікації чи зміна формату проєкту мають супровідний тест. Виправлення бага починаємо з тесту, який цей баг відтворює.
- Числа в очікуваннях рахуємо вручну й коментуємо, звідки вони взялися (`// (600 - 4*3) / 3`), а не копіюємо з результату виконання коду.
- `core/` перевіряємо на рівні ключів (`{key, params}`), а не перекладеного тексту. Текст перевіряємо лише там, де він і є результатом (`export`, `i18n`).
- `i18n/locales.test.js` автоматично перевіряє:
  - у кожній мові ті самі ключі й ті самі `{параметри}`, що в `uk.js`;
  - кожен ключ, згаданий у коді чи `index.html` як літерал `'namespace.key'`, існує в `uk.js`.

  Ключі, що складаються динамічно (`'preset.' + id`), туди не потрапляють, тож для них потрібен окремий тест (див. пресети, типи меблів і типи зон).

- Модулі, що читають `localStorage` під час імпорту (`core/store.js`), тестуємо через `vi.stubGlobal` + `vi.resetModules()` і динамічний `import()`.
- `ui/` (jsdom) поки не налаштовано. `viewer/` юніт-тестами не покриваємо.

### E2E (Playwright)

- Тести в `e2e/*.spec.js`, конфіг `playwright.config.js`. Проєкти: `desktop` (Chromium) і `mobile` (WebKit, iPhone 13 + перевірка на 375 px). Браузери ставляться один раз: `npx playwright install chromium webkit`.
- Імпортуємо `test`/`expect` з `e2e/fixtures.js`: там мова фіксується на `uk`, а будь-яка помилка в консолі валить тест.
- Селектори — лише `id` і `data-*`. Якщо хука немає, додаємо `data-*` у шаблон, а не чіпляємось за класи чи текст.
- Очікування (габарити пресетів тощо) пишемо в тесті, а не імпортуємо з `src/`.
- `e2e/golden/` — еталонні CSV/JSON кожного пресета. Розбіжність = зміна специфікації чи формату. Якщо вона навмисна, оновлюємо еталони (`npm run test:e2e:golden`) окремим комітом.
- E2E не входять у pre-commit і `check` (довго): запускаємо `npm run check:full`.

## Модель даних проєкту

Спільні для всіх типів лише `version` і `type`; решту полів визначає тип (схема — `schema/types/<тип>.v2.schema.json`).

Шафа (`type: 'wardrobe'`):

```js
{
  version: 2,                       // версія формату (FORMAT_VERSION у core/project-format.js)
  type: 'wardrobe',
  W, H, D, plinth,                  // мм
  top?: { mount: 'between'|'over', double: boolean,     // кришка; немає поля → between, одинарна
          overhang?: { back, front, left, right } },      // виступи, мм; лише для over, немає → 0
  sections: [{
    width: number | 'auto',
    zones: [{ type: 'empty'|'shelves'|'rod'|'drawers', height: number | 'auto', count? }]
  }]
}
```

Секції йдуть зліва направо, зони — зверху вниз. `'auto'` ділить залишок порівну.

Кухня (`type: 'kitchen'`) — ряд нижніх модулів на ніжках зі спільною стільницею й цокольною планкою:

```js
{
  version: 2,
  type: 'kitchen',
  H, D, legs,                       // корпус модулів (висота без ніжок і стільниці, глибина), ніжки; мм
  worktop?: { front, left, right }, // виступи стільниці, мм; немає поля → 30 / 0 / 0. Товщина — MATERIALS.worktop.t
  modules: [{ width: number, type: 'doors'|'drawers'|'sink'|'open', count? }]  // зліва направо
}
```

Ширини модулів фіксовані (без `'auto'`), загальна ширина — їх сума. `count`: двері 1–2, ящики 1–6, полиці відкритого модуля 0–6; у модуля під мийку поля немає (двері за шириною: від 600 мм — дві).

Товщина плити `T = 16` мм (= `MATERIALS.chipboard.t`), зазор фасадів `GAP = 3` мм (`config/constants.js`).

**Геометрія = специфікація.** Кожна плита специфікації має рівно один бокс у геометрії типу (`kind: 'panel'`, той самий `key` і `mat`, розміри a × b, товщина = `MATERIALS[mat].t`); фурнітура — `kind: 'hardware'`. Це перевіряє `core/registry.test.js` для кожного пресета; на цьому тримається експорт у SketchUp/DXF.
Ключ localStorage: `lego-project` (старий `wardrobe-cfg-v1` читається з міграцією, якщо нового ще немає, і не видаляється). Цей JSON зберігають у файли, а згодом і в базу. Тому **несумісна зміна формату = нова версія + міграція в `core/project-format.js` (`MIGRATIONS`) + фікстура старого файлу в `core/fixtures/`**. Старі файли мусять відкриватися; фікстури ніколи не редагуємо. Файл без `version` — це v1 (до появи версій). Файл новішої версії, ніж знає застосунок, не відкривається (`file.tooNew`).
Пресети (`core/types/<тип>/presets.js`) зберігаються без `version`/`type`; проєкт з них робить `createProject(type, data)`.
**Офіційний опис формату — JSON Schema в `schema/`** (`project.v2.schema.json` + `types/<тип>.v2.schema.json`): її отримують бекенд і API. У застосунку той самий формат перевіряє валідатор типу (`validate` у модулі типу, загальні перевірки — `core/validate.js`). Будь-який JSON ззовні (файл, localStorage) проходить `parseProject` (`core/store.js`): міграція → валідація → нормалізація (невідомі поля відкидаються). Помилки — `{key, params, path}` (`validate.*`). Змінюєш формат — оновлюй і схему, і валідатор: `core/schema.test.js` звіряє їх на фікстурах `core/fixtures/validation/` (`valid-*` / `invalid-*`).

## Перевірка змін

1. `npm run check` проходить без помилок (lint, формат, тести, збірка).
2. Сторінка відкривається без помилок у консолі; для кожного типу меблів пресети, редагування форми, повідомлення, CSV, PNG, збереження/відкриття JSON працюють (`npm run test:e2e` покриває більшість).
3. Перевірено вигляд на десктопі та на 375px.

## Git

- Поки що вся робота йде прямо в гілці `main`, окремих гілок і PR не робимо.
- **Не комітимо й не пушимо самостійно.** Коміт і пуш — лише коли користувач прямо про це попросить.
- Повідомлення комітів: коротко, в наказовому способі, мова — українська або англійська, але однакова в межах проєкту.
