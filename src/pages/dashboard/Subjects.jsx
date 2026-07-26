import { useState } from 'react';
import SubjectFormModal from './SubjectFormModal';
import '../../styles/dashboard-shared.css';

const INITIAL_SUBJECTS = [
  { id: 1, name: 'Xisaabta', code: 'MATH-101', teacher: 'Cali Xasan Warsame', credit: 4, weeklyHours: 5 },
  { id: 2, name: 'Ingiriisi', code: 'ENG-101', teacher: 'Faadumo Nuur Cige', credit: 4, weeklyHours: 5 },
  { id: 3, name: 'Cilmiga Bulshada', code: 'SOC-101', teacher: 'Yoonis Cabdi Maxamed', credit: 3, weeklyHours: 3 },
  { id: 4, name: 'Sayniska', code: 'SCI-101', teacher: 'Cabdiraxman Xasan', credit: 3, weeklyHours: 4 },
  { id: 5, name: 'Diinta Islaamka', code: 'ISL-101', teacher: 'Xamdi Maxamed Xuseen', credit: 2, weeklyHours: 3 },
  { id: 6, name: 'Fiisigis', code: 'PHY-201', teacher: 'Cabdiraxman Xasan', credit: 4, weeklyHours: 4 },
];

function initials(name) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function Subjects() {
  const [subjects, setSubjects] = useState(INITIAL_SUBJECTS);
  const [search, setSearch] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  const filtered = subjects.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setEditingSubject(null);
    setShowFormModal(true);
  };

  const openEditModal = (subject) => {
    setEditingSubject(subject);
    setShowFormModal(true);
  };

  const handleSaveSubject = (payload, subjectId) => {
    if (subjectId) {
      setSubjects((prev) => prev.map((s) => (s.id === subjectId ? { ...s, ...payload } : s)));
    } else {
      setSubjects((prev) => [...prev, { ...payload, id: Date.now() }]);
    }
  };

  const handleDeleteSubject = (subjectId, name) => {
    const confirmed = window.confirm(`Ma hubtaa inaad tirtirayso maadada "${name}"? Tallaabadan lama noqon karo.`);
    if (confirmed) {
      setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Maadooyinka</h2>
          <p>Maamul dhammaan maadooyinka la dhigo dugsiga.</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          Ku Dar Maadada Cusub
        </button>
      </div>

      <div className="dash-card">
        <div className="table-toolbar">
          <div className="table-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder="Raadi maadada ama code-ka..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Maadada</th>
                <th>Code</th>
                <th>Macallinka</th>
                <th>Credit</th>
                <th>Saacadaha Toddobaadka</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="cell-person">
                      <div className="cell-avatar">{initials(s.name)}</div>
                      <span className="cell-name">{s.name}</span>
                    </div>
                  </td>
                  <td className="cell-sub">{s.code}</td>
                  <td>{s.teacher}</td>
                  <td><span className="badge badge-neutral">{s.credit} Credit</span></td>
                  <td className="cell-sub">{s.weeklyHours} saacadood/toddobaad</td>
                  <td>
                    <div className="row-actions">
                      <button className="row-action-btn" title="Wax Ka Beddel" onClick={() => openEditModal(s)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z"/></svg>
                      </button>
                      <button className="row-action-btn danger" title="Tirtir" onClick={() => handleDeleteSubject(s.id, s.name)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>Wax lama helin.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-pagination">
          <span className="pagination-info">Muujinaya {filtered.length} ee {subjects.length} maadooyin</span>
        </div>
      </div>

      <SubjectFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSave={handleSaveSubject}
        subject={editingSubject}
      />
    </div>
  );
}

export default Subjects;