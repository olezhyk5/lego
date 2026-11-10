// Бандл конфігуратора → assets/js/lego.js. Сторінка (сайт клієнта чи index.html) підключає його
// й запускає екземпляр: window.lego.createConfigurator(root, options) — див. app/configurator.js.
import { createConfigurator } from './app/configurator.js';

window.lego = { createConfigurator };
