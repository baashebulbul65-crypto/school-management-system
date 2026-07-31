import './Testimonials.css';

const TESTIMONIALS = [
  {
    id: 1,
    quote:
      'Kayd wuxuu inoo fududeeyay maamulka dugsigeenna gebi ahaanba. Xisaabaadka iyo imaanshaha ardayda hore ayaan u qaadan jiray saacado badan, hadda waxa ay igu qaadataa daqiiqado.',
    name: 'Ustaad Cabdiraxman Xasan',
    role: 'Maamule, Dugsiga Nuurul-Ilm',
    initials: 'CX',
  },
  {
    id: 2,
    quote:
      'Waalidiinta ayaa aad ugu faraxsan diyaarinta warbixinnada iyo fariimaha WhatsApp ee toos ah. Xiriirka dugsiga iyo qoyska ayaa noqday mid aad u fudud.',
    name: 'Ustaadha Xamdi Maxamed',
    role: 'Agaasime Waxbarasho, Al-Falax Academy',
    initials: 'XM',
  },
  {
    id: 3,
    quote:
      'Waxaan isticmaalnaa Kayd ilaa laba dugsi. Nidaamku waa mid la isku halayn karo, taageeradooduna mar walba way dhaqso u jawaabaan.',
    name: 'Ustaad Yoonis Cabdi',
    role: 'Milkiile, Dugsiyada Al-Maax',
    initials: 'YC',
  },
];

function Testimonials() {
  return (
    <section className="testimonials">
      <div className="testimonials-head">
        <div className="eyebrow">Waxa Ay Naga Yiraahdaan</div>
        <h2>Waxaa Isku Halaya Boqollaal <span className="highlight">Dugsi</span></h2>
        <p>Dugsiyada iyo macallimiinta oo isticmaala Kayd maalin walba si ay u maamulaan xogtooda.</p>
      </div>

      <div className="testimonials-grid">
        {TESTIMONIALS.map((t) => (
          <div key={t.id} className="testimonial-card">
            <svg className="quote-mark" viewBox="0 0 32 32" fill="currentColor">
              <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H8c0-1.1.9-2 2-2V8zm14 0c-3.3 0-6 2.7-6 6v10h10V14h-6c0-1.1.9-2 2-2V8z" />
            </svg>

            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <svg key={i} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01z" />
                </svg>
              ))}
            </div>

            <p className="quote-text">{t.quote}</p>

            <div className="testimonial-author">
              <div className="author-avatar">{t.initials}</div>
              <div>
                <div className="author-name">{t.name}</div>
                <div className="author-role">{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Testimonials;