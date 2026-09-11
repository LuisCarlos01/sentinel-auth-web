import type { Transition } from 'motion/react';

// Desktop/tablet: painel accent é uma "cápsula" arredondada que desliza de
// um lado pro outro, encolhendo levemente no meio do trajeto (não é um clip
// diagonal — o painel tem raio de borda próprio, independente do card).
export const PILL_SLIDE_TRANSITION: Transition = {
  duration: 0.6,
  times: [0, 0.5, 1],
  ease: 'easeInOut',
};

// Conteúdo (desktop): some rápido ao trocar, só reaparece perto do fim do
// slide — no vídeo de referência o texto não fica visível sendo coberto
// pela cápsula em trânsito.
export const CONTENT_EXIT_TRANSITION: Transition = {
  duration: 0.12,
  ease: 'easeIn',
};

export const CONTENT_ENTER_TRANSITION: Transition = {
  duration: 0.2,
  delay: 0.35,
  ease: 'easeOut',
};

// Mobile: a cor cobre a tela inteira (com o headline "welcome" central) e
// recua para uma faixa ondulada no fundo, revelando o form embaixo.
export const WAVE_TRANSITION: Transition = {
  duration: 0.8,
  times: [0, 0.5, 1],
  ease: 'easeInOut',
};

// Conteúdo do form no mobile — mesma ideia do desktop (some rápido, só
// reaparece perto do fim), com delay maior porque o WAVE_TRANSITION dura mais.
export const MOBILE_CONTENT_ENTER_TRANSITION: Transition = {
  duration: 0.25,
  delay: 0.5,
  ease: 'easeOut',
};
