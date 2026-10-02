import React, { useEffect, useState } from 'react';
import { LightState } from '../types/game';

interface RedLightOverlayProps {
  lightState: LightState;
  showFreezeAlert: boolean;
  freezeCountdown: number | null;
}

export const RedLightOverlay: React.FC<RedLightOverlayProps> = ({
  lightState,
  showFreezeAlert,
  freezeCountdown,
}) => {
  const [visibleState, setVisibleState] = useState<'GREEN' | 'RED' | null>(null);

  useEffect(() => {
    setVisibleState(lightState);
    const timer = setTimeout(() => {
      // Fade banner out slightly after transition
    }, 2500);
    return () => clearTimeout(timer);
  }, [lightState]);

  if (!showFreezeAlert && freezeCountdown === null) {
    return null;
  }

  const isRed = lightState === 'RED';

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center p-4">
      {/* Light state banner */}
      <div
        className={`px-8 py-6 rounded-3xl backdrop-blur-2xl border-2 shadow-2xl flex flex-col items-center justify-center gap-2 transform transition-all duration-300 scale-105 animate-bounce ${
          isRed
            ? 'bg-rose-950/85 border-rose-500 text-rose-100 shadow-rose-600/40'
            : 'bg-emerald-950/85 border-emerald-500 text-emerald-100 shadow-emerald-600/40'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-4xl">{isRed ? '🔴' : '🟢'}</span>
          <span className="text-3xl md:text-5xl font-black tracking-wider uppercase font-mono">
            {isRed ? 'RED LIGHT!' : 'GREEN LIGHT!'}
          </span>
        </div>

        <div className="text-lg md:text-2xl font-black tracking-wide uppercase text-center">
          {isRed ? 'FREEZE! NO MOVING!' : 'ANSWER NOW!'}
        </div>

        {freezeCountdown !== null && freezeCountdown > 0 && (
          <div className="text-5xl md:text-6xl font-black font-mono mt-1 text-amber-300 animate-pulse">
            {freezeCountdown}
          </div>
        )}
      </div>
    </div>
  );
};
