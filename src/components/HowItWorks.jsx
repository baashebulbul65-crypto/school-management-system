import { useEffect, useRef, useState } from 'react';
import './HowItWorks.css';

const STEPS = [
  {
    number: '01',
    icon: <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/>,
    title: 'Samee Akoonkaaga',
    text: 'Diiwaan geli dugsigaaga oo hel School Code gaar ah — waqti yar ayay qaadaneysaa.'
  },
  {
    number: '02',
    icon: <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>,
    title: 'Ku Dar Ardayda & Macallimiinta',
    text: 'Geli xogta ardayda, macallimiinta, iyo fasallada — si tartiib tartiib ah ama kaydka hore ka soo qaad.'
  },
  {
    number: '03',
    icon: <path d="M4 4h16v12H8l-4 4V4z"/>,
    title: 'Maamul Fasallada',
    text: 'Abuur fasallada, qoondee ardayda, oo la soco imaanshaha iyo horumarka waxbarasho maalin walba.'
  },
  {
    number: '04',
    icon: <path d="M3 3v18h18M18.7 8l-5.1 5.1-3-3L3 17.4"/>,
    title: 'La Soco Warbixinnada',
    text: 'Eeg xisaabaadka, imaanshaha, iyo horumarka guud — dhammaan hal dashboard ah oo fudud.'
  }
];

function HowItWorks() {
  const stepRefs = useRef([]);
  const [visibleSteps, setVisibleSteps] = useState(() => STEPS.map(() => false));

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.dataset.index);
            setVisibleSteps((prev) => {
              const next = [...prev];
              next[index] = true;
              return next;
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    stepRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const visibleCount = visibleSteps.filter(Boolean).length;
  const lineFillPercent = (visibleCount / STEPS.length) * 100;

  return (
    <section className="how-it-works">
      <div className="hiw-head">
        <div className="eyebrow">Sida Uu U Shaqeeyo</div>
        <h2>Afar Tallaabo Oo Fudud Ah Ayaad Ku <span className="highlight">Bilaabaysaa</span></h2>
        <p>Kama baahnid khibrad tignoolajiyadeed. Kayd waxa uu kaa dhigayaa mid fudud in aad dugsigaaga si dhakhso ah u maamusho.</p>
      </div>

      <div className="hiw-track">
        <div className="hiw-line">
          <div className="hiw-line-fill" style={{ width: `${lineFillPercent}%` }}></div>
        </div>

        <div className="hiw-steps">
          {STEPS.map((step, i) => (
            <div
              className={`hiw-step${visibleSteps[i] ? ' visible' : ''}`}
              key={step.number}
              data-index={i}
              ref={(el) => (stepRefs.current[i] = el)}
            >
              <div className="hiw-number"><span>{step.number}</span></div>
              <div className="hiw-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{step.icon}</svg>
              </div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;