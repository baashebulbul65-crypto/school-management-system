import './Hero.css';

function Hero({ onOpenLogin }) {
  return (
    <section className="hero">
      <div className="glow-blob left"></div>
      <div className="glow-blob right"></div>

      <div className="eyebrow">Nidaam Maamul Dugsi oo Cloud-Based ah</div>
      <h1>Si Fudud U Maamul Xogta <span className="highlight">Ardayda!</span></h1>
      <p>Xarun waxa uu kaa caawinayaa inaad qaab fudud u maamusho xogta ardayda, macallimiinta, iyo macluumaadka dugsigaaga — dhammaan hal meel.</p>

      <button className="hero-cta" onClick={onOpenLogin}>
        Gal Akoonkaaga
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </button>
    </section>
  );
}

export default Hero;