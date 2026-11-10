// Коротке повідомлення внизу екрана. Одне на екземпляр (data-ref="toast").
/** @param {HTMLElement} el */
export function createToast(el) {
  let timer;

  /** @param {string} msg уже перекладений текст */
  function toast(msg) {
    el.textContent = msg;
    el.classList.add('is-visible');
    clearTimeout(timer);
    timer = setTimeout(() => el.classList.remove('is-visible'), 1800);
  }

  // Таймер не переживає знищення екземпляра
  toast.dispose = () => clearTimeout(timer);
  return toast;
}
