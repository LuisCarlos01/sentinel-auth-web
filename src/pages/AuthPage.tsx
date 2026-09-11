import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useAuthCardState } from '../auth/useAuthCardState';
import { MobileIntro } from '../components/auth/MobileIntro';
import { PillSlideDesktopCard } from '../components/auth/PillSlideDesktopCard';
import { WaveMobileCard } from '../components/auth/WaveMobileCard';

export function AuthPage() {
  const { status } = useAuth();
  const state = useAuthCardState();
  const [showIntro, setShowIntro] = useState(true);

  if (status === 'authenticated') return <Navigate to="/" replace />;

  return (
    <>
      <div className="sm:hidden">
        {showIntro && <MobileIntro onComplete={() => setShowIntro(false)} />}
        <WaveMobileCard state={state} />
      </div>
      <div className="hidden sm:block">
        <PillSlideDesktopCard state={state} />
      </div>
    </>
  );
}
