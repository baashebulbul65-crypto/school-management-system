import './Features.css';

const FEATURES = [
  {
    icon: <path d="M12 14a4 4 0 100-8 4 4 0 000 8zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"/>,
    title: 'Maamulka Ardayda',
    text: 'Diiwaan geli, la soco, oo maamul xogta ardayda oo dhan — profile, fasal, iyo horumarka waxbarasho — hal meel.'
  },
  {
    icon: <path d="M4 4h16v12H8l-4 4V4z"/>,
    title: 'Macallimiinta',
    text: 'Maamul jadwalka macallimiinta, fasallada ay wax ku dhigaan, iyo diiwaanka mushaharkooda si fudud.'
  },
  {
    icon: <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>,
    title: 'Maamulka Lacagta',
    text: 'La soco kharashka iyo dakhliga, samee rasiidyo si otomaatig ah, oo warbixino lacageed toos u soo saar.',
    featured: true,
    badge: 'UGU CAANSAN'
  },
  {
    icon: <path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>,
    title: 'Imaanshaha (Attendance)',
    text: 'Duub imaanshaha ardayda maalin kasta, oo waalidiinta si toos ah ugala soo xiriir marka ilmahoodu maqan yahay.'
  },
  {
    icon: <path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/>,
    title: "Horumarka Qur'aanka",
    text: "La soco xifdiga iyo dhigashada Qur'aanka ee arday kasta, oo warbixin gaar ah u samee waalidiinta."
  },
  {
    icon: <path d="M3 3v18h18M18.7 8l-5.1 5.1-3-3L3 17.4"/>,
    title: 'Warbixino & Falanqayn',
    text: 'Eeg xogta guud ee dugsigaaga adigoo isticmaalaya jaantusyo (charts) fudud oo la fahmi karo.'
  }
];

function Features() {
  return (
    <section className="features">
      <div className="features-head">
        <div className="eyebrow">Waxa Xarun Ku Sarreeyo</div>
        <h2>Dhammaan Waxa Aad U Baahan Tahay Hal <span className="highlight">Nidaam</span></h2>
        <p>Ka bilow diiwaan gelinta ilaa xisaabaadka — Xarun wuxuu isugu keenaa dhammaan qaybaha maamulka dugsigaaga hal meel oo fudud.</p>
      </div>

      <div className="features-grid">
        {FEATURES.map((f, i) => (
          <div className={`feature-card${f.featured ? ' featured' : ''}`} key={i}>
            {f.badge && <div className="feature-badge">{f.badge}</div>}
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{f.icon}</svg>
            </div>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Features;