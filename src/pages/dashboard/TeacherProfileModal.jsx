import { useState } from 'react';
import './TeacherProfileModal.css';

const TABS = [
  { id: 'guud', label: 'Macluumaadka Guud' },
  { id: 'jadwal', label: 'Jadwalka (Timetable)' },
  { id: 'imaanshaha', label: 'Imaanshaha' },
  { id: 'mushahar', label: 'Mushaharka' },
  { id: 'dukumenti', label: 'Dukumentiyada' },
];

function initials(name) {
  return name ? name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() : '';
}

function InfoRow({ label, value }) {
  return (
    <div className="tpm-info-row">
      <span className="tpm-info-label">{label}</span>
      <span className="tpm-info-value">{value || '—'}</span>
    </div>
  );
}

function TeacherProfileModal({ teacher, onClose, onToggleAttendance }) {
  const [activeTab, setActiveTab] = useState('guud');

  if (!teacher) return null;

  const assignedClasses = teacher.assignedClasses || [];
  const timetable = teacher.timetable || [];
  const attendance = teacher.attendance || [];
  const salary = teacher.salary || [];
  const documents = teacher.documents || [];

  return (
    <div className="tpm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="tpm-modal">

        {/* HEADER */}
        <div className="tpm-header">
          <button className="tpm-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>

          <div className="tpm-header-top">
            <div className="tpm-avatar">{initials(teacher.fullName)}</div>
            <div className="tpm-header-info">
              <h2>{teacher.fullName}</h2>
              <p>{teacher.teacherId} &middot; {teacher.subject}</p>
              <span className={`badge ${teacher.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                {teacher.status === 'active' ? 'Firfircoon' : 'Fasax'}
              </span>
            </div>
          </div>

          <div className="tpm-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`tpm-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* BODY */}
        <div className="tpm-body">

          {activeTab === 'guud' && (
            <div className="tpm-grid">
              <InfoRow label="Magaca Buuxa" value={teacher.fullName} />
              <InfoRow label="Teacher ID" value={teacher.teacherId} />
              <InfoRow label="Telefoonka" value={teacher.phone} />
              <InfoRow label="Email" value={teacher.email} />
              <InfoRow label="Shahaadada (Qualification)" value={teacher.qualification} />
              <InfoRow label="Maadada" value={teacher.subject} />
              <div className="tpm-divider">Fasallada Loo Xilsaaray</div>
              <div className="tpm-tags">
                {assignedClasses.length === 0 ? (
                  <p className="tpm-note">Weli fasal loo xilsaaray ma jiro.</p>
                ) : (
                  assignedClasses.map((c) => (
                    <span key={c} className="tpm-tag">{c}</span>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'jadwal' && (
            <div className="data-table-wrap">
              {timetable.length === 0 ? (
                <p className="tpm-note">Weli jadwal lama dhigin.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr><th>Maalinta</th><th>Waqtiga</th><th>Fasalka</th><th>Maadada</th></tr>
                  </thead>
                  <tbody>
                    {timetable.map((t, i) => (
                      <tr key={i}>
                        <td>{t.day}</td>
                        <td className="cell-sub">{t.time}</td>
                        <td>{t.className}</td>
                        <td>{t.subject}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'imaanshaha' && (
            <div>
              <p className="tpm-note">Guji maalin kasta si aad u beddesho xaaladda imaanshaha (Present/Absent).</p>
              <div className="attendance-grid">
                {attendance.length === 0 ? (
                  <p className="tpm-note">Weli imaansho ma jiro.</p>
                ) : (
                  attendance.map((a) => (
                    <button
                      key={a.date}
                      className={`attendance-cell ${a.status}`}
                      onClick={() => onToggleAttendance?.(teacher.id, a.date)}
                      title={a.date}
                    >
                      <span className="attendance-date">{a.date.split('-')[2]}</span>
                      <span className="attendance-status">
                        {a.status === 'present' ? 'Joog' : a.status === 'late' ? 'Daahid' : 'Maqan'}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'mushahar' && (
            <div className="data-table-wrap">
              {salary.length === 0 ? (
                <p className="tpm-note">Weli mushahar lama diiwaan gelin.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr><th>Bisha</th><th>Qadarka</th><th>Taariikhda Bixinta</th><th>Xaaladda</th></tr>
                  </thead>
                  <tbody>
                    {salary.map((s, i) => (
                      <tr key={i}>
                        <td>{s.month}</td>
                        <td>${s.amount}</td>
                        <td className="cell-sub">{s.date}</td>
                        <td>
                          <span className={`badge ${s.status === 'paid' ? 'badge-success' : s.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                            {s.status === 'paid' ? 'La Bixiyay' : s.status === 'pending' ? 'Sugaya' : 'Dib U Dhacay'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'dukumenti' && (
            <div className="documents-list">
              {documents.length === 0 ? (
                <p className="tpm-note">Weli dukumenti lama geli.</p>
              ) : (
                documents.map((d, i) => (
                  <div key={i} className="document-row">
                    <div className="document-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
                    </div>
                    <div className="document-info">
                      <div className="document-name">{d.name}</div>
                      <div className="document-meta">{d.type} &middot; {d.uploadDate}</div>
                    </div>
                    <button className="row-action-btn" title="Soo Deji">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default TeacherProfileModal;