import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useSchoolData } from '../../context/SchoolDataContext';
import '../../styles/dashboard-shared.css';
import './Messages.css';

function initials(name) {
  return name ? name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() : '';
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function Messages() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { students, classes, staffMessages, sendStaffMessage, markThreadReadByStaff } = useSchoolData();
  const [search, setSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef(null);

  // Macallinku wuxuu kaliya arkaa ardayda fasalladiisa — barbardhig ID dhab
  // ah (classTeacherId === profile.teacherDocId), ma aha isbarbardhig magac.
  // Owner-ku wuxuu arkaa dhammaan ardayda.
  const myClassNames = useMemo(() => {
    if (profile?.role !== 'teacher') return null;
    if (!profile?.teacherDocId) return [];
    return classes.filter((c) => c.classTeacherId === profile.teacherDocId).map((c) => `${c.grade}${c.section}`);
  }, [classes, profile?.role, profile?.teacherDocId]);

  const visibleStudents = useMemo(
    () => (myClassNames ? students.filter((s) => myClassNames.includes(s.className)) : students),
    [students, myClassNames]
  );

  const threads = useMemo(() => {
    return visibleStudents
      .map((s) => {
        const msgs = staffMessages.filter((m) => m.studentId === s.id);
        const last = msgs[msgs.length - 1] || null;
        const unread = msgs.filter((m) => m.senderRole === 'parent' && !m.readByStaff).length;
        return { student: s, messages: msgs, last, unread };
      })
      .filter((th) => th.student.fullName.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (a.last && b.last) return b.last.createdAt.localeCompare(a.last.createdAt);
        if (a.last) return -1;
        if (b.last) return 1;
        return a.student.fullName.localeCompare(b.student.fullName);
      });
  }, [visibleStudents, staffMessages, search]);

  const selectedThread = threads.find((th) => th.student.id === selectedStudentId) || null;

  useEffect(() => {
    if (selectedThread && selectedThread.unread > 0) {
      markThreadReadByStaff(selectedThread.student.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThread?.student.id, selectedThread?.unread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedThread?.messages.length]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!draft.trim() || !selectedThread) return;
    const parentMsg = selectedThread.messages.find((m) => m.senderRole === 'parent');
    sendStaffMessage(
      selectedThread.student.id,
      selectedThread.student.fullName,
      selectedThread.student.className,
      parentMsg?.senderId || null,
      draft
    );
    setDraft('');
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>{t('messages.pageTitle')}</h2>
          <p>{t('messages.pageSubtitle')}</p>
        </div>
        <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          {t('common.backToDashboard')}
        </button>
      </div>

      <div className="msg-layout">
        <div className="msg-list-panel">
          <div className="msg-search">
            <div className="table-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input
                type="text"
                placeholder={t('messages.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="msg-thread-list">
            {threads.length === 0 && <div className="msg-empty-note">{t('messages.noStudents')}</div>}
            {threads.map((th) => (
              <button
                key={th.student.id}
                className={`msg-thread-item ${selectedStudentId === th.student.id ? 'active' : ''}`}
                onClick={() => setSelectedStudentId(th.student.id)}
              >
                <div className="msg-thread-avatar">{initials(th.student.fullName)}</div>
                <div className="msg-thread-body">
                  <div className="msg-thread-top">
                    <span className="msg-thread-name">{th.student.fullName}</span>
                    {th.last && <span className="msg-thread-time">{formatTime(th.last.createdAt)}</span>}
                  </div>
                  <div className="msg-thread-preview">{th.last ? th.last.text : t('messages.noMessagesYet')}</div>
                </div>
                {th.unread > 0 && <span className="msg-thread-unread-dot"></span>}
              </button>
            ))}
          </div>
        </div>

        <div className="msg-panel">
          {!selectedThread ? (
            <div className="msg-empty-state">
              <p>{t('messages.selectStudent')}</p>
            </div>
          ) : (
            <>
              <div className="msg-panel-head">
                <div className="msg-thread-avatar">{initials(selectedThread.student.fullName)}</div>
                <div>
                  <div className="msg-panel-name">{selectedThread.student.fullName}</div>
                  <div className="msg-panel-class">{selectedThread.student.className}</div>
                </div>
              </div>

              <div className="msg-bubble-list">
                {selectedThread.messages.length === 0 && (
                  <p className="msg-empty-note">{t('messages.startConversation')}</p>
                )}
                {selectedThread.messages.map((m) => (
                  <div key={m.id} className={`msg-bubble-row ${m.senderRole === 'staff' ? 'mine' : ''}`}>
                    <div className="msg-bubble">
                      <div className="msg-bubble-text">{m.text}</div>
                      <div className="msg-bubble-time">{formatTime(m.createdAt)}</div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <form className="msg-compose" onSubmit={handleSend}>
                <input
                  type="text"
                  placeholder={t('messages.composePlaceholder')}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button type="submit" className="msg-send-btn" disabled={!draft.trim()}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Messages;
