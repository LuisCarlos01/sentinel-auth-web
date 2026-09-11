import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import type { AuthCardState } from '../../auth/useAuthCardState';
import { OAuthButtons } from './OAuthButtons';

// o desvio vertical é bem mais curto que o horizontal de propósito — o botão
// é `w-full` e fica coladinho embaixo do campo de senha, então um desvio
// vertical grande o levava a cobrir o input e bloquear o clique nele
const MAX_DODGE_X = 160;
const MAX_DODGE_Y = 20;
// raio de segurança: enquanto o cursor estiver mais perto do que isso do
// centro do botão, ele é empurrado pra fora — contínuo, não só ao "entrar",
// então o cursor nunca chega a ficar de fato sobre o botão
const SAFE_RADIUS = 120;
const PUSH_MARGIN = 30;
const DODGE_TRANSITION = { type: 'spring', stiffness: 500, damping: 24 } as const;

/**
 * Easter egg pedido: no mouse (desktop), se a senha ainda não foi digitada,
 * é pra ser IMPOSSÍVEL o cursor chegar sobre o botão — não só "difícil".
 * Duas camadas de garantia:
 * 1. Foge continuamente por proximidade (`pointermove` na janela inteira,
 *    não só `pointerenter` no próprio botão) — ele já começa a se afastar
 *    antes do cursor chegar perto o suficiente pra tocar.
 * 2. `pointer-events-none` como rede de segurança: mesmo que o cursor
 *    consiga alcançar o retângulo dele num salto muito rápido, o clique
 *    simplesmente não registra ali enquanto a senha estiver vazia.
 * Um "cabo" (linha) liga o botão de volta à posição de origem, pra deixar
 * claro que ele está preso ali, só esticando, não teleportando. Some (cabo e
 * desvio) assim que a senha é preenchida. Ignorado em touch
 * (`pointerType !== 'mouse'`), então não afeta mobile.
 */
export function AuthCta({
  state,
  formTone = 'dark',
}: {
  state: AuthCardState;
  formTone?: 'dark' | 'light';
}) {
  const { mode, toggleMode, form, pending, formError, notice } = state;
  const isDark = formTone === 'dark';
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dodgeRef = useRef({ x: 0, y: 0 });
  const [dodge, setDodge] = useState({ x: 0, y: 0 });
  const passwordEmpty = form.password.trim().length === 0;
  const disabled = passwordEmpty || pending;

  useEffect(() => {
    if (!passwordEmpty) {
      dodgeRef.current = { x: 0, y: 0 };
      setDodge({ x: 0, y: 0 });
    }
  }, [passwordEmpty]);

  useEffect(() => {
    if (!passwordEmpty) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || !buttonRef.current) return;

      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      let dx = centerX - e.clientX;
      let dy = centerY - e.clientY;
      let distance = Math.hypot(dx, dy);
      if (distance >= SAFE_RADIUS) return;
      // cursor caiu bem em cima do centro (vetor de fuga indefinido) — foge
      // numa direção aleatória em vez de ficar parado
      if (distance < 1) {
        const angle = Math.random() * Math.PI * 2;
        dx = Math.cos(angle);
        dy = Math.sin(angle);
        distance = 1;
      }

      const dirX = dx / distance;
      const dirY = dy / distance;
      const targetCenterX = e.clientX + dirX * (SAFE_RADIUS + PUSH_MARGIN);
      const targetCenterY = e.clientY + dirY * (SAFE_RADIUS + PUSH_MARGIN);

      const next = {
        x: Math.max(
          -MAX_DODGE_X,
          Math.min(MAX_DODGE_X, dodgeRef.current.x + (targetCenterX - centerX)),
        ),
        y: Math.max(
          -MAX_DODGE_Y,
          Math.min(MAX_DODGE_Y, dodgeRef.current.y + (targetCenterY - centerY)),
        ),
      };
      dodgeRef.current = next;
      setDodge(next);
    };

    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [passwordEmpty]);

  const cableLength = Math.hypot(dodge.x, dodge.y);
  const cableAngle = (Math.atan2(dodge.y, dodge.x) * 180) / Math.PI;

  return (
    <>
      {(formError ?? notice) && (
        <p className={`mt-4 text-xs ${formError ? 'text-red-500' : 'text-[var(--accent)]'}`}>
          {formError ?? notice}
        </p>
      )}

      <div className="relative mt-6">
        {/* cabo: liga o botão de volta à posição de origem enquanto ele foge */}
        {cableLength > 0 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 z-0 h-[2px] origin-left rounded-full bg-zinc-600"
            style={{ width: cableLength, transform: `translateY(-50%) rotate(${cableAngle}deg)` }}
          >
            <span className="absolute -top-[3px] -left-1 h-2 w-2 rounded-full bg-zinc-500" />
          </div>
        )}

        <motion.button
          ref={buttonRef}
          type="submit"
          animate={{ x: dodge.x, y: dodge.y }}
          transition={DODGE_TRANSITION}
          className={`relative z-10 w-full rounded-full bg-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-60 ${passwordEmpty ? 'pointer-events-none' : ''}`}
          disabled={disabled}
        >
          {pending ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Sign up'}
        </motion.button>
      </div>

      <div
        className={`my-4 flex items-center gap-3 text-[10px] uppercase tracking-wide ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}
      >
        <span className={`h-px flex-1 ${isDark ? 'bg-zinc-700' : 'bg-zinc-300'}`} />
        or continue with
        <span className={`h-px flex-1 ${isDark ? 'bg-zinc-700' : 'bg-zinc-300'}`} />
      </div>

      <OAuthButtons formTone={formTone} />

      <button
        type="button"
        onClick={toggleMode}
        className={`mt-4 text-xs underline-offset-2 hover:underline ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}
      >
        {mode === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Sign in'}
      </button>
    </>
  );
}
