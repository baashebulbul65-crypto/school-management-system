import { useState } from 'react';
import TeacherProfileModal from './TeacherProfileModal';
import TeacherFormModal from './TeacherFormModal';
import '../../styles/dashboard-shared.css';

function buildAttendance() {
  const days = ['2026-07-01','2026-07-02','2026-07-03','2026-07-06','2026-07-07','2026-07-08','2026-07-09','2026-07-10','2026-07-13','2026-07-14','2026-07-15','2026-07-16','2026-07-17','2026-07-20'];
  const pattern = ['present','present','present','present','present','absent','present','present','present','late','present','present','present','present'];
  return days.map((date, i) => ({ date, status: pattern[i] }));
}

const TEACHERS = [
  {
    id: 1,
    teacherId: 'TCH-201',
    fullName: 'Cali Xasan Warsame',
    phone: '+252 61 111 2233',
    email: 'cali.warsame@xarun.com',
    qualification: 'BSc Xisaabta - Jaamacadda Muqdisho',
    subject: 'Xisaabta',
    assignedClasses: ['Form 1A', 'Form 2A'],
    salary: [
      { month: 'Juun 2026', amount: 420, status: 'paid', date: '2026-06-28' },
      { month: 'Luulyo 2026', amount: 420, status: 'pending', date: '-' },
    ],
    timetable: [
      { day: 'Isniin', time: '08:00 - 09:30', className: 'Form 1A', subject: 'Xisaabta' },
      { day: 'Talaado', time: '10:00 - 11:30', className: 'Form 2A', subject: 'Xisaabta' },
      { day: 'Arbaco', time: '08:00 - 09:30', className: 'Form 1A', subject: 'Xisaabta' },
    ],
    documents: [
      { name: 'Shahaadada Jaamacadda', type: 'PDF', uploadDate: '2025-09-01' },
      { name: 'CV-ga', type: 'PDF', uploadDate: '2025-09-01' },
    ],
    attendance: buildAttendance(),
    status: 'active',
  },
  {
    id: 2,
    teacherId: 'TCH-202',
    fullName: 'Faadumo Nuur Cige',
    phone: '+252 61 222 3344',
    email: 'faadumo.nuur@xarun.com',
    qualification: 'BA Ingiriisi - Jaamacadda Simad',
    subject: 'Ingiriisi',
    assignedClasses: ['Form 2A', 'Form 3A'],
    salary: [{ month: 'Luulyo 2026', amount: 380, status: 'pending', date: '-' }],
    timetable: [
      { day: 'Isniin', time: '09:30 - 11:00', className: 'Form 2A', subject: 'Ingiriisi' },
      { day: 'Khamiis', time: '08:00 - 09:30', className: 'Form 3A', subject: 'Ingiriisi' },
    ],
    documents: [{ name: 'Shahaadada Jaamacadda', type: 'PDF', uploadDate: '2025-08-15' }],
    attendance: buildAttendance(),
    status: 'active',
  },
  {
    id: 3,
    teacherId: 'TCH-203',
    fullName: 'Yoonis Cabdi Maxamed',
    phone: '+252 61 333 4455',
    email: 'yoonis.cabdi@xarun.com',
    qualification: 'BA Cilmiga Bulshada',
    subject: 'Cilmiga Bulshada',
    assignedClasses: ['Form 3A'],
    salary: [{ month: 'Luulyo 2026', amount: 350, status: 'paid', date: '2026-07-05' }],
    timetable: [{ day: 'Talaado', time: '08:00 - 09:30', className: 'Form 3A', subject: 'Cilmiga Bulshada' }],
    documents: [],
    attendance: buildAttendance(),
    status: 'active',
  },
  {
    id: 4,
    teacherId: 'TCH-204',
    fullName: 'Xamdi Maxamed Xuseen',
    phone: '+252 61 444 5566',
    email: 'xamdi.xuseen@xarun.com',
    qualification: 'Diploma Cilmiga Diinta',
    subject: 'Diinta Islaamka',
    assignedClasses: ['Form 1A', 'Form 4A'],
    salary: [{ month: 'Juun 2026', amount: 300, status: 'overdue', date: '-' }],
    timetable: [{ day: 'Arbaco', time: '11:00 - 12:30', className: 'Form 4A', subject: 'Diinta Islaamka' }],
    documents: [],
    attendance: buildAttendance(),
    status: 'leave',
  },
  {
    id: 5,
    teacherId: 'TCH-205',
    fullName: 'Cabdiraxman Xasan',
    phone: '+252 61 555 6677',
    email: 'cabdiraxman.xasan@xarun.com',
    qualification: 'BSc Sayniska - Jaamacadda Banaadir',
    subject: 'Sayniska',
    assignedClasses: ['Form 4A'],
    salary: [{ month: 'Luulyo 2026', amount: 400, status: 'paid', date: '2026-07-04' }],
    timetable: [{ day: 'Khamiis', time: '10:00 - 11:30', className: 'Form 4A', subject: 'Sayniska' }],
    documents: [{ name: 'Shahaadada Jaamacadda', type: 'PDF', uploadDate: '2025-09-10' }],
    attendance: buildAttendance(),
    status: 'active',
  },
];

const STATUS_LABEL = {
  active: { label: 'Firfircoon', cls: 'badge-success' },
  leave: { label: 'Fasax', cls: 'badge-warning' },
};

function initials(name) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function Teachers() {
  const [teachers, setTeachers] = useState(TEACHERS);
  const [search, setSearch] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);

  const filtered = teachers.filter((t) =>
    t.fullName.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setEditingTeacher(null);
    setShowFormModal(true);
  };

  const openEditModal = (teacher) => {
    setEditingTeacher(teacher);
    setShowFormModal(true);
  };

  const handleSaveTeacher = (payload, teacherId) => {
    if (teacherId) {
      setTeachers((prev) => prev.map((t) => (t.id === teacherId ? { ...t, ...payload } : t)));
    } else {
      const newTeacher = {
        ...payload,
        id: Date.now(),
        teacherId: `TCH-${200 + teachers.length + 1}`,
        salary: [],
        timetable: [],
        documents: [],
        attendance: buildAttendance(),
      };
      setTeachers((prev) => [...prev, newTeacher]);
    }
  };

  const handleToggleAttendance = (teacherId, date) => {
    const nextStatus = { present: 'absent', absent: 'late', late: 'present' };
    setTeachers((prev) =>
      prev.map((t) => {
        if (t.id !== teacherId) return t;
        return {
          ...t,
          attendance: t.attendance.map((a) => (a.date === date ? { ...a, status: nextStatus[a.status] } : a)),
        };
      })
    );
    setSelectedTeacher((prev) => {
      if (!prev || prev.id !== teacherId) return prev;
      return {
        ...prev,
        attendance: prev.attendance.map((a) => (a.date === date ? { ...a, status: nextStatus[a.status] } : a)),
      };
    });
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Macallimiinta</h2>
          <p>Maamul dhammaan macallimiinta ka shaqeeya dugsiga.</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          Ku Dar Macallin
        </button>
      </div>

      <div className="dash-card">
        <div className="table-toolbar">
          <div className="table-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder="Raadi magaca ama maadada..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Macallin</th>
                <th>Email</th>
                <th>Maadada</th>
                <th>Fasallada</th>
                <th>Telefoon</th>
                <th>Xaaladda</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="cell-person">
                      <div className="cell-avatar">{initials(t.fullName)}</div>
                      <div>
                        <div className="cell-name">{t.fullName}</div>
                        <div className="cell-sub">{t.teacherId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="cell-sub">{t.email}</td>
                  <td>{t.subject}</td>
                  <td>{t.assignedClasses.join(', ')}</td>
                  <td className="cell-sub">{t.phone}</td>
                  <td><span className={`badge ${STATUS_LABEL[t.status].cls}`}>{STATUS_LABEL[t.status].label}</span></td>
                  <td>
                    <div className="row-actions">
                      <button className="row-action-btn" title="Eeg" onClick={() => setSelectedTeacher(t)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button className="row-action-btn" title="Wax Ka Beddel" onClick={() => openEditModal(t)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>Wax lama helin.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-pagination">
          <span className="pagination-info">Muujinaya {filtered.length} ee {teachers.length} macallin</span>
        </div>
      </div>

      {selectedTeacher && (
        <TeacherProfileModal
          teacher={selectedTeacher}
          onClose={() => setSelectedTeacher(null)}
          onToggleAttendance={handleToggleAttendance}
        />
      )}

      <TeacherFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSave={handleSaveTeacher}
        teacher={editingTeacher}
      />
    </div>
  );
}

export default Teachers;