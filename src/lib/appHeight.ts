/**
 * `dvh` deveria bastar, mas WebKit em iOS não recalcula direito quando um
 * overlay de terceiros (ex.: banner "Traduzir página?" do Chrome) ocupa
 * espaço na viewport — sobra um vão em branco embaixo do conteúdo full-bleed
 * até a próxima navegação. `visualViewport.height` reflete a área
 * realmente visível ao vivo (é pra isso que a API existe), então usamos
 * isso pra alimentar uma custom property e ficamos imunes a esse tipo de
 * descompasso, venha de onde vier.
 */
export function initAppHeightVar() {
  const setAppHeight = () => {
    const height = window.visualViewport?.height ?? window.innerHeight;
    document.documentElement.style.setProperty('--app-height', `${height}px`);
  };

  setAppHeight();
  window.visualViewport?.addEventListener('resize', setAppHeight);
  window.addEventListener('resize', setAppHeight);
  window.addEventListener('orientationchange', setAppHeight);
}
