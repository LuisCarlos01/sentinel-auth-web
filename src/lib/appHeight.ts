/**
 * Bug real, confirmado num iPhone: abrir o link a partir do WhatsApp (app-to-app
 * handoff pro Chrome, que no iOS roda sobre o mesmo motor WebKit do Safari) faz
 * `visualViewport.height`/`dvh` reportarem uma altura menor que a área
 * realmente visível — sobra um vão em branco embaixo do conteúdo full-bleed.
 * Confirmado também que **rolar a página corrige na hora**: é o WebKit
 * recalculando a viewport ao vivo, só que só faz isso mediante um evento de
 * scroll de verdade — carregar direto pelo Chrome (sem vir de outro app) nunca
 * reproduz, porque nesse caminho o WebKit já inicializa com o valor certo.
 *
 * Em vez de depender do usuário rolar (ou de esperar), forçamos esse
 * recálculo nós mesmos com um "chute" de scroll de 1px assim que a página
 * monta — de baixo overhead e sem delay perceptível, mas o suficiente pra
 * fazer o WebKit assentar a métrica certa antes do usuário notar qualquer
 * coisa errada.
 */
export function initAppHeightVar() {
  const setAppHeight = () => {
    const height = window.visualViewport?.height ?? window.innerHeight;
    document.documentElement.style.setProperty('--app-height', `${height}px`);
  };

  setAppHeight();

  const kickScroll = () => {
    window.scrollTo(0, 1);
    window.scrollTo(0, 0);
    setAppHeight();
  };

  // dois rAF em sequência: garante que já passou por um frame pintado com o
  // conteúdo real montado antes do "chute" — chutar cedo demais (documento
  // ainda vazio) não tem efeito no recálculo do WebKit.
  requestAnimationFrame(() => requestAnimationFrame(kickScroll));

  window.visualViewport?.addEventListener('resize', setAppHeight);
  window.addEventListener('resize', setAppHeight);
  window.addEventListener('orientationchange', setAppHeight);
  window.addEventListener('pageshow', setAppHeight);
  document.addEventListener('visibilitychange', setAppHeight);
}
