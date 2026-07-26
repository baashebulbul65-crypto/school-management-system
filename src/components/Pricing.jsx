import { useState } from 'react';
import './Pricing.css';

const PLANS = [
  {
    id: 'bilow',
    name: 'Bilowga',
    tagline: 'Dugsiyada yaryar ee bilaabaya',
    monthly: 15,
    yearly: 12,
    featured: false,
    features: [
      'Ilaa 100 Arday',
      'Maamulka Ardayda & Macallimiinta',
      'Diiwaanka Imaanshaha',
      'Taageero Iimayl ah',
    ],
  },
  {
    id: 'caadi',
    name: 'Caadiga Ah',
    tagline: 'Ugu habboon dugsiyada dhexdhexaad ah',
    monthly: 35,
    yearly: 28,
    featured: true,
    badge: 'UGU CAANSAN',
    features: [
      'Ilaa 500 Arday',
      'Dhammaan Features-ka Bilowga',
      'Maamulka Lacagta & Rasiidyada',
      'Horumarka Qur\u2019aanka',
      'Fariimaha WhatsApp ee Waalidiinta',
      'Taageero Degdeg ah',
    ],
  },
  {
    id: 'waaweyn',
    name: 'Waaweyn',
    tagline: 'Dugsiyada badan & xarumaha weyn',
    monthly: 75,
    yearly: 60,
    featured: false,
    features: [
      'Arday Aan Xad Lahayn',
      'Dhammaan Features-ka Caadiga Ah',
      'Warbixino & Falanqayn Dheeraad ah',
      'Isku-xirka Dhowr Dugsi (Multi-Branch)',
      'Taageero 24/7 ah',
    ],
  },
];

function Pricing() {
  const [billing, setBilling] = useState('monthly');

  return (
    <section className="pricing">
      <div className="pricing-head">
        <div className="eyebrow">Qiimaha</div>
        <h2>Dooro Qorshaha Ku <span className="highlight">Habboon</span> Dugsigaaga</h2>
        <p>Ma jiro heshiis muddo dheer ah. Bedel ama joojiso qorshahaaga wakhti kasta.</p>

        <div className="billing-toggle">
          <button
            className={`billing-btn ${billing === 'monthly' ? 'active' : ''}`}
            onClick={() => setBilling('monthly')}
          >
            Bishii
          </button>
          <button
            className={`billing-btn ${billing === 'yearly' ? 'active' : ''}`}
            onClick={() => setBilling('yearly')}
          >
            Sanadkii
            <span className="save-tag">Kaydso 20%</span>
          </button>
        </div>
      </div>

      <div className="pricing-grid">
        {PLANS.map((plan) => (
          <div key={plan.id} className={`price-card ${plan.featured ? 'featured' : ''}`}>
            {plan.badge && <div className="price-badge">{plan.badge}</div>}

            <h3>{plan.name}</h3>
            <p className="price-tagline">{plan.tagline}</p>

            <div className="price-amount">
              <span className="currency">$</span>
              <span className="number">{billing === 'monthly' ? plan.monthly : plan.yearly}</span>
              <span className="period">/ bishii</span>
            </div>
            {billing === 'yearly' && (
              <p className="billed-note">La xisaabiyo sanadkii oo dhan</p>
            )}

            <button className="price-cta">
              Bilow Hadda
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>

            <ul className="price-features">
              {plan.features.map((feature, i) => (
                <li key={i}>
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Pricing;