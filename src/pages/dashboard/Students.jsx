import { useState, useMemo } from 'react';
import StudentProfileModal from './StudentProfileModal';
import StudentFormModal from './StudentFormModal';
import '../../styles/dashboard-shared.css';

function buildAttendance() {
  // 14 maalmood oo tijaabo ah
  const days = ['2026-07-01','2026-07-02','2026-07-03','2026-07-06','2026-07-07','2026-07-08','2026-07-09','2026-07-10','2026-07-13','2026-07-14','2026-07-15','2026-07-16','2026-07-17','2026-07-20'];
  const pattern = ['present','present','present','absent','present','present','late','present','present','present','absent','present','present','present'];
  return days.map((date, i) => ({ date, status: pattern[i] }));
}

const STUDENTS = [
  {
    id: 1,
    studentId: 'STU-1042',
    fullName: 'Ismaaciil Cabdi Xasan',
    gender: 'Wiil',
    dob: '2011-03-14',
    phone: '+252 61 111 2233',
    parentName: 'Cabdi Xasan Warsame',
    parentRelation: 'Aabo',
    parentPhone: '+252 61 999 8877',
    address: 'Xaafadda Hodan, Muqdisho',
    className: 'Form 1A',
    section: 'A',
    rollNumber: 12,
    subjects: ['Xisaab', 'Ingiriisi', 'Cilmiga Bulshada', 'Sayniska', 'Qur\u2019aan'],
    status: 'active',
    fee: 'paid',
    attendance: buildAttendance(),
    examResults: [
      { subject: 'Xisaab', marks: 82, maxMarks: 100, grade: 'A' },
      { subject: 'Ingiriisi', marks: 74, maxMarks: 100, grade: 'B' },
      { subject: 'Sayniska', marks: 65, maxMarks: 100, grade: 'C' },
    ],
    fees: [
      { term: 'Semester 1', amount: 120, date: '2026-01-10', status: 'paid' },
      { term: 'Semester 2', amount: 120, date: '2026-06-10', status: 'paid' },
    ],
    behaviour: [
      { note: 'Ka qayb qaatay tartanka akhriska - meesha 1aad', date: '2026-05-02', type: 'positive' },
    ],
    documents: [
      { name: 'Shahaadada Dhalashada', type: 'PDF', uploadDate: '2026-01-05' },
      { name: 'Sawirka Ardayga', type: 'JPG', uploadDate: '2026-01-05' },
    ],
  },
  {
    id: 2,
    studentId: 'STU-1043',
    fullName: 'Xaawo Maxamed Cali',
    gender: 'Gabar',
    dob: '2010-11-02',
    phone: '+252 61 222 3344',
    parentName: 'Maxamed Cali Nuur',
    parentRelation: 'Aabo',
    parentPhone: '+252 61 888 7766',
    address: 'Xaafadda Wadajir, Muqdisho',
    className: 'Form 2A',
    section: 'A',
    rollNumber: 5,
    subjects: ['Xisaab', 'Ingiriisi', 'Taariikh', 'Sayniska'],
    status: 'active',
    fee: 'paid',
    attendance: buildAttendance(),
    examResults: [
      { subject: 'Xisaab', marks: 91, maxMarks: 100, grade: 'A' },
      { subject: 'Ingiriisi', marks: 88, maxMarks: 100, grade: 'A' },
    ],
    fees: [{ term: 'Semester 1', amount: 120, date: '2026-01-12', status: 'paid' }],
    behaviour: [],
    documents: [{ name: 'Shahaadada Dhalashada', type: 'PDF', uploadDate: '2026-01-06' }],
  },
  {
    id: 3,
    studentId: 'STU-1044',
    fullName: 'Cabdiraxman Yoonis',
    gender: 'Wiil',
    dob: '2011-07-19',
    phone: '',
    parentName: 'Yoonis Cabdi Aadan',
    parentRelation: 'Aabo',
    parentPhone: '+252 61 555 4433',
    address: 'Xaafadda Boondheere, Muqdisho',
    className: 'Form 1A',
    section: 'A',
    rollNumber: 18,
    subjects: ['Xisaab', 'Ingiriisi', 'Cilmiga Bulshada'],
    status: 'active',
    fee: 'pending',
    attendance: buildAttendance(),
    examResults: [{ subject: 'Xisaab', marks: 48, maxMarks: 100, grade: 'F' }],
    fees: [{ term: 'Semester 2', amount: 120, date: '2026-06-15', status: 'pending' }],
    behaviour: [
      { note: 'Fasalka ka daahay 3 jeer bishan', date: '2026-06-20', type: 'negative' },
    ],
    documents: [],
  },
  {
    id: 4,
    studentId: 'STU-1045',
    fullName: 'Sacdiyo Xasan Nuur',
    gender: 'Gabar',
    dob: '2009-09-30',
    phone: '',
    parentName: 'Xasan Nuur Cige',
    parentRelation: 'Aabo',
    parentPhone: '+252 61 444 3322',
    address: 'Xaafadda Karaan, Muqdisho',
    className: 'Form 3A',
    section: 'A',
    rollNumber: 9,
    subjects: ['Xisaab', 'Ingiriisi', 'Sayniska', 'Taariikh'],
    status: 'inactive',
    fee: 'overdue',
    attendance: buildAttendance(),
    examResults: [{ subject: 'Ingiriisi', marks: 55, maxMarks: 100, grade: 'C' }],
    fees: [{ term: 'Semester 2', amount: 120, date: '2026-06-01', status: 'overdue' }],
    behaviour: [],
    documents: [],
  },
  {
    id: 5,
    studentId: 'STU-1046',
    fullName: 'Maxamed Xuseen Cige',
    gender: 'Wiil',
    dob: '2008-05-11',
    phone: '+252 61 333 2211',
    parentName: 'Xuseen Cige Faarax',
    parentRelation: 'Aabo',
    parentPhone: '+252 61 222 1100',
    address: 'Xaafadda Dharkenley, Muqdisho',
    className: 'Form 4A',
    section: 'A',
    rollNumber: 2,
    subjects: ['Xisaab', 'Ingiriisi', 'Fiisigis', 'Kiimikada'],
    status: 'active',
    fee: 'paid',
    attendance: buildAttendance(),
    examResults: [
      { subject: 'Fiisigis', marks: 77, maxMarks: 100, grade: 'B' },
      { subject: 'Kiimikada', marks: 85, maxMarks: 100, grade: 'A' },
    ],
    fees: [{ term: 'Semester 2', amount: 150, date: '2026-06-08', status: 'paid' }],
    behaviour: [],
    documents: [{ name: 'Ratiga Fasalka Hore', type: 'PDF', uploadDate: '2026-02-01' }],
  },
  {
    id: 6,
    studentId: 'STU-1047',
    fullName: 'Amiina Cabdulle',
    gender: 'Gabar',
    dob: '2010-01-22',
    phone: '',
    parentName: 'Cabdulle Warsame',
    parentRelation: 'Aabo',
    parentPhone: '+252 61 111 0099',
    address: 'Xaafadda Yaaqshiid, Muqdisho',
    className: 'Form 2A',
    section: 'A',
    rollNumber: 21,
    subjects: ['Xisaab', 'Ingiriisi', 'Taariikh'],
    status: 'active',
    fee: 'pending',
    attendance: buildAttendance(),
    examResults: [{ subject: 'Taariikh', marks: 69, maxMarks: 100, grade: 'C' }],
    fees: [{ term: 'Semester 2', amount: 120, date: '2026-06-18', status: 'pending' }],
    behaviour: [],
    documents: [],
  },
];

const FEE_LABEL = {
  paid: { label: 'La Bixiyay', cls: 'badge-success' },
  pending: { label: 'Sugaya', cls: 'badge-warning' },
  overdue: { label: 'Dib U Dhacay', cls: 'badge-danger' },
};

const STATUS_LABEL = {
  active: { label: 'Firfircoon', cls: 'badge-success' },
  inactive: { label: 'Firfircoona', cls: 'badge-neutral' },
};

function initials(name) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function Students() {
  const [students, setStudents] = useState(STUDENTS);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const classes = useMemo(() => ['all', ...new Set(students.map((s) => s.className))], [students]);

  const filtered = students.filter((s) => {
    const matchesSearch = s.fullName.toLowerCase().includes(search.toLowerCase()) || s.studentId.toLowerCase().includes(search.toLowerCase());
    const matchesClass = classFilter === 'all' || s.className === classFilter;
    return matchesSearch && matchesClass;
  });

  const openAddModal = () => {
    setEditingStudent(null);
    setShowAddModal(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setShowAddModal(true);
  };

  const handleSaveStudent = (payload, studentId) => {
    if (studentId) {
      setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, ...payload } : s)));
    } else {
      const newStudent = {
        ...payload,
        id: Date.now(),
        studentId: `STU-${1040 + students.length + 1}`,
        attendance: buildAttendance(),
        examResults: [],
        fees: [],
        behaviour: [],
        documents: [],
      };
      setStudents((prev) => [...prev, newStudent]);
    }
  };

  const handleToggleAttendance = (studentId, date) => {
    const nextStatus = { present: 'absent', absent: 'late', late: 'present' };
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        return {
          ...s,
          attendance: s.attendance.map((a) =>
            a.date === date ? { ...a, status: nextStatus[a.status] } : a
          ),
        };
      })
    );
    setSelectedStudent((prev) => {
      if (!prev || prev.id !== studentId) return prev;
      return {
        ...prev,
        attendance: prev.attendance.map((a) =>
          a.date === date ? { ...a, status: nextStatus[a.status] } : a
        ),
      };
    });
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Ardayda</h2>
          <p>Maamul dhammaan ardayda diiwaan gashan dugsiga.</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          Ku Dar Arday Cusub
        </button>
      </div>

      <div className="dash-card">
        <div className="table-toolbar">
          <div className="table-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder="Raadi magaca ama ID-ga..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="filter-select" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            {classes.map((c) => (
              <option key={c} value={c}>{c === 'all' ? 'Dhammaan Fasallada' : c}</option>
            ))}
          </select>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Arday</th>
                <th>ID</th>
                <th>Fasalka</th>
                <th>Jinsiga</th>
                <th>Xaaladda</th>
                <th>Lacagta</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="cell-person">
                      <div className="cell-avatar">{initials(s.fullName)}</div>
                      <span className="cell-name">{s.fullName}</span>
                    </div>
                  </td>
                  <td className="cell-sub">{s.studentId}</td>
                  <td>{s.className}</td>
                  <td>{s.gender}</td>
                  <td><span className={`badge ${STATUS_LABEL[s.status].cls}`}>{STATUS_LABEL[s.status].label}</span></td>
                  <td><span className={`badge ${FEE_LABEL[s.fee].cls}`}>{FEE_LABEL[s.fee].label}</span></td>
                  <td>
                    <div className="row-actions">
                      <button className="row-action-btn" title="Eeg" onClick={() => setSelectedStudent(s)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button className="row-action-btn" title="Wax Ka Beddel" onClick={() => openEditModal(s)}>
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
          <span className="pagination-info">Muujinaya {filtered.length} ee {students.length} arday</span>
          <div className="pagination-controls">
            <button className="page-btn active">1</button>
          </div>
        </div>
      </div>

      {selectedStudent && (
        <StudentProfileModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onToggleAttendance={handleToggleAttendance}
        />
      )}

      <StudentFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveStudent}
        student={editingStudent}
      />
    </div>
  );
}

export default Students;