import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useSchoolData } from '../../context/SchoolDataContext';
import './Sidebar.css';

// roles: haddii la reebo (undefined), dhammaan school-staff-ku way arki karaan.
// Haddii la qeexo, kaliya doorarka ku jira liiska ayaa arki kara link-gan.
const NAV_ITEMS = [
  {
    section: 'Guud',
    items: [
      { to: '/dashboard', label: 'Dashboard-ka', end: true, icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12l9-9 9 9M5 10v10h14V10"/></svg>
      )},
      { to: '/dashboard/notifications', label: 'Ogeysiisyada', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0"/></svg>
      )},
      { to: '/dashboard/messages', label: 'Fariimaha', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
      )},
      // Dejinta (Settings) waa in shaqaale kastaa gaadho — macallinku wuxuu
      // kaliya arkaa tab-ka "Akoonkayga" (beddelidda password-ka, fiiri
      // Settings.jsx), owner-ku wuxuu arkaa tabyada oo dhan. Sidaas darteed
      // ma jirto roles-restriction halkan, kama aha "Nidaamka" (owner-only)
      // (Teacher Role Scoping audit, 2026-08-02).
      { to: '/dashboard/settings', label: 'Dejinta', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09A1.65 1.65 0 0015 4.6a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
      )},
    ],
  },
  {
    section: 'Maamulka',
    items: [
      { to: '/dashboard/students', label: 'Ardayda', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 14a4 4 0 100-8 4 4 0 000 8zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"/></svg>
      )},
      { to: '/dashboard/teachers', label: 'Macallimiinta', roles: ['owner'], icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v12H8l-4 4V4z"/></svg>
      )},
      { to: '/dashboard/classes', label: 'Fasallada', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/></svg>
      )},
      { to: '/dashboard/subjects', label: 'Maadooyinka', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/><path d="M8 7h8M8 11h8"/></svg>
      )},
      { to: '/dashboard/attendance', label: 'Imaanshaha', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/></svg>
      )},
      { to: '/dashboard/exams', label: 'Imtixaanada', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
      )},
    ],
  },
  {
    section: 'Maaliyadda',
    roles: ['owner'],
    items: [
      { to: '/dashboard/finance', label: 'Lacagta', roles: ['owner'], icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
      )},
      { to: '/dashboard/reports', label: 'Warbixinno', roles: ['owner'], icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18M18.7 8l-5.1 5.1-3-3L3 17.4"/></svg>
      )},
    ],
  },
  {
    section: 'Nidaamka',
    roles: ['owner'],
    items: [
      { to: '/dashboard/users', label: 'Shaqaalaha', roles: ['owner'], icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
      )},
      { to: '/dashboard/trash', label: 'Xogta La Tirtiray', roles: ['owner'], icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>
      )},
      { to: '/dashboard/archived-students', label: 'Ardayda Qalin-jabiyay', roles: ['owner'], icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></svg>
      )},
    ],
  },
];

// School-staff role-yada oo dhan (Owner, Principal, VP, Accountant, Receptionist)
// waxay hadda ku jiraan isla "owner" heerka sahay-ka ah, marka laga reebo 'teacher'.
// Sidaas darteed: role kastaa oo aan ahayn 'teacher' wuxuu u dhaqmaa sidii 'owner'.
function normalizeRole(role) {
  return role === 'teacher' ? 'teacher' : 'owner';
}

function canSee(item, effectiveRole) {
  if (!item.roles) return true;
  return item.roles.includes(effectiveRole);
}

function Sidebar({ isOpen, onClose }) {
  const { profile, logout } = useAuth();
  const { settings } = useSettings();
  const { staffMessages, classes, deletedStudents } = useSchoolData();
  const effectiveRole = normalizeRole(profile?.role);

  // Macallinku wuxuu kaliya arkaa fariimaha fasalladiisa — barbardhig ID dhab
  // ah (classTeacherId === profile.teacherDocId), ma aha isbarbardhig magac
  // (fiiri commit-kii ka saaray isbarbardhigga magac-ku-salaysan). Haddii
  // macallinku aanu weli ku xirneyn diiwaanka Teachers (teacherDocId maqan),
  // 0 fasal ayuu arkaa — sax, ma aha khalad qarsoon.
  const myClassNames = useMemo(() => {
    if (profile?.role !== 'teacher') return null;
    if (!profile?.teacherDocId) return [];
    return classes.filter((c) => c.classTeacherId === profile.teacherDocId).map((c) => `${c.grade}${c.section}`);
  }, [classes, profile?.role, profile?.teacherDocId]);

  const unreadMessagesCount = useMemo(() => {
    const relevant = myClassNames ? staffMessages.filter((m) => myClassNames.includes(m.className)) : staffMessages;
    return relevant.filter((m) => m.senderRole === 'parent' && !m.readByStaff).length;
  }, [staffMessages, myClassNames]);

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose}></div>}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          {settings.school.logo ? (
            <img className="sidebar-brand-logo" src={settings.school.logo} alt={settings.school.name} />
          ) : (
            <svg viewBox="0 0 40 40" fill="none">
              <path d="M8 30 C8 18, 16 8, 28 8" stroke="#16C784" strokeWidth="4" strokeLinecap="round" fill="none"/>
              <circle cx="30" cy="8" r="3" fill="#0B1F2B"/>
              <path d="M8 30 H24" stroke="#0B1F2B" strokeWidth="4" strokeLinecap="round"/>
            </svg>
          )}
          <span>{settings.school.name}<span className="dot">.</span></span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.filter((group) => canSee(group, effectiveRole)).map((group) => {
            const visibleItems = group.items.filter((item) => canSee(item, effectiveRole));
            if (visibleItems.length === 0) return null;

            return (
              <div className="nav-group" key={group.section}>
                <div className="nav-group-label">{group.section}</div>
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                    onClick={onClose}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {item.label}
                    {item.to === '/dashboard/messages' && unreadMessagesCount > 0 && (
                      <span className="nav-item-badge">{unreadMessagesCount}</span>
                    )}
                    {item.to === '/dashboard/trash' && deletedStudents.length > 0 && (
                      <span className="nav-item-badge">{deletedStudents.length}</span>
                    )}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {(profile?.fullName || 'U').slice(0, 2).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{profile?.fullName || 'Isticmaale'}</div>
              <div className="sidebar-user-role">{profile?.role || '—'}</div>
            </div>
          </div>
          <button className="sidebar-logout" onClick={logout} title="Ka Bax">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;