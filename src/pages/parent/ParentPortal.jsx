import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getStudentsByIds } from '../../firebase/students';
import { subscribeToStudentAttendanceHistory } from '../../firebase/attendance';
import { subscribeToStudentQuranProgressHistory } from '../../firebase/quranProgress';
import { subscribeToQuranTargetsForStudent } from '../../firebase/quranTargets';
import { subscribeToStudentExamMarks } from '../../firebase/examMarks';
import { subscribeToClassExamsForParent } from '../../firebase/exams';
import { subscribeToStudentFeePayments } from '../../firebase/finance';
import { addChildToParent } from '../../firebase/auth';
import { subscribeToThread, sendMessage, markMessagesRead } from '../../firebase/messages';
import { subscribeToNotificationsForChildren, markNotificationsRead } from '../../firebase/notifications';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { formatDMY, currentMonthValue } from '../../utils/somaliDate';
import { getMonthlyFeeStatus, studentFeeOwed } from '../../utils/studentFee';
import '../../styles/dashboard-shared.css';
import './ParentPortal.css';

function gradeFromPercent(pct) {
  if (pct >= 80) return 'A';
  if (pct >= 65) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
}

function initials(name) {
  return name ? name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() : '';
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function AddChildForm({ onAdd, onCancel, loading, error }) {
  const { t } = useTranslation();
  const [diiwaanId, setDiiwaanId] = useState('');
  return (
    <form
      className="pp-addchild-form"
      onSubmit={(e) => { e.preventDefault(); onAdd(diiwaanId); }}
    >
      {error && <div className="form-error">{error}</div>}
      <input
        type="text"
        placeholder={t('parentPortal.addChildPlaceholder')}
        value={diiwaanId}
        onChange={(e) => setDiiwaanId(e.target.value)}
        required
      />
      <button type="submit" className="btn-primary" disabled={loading}>{loading ? t('parentPortal.addChildSubmitting') : t('parentPortal.addChildSubmit')}</button>
      {onCancel && <button type="button" className="btn-secondary" onClick={onCancel}>{t('parentPortal.addChildCancel')}</button>}
    </form>
  );
}

function ParentPortal() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('attendance');
  const { profile, logout } = useAuth();
  const { showError } = useToast();
  const navigate = useNavigate();

  const reportError = (message, err) => {
    console.error(message, err);
    showError(message);
  };

  const TABS = [
    { id: 'attendance', label: t('parentPortal.tabs.attendance') },
    { id: 'quran', label: t('parentPortal.tabs.quran') },
    { id: 'fees', label: t('parentPortal.tabs.fees') },
    { id: 'results', label: t('parentPortal.tabs.results') },
    { id: 'messages', label: t('parentPortal.tabs.messages') },
    { id: 'behaviour', label: t('parentPortal.tabs.behaviour') },
    { id: 'examdates', label: t('parentPortal.tabs.examdates') },
  ];

  const [childrenIds, setChildrenIds] = useState(profile?.childrenIds || []);
  const [children, setChildren] = useState([]);
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [quranProgressHistory, setQuranProgressHistory] = useState([]);
  const [studentQuranTargets, setStudentQuranTargets] = useState([]);
  const [studentExamMarks, setStudentExamMarks] = useState([]);
  const [classExams, setClassExams] = useState([]);
  const [feePaymentsHistory, setFeePaymentsHistory] = useState([]);
  const [threadMessages, setThreadMessages] = useState([]);
  const [messageDraft, setMessageDraft] = useState('');
  const messagesEndRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifPanelRef = useRef(null);

  const [showAddChild, setShowAddChild] = useState(false);
  const [addChildLoading, setAddChildLoading] = useState(false);
  const [addChildError, setAddChildError] = useState('');

  // Soo qaad diiwaannada ardayda ee childrenIds-ka ku jira
  useEffect(() => {
    if (childrenIds.length === 0) {
      setChildren([]);
      setChildrenLoading(false);
      return;
    }
    setChildrenLoading(true);
    getStudentsByIds(childrenIds)
      .then((list) => {
        setChildren(list);
        setChildrenLoading(false);
        setSelectedChildId((prev) => (prev && list.some((c) => c.id === prev) ? prev : list[0]?.id));
      })
      .catch((err) => {
        reportError('Khalad ayaa dhacay markii ilmaha laga soo akhriyay:', err);
        setChildrenLoading(false);
      });
  }, [childrenIds]);

  // Taariikhda imaanshaha ee ilmaha la doortay
  useEffect(() => {
    if (!profile?.schoolCode || !selectedChildId) {
      setAttendanceHistory([]);
      return undefined;
    }
    const unsubscribe = subscribeToStudentAttendanceHistory(
      profile.schoolCode,
      selectedChildId,
      setAttendanceHistory,
      (err) => reportError('Khalad ayaa dhacay markii imaanshaha laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, selectedChildId]);

  // Garashada Quraanka maalinlaha ah ee ilmaha la doortay
  useEffect(() => {
    if (!profile?.schoolCode || !selectedChildId) {
      setQuranProgressHistory([]);
      return undefined;
    }
    const unsubscribe = subscribeToStudentQuranProgressHistory(
      profile.schoolCode,
      selectedChildId,
      setQuranProgressHistory,
      (err) => reportError('Khalad ayaa dhacay markii garashada Quraanka laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, selectedChildId]);

  // Yoolka Quraanka ee ilmaha la doortay
  useEffect(() => {
    if (!profile?.schoolCode || !selectedChildId) {
      setStudentQuranTargets([]);
      return undefined;
    }
    const unsubscribe = subscribeToQuranTargetsForStudent(
      profile.schoolCode,
      selectedChildId,
      setStudentQuranTargets,
      (err) => reportError('Khalad ayaa dhacay markii yoolka Quraanka laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, selectedChildId]);

  // Buundooyinka imtixaanada ee ilmaha la doortay
  useEffect(() => {
    if (!profile?.schoolCode || !selectedChildId) {
      setStudentExamMarks([]);
      return undefined;
    }
    const unsubscribe = subscribeToStudentExamMarks(
      profile.schoolCode,
      selectedChildId,
      setStudentExamMarks,
      (err) => reportError('Khalad ayaa dhacay markii buundooyinka laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, selectedChildId]);

  // Imtixaannada fasalka ilmaha la doortay KALIYA (classId-scoped) — ma aha
  // dhammaan imtixaanada dugsiga (kaas oo staff-only, fiiri
  // SchoolDataContext.jsx). Haddii ilmuhu weli aanu lahayn classId (aan la
  // dib-u-kaydin dropdown-ka cusub), liiskan wuu madhnaan doonaa ilaa la
  // dib-u-kaydiyo.
  useEffect(() => {
    const child = children.find((c) => c.id === selectedChildId);
    if (!profile?.schoolCode || !child?.classId) {
      setClassExams([]);
      return undefined;
    }
    const unsubscribe = subscribeToClassExamsForParent(
      profile.schoolCode,
      child.classId,
      setClassExams,
      (err) => reportError('Khalad ayaa dhacay markii imtixaanada laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, selectedChildId, children]);

  // Taariikhda bixinnada lacagta ee ilmaha la doortay (feePayments dhab ah,
  // halkii ay ka akhrin lahaayeen selectedChild.fees oo ah array hore oo
  // marna aan la buuxin).
  useEffect(() => {
    if (!profile?.schoolCode || !selectedChildId) {
      setFeePaymentsHistory([]);
      return undefined;
    }
    const unsubscribe = subscribeToStudentFeePayments(
      profile.schoolCode,
      selectedChildId,
      setFeePaymentsHistory,
      (err) => reportError('Khalad ayaa dhacay markii taariikhda lacagta laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, selectedChildId]);

  // Fariimaha (Waalid <-> Shaqaale) ee ilmaha la doortay
  useEffect(() => {
    if (!profile?.schoolCode || !selectedChildId) {
      setThreadMessages([]);
      return undefined;
    }
    const unsubscribe = subscribeToThread(
      profile.schoolCode,
      selectedChildId,
      setThreadMessages,
      (err) => reportError('Khalad ayaa dhacay markii fariimaha laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, selectedChildId]);

  useEffect(() => {
    if (activeTab !== 'messages') return;
    const unreadIds = threadMessages
      .filter((m) => m.senderRole === 'staff' && !m.readByParent)
      .map((m) => m.id);
    if (unreadIds.length > 0) {
      markMessagesRead(unreadIds, 'parent').catch((err) =>
        reportError('Khalad ayaa dhacay markii fariimaha la calaamadinayay in la akhriyay:', err)
      );
    }
  }, [activeTab, threadMessages]);

  useEffect(() => {
    if (activeTab === 'messages') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, threadMessages.length]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageDraft.trim() || !selectedChild) return;
    await sendMessage({
      schoolCode: profile.schoolCode,
      studentId: selectedChild.id,
      studentName: selectedChild.fullName,
      className: selectedChild.className,
      parentId: profile.uid,
      senderRole: 'parent',
      senderId: profile.uid,
      senderName: profile.fullName,
      text: messageDraft.trim(),
    });
    setMessageDraft('');
  };

  // Ogeysiisyada (Xasuusin Lacageed + Alert Maqnaansho) — dhammaan ilmaha waalidku leeyahay
  useEffect(() => {
    if (!profile?.schoolCode || childrenIds.length === 0) {
      setNotifications([]);
      return undefined;
    }
    const unsubscribe = subscribeToNotificationsForChildren(
      profile.schoolCode,
      childrenIds,
      setNotifications,
      (err) => reportError('Khalad ayaa dhacay markii ogeysiisyada laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, childrenIds]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target)) {
        setShowNotifPanel(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadNotifCount = notifications.filter((n) => !n.readByParent).length;

  const handleNotifClick = (n) => {
    markNotificationsRead([n.id], 'parent').catch((err) =>
      reportError('Khalad ayaa dhacay markii ogeysiiska la calaamadinayay in la akhriyay:', err)
    );
  };

  const handleMarkAllNotifsRead = () => {
    const unreadIds = notifications.filter((n) => !n.readByParent).map((n) => n.id);
    if (unreadIds.length === 0) return;
    markNotificationsRead(unreadIds, 'parent').catch((err) =>
      reportError('Khalad ayaa dhacay markii dhammaan ogeysiisyada la calaamadinayay:', err)
    );
    setShowNotifPanel(false);
    if (n.studentId !== selectedChildId) setSelectedChildId(n.studentId);
    setActiveTab(n.type === 'fee' ? 'fees' : 'attendance');
  };

  const selectedChild = children.find((c) => c.id === selectedChildId) || null;

  const currentMonth = currentMonthValue();
  const feeStatus = selectedChild ? getMonthlyFeeStatus(selectedChild, feePaymentsHistory, currentMonth) : null;
  const feeOwed = selectedChild ? studentFeeOwed(selectedChild) : 0;

  const latestQuranTarget = useMemo(() => {
    return studentQuranTargets.reduce((latest, qt) => (!latest || qt.createdAt > latest.createdAt ? qt : latest), null);
  }, [studentQuranTargets]);

  const attendanceRate = useMemo(() => {
    if (attendanceHistory.length === 0) return 0;
    const present = attendanceHistory.filter((a) => a.status === 'present').length;
    return Math.round((present / attendanceHistory.length) * 100);
  }, [attendanceHistory]);

  const results = useMemo(() => {
    if (!selectedChild) return [];
    const marksByExamId = {};
    studentExamMarks.forEach((r) => { marksByExamId[r.examId] = r.mark; });
    return classExams
      .map((e) => {
        const mark = marksByExamId[e.id];
        const hasMark = mark !== undefined && mark !== '' && mark !== null;
        const pct = hasMark ? (mark / e.maxMarks) * 100 : null;
        return { exam: e, mark, hasMark, grade: hasMark ? gradeFromPercent(pct) : null };
      });
  }, [classExams, studentExamMarks, selectedChild]);

  const upcomingExams = useMemo(() => {
    if (!selectedChild) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return classExams
      .filter((e) => new Date(e.date) >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [classExams, selectedChild]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleAddChild = async (diiwaanId) => {
    setAddChildError('');
    setAddChildLoading(true);
    try {
      const student = await addChildToParent(profile.uid, profile.schoolCode, diiwaanId);
      setChildrenIds((prev) => (prev.includes(student.id) ? prev : [...prev, student.id]));
      setShowAddChild(false);
    } catch (err) {
      setAddChildError(err.message === 'ARDAY_LAMA_HELIN' ? t('parentPortal.addChildNotFound') : t('parentPortal.addChildGenericError'));
    } finally {
      setAddChildLoading(false);
    }
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
          <span>Kayd<span className="pp-dot">.</span> {t('parentPortal.brandSuffix')}</span>
        </div>
        <div className="pp-header-right">
          <span className="pp-welcome">{t('parentPortal.welcome', { name: profile?.fullName || t('parentPortal.defaultParentName') })}</span>

          <div className="pp-notif-wrap" ref={notifPanelRef}>
            <button className="pp-notif-btn" onClick={() => setShowNotifPanel((v) => !v)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0"/></svg>
              {unreadNotifCount > 0 && <span className="pp-notif-dot"></span>}
            </button>

            {showNotifPanel && (
              <div className="pp-notif-panel">
                <div className="pp-notif-panel-head">
                  <h3>{t('parentPortal.notifications.title')}</h3>
                  {unreadNotifCount > 0 && (
                    <button className="pp-notif-mark-all" onClick={handleMarkAllNotifsRead}>
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                      {t('parentPortal.notifications.markAllRead')} ({unreadNotifCount})
                    </button>
                  )}
                </div>
                <div className="pp-notif-list">
                  {notifications.length === 0 && (
                    <div className="pp-notif-empty">{t('parentPortal.notifications.empty')}</div>
                  )}
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      className={`pp-notif-item ${!n.readByParent ? 'unread' : ''}`}
                      onClick={() => handleNotifClick(n)}
                    >
                      <div className="pp-notif-item-body">
                        <div className="pp-notif-item-text">
                          {t(n.type === 'fee' ? 'notifications.feeMessage' : 'notifications.absentMessage', {
                            name: n.studentName,
                            className: n.className,
                          })}
                        </div>
                        <div className="pp-notif-item-time">{formatRelativeTime(n.createdAt)}</div>
                      </div>
                      {!n.readByParent && <span className="pp-notif-item-unread-dot"></span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button className="pp-logout" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            {t('parentPortal.logout')}
          </button>
        </div>
      </header>

      <div className="pp-container">

        {childrenLoading && (
          <div className="pp-card" style={{ textAlign: 'center', padding: 40 }}>{t('parentPortal.loading')}</div>
        )}

        {!childrenLoading && children.length === 0 && (
          <div className="pp-card">
            <h3 className="pp-card-title">{t('parentPortal.noChildTitle')}</h3>
            <p style={{ color: '#64748A', fontSize: 13.5, marginBottom: 18 }}>
              {t('parentPortal.noChildDesc')}
            </p>
            <AddChildForm onAdd={handleAddChild} loading={addChildLoading} error={addChildError} />
          </div>
        )}

        {!childrenLoading && selectedChild && (
          <>
            <div className="pp-child-card">
              <div className="pp-child-avatar">{initials(selectedChild.fullName)}</div>
              <div className="pp-child-info">
                <h2>{selectedChild.fullName}</h2>
                <p>{selectedChild.studentId} &middot; {selectedChild.className}</p>
              </div>
              <div className="pp-child-stat">
                <span>{attendanceRate}%</span>
                <label>{t('parentPortal.attendanceRateLabel')}</label>
              </div>
            </div>

            {children.length > 1 && (
              <div className="pp-child-switcher">
                {children.map((c) => (
                  <button
                    key={c.id}
                    className={`pp-child-chip ${c.id === selectedChildId ? 'active' : ''}`}
                    onClick={() => setSelectedChildId(c.id)}
                  >
                    {c.fullName}
                  </button>
                ))}
              </div>
            )}

            {!showAddChild ? (
              <button type="button" className="pp-addchild-link" onClick={() => setShowAddChild(true)}>
                {t('parentPortal.addChildLink')}
              </button>
            ) : (
              <div className="pp-card" style={{ marginBottom: 20 }}>
                <AddChildForm onAdd={handleAddChild} onCancel={() => setShowAddChild(false)} loading={addChildLoading} error={addChildError} />
              </div>
            )}

            <div className="pp-tabs">
              {TABS.map((tb) => (
                <button key={tb.id} className={`pp-tab ${activeTab === tb.id ? 'active' : ''}`} onClick={() => setActiveTab(tb.id)}>
                  {tb.label}
                </button>
              ))}
            </div>

            <div className="pp-card">

              {activeTab === 'attendance' && (
                <>
                  <h3 className="pp-card-title">{t('parentPortal.attendance.title')}</h3>
                  {attendanceHistory.length === 0 ? (
                    <p className="pp-empty-note">{t('parentPortal.attendance.empty')}</p>
                  ) : (
                    <div className="pp-attendance-grid">
                      {attendanceHistory.map((a) => (
                        <div key={a.date} className={`pp-att-cell ${a.status}`} title={a.date}>
                          <span className="pp-att-date">{a.date.split('-')[2]}</span>
                          <span className="pp-att-status">{t(`common.${a.status}`, a.status)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'quran' && (
                <>
                  <h3 className="pp-card-title">{t('parentPortal.quran.targetTitle')}</h3>
                  {!latestQuranTarget ? (
                    <p className="pp-empty-note">{t('parentPortal.quran.targetEmpty')}</p>
                  ) : (
                    <div className="data-table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>{t('parentPortal.quran.currentPositionLabel')}</th>
                            <th>{t('parentPortal.quran.targetLabel')}</th>
                            <th>{t('parentPortal.quran.deadlineLabel')}</th>
                            <th>{t('parentPortal.fees.table.status')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td dir="auto">{latestQuranTarget.currentPosition || '—'}</td>
                            <td dir="auto">{latestQuranTarget.targetPosition || '—'}</td>
                            <td className="cell-sub">{formatDMY(latestQuranTarget.deadline)}</td>
                            <td>
                              {latestQuranTarget.status === 'pending' && <span className="badge badge-warning">{t('parentPortal.quran.status.pending')}</span>}
                              {latestQuranTarget.status === 'reached' && <span className="badge badge-success">{t('parentPortal.quran.status.reached')}</span>}
                              {latestQuranTarget.status === 'missed' && <span className="badge badge-danger">{t('parentPortal.quran.status.missed')}</span>}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  <h3 className="pp-card-title" style={{ marginTop: 28 }}>{t('parentPortal.quran.progressTitle')}</h3>
                  {quranProgressHistory.length === 0 ? (
                    <p className="pp-empty-note">{t('parentPortal.quran.progressEmpty')}</p>
                  ) : (
                    <div className="data-table-wrap">
                      <table className="data-table">
                        <thead><tr><th>{t('parentPortal.fees.table.date')}</th><th>{t('parentPortal.quran.targetLabel')}</th><th>{t('parentPortal.fees.table.status')}</th></tr></thead>
                        <tbody>
                          {quranProgressHistory.map((r) => (
                            <tr key={r.date}>
                              <td className="cell-sub">{r.date}</td>
                              <td dir="auto">{r.surah || '—'}</td>
                              <td>
                                {r.result === 'gartay' && <span className="badge badge-success">{t('parentPortal.quran.knew')}</span>}
                                {r.result === 'garanwaa' && <span className="badge badge-danger">{t('parentPortal.quran.didNotKnow')}</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'fees' && (
                <>
                  <h3 className="pp-card-title">{t('parentPortal.fees.title')}</h3>
                  <p className="pp-fee-current-status">
                    <span className={`badge ${feeStatus === 'paid' ? 'badge-success' : feeStatus === 'free' ? 'badge-neutral' : 'badge-danger'}`}>
                      {t(`finance.classDetail.stats.${feeStatus}`)}
                    </span>
                    {feeStatus !== 'free' && <span className="pp-fee-amount">${feeOwed.toFixed(2)}</span>}
                  </p>

                  <h3 className="pp-card-title" style={{ marginTop: 24 }}>{t('parentPortal.fees.historyTitle')}</h3>
                  {feePaymentsHistory.length === 0 ? (
                    <p className="pp-empty-note">{t('parentPortal.fees.empty')}</p>
                  ) : (
                    <div className="data-table-wrap">
                      <table className="data-table">
                        <thead><tr><th>{t('parentPortal.fees.table.month')}</th><th>{t('parentPortal.fees.table.amount')}</th><th>{t('parentPortal.fees.table.date')}</th></tr></thead>
                        <tbody>
                          {feePaymentsHistory.map((p) => (
                            <tr key={p.id}>
                              <td>{p.month}</td>
                              <td>${(p.amount || 0).toFixed(2)}</td>
                              <td className="cell-sub">{p.date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'results' && (
                <>
                  <h3 className="pp-card-title">{t('parentPortal.results.title')}</h3>
                  {results.length === 0 ? (
                    <p className="pp-empty-note">{t('parentPortal.results.empty')}</p>
                  ) : (
                    <div className="data-table-wrap">
                      <table className="data-table">
                        <thead><tr><th>{t('parentPortal.results.table.subject')}</th><th>{t('parentPortal.results.table.type')}</th><th>{t('parentPortal.results.table.marks')}</th><th>{t('parentPortal.results.table.grade')}</th></tr></thead>
                        <tbody>
                          {results.map((r) => (
                            <tr key={r.exam.id}>
                              <td className="cell-name">{r.exam.subject}</td>
                              <td><span className="badge badge-neutral">{r.exam.type}</span></td>
                              <td>{r.hasMark ? `${r.mark}/${r.exam.maxMarks}` : t('parentPortal.results.notEntered')}</td>
                              <td>
                                {r.grade ? (
                                  <span className={`badge ${r.grade === 'A' ? 'badge-success' : r.grade === 'F' ? 'badge-danger' : 'badge-warning'}`}>
                                    {r.grade}
                                  </span>
                                ) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'messages' && (
                <>
                  <h3 className="pp-card-title">{t('parentPortal.messages.title')}</h3>
                  <div className="pp-chat">
                    <div className="pp-chat-bubble-list">
                      {threadMessages.length === 0 && (
                        <p className="pp-empty-note">{t('parentPortal.messages.empty')}</p>
                      )}
                      {threadMessages.map((m) => (
                        <div key={m.id} className={`pp-chat-row ${m.senderRole === 'parent' ? 'mine' : ''}`}>
                          <div className="pp-chat-bubble">
                            <div className="pp-chat-text">{m.text}</div>
                            <div className="pp-chat-time">{formatTime(m.createdAt)}</div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                    <form className="pp-chat-compose" onSubmit={handleSendMessage}>
                      <input
                        type="text"
                        placeholder={t('parentPortal.messages.composePlaceholder')}
                        value={messageDraft}
                        onChange={(e) => setMessageDraft(e.target.value)}
                      />
                      <button type="submit" className="pp-chat-send-btn" disabled={!messageDraft.trim()}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                      </button>
                    </form>
                  </div>
                </>
              )}

              {activeTab === 'behaviour' && (
                <>
                  <h3 className="pp-card-title">{t('parentPortal.behaviour.title')}</h3>
                  {(selectedChild.behaviour || []).length === 0 ? (
                    <p className="pp-empty-note">{t('parentPortal.behaviour.empty')}</p>
                  ) : (
                    <div className="pp-behaviour-list">
                      {selectedChild.behaviour.map((b, i) => (
                        <div key={i} className={`pp-behaviour-item ${b.type}`}>
                          <span className="pp-behaviour-dot"></span>
                          <div>
                            <p>{b.note}</p>
                            <span className="pp-behaviour-date">{b.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'examdates' && (
                <>
                  <h3 className="pp-card-title">{t('parentPortal.examdates.title')}</h3>
                  {upcomingExams.length === 0 ? (
                    <p className="pp-empty-note">{t('parentPortal.examdates.empty')}</p>
                  ) : (
                    <div className="data-table-wrap">
                      <table className="data-table">
                        <thead><tr><th>{t('parentPortal.examdates.table.subject')}</th><th>{t('parentPortal.examdates.table.type')}</th><th>{t('parentPortal.examdates.table.date')}</th></tr></thead>
                        <tbody>
                          {upcomingExams.map((e) => (
                            <tr key={e.id}>
                              <td className="cell-name">{e.subject}</td>
                              <td><span className="badge badge-neutral">{e.type}</span></td>
                              <td className="cell-sub">{e.date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ParentPortal;
