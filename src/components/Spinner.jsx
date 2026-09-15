import { useEffect, useRef, useState } from 'react';
import './Spinner.css';

// Simulated progress (2026-09-15): wax kasta oo spinner-kan isticmaala
// (page-chunk load, auth-check, Firestore submit) ma laha real progress
// signal — sidaas darteed percentage-gu waa mid la xisaabiyo (simulated),
// ma aha mid dhab ah oo la la socdo byte-by-byte. Curve-ku waa exponential
// ease-out: dhaqso ayuu ugu kacaa bilowga, dabadeedna u gaabiyaa isaga oo
// aan marnaba gaadhin `cap`-ka intuu `active` yahay — haddii kale user-ku
// wuxuu arki lahaa "100%" oo ku taagan halkiisa loading-gu weli socdo
// (user-ka la weydiiyay, 2026-09-15: la doortay ka-fog qaabkaas "fixed
// duration" ee la sheegay inuu u ekaan karo "stuck"). Marka `active` uga
// beddesho true -> false (dhab ahaan shaqadu way dhammaatay), waxaa dhaca
// "finish flourish": percent-ka wuxuu si dhaqso ah (~220ms) ugu booda 100%,
// dabadeedna `done` waa la dhigaa true `finishMs` kadib si loading-container-ku
// muddo gaaban u sii muujiyo 100% ka hor intuusan la beddelin xogta dhabta ah.
export function useSimulatedProgress(active, { cap = 92, tau = 900, finishMs = 300 } = {}) {
  const [percent, setPercent] = useState(active ? 1 : 0);
  const [done, setDone] = useState(!active);
  const percentRef = useRef(active ? 1 : 0);

  useEffect(() => {
    let raf;
    let cancelled = false;

    if (active) {
      setDone(false);
      percentRef.current = 1;
      setPercent(1);
      const start = performance.now();
      const climb = (now) => {
        if (cancelled) return;
        const elapsed = now - start;
        const pct = Math.max(1, Math.min(cap, Math.round(cap * (1 - Math.exp(-elapsed / tau)))));
        percentRef.current = pct;
        setPercent(pct);
        raf = requestAnimationFrame(climb);
      };
      raf = requestAnimationFrame(climb);
    } else {
      const start = performance.now();
      const from = percentRef.current;
      const jump = (now) => {
        if (cancelled) return;
        const t = Math.min(1, (now - start) / 220);
        const pct = Math.round(from + (100 - from) * t);
        percentRef.current = pct;
        setPercent(pct);
        if (t < 1) {
          raf = requestAnimationFrame(jump);
        } else {
          setTimeout(() => { if (!cancelled) setDone(true); }, finishMs);
        }
      };
      raf = requestAnimationFrame(jump);
    }

    return () => { cancelled = true; cancelAnimationFrame(raf); };
  }, [active, cap, tau, finishMs]);

  return { percent, done };
}

// Ring-ka rotating-ka ah + (ikhtiyaari) percentage-ka dhexdiisa ku qoran.
// showPercent waa in la xiro (false) meelaha yar-yar (badhamada submit-ka,
// ~16-20px) — tiro ku qoran ring 18px ah lama akhrin karo, sidaas darteed
// halkaas ring-ka oo qura (CSS animation, wax JS/state ah looma baahna) ayaa
// isticmaalaya.
export default function Spinner({ percent = 0, size = 56, showPercent = true, className = '' }) {
  const strokeWidth = Math.max(3, Math.round(size * 0.11));
  return (
    <div className={`spinner-wrap ${className}`} style={{ width: size, height: size }}>
      <div className="spinner-ring" style={{ '--spinner-stroke': `${strokeWidth}px` }} />
      {showPercent && (
        <span className="spinner-percent" style={{ fontSize: Math.max(10, Math.round(size * 0.22)) }}>
          {Math.min(100, Math.max(0, percent))}%
        </span>
      )}
    </div>
  );
}

// .spinner-overlay waa kaliya layout (fixed + centered, transparent) —
// bogga hoosta ka socda 100% ayuu u muuqan doonaa. .spinner-badge (navy
// khafiif ah) waxay ku koobán tahay kaliya spinner-ka lafteeda (round 3,
// 2026-09-15, user-request: "backroonka spinner kaliya, ha taaban
// backroonka guud"). Isticmaalka saddexda bog ee full-page loading leh
// (App.jsx Suspense fallback, ProtectedRoute, RequireRole) — hal component
// oo la wadaago si aan loo laba-qorin markup-ka overlay+badge.
export function SpinnerOverlay({ percent = 0, size = 140 }) {
  return (
    <div className="spinner-overlay">
      <div className="spinner-badge">
        <Spinner percent={percent} size={size} />
      </div>
    </div>
  );
}

export function FullPageSpinner({ active = true, size = 140 }) {
  const { percent } = useSimulatedProgress(active);
  return <SpinnerOverlay percent={percent} size={size} />;
}
