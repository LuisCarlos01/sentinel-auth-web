import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useAuthCardState } from '../auth/useAuthCardState';
import { MobileIntro } from '../components/auth/MobileIntro';
import { PillSlideDesktopCard } from '../components/auth/PillSlideDesktopCard';
import { WaveMobileCard } from '../components/auth/WaveMobileCard';
import { useMediaQuery } from '../lib/useMediaQuery';

// mesmo breakpoint do `sm` do Tailwind, usado antes via CSS pra alternar os
// dois cards — trocado por matchMedia pra montar só um card por vez (o
// outro nunca fica no DOM, evitando campos de formulário duplicados)
const DESKTOP_QUERY = '(min-width: 640px)';

export function AuthPage() {
  const { status } = useAuth();
  const state = useAuthCardState();
  const [showIntro, setShowIntro] = useState(true);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);

  if (status === 'authenticated') return <Navigate to="/" replace />;

  if (isDesktop) return <PillSlideDesktopCard state={state} />;

  return (
    <>
      {showIntro && <MobileIntro onComplete={() => setShowIntro(false)} />}
      <WaveMobileCard state={state} />
    </>
  );
}
