import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSchoolData } from '../../context/SchoolDataContext';
import { todaySomaliDayName, todayISODate, formatDMY } from '../../utils/somaliDate';
import QuranTargetFormModal from './QuranTargetFormModal';
import '../../styles/dashboard-shared.css';
import './Attendance.css';
import './Exams.css';
import './ClassWorkspace.css';

const DAY_MS = 24 * 60 * 60 * 1000;

function initials(name) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function ClassWorkspace() {
  const { t } = useTranslation();
  const { classId } = useParams();
  const navigate = useNavigate();
  const {
    classes, students, teachers, exams, examMarks, attendanceToday, setStudentAttendanceStatus, updateExamMark,
    quranProgressToday, setQuranProgress,
    quranTargets, saveQuranTarget, recordQuranTargetOutcome,
  } = useSchoolData();
  const [activeTab, setActiveTab] = useState('roster');
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [pendingMarks, setPendingMarks] = useState({});
  const [surahInput, setSurahInput] = useState('');
  const [targetModalStudent, setTargetModalStudent] = useState(null);
  const [dismissedPromptIds, setDismissedPromptIds] = useState([]);

  const TABS = [
    { id: 'roster', label: t('classWorkspace.tabs.roster') },
    { id: 'attendance', label: t('classWorkspace.tabs.attendance') },
    { id: 'grades', label: t('classWorkspace.tabs.grades') },
    { id: 'quran', label: t('classWorkspace.tabs.quran') },
    { id: 'quranTargets', label: t('classWorkspace.tabs.quranTargets') },
    { id: 'schedule', label: t('classWorkspace.tabs.schedule') },
  ];

  const ATTENDANCE_STATUSES = [
    { key: 'present', label: t('common.present') },
    { key: 'absent', label: t('common.absent') },
    { key: 'leave', label: t('common.leave') },
    { key: 'sick', label: t('common.sick') },
  ];

  const cls = classes.find((c) => String(c.id) === classId);
  const classroomName = cls ? `${cls.grade}${cls.section}` : '';

  const classStudents = useMemo(
    () => students.filter((s) => s.className === classroomName),
    [students, classroomName]
  );

  const classExams = useMemo(
    () => exams.filter((e) => e.className === classroomName),
    [exams, classroomName]
  );

  const currentExamId = selectedExamId ?? classExams[0]?.id;
  const selectedExam = classExams.find((e) => e.id === currentExamId);

  // Yoolka ugu dambeeyay (createdAt) ee arday kasta — kuwii hore (reached/missed)
  // waxay ahaadaan taariikh/history oo aan la beddelin, kaliya waa la kaydiyaa.
  const latestTargetByStudent = useMemo(() => {
    const map = {};
    quranTargets
      .filter((qt) => qt.className === classroomName)
      .forEach((qt) => {
        const existing = map[qt.studentId];
        if (!existing || qt.createdAt > existing.createdAt) map[qt.studentId] = qt;
      });
    return map;
  }, [quranTargets, classroomName]);

  // Ha isticmaalin useMemo halkan — waa in mar walba (render kasta, sida marka
  // tab-ka la furo) laga hubiyaa "now" cusub si prompt-ku si otomaatig ah
  // isaga ugu soo baxo marka taariikhda yoolku gaadho, iyada oo aan la sugin
  // isbeddel xog Firestore ah.
  const expiredPendingTarget =
    classStudents
      .map((s) => latestTargetByStudent[s.id])
      .find((qt) => qt && qt.status === 'pending' && !dismissedPromptIds.includes(qt.id) && new Date(qt.deadline).getTime() <= Date.now()) || null;

  const todayDayName = todaySomaliDayName(); // fur (key) loo isticmaalo barbardhigga xogta timetable
  const todayDayLabel = t('common.dayNames', { returnObjects: true })[new Date().getDay()]; // magaca loo muujiyo
  const todaysSchedule = useMemo(() => {
    const entries = teachers.flatMap((tc) =>
      (tc.timetable || [])
        .filter((tt) => tt.className === classroomName && tt.day === todayDayName)
        .map((tt) => ({ ...tt, teacherName: tc.fullName }))
    );
    return entries.sort((a, b) => a.time.localeCompare(b.time));
  }, [teachers, classroomName, todayDayName]);

  const markKey = (examId, studentId) => `${examId}_${studentId}`;

  const handleMarkChange = (examId, studentId, value) => {
    setPendingMarks((prev) => ({ ...prev, [markKey(examId, studentId)]: value }));
  };

  const commitMark = (examId, studentId) => {
    const key = markKey(examId, studentId);
    if (pendingMarks[key] === undefined) return;
    updateExamMark(examId, studentId, pendingMarks[key]);
    setPendingMarks((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  if (!cls) {
    return (
      <div className="dash-card cw-not-found">
        <p>{t('classWorkspace.notFound')}</p>
        <button className="btn-secondary" onClick={() => navigate('/dashboard/classes')}>{t('classWorkspace.backToClasses')}</button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>{t('classWorkspace.title', { grade: cls.grade, section: cls.section })}</h2>
          <p>{cls.room} · {t('classWorkspace.classTeacherLabel')}: {teachers.find((tc) => tc.id === cls.classTeacherId)?.fullName || cls.classTeacher || '—'}</p>
        </div>
        <button className="btn-secondary" onClick={() => navigate('/dashboard/classes')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          {t('classWorkspace.backToClasses')}
        </button>
      </div>

      <div className="fin-tabs">
        {TABS.map((tb) => (
          <button key={tb.id} className={`fin-tab ${activeTab === tb.id ? 'active' : ''}`} onClick={() => setActiveTab(tb.id)}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* ===== ARDAYDA FASALKA ===== */}
      {activeTab === 'roster' && (
        <div className="dash-card">
          <div className="dash-card-head">
            <h3>{t('classWorkspace.roster.title')}</h3>
            <span className="cw-count-badge">{t('classWorkspace.roster.countBadge', { count: classStudents.length })}</span>
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>{t('classWorkspace.roster.table.student')}</th><th>{t('classWorkspace.roster.table.id')}</th><th>{t('classWorkspace.roster.table.status')}</th></tr></thead>
              <tbody>
                {classStudents.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="cell-person">
                        <div className="cell-avatar">{initials(s.fullName)}</div>
                        <span className="cell-name">{s.fullName}</span>
                      </div>
                    </td>
                    <td className="cell-sub">{s.studentId}</td>
                    <td>
                      <span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                        {t(`common.status.${s.status}`)}
                      </span>
                    </td>
                  </tr>
                ))}
                {classStudents.length === 0 && (
                  <tr><td colSpan="3" style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>{t('classWorkspace.roster.empty')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== XAADIRIS ===== */}
      {activeTab === 'attendance' && (
        <div className="dash-card">
          <div className="dash-card-head">
            <h3>{t('classWorkspace.attendance.title')}</h3>
            <span className="cw-count-badge">{todayISODate()}</span>
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>{t('classWorkspace.attendance.table.student')}</th><th>{t('classWorkspace.attendance.table.status')}</th></tr></thead>
              <tbody>
                {classStudents.map((s) => {
                  const status = attendanceToday.students[s.id] || 'present';
                  return (
                    <tr key={s.id}>
                      <td>
                        <div className="cell-person">
                          <div className="cell-avatar">{initials(s.fullName)}</div>
                          <span className="cell-name">{s.fullName}</span>
                        </div>
                      </td>
                      <td>
                        <div className="att-status-btn-group">
                          {ATTENDANCE_STATUSES.map((def) => (
                            <button
                              key={def.key}
                              className={`att-status-btn ${def.key}${status === def.key ? ' active' : ''}`}
                              onClick={() => setStudentAttendanceStatus(s.id, s.className, def.key)}
                            >
                              {def.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {classStudents.length === 0 && (
                  <tr><td colSpan="2" style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>{t('classWorkspace.attendance.empty')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== DHIBCAHA / IMTIXAANADA ===== */}
      {activeTab === 'grades' && (
        <div className="dash-card">
          <div className="dash-card-head">
            <h3>{t('classWorkspace.grades.title')}</h3>
          </div>
          {classExams.length === 0 ? (
            <p className="cw-empty-note">{t('classWorkspace.grades.empty')}</p>
          ) : (
            <>
              <div className="exam-select-row">
                <label>{t('classWorkspace.grades.selectExam')}</label>
                <select value={currentExamId} onChange={(e) => setSelectedExamId(Number(e.target.value))}>
                  {classExams.map((e) => (
                    <option key={e.id} value={e.id}>{e.type} — {e.subject} ({e.date})</option>
                  ))}
                </select>
              </div>
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead><tr><th>{t('classWorkspace.grades.table.student')}</th><th>{t('classWorkspace.grades.marksNotMoreThan', { max: selectedExam?.maxMarks })}</th><th>{t('classWorkspace.grades.table.percent')}</th></tr></thead>
                  <tbody>
                    {classStudents.map((s) => {
                      const key = markKey(currentExamId, s.id);
                      const savedMark = examMarks[currentExamId]?.[s.id];
                      const mark = pendingMarks[key] !== undefined ? pendingMarks[key] : savedMark;
                      const pct = mark !== undefined && mark !== '' ? Math.round((mark / selectedExam.maxMarks) * 100) : null;
                      return (
                        <tr key={s.id}>
                          <td>
                            <div className="cell-person">
                              <div className="cell-avatar">{initials(s.fullName)}</div>
                              <span className="cell-name">{s.fullName}</span>
                            </div>
                          </td>
                          <td>
                            <input
                              type="number"
                              className="marks-input"
                              min="0"
                              max={selectedExam?.maxMarks}
                              value={mark ?? ''}
                              onChange={(ev) => handleMarkChange(currentExamId, s.id, ev.target.value)}
                              onBlur={() => commitMark(currentExamId, s.id)}
                              placeholder="—"
                            />
                          </td>
                          <td className="cell-sub">{pct !== null ? `${pct}%` : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== QURAANKA ===== */}
      {activeTab === 'quran' && (
        <div className="dash-card">
          <div className="dash-card-head">
            <h3>{t('classWorkspace.quran.title')}</h3>
            <span className="cw-count-badge">{todayISODate()}</span>
          </div>

          <div className="cw-quran-surah-row">
            <label>{t('classWorkspace.quran.surahLabel')}</label>
            <input
              type="text"
              placeholder={t('classWorkspace.quran.surahPlaceholder')}
              value={surahInput}
              onChange={(e) => setSurahInput(e.target.value)}
            />
          </div>

          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>{t('classWorkspace.quran.table.student')}</th><th>{t('classWorkspace.quran.table.currentStatus')}</th><th>{t('classWorkspace.quran.table.mark')}</th></tr></thead>
              <tbody>
                {classStudents.map((s) => {
                  const progress = quranProgressToday[s.id];
                  return (
                    <tr key={s.id}>
                      <td>
                        <div className="cell-person">
                          <div className="cell-avatar">{initials(s.fullName)}</div>
                          <span className="cell-name">{s.fullName}</span>
                        </div>
                      </td>
                      <td>
                        {progress?.result === 'gartay' && <span className="badge badge-success">{t('classWorkspace.quran.knew')}{progress.surah ? ` — ${progress.surah}` : ''}</span>}
                        {progress?.result === 'garanwaa' && <span className="badge badge-danger">{t('classWorkspace.quran.didNotKnow')}{progress.surah ? ` — ${progress.surah}` : ''}</span>}
                        {!progress && <span className="badge badge-neutral">{t('classWorkspace.quran.notMarkedYet')}</span>}
                      </td>
                      <td>
                        <div className="att-status-btn-group">
                          <button
                            className={`att-status-btn present${progress?.result === 'gartay' ? ' active' : ''}`}
                            onClick={() => setQuranProgress(s.id, s.className, 'gartay', surahInput)}
                          >
                            {t('classWorkspace.quran.knew')}
                          </button>
                          <button
                            className={`att-status-btn absent${progress?.result === 'garanwaa' ? ' active' : ''}`}
                            onClick={() => setQuranProgress(s.id, s.className, 'garanwaa', surahInput)}
                          >
                            {t('classWorkspace.quran.didNotKnow')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {classStudents.length === 0 && (
                  <tr><td colSpan="3" style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>{t('classWorkspace.quran.empty')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== YOOLKA QURAANKA ===== */}
      {activeTab === 'quranTargets' && (
        <div className="dash-card">
          <div className="dash-card-head">
            <h3>{t('classWorkspace.quranTargets.title')}</h3>
          </div>

          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('classWorkspace.quranTargets.table.student')}</th>
                  <th>{t('classWorkspace.quranTargets.table.currentPosition')}</th>
                  <th>{t('classWorkspace.quranTargets.table.target')}</th>
                  <th>{t('classWorkspace.quranTargets.table.deadline')}</th>
                  <th>{t('classWorkspace.quranTargets.table.status')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((s) => {
                  const target = latestTargetByStudent[s.id];
                  const daysLeft = target ? Math.max(0, Math.ceil((new Date(target.deadline).getTime() - Date.now()) / DAY_MS)) : 0;
                  // Xannibaad: haddii arday leeyahay yool "pending" ah oo taariikhdiisu
                  // weli MUSTAQBAL tahay (aan la gaadhin), macallinku kama sameyn karo
                  // yool cusub ilaa uu ka jawaabo (Sax/Khalad) ama ilaa taariikhdu gaadho.
                  const locked = !!target && target.status === 'pending' && todayISODate() < target.deadline;
                  return (
                    <tr key={s.id}>
                      <td>
                        <div className="cell-person">
                          <div className="cell-avatar">{initials(s.fullName)}</div>
                          <span className="cell-name">{s.fullName}</span>
                        </div>
                      </td>
                      <td className="cell-sub" dir="auto">{target?.currentPosition || '—'}</td>
                      <td className="cell-sub" dir="auto">{target?.targetPosition || '—'}</td>
                      <td className="cell-sub">{target ? formatDMY(target.deadline) : '—'}</td>
                      <td>
                        {!target && <span className="badge badge-neutral">—</span>}
                        {target?.status === 'pending' && (
                          <>
                            <span className="badge badge-warning">{t('classWorkspace.quranTargets.pendingUntilLabel', { date: formatDMY(target.deadline) })}</span>
                            <div className="cell-sub">{t('classWorkspace.quranTargets.daysLeftLabel', { count: daysLeft })}</div>
                          </>
                        )}
                        {target?.status === 'reached' && (
                          <span className="badge badge-success">{t('classWorkspace.quranTargets.status.reached')}</span>
                        )}
                        {target?.status === 'missed' && (
                          <span className="badge badge-danger">{t('classWorkspace.quranTargets.status.missed')}</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={locked}
                          title={locked ? t('classWorkspace.quranTargets.lockedTooltip', { date: formatDMY(target.deadline) }) : undefined}
                          onClick={() => setTargetModalStudent(s)}
                        >
                          {t('classWorkspace.quranTargets.setTarget')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {classStudents.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>{t('classWorkspace.quranTargets.empty')}</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {expiredPendingTarget && (
            <div className="qtm-overlay" onClick={(e) => e.target === e.currentTarget && setDismissedPromptIds((prev) => [...prev, expiredPendingTarget.id])}>
              <div className="qtm-modal cw-qtp-modal">
                <div className="qtm-header">
                  <h2>{t('classWorkspace.quranTargets.promptTitle', { name: expiredPendingTarget.studentName, target: expiredPendingTarget.targetPosition })}</h2>
                </div>
                <div className="qtm-footer cw-qtp-footer">
                  <button type="button" className="btn-secondary cw-qtp-btn-danger" onClick={() => recordQuranTargetOutcome(expiredPendingTarget.id, false)}>
                    {t('classWorkspace.quranTargets.promptMissed')}
                  </button>
                  <button type="button" className="btn-primary" onClick={() => recordQuranTargetOutcome(expiredPendingTarget.id, true)}>
                    {t('classWorkspace.quranTargets.promptReached')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== JADWALKA ===== */}
      {activeTab === 'schedule' && (
        <div className="dash-card">
          <div className="dash-card-head">
            <h3>{t('classWorkspace.schedule.title', { day: todayDayLabel })}</h3>
          </div>
          {todaysSchedule.length === 0 ? (
            <p className="cw-empty-note">{t('classWorkspace.schedule.empty', { day: todayDayLabel })}</p>
          ) : (
            <div className="cw-schedule-list">
              {todaysSchedule.map((entry, i) => (
                <div className="cw-schedule-row" key={i}>
                  <div className="cw-schedule-time">{entry.time}</div>
                  <div>
                    <div className="cw-schedule-subject">{entry.subject}</div>
                    <div className="cw-schedule-teacher">{entry.teacherName}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <QuranTargetFormModal
        isOpen={!!targetModalStudent}
        onClose={() => setTargetModalStudent(null)}
        student={targetModalStudent}
        onSave={(data) =>
          saveQuranTarget(targetModalStudent.id, targetModalStudent.fullName, targetModalStudent.className, data)
        }
      />
    </div>
  );
}

export default ClassWorkspace;
