import StatCard from '../../components/dashboard/StatCard';
import '../../styles/dashboard-shared.css';
import './Overview.css';

const RECENT_ACTIVITY = [
  { id: 1, text: 'Arday cusub ayaa la diiwaan geliyay — Fasalka 3A', time: '10 daqiiqo kahor', type: 'success' },
  { id: 2, text: 'Rasiid lacageed ayaa la sameeyay — $120', time: '45 daqiiqo kahor', type: 'success' },
  { id: 3, text: 'Macallin cusub ayaa la diiwaan geliyay', time: '2 saacadood kahor', type: 'neutral' },
  { id: 4, text: 'Imaanshaha maanta lama duubin — Fasalka 2B', time: '3 saacadood kahor', type: 'warning' },
  { id: 5, text: 'Waalid ayaa fariin ka soo diray dugsiga', time: 'Shalay', time2: '', type: 'neutral' },
];

const CLASS_SNAPSHOT = [
  { id: 1, name: 'Form 1A', students: 45, teacher: 'Ustaad Cali Xasan', fill: 90 },
  { id: 2, name: 'Form 2A', students: 42, teacher: 'Ustaadha Faadumo Nuur', fill: 84 },
  { id: 3, name: 'Form 3A', students: 38, teacher: 'Ustaad Yoonis Cabdi', fill: 76 },
  { id: 4, name: 'Form 4A', students: 40, teacher: 'Ustaadha Xamdi Maxamed', fill: 80 },
];

function Overview() {
  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Ku Soo Dhawoow, Xarun 👋</h2>
          <p>Waa tan sida ay maanta u socoto dugsigaaga.</p>
        </div>
        <button className="btn-primary">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          Ku Dar Arday
        </button>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Wadarta Ardayda"
          value="1,248"
          change="+4.2%"
          changeType="up"
          accent="mint"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 14a4 4 0 100-8 4 4 0 000 8zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"/></svg>}
        />
        <StatCard
          label="Macallimiinta"
          value="64"
          change="+2"
          changeType="up"
          accent="navy"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v12H8l-4 4V4z"/></svg>}
        />
        <StatCard
          label="Dakhliga Bishan"
          value="$18,420"
          change="+12.5%"
          changeType="up"
          accent="gold"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
        />
        <StatCard
          label="Imaanshaha Maanta"
          value="94%"
          change="-1.8%"
          changeType="down"
          accent="coral"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/></svg>}
        />
      </div>

      <div className="overview-grid">
        <div className="dash-card">
          <div className="dash-card-head">
            <h3>Fasallada</h3>
            <a href="/dashboard/classes" className="see-all-link">Dhammaan Eeg →</a>
          </div>

          <div className="class-snapshot-list">
            {CLASS_SNAPSHOT.map((c) => (
              <div className="class-snapshot-row" key={c.id}>
                <div className="cs-info">
                  <div className="cs-name">{c.name}</div>
                  <div className="cs-teacher">{c.teacher}</div>
                </div>
                <div className="cs-bar-wrap">
                  <div className="cs-bar"><div className="cs-bar-fill" style={{ width: `${c.fill}%` }}></div></div>
                </div>
                <div className="cs-students">{c.students} Arday</div>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-head">
            <h3>Dhaqdhaqaaqa Dambe</h3>
          </div>

          <div className="activity-list">
            {RECENT_ACTIVITY.map((a) => (
              <div className="activity-row" key={a.id}>
                <span className={`activity-dot ${a.type}`}></span>
                <div className="activity-text">
                  <div>{a.text}</div>
                  <div className="activity-time">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Overview;