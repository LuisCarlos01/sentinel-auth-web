import gsap from 'gsap';
import { useLayoutEffect, useRef } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import circuitBackgroundDark from '../../assets/fundo.png';
import circuitBackgroundLight from '../../assets/fundo-claro.png';
import logoBackground from '../../assets/logo-background.png';
import logoLogin from '../../assets/logo-login.png';

const ACCENT = '#0e96b5';

// Pulsos de energia percorrendo trilhas aproximadas dos circuitos visíveis
// no fundo (`fundo.png`) — cada um nasce, viaja de `from` até `to` e some,
// em loop com uma pausa entre ciclos, simulando corrente passando pelo fio.
const CIRCUIT_SPARKS = [
  { from: { left: '12%', top: '14%' }, to: { left: '12%', top: '30%' }, duration: 1.6, delay: 0, repeatDelay: 1.2 },
  { from: { left: '70%', top: '3%' }, to: { left: '70%', top: '15%' }, duration: 1.2, delay: 0.5, repeatDelay: 1.6 },
  { from: { left: '5%', top: '50%' }, to: { left: '24%', top: '62%' }, duration: 1.9, delay: 0.9, repeatDelay: 1 },
  { from: { left: '93%', top: '46%' }, to: { left: '78%', top: '57%' }, duration: 1.7, delay: 1.2, repeatDelay: 1.3 },
  { from: { left: '23%', top: '69%' }, to: { left: '23%', top: '82%' }, duration: 1.4, delay: 0.3, repeatDelay: 1.5 },
  { from: { left: '59%', top: '81%' }, to: { left: '59%', top: '95%' }, duration: 1.3, delay: 0.7, repeatDelay: 1.4 },
  { from: { left: '80%', top: '64%' }, to: { left: '64%', top: '78%' }, duration: 1.7, delay: 1.4, repeatDelay: 1.1 },
];

// Campo de partículas espalhadas pela tela toda (como o rastro de
// estrelas/partículas do vídeo de referência, estendendo além da própria
// logo) — posições fixas (não Math.random a cada render) pra não reamostrar
// em re-renders.
const STARS = [
  { x: '12%', y: '18%', size: 2, delay: 0 },
  { x: '85%', y: '14%', size: 3, delay: 0.1 },
  { x: '22%', y: '9%', size: 2, delay: 0.25 },
  { x: '70%', y: '24%', size: 2, delay: 0.05 },
  { x: '90%', y: '32%', size: 2, delay: 0.3 },
  { x: '8%', y: '38%', size: 3, delay: 0.15 },
  { x: '48%', y: '10%', size: 2, delay: 0.35 },
  { x: '78%', y: '42%', size: 2, delay: 0.2 },
  { x: '15%', y: '55%', size: 2, delay: 0.4 },
  { x: '92%', y: '58%', size: 3, delay: 0.08 },
  { x: '35%', y: '15%', size: 2, delay: 0.28 },
  { x: '60%', y: '8%', size: 2, delay: 0.18 },
  { x: '5%', y: '25%', size: 2, delay: 0.32 },
  { x: '95%', y: '20%', size: 2, delay: 0.12 },
  { x: '25%', y: '62%', size: 2, delay: 0.22 },
];

/**
 * Intro mobile — roda uma vez ao montar a página, sobre o WaveMobileCard já
 * montado (e em repouso) por baixo. Fundo é a imagem de circuito
 * (`fundo.png` no escuro, `fundo-claro.png` no claro — segue o mesmo
 * `ThemeContext` que o resto do app), com pulsos de energia percorrendo as
 * trilhas em loop. A base sólida por trás da imagem (`baseRef`) também
 * acompanha o tema, pra não haver flash da cor errada enquanto a imagem
 * carrega.
 *
 * Coreografia: campo de partículas acende, a logo (imagem oficial — já traz
 * o próprio brilho embutido) entra com um flare e assenta. Só depois que essa
 * animação inicial termina por completo (logo já sumiu) é que a cúpula entra
 * em cena: a logo some, um feixe de luz vertical sobe do centro dela até o
 * topo da tela e, ao chegar lá, a cúpula (mesma silhueta da onda do card, só
 * que ancorada no topo em vez do rodapé) nasce cobrindo o essencial da tela —
 * sem pausar cheia — e já emenda direto no recolhimento pra uma faixa
 * ancorada no rodapé (mesma forma/posição da onda de repouso do card por
 * baixo), num movimento único e contínuo, com um trilho de circuito
 * decorativo correndo na borda de avanço. Conforme essa faixa desce até sua
 * posição de origem, a seção de login/cadastro
 * vai aparecendo de cima pra baixo, de forma fluida e contínua (não é um
 * corte/dissolve único no final).
 */
export function MobileIntro({ onComplete }: { onComplete: () => void }) {
  const { theme } = useTheme();
  const circuitBackground = theme === 'light' ? circuitBackgroundLight : circuitBackgroundDark;
  // no escuro usa a imagem com fundo próprio (fica como uma "placa"); no
  // claro essa mesma imagem deixaria uma caixa escura feia por cima do fundo
  // claro, então troca pra variante transparente (sem fundo embutido)
  const markSrc = theme === 'light' ? logoLogin : logoBackground;
  const rootRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLImageElement>(null);
  const sparksRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLImageElement>(null);
  const glowRef = useRef<HTMLImageElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const domeRef = useRef<HTMLDivElement>(null);
  const waveRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const stars = starsRef.current ? Array.from(starsRef.current.children) : [];

      // pulsos de energia: cada um é um loop independente e infinito (nasce,
      // viaja, some, pausa, repete) — por isso vive fora da timeline
      // principal (que é finita), mas dentro do mesmo contexto pra ser
      // limpo junto quando o intro desmonta
      const sparkEls = sparksRef.current ? Array.from(sparksRef.current.children) : [];
      sparkEls.forEach((el, i) => {
        const spark = CIRCUIT_SPARKS[i];
        gsap.set(el, { ...spark.from, opacity: 0 });
        gsap
          .timeline({ repeat: -1, delay: spark.delay, repeatDelay: spark.repeatDelay })
          .to(el, { opacity: 1, duration: 0.15 })
          .to(el, { ...spark.to, duration: spark.duration, ease: 'power1.inOut' }, '<')
          .to(el, { opacity: 0, duration: 0.15 }, '-=0.15')
          .set(el, { ...spark.from });
      });

      gsap
        .timeline({ defaults: { ease: 'power2.out' }, onComplete })
        .set(markRef.current, { scale: 0.75, opacity: 0, transformOrigin: '50% 50%' })
        .set(glowRef.current, { opacity: 0, scale: 0.9, transformOrigin: '50% 50%' })
        .set(beamRef.current, { height: 0, opacity: 0.9 })
        .set(flashRef.current, { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' })
        .set(domeRef.current, { height: '0%' })
        .set(waveRef.current, { height: '0%' })
        .set(stars, { opacity: 0, scale: 0 })
        // 0. campo de partículas acende, espalhado, antes da logo aparecer
        .to(stars, { opacity: 1, scale: 1, duration: 0.5, stagger: { each: 0.025, from: 'random' } }, 0)
        // 1. flare de brilho anuncia a logo, que entra em seguida e assenta
        //    com um micro overshoot (a imagem já traz anéis + brilho prontos)
        .to(glowRef.current, { opacity: 0.8, scale: 1.15, duration: 0.4, ease: 'power1.out' }, 0.15)
        .to(markRef.current, { opacity: 1, scale: 1, duration: 0.9, ease: 'back.out(1.5)' }, '<0.1')
        .to(glowRef.current, { opacity: 0.35, scale: 1, duration: 0.6, ease: 'power1.out' }, '<')
        .to({}, { duration: 0.3 })
        // 2. a logo some e um feixe de luz sobe do centro dela até o topo
        .addLabel('vanish')
        .to([markRef.current, glowRef.current], { opacity: 0, scale: 0.85, duration: 0.35, ease: 'power1.in' }, 'vanish')
        .to(beamRef.current, { height: '50%', duration: 0.55, ease: 'power2.in' }, 'vanish+=0.1')
        // flash quando o feixe "bate" no topo
        .to(flashRef.current, { opacity: 1, scale: 1, duration: 0.18, ease: 'power1.out' }, 'vanish+=0.6')
        .to(flashRef.current, { opacity: 0, scale: 1.6, duration: 0.35, ease: 'power1.out' }, '>')
        .to(beamRef.current, { opacity: 0, duration: 0.25 }, '<')
        .to(stars, { opacity: 0, duration: 0.25 }, '<')
        .to(sparksRef.current, { opacity: 0, duration: 0.25 }, '<')
        // 3. só depois que a animação inicial (partículas/logo/feixe) já
        //    sumiu por completo é que a cúpula nasce do topo — cobre rápido
        //    o essencial pra esconder o corte de fundo e, sem pausa estática,
        //    já emenda direto no recolhimento: um movimento contínuo só, sem
        //    "segurar" a tela cheia no meio do caminho
        .addLabel('dome')
        .to(domeRef.current, { height: '150%', duration: 0.7, ease: 'power1.inOut' }, 'dome')
        // troca a cúpula (ancorada no topo) pela faixa do rodapé assim que a
        // cobertura fica total — as duas coincidem na mesma cor sólida, sem
        // corte visível na troca
        .addLabel('handoff', 'dome+=0.7')
        .set(waveRef.current, { height: '150%' }, 'handoff')
        .set(domeRef.current, { opacity: 0 }, 'handoff')
        // some o fundo de circuito e o que sobrou dos efeitos — só a faixa
        // colorida segue visível a partir daqui
        .to([baseRef.current, bgRef.current], { opacity: 0, duration: 0.2 }, 'handoff')
        // 4. a faixa recolhe devagar até a posição de repouso (mesma forma
        //    da onda real do card por baixo), emendando direto na descida —
        //    conforme ela desce, o form vai aparecendo de cima pra baixo,
        //    de forma fluida e contínua, num só movimento
        .to(waveRef.current, { height: '16%', duration: 1.4, ease: 'power2.inOut' }, 'handoff');
    }, rootRef);

    return () => ctx.revert();
  }, [onComplete]);

  return (
    <div ref={rootRef} className="pointer-events-none fixed inset-x-0 top-0 z-50 h-dvh overflow-hidden">
      {/* base sólida sempre opaca desde o primeiro frame — a imagem de fundo
          (2MB+) leva um instante pra carregar/decodificar, e sem essa base o
          card real (já montado atrás, com a onda de repouso visível) vaza
          por trás enquanto o <img> ainda está transparente */}
      <div ref={baseRef} className={`absolute inset-0 ${theme === 'light' ? 'bg-white' : 'bg-black'}`} />
      <img ref={bgRef} src={circuitBackground} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />

      <div ref={sparksRef} className="absolute inset-0 z-[6]">
        {CIRCUIT_SPARKS.map((_spark, i) => (
          <div
            key={i}
            className="absolute h-2.5 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ backgroundColor: ACCENT, boxShadow: `0 0 8px 2px ${ACCENT}` }}
          />
        ))}
      </div>

      <div ref={starsRef} className="absolute inset-0 z-10">
        {STARS.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: star.x,
              top: star.y,
              width: star.size,
              height: star.size,
              backgroundColor: ACCENT,
              boxShadow: `0 0 6px ${ACCENT}`,
            }}
          />
        ))}
      </div>

      {/* feixe: sobe do centro da logo (viewport center) até o topo */}
      <div
        ref={beamRef}
        className="absolute bottom-1/2 left-1/2 z-20 w-[3px] -translate-x-1/2"
        style={{ backgroundColor: ACCENT, boxShadow: `0 0 16px 3px ${ACCENT}` }}
      />
      {/* flash quando o feixe bate no topo */}
      <div
        ref={flashRef}
        className="absolute top-0 left-1/2 z-20 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ backgroundColor: ACCENT, filter: 'blur(20px)' }}
      />

      {/* cúpula: nasce ancorada no topo (silhueta invertida da onda do card)
          e cresce pra baixo, cobrindo a tela devagar */}
      <div ref={domeRef} className="absolute inset-x-[-25%] top-0 z-20 overflow-hidden rounded-b-[100%]" style={{ backgroundColor: ACCENT }}>
        {/* trilho de circuito decorativo na borda de avanço (acompanha a cúpula) */}
        <div className="absolute inset-x-0 bottom-0 flex h-6 items-end justify-around px-[15%] opacity-80">
          {[10, 22, 14, 28, 16, 24, 12].map((h, i) => (
            <span
              key={i}
              className="w-px rounded-full bg-white"
              style={{ height: h, boxShadow: '0 0 6px 1px rgba(255,255,255,0.9)' }}
            />
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white" style={{ boxShadow: '0 0 8px 2px rgba(255,255,255,0.9)' }} />
      </div>

      {/* faixa de repouso: recebe o bastão da cúpula já com cobertura total
          e recolhe devagar até a mesma forma/posição da onda real do card */}
      <div ref={waveRef} className="absolute inset-x-[-25%] bottom-0 z-20 rounded-t-[100%]" style={{ backgroundColor: ACCENT }} />

      <div className="absolute inset-0 z-30 flex items-center justify-center">
        <img
          ref={glowRef}
          src={markSrc}
          alt=""
          aria-hidden="true"
          className={`absolute h-56 w-56 ${theme === 'light' ? 'object-contain' : 'rounded-2xl object-cover'}`}
          style={{ filter: 'blur(18px) brightness(1.6)' }}
        />
        <img
          ref={markRef}
          src={markSrc}
          alt="Sentinel"
          className={`relative h-56 w-56 ${theme === 'light' ? 'object-contain' : 'rounded-2xl object-cover'}`}
        />
      </div>
    </div>
  );
}
