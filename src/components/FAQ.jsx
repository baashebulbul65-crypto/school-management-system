import { useState } from 'react';
import './FAQ.css';

const FAQS = [
  {
    id: 1,
    question: 'Sidee bilaabaa isticmaalka Xarun?',
    answer:
      'Waxaad diiwaan gelisaa dugsigaaga bogga hore, waxaana lagu siinayaa School Code kuu gaar ah. Kadib waxaad ku dari kartaa ardayda, macallimiinta, iyo fasallada gudaha daqiiqado.',
  },
  {
    id: 2,
    question: 'Ma jiraa muddo tijaabo ah (free trial)?',
    answer:
      'Haa, dugsiyada cusub waxay heli karaan 14 maalmood oo tijaabo ah oo bilaash ah, iyada oo aan lacag bixin loo baahnayn.',
  },
  {
    id: 3,
    question: 'Xogtayda ma ammaan bay ku jirtaa?',
    answer:
      'Xogtaada waxaa lagu kaydiyaa server-yo ammaan ah oo si joogto ah backup loo sameeyo. Adiga oo keliya iyo shaqaalaha aad idan siisay ayaa geli kara xogta dugsigaaga.',
  },
  {
    id: 4,
    question: 'Waxaan haystaa dhowr dugsi — ma isticmaali karaa hal akoon?',
    answer:
      'Haa, qorshaha "Waaweyn" wuxuu kuu ogolaanayaa inaad ka maamusho dhowr dugsi hal dashboard ah, adigoo isticmaalaya hal akoon.',
  },
  {
    id: 5,
    question: 'Sidee waalidiinta ugu heli karaan xogta ilmahooda?',
    answer:
      'Waalidiinta waxaa la siiyaa akoon gaar ah (Diiwaan ID) oo ay ku arki karaan imaanshaha, natiijooyinka, iyo xisaabaadka lacageed ee ilmahooda.',
  },
  {
    id: 6,
    question: 'Ma bixin karaa lacagta si kala duwan (bishii/sanadkii)?',
    answer:
      'Haa, waxaad dooran kartaa in aad bixiso bishii kasta ama sanadkii oo dhan — bixinta sanadka waxay leedahay qiimo dhimis 20% ah.',
  },
];

function FAQ() {
  const [openId, setOpenId] = useState(1);

  const toggle = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="faq">
      <div className="faq-head">
        <div className="eyebrow">Su&apos;aalaha Badanaa La Is Weydiiyo</div>
        <h2>Wax Kasta Oo Aad U Baahan Tahay In Aad <span className="highlight">Ogaato</span></h2>
        <p>Haddii aysan su&apos;aashaadu halkan ka jirin, nala soo xiriir annagaa u diyaar u ah in aan ku caawino.</p>
      </div>

      <div className="faq-list">
        {FAQS.map((item) => (
          <div key={item.id} className={`faq-item ${openId === item.id ? 'open' : ''}`}>
            <button className="faq-question" onClick={() => toggle(item.id)}>
              <span>{item.question}</span>
              <span className="faq-icon">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </button>
            <div className="faq-answer">
              <p>{item.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default FAQ;