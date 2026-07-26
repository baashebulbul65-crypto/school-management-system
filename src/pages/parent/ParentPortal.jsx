import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/dashboard-shared.css';
import './ParentPortal.css';

const TABS = [
  { id: 'attendance', label: 'Imaanshaha' },
  { id: 'fees', label: 'Lacagaha' },
  { id: 'results', label: 'Natiijooyinka' },
  { id: 'messages', label: 'Fariimaha' },
  { id: 'behaviour', label: 'Anshaxa' },
  { id: 'examdates', label: 'Taariikhaha Imtixaanka' },
];

const CHILD = {
  name: 'Ismaaciil Cabdi Xasan',
  studentId: 'STU-1042',
  className: 'Form 1A',
};

const ATTENDANCE = [
  { date: '2026-07-01', status: 'present' }, { date: '2026-07-02', status: 'present' },
  { date: '2026-07-03', status: 'present' }, { date: '2026-07-06', status: 'absent' },
  { date: '2026-07-07', status: 'present' }, { date: '2026-07-08', status: 'present' },
  { date: '2026-07-09', status: 'late' }, { date: '2026-07-10', status: 'present' },
  { date: '2026-07-13', status: 'present' }, { date: '2026-07-14', status: 'present' },
  { date: '2026-07-15', status: 'absent' }, { date: '2026-07-16', status: 'present' },
  { date: '2026-07-17', status: 'present' }, { date: '2026-07-20', status: 'present' },
];

const FEES = [
  { term: 'Semester 1', amount: 120, dueDate: '2026-01-15', status: 'paid' },
  { term: 'Semester 2', amount: 120, dueDate: '2026-07-25', status: 'pending' },
];

const RESULTS = [
  { subject: 'Xisaabta', type: 'Midterm', marks: 82, maxMarks: 100, grade: 'A' },
  { subject: 'Ingiriisi', type: 'Final', marks: 74, maxMarks: 100, grade: 'B' },
  { subject: 'Sayniska', type: 'Quiz', marks: 65, maxMarks: 100, grade: 'C' },
];

const MESSAGES = [
  { from: 'Maamulka Dugsiga', date: '2026-07-18', text: 'Berri waa maalin fasax ah — dugsigu wuu xidhan yahay.' },
  { from: 'Macallin Cali Xasan', date: '2026-07-15', text: 'Ismaaciil aad ayuu u fiican yahay xisaabta — hambalyo!' },
  { from: 'Maamulka Dugsiga', date: '2026-07-10', text: 'Lacagta Semester 2-aad waxay dhamaanaysaa 25 Luulyo.' },
];

const BEHAVIOUR = [
  { note: 'Ka qayb qaatay tartanka akhriska - meesha 1aad', date: '2026-05-02', type: 'positive' },
  { note: 'Fasalka ka daahay hal jeer', date: '2026-06-10', type: 'negative' },
];

const EXAM_DATES = [
  { subject: 'Xisaabta', type: 'Final', date: '2026-08-05', room: 'Qolka 101' },
  { subject: 'Ingiriisi', type: 'Final', date: '2026-08-07', room: 'Qolka 101' },
  { subject: 'Sayniska', type: 'Final', date: '2026-08-09', room: 'Qolka 102' },
];

function statusLabel(status) {
  if (status === 'present') return 'Joog';
  if (status === 'late') return 'Daahid';
  return 'Maqan';
}

function initials(name) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function ParentPortal() {
  const [activeTab, setActiveTab] = useState('attendance');
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const presentCount = ATTENDANCE.filter((a) => a.status === 'present').length;
  const attendanceRate = Math.round((presentCount / ATTENDANCE.length) * 100);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="pp-page">
      <header className="pp-header">
        <div className="pp-brand">
          <svg viewBox="0 0 40 40" fill="none">
            <path d="M8 30 C8 18, 16 8, 28 8" stroke="#16C784" strokeWidth="4" strokeLinecap="round" fill="none"/>
            <circle cx="30" cy="8" r="3" fill="#0B1F2B"/>
            <path d="M8 30 H24" stroke="#0B1F2B" strokeWidth="4" strokeLinecap="round"/>
          </svg>
          <span>Xarun<span className="pp-dot">.</span> Waalidka</span>
        </div>
        <div className="pp-header-right">
          <span className="pp-welcome">Ku soo dhawoow, {profile?.fullName || 'Waalid'}</span>
          <button className="pp-logout" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            Ka Bax
          </button>
        </div>
      </header>

      <div className="pp-container">

        <div className="pp-child-card">
          <div className="pp-child-avatar">{initials(CHILD.name)}</div>
          <div className="pp-child-info">
            <h2>{CHILD.name}</h2>
            <p>{CHILD.studentId} &middot; {CHILD.className}</p>
          </div>
          <div className="pp-child-stat">
            <span>{attendanceRate}%</span>
            <label>Heerka Imaanshaha</label>
          </div>
        </div>

        <div className="pp-tabs">
          {TABS.map((t) => (
            <button key={t.id} className={`pp-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="pp-card">

          {activeTab === 'attendance' && (
            <>
              <h3 className="pp-card-title">Imaanshaha — Luulyo 2026</h3>
              <div className="pp-attendance-grid">
                {ATTENDANCE.map((a) => (
                  <div key={a.date} className={`pp-att-cell ${a.status}`} title={a.date}>
                    <span className="pp-att-date">{a.date.split('-')[2]}</span>
                    <span className="pp-att-status">{statusLabel(a.status)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'fees' && (
            <>
              <h3 className="pp-card-title">Lacagaha</h3>
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead><tr><th>Xilliga</th><th>Qadarka</th><th>Taariikhda Dhammaadka</th><th>Xaaladda</th></tr></thead>
                  <tbody>
                    {FEES.map((f, i) => (
                      <tr key={i}>
                        <td>{f.term}</td>
                        <td>${f.amount}</td>
                        <td className="cell-sub">{f.dueDate}</td>
                        <td>
                          <span className={`badge ${f.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                            {f.status === 'paid' ? 'La Bixiyay' : 'Sugaya'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'results' && (
            <>
              <h3 className="pp-card-title">Natiijooyinka</h3>
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead><tr><th>Maadada</th><th>Nooca</th><th>Buundooyinka</th><th>Darajada</th></tr></thead>
                  <tbody>
                    {RESULTS.map((r, i) => (
                      <tr key={i}>
                        <td className="cell-name">{r.subject}</td>
                        <td><span className="badge badge-neutral">{r.type}</span></td>
                        <td>{r.marks}/{r.maxMarks}</td>
                        <td>
                          <span className={`badge ${r.grade === 'A' ? 'badge-success' : r.grade === 'F' ? 'badge-danger' : 'badge-warning'}`}>
                            {r.grade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'messages' && (
            <>
              <h3 className="pp-card-title">Fariimaha</h3>
              <div className="pp-messages-list">
                {MESSAGES.map((m, i) => (
                  <div key={i} className="pp-message-item">
                    <div className="pp-message-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                    </div>
                    <div className="pp-message-body">
                      <div className="pp-message-top">
                        <strong>{m.from}</strong>
                        <span>{m.date}</span>
                      </div>
                      <p>{m.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'behaviour' && (
            <>
              <h3 className="pp-card-title">Anshaxa</h3>
              <div className="pp-behaviour-list">
                {BEHAVIOUR.map((b, i) => (
                  <div key={i} className={`pp-behaviour-item ${b.type}`}>
                    <span className="pp-behaviour-dot"></span>
                    <div>
                      <p>{b.note}</p>
                      <span className="pp-behaviour-date">{b.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'examdates' && (
            <>
              <h3 className="pp-card-title">Taariikhaha Imtixaanka</h3>
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead><tr><th>Maadada</th><th>Nooca</th><th>Taariikhda</th><th>Qolka</th></tr></thead>
                  <tbody>
                    {EXAM_DATES.map((e, i) => (
                      <tr key={i}>
                        <td className="cell-name">{e.subject}</td>
                        <td><span className="badge badge-neutral">{e.type}</span></td>
                        <td className="cell-sub">{e.date}</td>
                        <td>{e.room}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default ParentPortal;