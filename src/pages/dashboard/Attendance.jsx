import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useSchoolData } from '../../context/SchoolDataContext';
import { todayISODate, isoDateDaysAgo } from '../../utils/somaliDate';
import StaffMemberFormModal from './StaffMemberFormModal';
import '../../styles/dashboard-shared.css';
import './Attendance.css';

const VALUE_CLS = { present: 'success', absent: 'danger', late: 'warning', leave: 'warning', sick: 'danger' };

const PERIOD_DAYS = { weekly: 7, monthly: 30, yearly: 365 };

// Warbixinnada toddobaadka/bisha/sanadka waxaa laga soo xisaabiyaa (derive)
// taariikhda dhabta ah ee diiwaanka imaanshaha (allStudentAttendanceRecords /
// allStaffAttendanceRecords, fiiri SchoolDataContext.jsx) — "daily" waxaa
// laga soo xisaabiyaa xogta nool ee hoos ku qoran (attendanceToday).
function computePeriodStats(records, statusKeys, days) {
  const cutoffISO = isoDateDaysAgo(days);
  const filtered = records.filter((r) => r.date >= cutoffISO);
  const counts = { total: filtered.length };
  statusKeys.forEach((k) => { counts[k] = filtered.filter((r) => r.status === k).length; });
  counts.rate = counts.total ? Math.round(((counts.present || 0) / counts.total) * 100) : 0;
  return counts;
}

function initials(name) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function Attendance() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const {
    students, teachers, staff, attendanceToday, cycleAttendanceStatus,
    addStaffMember, updateStaffMember, removeStaffMember,
    allStudentAttendanceRecords, allStaffAttendanceRecords, myClassIds, myClassNames,
  } = useSchoolData();
  // Add/Edit/Delete shaqaalaha roster-ka waa owner-kaliya (Teacher Role
  // Scoping audit, 2026-08-02) — la mid ah Classes.jsx/Subjects.jsx, fiiri
  // firestore.rules: staffRoster.
  const isOwner = profile?.role !== 'teacher';
  // Macallinku, tabka "Ardayda", waa in uu kaliya arkaa/calaamadiyaa
  // imaanshaha ardayda fasalladiisa gaarka ah — ma aha ardayda/xaadiriska
  // dugsiga oo dhan (Teacher Role Scoping, 2026-08-02).
  const myStudents = useMemo(
    () => (myClassIds ? students.filter((s) => (s.classId ? myClassIds.has(s.classId) : myClassNames.has(s.className))) : students),
    [students, myClassIds, myClassNames]
  );
  const myStudentAttendanceRecords = useMemo(
    () => (myClassIds ? allStudentAttendanceRecords.filter((r) => myClassNames.has(r.className)) : allStudentAttendanceRecords),
    [allStudentAttendanceRecords, myClassIds, myClassNames]
  );
  const [category, setCategory] = useState('students');
  const [period, setPeriod] = useState('daily');
  const [date] = useState(todayISODate());
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaffMember, setEditingStaffMember] = useState(null);

  const CATEGORIES = [
    { id: 'students', label: t('attendance.categories.students') },
    { id: 'teachers', label: t('attendance.categories.teachers') },
    { id: 'staff', label: t('attendance.categories.staff') },
  ];

  const PERIODS = [
    { id: 'daily', label: t('attendance.periods.daily') },
    { id: 'weekly', label: t('attendance.periods.weekly') },
    { id: 'monthly', label: t('attendance.periods.monthly') },
    { id: 'yearly', label: t('attendance.periods.yearly') },
  ];

  // Ardayda hadda waxay leeyihiin 4 xaalado (Joog/Maqan/Fasax/Buka), Macallimiinta iyo
  // Shaqaalaha waxay wali isticmaalaan 3-da xaalado ee hore (Joog/Maqan/Daahid).
  const STATUS_DEFS = {
    students: [
      { key: 'present', label: t('common.present') },
      { key: 'absent', label: t('common.absent') },
      { key: 'leave', label: t('common.leave') },
      { key: 'sick', label: t('common.sick') },
    ],
    teachers: [
      { key: 'present', label: t('common.present') },
      { key: 'absent', label: t('common.absent') },
      { key: 'late', label: t('common.late') },
    ],
    staff: [
      { key: 'present', label: t('common.present') },
      { key: 'absent', label: t('common.absent') },
      { key: 'late', label: t('common.late') },
    ],
  };

  const statusDefs = STATUS_DEFS[category];

  const list = useMemo(() => {
    if (category === 'students') {
      return myStudents.map((s) => ({
        id: s.id,
        name: s.fullName,
        sub: `${s.className} · ${s.studentId}`,
        className: s.className,
        status: attendanceToday.students[s.id] || null,
      }));
    }
    if (category === 'teachers') {
      return teachers.map((t2) => ({
        id: t2.id,
        name: t2.fullName,
        sub: `${t2.subject} · ${t2.teacherId}`,
        status: attendanceToday.teachers[t2.id] || 'present',
      }));
    }
    return staff.map((s) => ({
      id: s.id,
      name: s.name,
      sub: s.sub,
      status: attendanceToday.staff[s.id] || 'present',
    }));
  }, [category, myStudents, teachers, staff, attendanceToday]);

  const todayCounts = useMemo(() => {
    const counts = { total: list.length };
    statusDefs.forEach((def) => {
      counts[def.key] = list.filter((p) => p.status === def.key).length;
    });
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, category]);

  const periodRecords = useMemo(() => {
    if (category === 'students') return myStudentAttendanceRecords;
    return allStaffAttendanceRecords.filter((r) => r.category === category);
  }, [category, myStudentAttendanceRecords, allStaffAttendanceRecords]);

  const stats = period === 'daily'
    ? { ...todayCounts, rate: todayCounts.total ? Math.round((todayCounts.present / todayCounts.total) * 100) : 0 }
    : computePeriodStats(periodRecords, statusDefs.map((d) => d.key), PERIOD_DAYS[period]);

  // Xaaladda xaadiriska ARDAYDA (Joog/Maqan/Fasax/Buka) waa in ay ka dhacdo
  // KALIYA ClassWorkspace.jsx tab-ka Xaadiris (fiiri README) — halkan
  // (bogga "Xaadiris" ee guud) waa akhris-kaliya ardayda, sidaas darteed
  // handleMark-ku kaliya wuxuu u shaqeeyaa macallimiinta/shaqaalaha.
  const handleMark = (person) => cycleAttendanceStatus(category, person.id);

  const openAddStaffModal = () => { setEditingStaffMember(null); setShowStaffModal(true); };
  const openEditStaffModal = (person) => { setEditingStaffMember({ id: person.id, name: person.name, sub: person.sub }); setShowStaffModal(true); };

  const handleSaveStaffMember = (payload, memberId) => {
    if (memberId) {
      updateStaffMember(memberId, payload);
    } else {
      addStaffMember(payload);
    }
  };

  const handleDeleteStaffMember = (memberId, name) => {
    if (window.confirm(`Ma hubtaa inaad ka saarayso "${name}" liiska shaqaalaha?`)) {
      removeStaffMember(memberId);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>{t('attendance.pageTitle')}</h2>
          <p>{t('attendance.pageSubtitle')}</p>
        </div>
        <input type="date" className="attendance-date-picker" value={date} disabled />
      </div>

      {/* CATEGORY TABS */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div className="att-category-tabs">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`att-cat-tab ${category === c.id ? 'active' : ''}`}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
        {category === 'staff' && isOwner && (
          <button className="btn-primary" onClick={openAddStaffModal}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            Ku Dar Shaqaale
          </button>
        )}
      </div>

      {/* TODAY SUMMARY */}
      <div className="att-summary-grid">
        {statusDefs.map((def) => (
          <div className={`att-summary-card ${def.key}`} key={def.key}>
            <span className="att-summary-value">{todayCounts[def.key]}</span>
            <span className="att-summary-label">{def.label} {t('attendance.today')}</span>
          </div>
        ))}
        <div className="att-summary-card total">
          <span className="att-summary-value">{todayCounts.total}</span>
          <span className="att-summary-label">{t('attendance.total')}</span>
        </div>
      </div>

      {/* MARKING TABLE */}
      <div className="dash-card">
        <div className="att-card-head">
          <h3>{t('attendance.markingTitle', { date })}</h3>
          <p className="att-note">
            {category === 'students' ? t('attendance.noteStudents') : t('attendance.noteOthers')}
          </p>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('attendance.table.name')}</th>
                <th>{t('attendance.table.details')}</th>
                <th>{t('attendance.table.status')}</th>
                {category === 'staff' && isOwner && <th></th>}
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="cell-person">
                      <div className="cell-avatar">{initials(p.name)}</div>
                      <span className="cell-name">{p.name}</span>
                    </div>
                  </td>
                  <td className="cell-sub">{p.sub}</td>
                  <td>
                    {category === 'students' ? (
                      p.status ? (
                        <span className={`att-status-btn ${p.status}`}>
                          {statusDefs.find((d) => d.key === p.status)?.label || p.status}
                        </span>
                      ) : (
                        <span className="att-status-btn neutral">{t('attendance.notMarkedYet')}</span>
                      )
                    ) : (
                      <button className={`att-status-btn ${p.status}`} onClick={() => handleMark(p)}>
                        {statusDefs.find((d) => d.key === p.status)?.label || p.status}
                      </button>
                    )}
                  </td>
                  {category === 'staff' && isOwner && (
                    <td>
                      <div className="row-actions">
                        <button className="row-action-btn" title="Wax Ka Beddel" onClick={() => openEditStaffModal(p)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z"/></svg>
                        </button>
                        <button className="row-action-btn danger" title="Ka Saar" onClick={() => handleDeleteStaffMember(p.id, p.name)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {category === 'staff' && list.length === 0 && (
                <tr><td colSpan={isOwner ? 4 : 3} style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>Wali shaqaale lama darin.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REPORTS */}
      <div className="dash-card">
        <div className="att-card-head">
          <h3>{t('attendance.reportsTitle')}</h3>
          <div className="att-period-tabs">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                className={`att-period-tab ${period === p.id ? 'active' : ''}`}
                onClick={() => setPeriod(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="att-report-grid">
          {statusDefs.map((def) => (
            <div className="att-report-stat" key={def.key}>
              <span className={`att-report-value ${VALUE_CLS[def.key]}`}>{stats[def.key] ?? 0}</span>
              <span className="att-report-label">{def.label}</span>
            </div>
          ))}
          <div className="att-report-stat">
            <span className="att-report-value">{stats.total}</span>
            <span className="att-report-label">{t('attendance.total')}</span>
          </div>
          <div className="att-report-rate">
            <div className="att-report-rate-bar">
              <div className="att-report-rate-fill" style={{ width: `${stats.rate}%` }}></div>
            </div>
            <span>{stats.rate}{t('attendance.attendanceRate')}</span>
          </div>
        </div>
      </div>

      <StaffMemberFormModal
        isOpen={showStaffModal}
        onClose={() => setShowStaffModal(false)}
        onSave={handleSaveStaffMember}
        member={editingStaffMember}
      />
    </div>
  );
}

export default Attendance;
