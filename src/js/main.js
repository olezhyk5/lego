// Сторінка index.html → assets/js/main.js. Запускає lego так само, як це зробив би сайт клієнта:
// через window.lego з assets/js/lego.js, без імпортів з src/js.

window.lego.createConfigurator(document.querySelector('[data-lego]'), {
  // Заголовок вкладки й мова документа — частина сторінки, а не конфігуратора
  onLocaleChange(locale, t) {
    document.documentElement.lang = locale;
    document.title = t('app.title');
  },
});
