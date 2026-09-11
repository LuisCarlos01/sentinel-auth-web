import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useTheme } from '../../theme/ThemeContext';

// baixo amortecimento de propósito: uma mola "dura" e crítica só puxaria reto
// de volta pro repouso; essa aqui ultrapassa o ponto de origem e oscila umas
// duas vezes antes de assentar — é isso que lê como "balanço" na volta, não
// um snap elástico
const SWING_BACK_SPRING = { type: 'spring', stiffness: 140, damping: 7 } as const;

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8l1.8-1.8M18 6l1.8-1.8" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
      <path d="M20.5 14.5a8.5 8.5 0 0 1-11-11 8.5 8.5 0 1 0 11 11Z" />
    </svg>
  );
}

interface PullCordProps {
  /** comprimento da corda em repouso, em px */
  restLength?: number;
  /** o quanto dá pra puxar pra baixo antes de bater no limite, em px */
  pullLimit?: number;
  /** o quanto dá pra puxar pros lados antes de bater no limite, em px */
  sideLimit?: number;
  /** distância puxada (linha reta) que já conta como "puxão" e troca o tema */
  toggleThreshold?: number;
  /** classe de posicionamento (fixed top-0 ... ) — cada breakpoint usa a sua */
  className?: string;
  /** pingente/corda um pouco menores pra caber numa tela estreita */
  compact?: boolean;
}

/**
 * Cordinha de abajur — puxar (arrastar o pingente além do threshold e
 * soltar) alterna claro/escuro. Compartilhada entre desktop
 * (`PillSlideDesktopCard`) e mobile (`WaveMobileCard`); cada um passa suas
 * próprias dimensões/posição via props pra caber no respectivo breakpoint.
 *
 * Encostar o cursor nela dá um "empurrão" — um balanço que nasce, decai
 * sozinho e para, como uma corda de verdade reagindo a um toque — em vez de
 * ficar balançando pra sempre enquanto o cursor fica parado em cima (isso
 * lia como travado/artificial, não como física real). Novo toque enquanto
 * ainda está balançando reinicia o impulso a partir do ângulo atual, sem
 * saltar. No touch (mobile) esse "nudge" só dispara com o próprio toque
 * inicial do arraste, já que não existe hover.
 *
 * A detecção de hover fica num wrapper de FORA que nunca se move — e o
 * balanço de toque roda só no wrapper de DENTRO, controlada por uma motion
 * value (`nudgeRotate`) animada uma vez via `animate()`, não por
 * `whileHover`. Botar o `whileHover` direto no elemento que gira é um erro
 * clássico: o balanço tira a própria caixa de baixo do cursor, dispara
 * hover-end/hover-start em loop e trava a animação em vez de balançar suave.
 *
 * O arraste é livre (x e y, não só vertical) — puxar na diagonal move o
 * pingente na diagonal de verdade. A corda (`ropeLength`/`ropeAngle`) é
 * derivada ao vivo da posição do pingente, então ela se estica e inclina
 * junto, como um cabo de verdade sendo puxado de lado. Ao soltar, em vez de
 * pular reto de volta (`dragSnapToOrigin`), animamos `x`/`y` com uma mola de
 * baixo amortecimento (`SWING_BACK_SPRING`) — ela ultrapassa o repouso e
 * balança de um lado pro outro até assentar, herdando a velocidade do gesto
 * de soltar pra continuidade.
 */
export function PullCord({
  restLength = 120,
  pullLimit = 70,
  sideLimit = 80,
  toggleThreshold = 42,
  className = 'fixed top-0 right-10 z-40 hidden h-[190px] w-12 flex-col items-center sm:flex',
  compact = false,
}: PullCordProps) {
  const { theme, toggleTheme } = useTheme();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const nudgeRotate = useMotionValue(0);
  const ropeLength = useTransform([x, y], (v) => {
    const [xv, yv] = v as number[];
    return Math.hypot(xv, restLength + yv);
  });
  const ropeAngle = useTransform([x, y], (v) => {
    const [xv, yv] = v as number[];
    // negativo de propósito: puxar o pingente pra esquerda (xv negativo) tem
    // que inclinar a corda pra esquerda também, não pro lado oposto
    return (Math.atan2(-xv, restLength + yv) * 180) / Math.PI;
  });

  const nudge = () => {
    animate(nudgeRotate, [nudgeRotate.get(), 8, -6, 4, -2, 0], { duration: 1.1, ease: 'easeOut' });
  };

  const knobSize = compact ? 'h-7 w-7' : 'h-8 w-8';
  const acornSize = compact ? 'h-5 w-5' : 'h-6 w-6';

  return (
    <div className={className} onMouseEnter={nudge}>
      <motion.div
        className="flex flex-col items-center"
        style={{ transformOrigin: 'top center', rotate: nudgeRotate }}
      >
        {/* corda: acompanha a posição do pingente (comprimento + ângulo ao
            vivo), em vez de só esticar na vertical */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none w-[3px] origin-top rounded-full bg-gradient-to-b from-zinc-400/70 to-zinc-400/40"
          style={{ height: ropeLength, rotate: ropeAngle }}
        />
        <motion.div
          role="button"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title="Pull to switch theme"
          drag
          dragConstraints={{ left: -sideLimit, right: sideLimit, top: 0, bottom: pullLimit }}
          dragElastic={0.15}
          dragMomentum={false}
          onDragStart={nudge}
          onDragEnd={(_, info) => {
            if (Math.hypot(info.offset.x, info.offset.y) > toggleThreshold) toggleTheme();
            animate(x, 0, { ...SWING_BACK_SPRING, velocity: info.velocity.x });
            animate(y, 0, { ...SWING_BACK_SPRING, velocity: info.velocity.y });
          }}
          style={{ x, y }}
          whileHover={{ scale: 1.08 }}
          className={`pointer-events-auto flex ${knobSize} cursor-grab flex-col items-center active:cursor-grabbing`}
        >
          {/* pingente: capuz neutro + "acorn" num tom neutro (fica visível tanto
              em cima do painel colorido quanto do escuro/claro), com um anel na
              cor de destaque — é essa cor que sempre aparece na ponta,
              independente de que lado do slide/tela a cordinha está pendurada */}
          <span className="-mb-1 h-2 w-2 rounded-t-full border border-b-0 border-zinc-500 bg-zinc-200" />
          <span
            className={`flex ${acornSize} items-center justify-center rounded-full border-2 bg-zinc-100 text-zinc-800 shadow-[0_0_10px_2px_var(--accent)]`}
            style={{ borderColor: 'var(--accent)' }}
          >
            {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}
