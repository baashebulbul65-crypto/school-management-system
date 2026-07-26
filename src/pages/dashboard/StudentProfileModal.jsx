import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './StudentProfileModal.css';

const TABS = [
  { id: 'guud', label: 'Macluumaadka Guud' },
  { id: 'waxbarasho', label: 'Waxbarasho' },
  { id: 'imaanshaha', label: 'Imaanshaha' },
  { id: 'natiijo', label: 'Natiijooyinka' },
  { id: 'lacag', label: 'Lacagta' },
  { id: 'anshax', label: 'Anshaxa' },
  { id: 'dukumenti', label: 'Dukumentiyada' },
];

function initials(name) {
  return name ? name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() : '';
}

// Helper Component-ka halkan lagu daray 👇
function InfoRow({ label, value }) {
  return (
    <div className="spm-info-row">
      <span className="spm-info-label">{label}</span>
      <span className="spm-info-value">{value || '—'}</span>
    </div>
  );
}

function StudentProfileModal({ student, onClose, onToggleAttendance }) {
  const [activeTab, setActiveTab] = useState('guud');

  if (!student) return null;

  return (
    <div className="spm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="spm-modal">

        {/* HEADER */}
        <div className="spm-header">
          <button className="spm-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>

          <div className="spm-header-top">
            <div className="spm-avatar">{initials(student.fullName)}</div>
            <div className="spm-header-info">
              <h2>{student.fullName}</h2>
              <p>{student.studentId} &middot; {student.className} - {student.section}</p>
              <span className={`badge ${student.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                {student.status === 'active' ? 'Firfircoon' : 'Aan Firfircoonayn'}
              </span>
            </div>
            <div className="spm-qr">
              <QRCodeSVG value={student.studentId || ''} size={72} bgColor="transparent" fgColor="#0B1F2B" />
              <span>QR Code</span>
            </div>
          </div>

          <div className="spm-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`spm-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* BODY */}
        <div className="spm-body">

          {activeTab === 'guud' && (
            <div className="spm-grid">
              <InfoRow label="Magaca Buuxa" value={student.fullName} />
              <InfoRow label="Student ID" value={student.studentId} />
              <InfoRow label="Jinsiga" value={student.gender} />
              <InfoRow label="Taariikhda Dhalashada" value={student.dob} />
              <InfoRow label="Telefoonka" value={student.phone} />
              <InfoRow label="Cinwaanka" value={student.address} />
              <div className="spm-divider">Macluumaadka Waalidka</div>
              <InfoRow label="Magaca Waalidka" value={student.parentName} />
              <InfoRow label="Xiriirka" value={student.parentRelation} />
              <InfoRow label="Telefoonka Waalidka" value={student.parentPhone} />
            </div>
          )}

          {activeTab === 'waxbarasho' && (
            <div className="spm-grid">
              <InfoRow label="Fasalka" value={student.className} />
              <InfoRow label="Qaybta (Section)" value={student.section} />
              <InfoRow label="Roll Number" value={student.rollNumber} />
              <div className="spm-divider">Maadooyinka</div>
              <div className="spm-tags">
                {student.subjects?.map((sub) => (
                  <span key={sub} className="spm-tag">{sub}</span>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'imaanshaha' && (
            <div>
              <p className="spm-note">Guji maalin kasta si aad u beddesho xaaladda imaanshaha (Present/Absent).</p>
              <div className="attendance-grid">
                {student.attendance?.map((a) => (
                  <button
                    key={a.date}
                    className={`attendance-cell ${a.status}`}
                    onClick={() => onToggleAttendance?.(student.id, a.date)}
                    title={a.date}
                  >
                    <span className="attendance-date">{a.date.split('-')[2]}</span>
                    <span className="attendance-status">
                      {a.status === 'present' ? 'Joog' : a.status === 'late' ? 'Daahid' : 'Maqan'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'natiijo' && (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Maadada</th><th>Buundooyinka</th><th>Wadarta</th><th>Darajada</th></tr>
                </thead>
                <tbody>
                  {student.examResults?.map((r) => (
                    <tr key={r.subject}>
                      <td>{r.subject}</td>
                      <td>{r.marks}</td>
                      <td>{r.maxMarks}</td>
                      <td><span className={`badge ${r.grade === 'A' ? 'badge-success' : r.grade === 'F' ? 'badge-danger' : 'badge-warning'}`}>{r.grade}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'lacag' && (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Xilliga</th><th>Qadarka</th><th>Taariikhda</th><th>Xaaladda</th></tr>
                </thead>
                <tbody>
                  {student.fees?.map((f, i) => (
                    <tr key={i}>
                      <td>{f.term}</td>
                      <td>${f.amount}</td>
                      <td className="cell-sub">{f.date}</td>
                      <td>
                        <span className={`badge ${f.status === 'paid' ? 'badge-success' : f.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                          {f.status === 'paid' ? 'La Bixiyay' : f.status === 'pending' ? 'Sugaya' : 'Dib U Dhacay'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'anshax' && (
            <div className="behaviour-list">
              {(!student.behaviour || student.behaviour.length === 0) && <p className="spm-note">Wax faallo ah lama qorin.</p>}
              {student.behaviour?.map((b, i) => (
                <div key={i} className={`behaviour-item ${b.type}`}>
                  <span className="behaviour-dot"></span>
                  <div>
                    <p>{b.note}</p>
                    <span className="behaviour-date">{b.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'dukumenti' && (
            <div className="documents-list">
              {(!student.documents || student.documents.length === 0) && <p className="spm-note">Wax dukumenti ah laguma soo shubin.</p>}
              {student.documents?.map((d, i) => (
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
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default StudentProfileModal;