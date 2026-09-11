import { AnimatePresence, animate, motion, useMotionTemplate, useMotionValue } from 'motion/react';
import { useRef } from 'react';
import type { AuthCardState } from '../../auth/useAuthCardState';
import { useTheme } from '../../theme/ThemeContext';
import logoLogin from '../../assets/logo-login.png';
import { AuthCta } from './AuthCta';
import { AuthFields } from './AuthFields';
import { CONTENT_ENTER_TRANSITION, CONTENT_EXIT_TRANSITION, PILL_SLIDE_TRANSITION } from './motionConfig';
import { PullCord } from './PullCord';

const REVEAL_SPRING = { type: 'spring', stiffness: 220, damping: 26 } as const;

/**
 * A logo fica escondida no painel colorido — só aparece dentro de um círculo
 * que segue o cursor, como se o mouse "revelasse" o que tem por trás. Usa
 * `mask-image` (radial-gradient acompanhando o cursor via motion values, sem
 * re-render do React a cada mousemove) em vez de opacity, pra não vazar um
 * "fantasma" da logo fora do círculo.
 */
function SpotlightLogo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const radius = useMotionValue(0);
  const maskImage = useMotionTemplate`radial-gradient(${radius}px circle at ${mouseX}px ${mouseY}px, black 35%, transparent 75%)`;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      onMouseMove={(e) => {
        const rect = containerRef.current!.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
      }}
      onMouseEnter={() => {
        // raio proporcional à largura do painel — num desktop grande o
        // painel é bem mais largo que num tablet, então um raio fixo ficava
        // pequeno demais lá e grande demais aqui
        const panelWidth = containerRef.current?.getBoundingClientRect().width ?? 300;
        const target = Math.max(160, Math.min(320, panelWidth * 0.28));
        animate(radius, target, REVEAL_SPRING);
      }}
      onMouseLeave={() => animate(radius, 0, REVEAL_SPRING)}
    >
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center"
        style={{ maskImage, WebkitMaskImage: maskImage }}
      >
        <img src={logoLogin} alt="" className="h-[65%] w-[65%] object-contain opacity-90" />
      </motion.div>
    </div>
  );
}

const COPY = {
  login: {
    headline: 'WELCOME BACK!',
    body: 'Sign in to keep an eye on your Sentinel account.',
  },
  register: {
    headline: 'WELCOME!',
    body: 'Create an account to get started with Sentinel.',
  },
};

/**
 * Mecânica confirmada frame a frame numa gravação de referência (desktop/
 * tablet, ver handoff): não é um clip-path diagonal — é uma cápsula
 * arredondada, com raio de borda próprio, que desliza de um lado pro outro
 * encolhendo levemente no meio do trajeto. O conteúdo de cada lado troca só
 * quando a cápsula já está cobrindo aquele ponto (por isso some rápido e só
 * reaparece perto do fim do slide).
 */
export function PillSlideDesktopCard({ state }: { state: AuthCardState }) {
  const { mode, submit } = state;
  const copy = COPY[mode];
  const { theme } = useTheme();

  return (
    <div className="relative min-h-svh w-full overflow-hidden bg-[var(--form-panel)]">
      <PullCord />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`form-${mode}`}
          className="absolute inset-y-0 z-10 flex w-1/2 items-center justify-center px-[6%] sm:px-[8%]"
          style={{ left: mode === 'login' ? '0%' : '50%' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: CONTENT_ENTER_TRANSITION }}
          exit={{ opacity: 0, transition: CONTENT_EXIT_TRANSITION }}
        >
          <form
            className="w-full max-w-xs text-[var(--form-foreground)] sm:max-w-sm lg:max-w-md"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div className="mb-8 flex flex-col items-center lg:mb-10">
              <img src={logoLogin} alt="Sentinel" className="h-12 w-12 object-contain sm:h-14 sm:w-14 lg:h-16 lg:w-16" />
              <span
                className="mt-2 text-xs font-bold tracking-[0.3em] text-[var(--accent)] sm:text-sm sm:tracking-[0.35em] lg:text-base"
                style={{ fontFamily: 'var(--font-wordmark)' }}
              >
                SENTINEL
              </span>
            </div>
            <h2 className="mb-6 text-xl font-semibold sm:text-2xl lg:text-3xl">
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </h2>
            <AuthFields state={state} formTone={theme} />
            <AuthCta state={state} formTone={theme} />
          </form>
        </motion.div>
      </AnimatePresence>

      <motion.div
        className="absolute inset-y-0 z-20 w-1/2 bg-[var(--accent)]"
        animate={{
          left: mode === 'login' ? '50%' : '0%',
          scale: [1, 0.985, 1],
        }}
        transition={PILL_SLIDE_TRANSITION}
      >
        <SpotlightLogo />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`accent-${mode}`}
            className="relative pointer-events-none flex h-full flex-col items-center justify-center px-[8%] text-center text-[var(--accent-foreground)] sm:px-[10%]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: CONTENT_ENTER_TRANSITION }}
            exit={{ opacity: 0, transition: CONTENT_EXIT_TRANSITION }}
          >
            <h2 className="mb-3 text-2xl font-bold sm:text-3xl lg:text-4xl xl:text-5xl">{copy.headline}</h2>
            <p className="max-w-[220px] text-xs opacity-90 sm:max-w-xs sm:text-sm lg:max-w-sm lg:text-base">{copy.body}</p>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
