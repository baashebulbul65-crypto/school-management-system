import { useState } from 'react';
import ClassFormModal from './ClassFormModal';
import ClassDetailModal from './ClassDetailModal';
import '../../styles/dashboard-shared.css';
import './Classes.css';

const INITIAL_CLASSES = [
  {
    id: 1,
    grade: 'Form 1',
    section: 'A',
    room: 'Qolka 101',
    capacity: 50,
    students: 45,
    classTeacher: 'Cali Xasan Warsame',
    subjects: ['Xisaab', 'Ingiriisi', 'Cilmiga Bulshada', 'Sayniska'],
  },
  {
    id: 2,
    grade: 'Form 1',
    section: 'B',
    room: 'Qolka 102',
    capacity: 50,
    students: 40,
    classTeacher: 'Hodan Cabdi',
    subjects: ['Xisaab', 'Ingiriisi', 'Diinta Islaamka'],
  },
  {
    id: 3,
    grade: 'Form 2',
    section: 'A',
    room: 'Qolka 201',
    capacity: 45,
    students: 42,
    classTeacher: 'Faadumo Nuur Cige',
    subjects: ['Xisaab', 'Ingiriisi', 'Taariikh'],
  },
  {
    id: 4,
    grade: 'Form 2',
    section: 'B',
    room: 'Qolka 202',
    capacity: 45,
    students: 38,
    classTeacher: 'Maxamed Xuseen',
    subjects: ['Xisaab', 'Ingiriisi', 'Sayniska'],
  },
  {
    id: 5,
    grade: 'Form 3',
    section: 'A',
    room: 'Qolka 301',
    capacity: 40,
    students: 38,
    classTeacher: 'Yoonis Cabdi Maxamed',
    subjects: ['Xisaab', 'Ingiriisi', 'Fiisigis', 'Kiimikada'],
  },
  {
    id: 6,
    grade: 'Form 4',
    section: 'A',
    room: 'Qolka 401',
    capacity: 40,
    students: 40,
    classTeacher: 'Xamdi Maxamed Xuseen',
    subjects: ['Xisaab', 'Ingiriisi', 'Fiisigis', 'Kiimikada', 'Bayoolaji'],
  },
];

function Classes() {
  const [classes, setClasses] = useState(INITIAL_CLASSES);
  const [search, setSearch] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null); // <-- Halkan ayaa fasalka furan lagu kaydinayaa

  const filtered = classes.filter((c) =>
    `${c.grade} ${c.section}`.toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setEditingClass(null);
    setShowFormModal(true);
  };

  const openEditModal = (cls) => {
    setEditingClass(cls);
    setShowFormModal(true);
  };

  const handleSaveClass = (payload, classId) => {
    if (classId) {
      setClasses((prev) => prev.map((c) => (c.id === classId ? { ...c, ...payload } : c)));
    } else {
      const newClass = { ...payload, id: Date.now(), students: 0 };
      setClasses((prev) => [...prev, newClass]);
    }
  };

  const handleDeleteClass = (classId, className) => {
    const confirmed = window.confirm(`Ma hubtaa inaad tirtirayso ${className}? Tallaabadan lama noqon karo.`);
    if (confirmed) {
      setClasses((prev) => prev.filter((c) => c.id !== classId));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Fasallada</h2>
          <p>Maamul dhammaan fasallada iyo qoondaynta macallimiinta.</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          Abuur Fasal Cusub
        </button>
      </div>

      <div className="table-toolbar">
        <div className="table-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            type="text"
            placeholder="Raadi fasal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="classes-grid">
        {filtered.map((c) => {
          const percent = Math.round((c.students / c.capacity) * 100);
          return (
            <div className="class-card" key={c.id}>
              <div className="class-card-top">
                <div className="class-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/></svg>
                </div>
                <div className="class-card-actions">
                  <button className="row-action-btn" title="Wax Ka Beddel" onClick={() => openEditModal(c)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z"/></svg>
                  </button>
                  <button className="row-action-btn danger" title="Tirtir" onClick={() => handleDeleteClass(c.id, `${c.grade} ${c.section}`)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>
                  </button>
                </div>
              </div>

              <h3>{c.grade} - {c.section}</h3>
              <p className="class-room">{c.room}</p>
              <p className="class-teacher">{c.classTeacher}</p>

              <div className="class-subjects">
                {c.subjects.slice(0, 3).map((s) => (
                  <span key={s} className="class-subject-tag">{s}</span>
                ))}
                {c.subjects.length > 3 && (
                  <span className="class-subject-tag more">+{c.subjects.length - 3}</span>
                )}
              </div>

              <div className="class-progress">
                <div className="class-progress-bar">
                  <div className="class-progress-fill" style={{ width: `${percent}%` }}></div>
                </div>
                <span>{c.students}/{c.capacity}</span>
              </div>

              {/* HALKAN ayaa onClick lagu dray si fasalku u furmo */}
              <button className="btn-secondary class-open-btn" onClick={() => setSelectedClass(c)}>
                Fur Fasalka
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </button>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p style={{ color: '#94A3B8', gridColumn: '1 / -1', textAlign: 'center', padding: '32px' }}>Wax lama helin.</p>
        )}
      </div>

      <ClassFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSave={handleSaveClass}
        cls={editingClass}
      />

      {/* Modal-ka lagu furayo fasalka la doortay */}
      <ClassDetailModal
        cls={selectedClass}
        onClose={() => setSelectedClass(null)}
      />
    </div>
  );
}

export default Classes;