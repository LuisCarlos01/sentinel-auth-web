import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState } from 'react';
import type { AuthCardState } from '../../auth/useAuthCardState';
import { useTheme } from '../../theme/ThemeContext';
import logoLogin from '../../assets/logo-login.png';
import { AuthCta } from './AuthCta';
import { AuthFields } from './AuthFields';
import { CONTENT_EXIT_TRANSITION, MOBILE_CONTENT_ENTER_TRANSITION, WAVE_TRANSITION } from './motionConfig';
import { PullCord } from './PullCord';

const COPY = {
  login: { headline: 'WELCOME BACK!', body: 'Sign in to keep an eye on your Sentinel account.' },
  register: { headline: 'WELCOME!', body: 'Create an account to get started with Sentinel.' },
};

/**
 * Mecânica confirmada frame a frame numa gravação de referência (mobile, ver
 * handoff): a cor cobre a tela inteira e depois recua para uma faixa
 * ondulada grudada no fundo, revelando o form. Reaproveitamos as duas
 * pontas dessa animação (cheio / recuado) como os dois extremos do toggle
 * login↔register.
 *
 * A mensagem de boas-vindas não pisca em tela cheia durante a transição —
 * fica fixa perto da borda inferior da própria onda (que é sempre `bottom:0`,
 * então essa borda não se move mesmo quando a onda cresce pra tela cheia),
 * então ela permanece legível tanto em repouso (crista de 16%) quanto
 * durante o flash do toggle.
 */
export function WaveMobileCard({ state }: { state: AuthCardState }) {
  const { mode, submit } = state;
  const copy = COPY[mode];
  const { theme } = useTheme();

  // A Motion reproduz o array de keyframes assim que o elemento monta, não só
  // quando o `mode` muda de verdade — sem essa guarda a onda nasceria cobrindo
  // a tela por uma fração de segundo no load inicial. Só liga o keyframe depois
  // do primeiro toggle real (padrão de "derivar estado durante o render").
  const [hasToggled, setHasToggled] = useState(false);
  const prevModeRef = useRef(mode);
  if (prevModeRef.current !== mode) {
    prevModeRef.current = mode;
    if (!hasToggled) setHasToggled(true);
  }

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-[var(--form-panel)]">
      {/* mesma cordinha do desktop, só que compacta e ancorada mais perto da
          borda — a tela é bem mais estreita, então a corda de repouso e o
          alcance do arraste também encolhem, senão o pingente esbarraria
          fora da área visível em telas pequenas */}
      <PullCord
        restLength={70}
        pullLimit={50}
        sideLimit={45}
        toggleThreshold={30}
        compact
        className="fixed top-0 right-4 z-40 flex h-[110px] w-9 flex-col items-center"
      />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`form-${mode}`}
          className="relative z-10 flex min-h-dvh flex-col justify-center px-6 py-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: MOBILE_CONTENT_ENTER_TRANSITION }}
          exit={{ opacity: 0, transition: CONTENT_EXIT_TRANSITION }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div className="mb-6 flex flex-col items-center">
              <img src={logoLogin} alt="Sentinel" className="h-16 w-16 object-contain" />
              <span
                className="mt-2 text-sm font-bold tracking-[0.35em] text-[var(--accent)]"
                style={{ fontFamily: 'var(--font-wordmark)' }}
              >
                SENTINEL
              </span>
            </div>
            <h3 className="mb-5 text-lg font-semibold text-[var(--form-foreground)]">
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </h3>
            <AuthFields state={state} formTone={theme} />
            <AuthCta state={state} formTone={theme} />
          </form>
        </motion.div>
      </AnimatePresence>

      {/* Onda: elipse achatada mais larga que o card — só a "crista" fica
          visível dentro do overflow-hidden, criando o efeito de colina. */}
      <motion.div
        key={mode}
        className="pointer-events-none absolute inset-x-[-25%] bottom-0 z-20 flex justify-center rounded-t-[100%] bg-[var(--accent)]"
        initial={{ height: '16%' }}
        animate={{ height: hasToggled ? ['16%', '145%', '16%'] : '16%' }}
        transition={WAVE_TRANSITION}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            className="absolute bottom-6 w-1/2 min-w-[220px] text-center text-[var(--accent-foreground)]"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <h2 className="text-sm font-bold">{copy.headline}</h2>
            <p className="mt-1 text-[11px] opacity-90">{copy.body}</p>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
