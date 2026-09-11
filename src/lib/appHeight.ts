/**
 * `dvh` deveria bastar, mas WebKit em iOS não recalcula direito quando um
 * overlay de terceiros (ex.: banner "Traduzir página?" do Chrome) ocupa
 * espaço na viewport — sobra um vão em branco embaixo do conteúdo full-bleed
 * até a próxima navegação. `visualViewport.height` reflete a área
 * realmente visível ao vivo (é pra isso que a API existe), então usamos
 * isso pra alimentar uma custom property.
 *
 * Isso sozinho não bastou pro caso real reportado: abrir o link a partir do
 * WhatsApp faz o iOS entregar a abertura do Chrome como um "app handoff" —
 * o Chrome starta a frio no meio da transição do sistema, e a primeiríssima
 * leitura de `visualViewport.height` (mesmo via JS, na carga do documento)
 * já vem errada, medida antes da transição assentar. Como depois disso não
 * chega nenhum evento de `resize` de verdade (do ponto de vista do Chrome
 * nada mudou), o valor errado gruda. Abrir o Chrome direto (sem vir de outro
 * app) não reproduz — confirma que é o timing do handoff, não o cálculo em
 * si. Mitigação: re-medir algumas vezes nos primeiros ~2s depois da carga,
 * pra pegar o valor certo assim que a transição do SO tiver terminado,
 * mesmo sem um evento de resize disparando isso.
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
  window.addEventListener('pageshow', setAppHeight);
  document.addEventListener('visibilitychange', setAppHeight);

  const recheckDelaysMs = [100, 300, 600, 1000, 2000];
  for (const delay of recheckDelaysMs) {
    setTimeout(setAppHeight, delay);
  }
}
