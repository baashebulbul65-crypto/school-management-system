import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import UserFormModal from './UserFormModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSchoolData } from '../../context/SchoolDataContext';
import { useSettings } from '../../context/SettingsContext';
import { subscribeToStaff, createStaffAccount, updateStaffDoc, setStaffStatus, removeStaffDoc } from '../../firebase/staff';
import { buildWhatsAppLink } from '../../utils/whatsapp';
import '../../styles/dashboard-shared.css';
import './Users.css';

// Role-yada la maamuli karo (heerka School-level, ma ahan Super Admin)
export const ROLE_OPTIONS = [
  'School Owner',
  'Principal',
  'Vice Principal',
  'Accountant',
  'Receptionist',
  'Teacher',
];

// Doorka ilaalinta (permission tier): 'Teacher' oo kaliya ayaa xaddidan,
// intiisa kale (Owner/Principal/VP/Accountant/Receptionist) waxay leeyihiin gelitaan buuxa.
// Tan waa doorka DHABTA AH ee firestore.rules/RequireRole isticmaalaan — 'title'
// waa magaca la muujiyo kaliya (cosmetic).
function permissionTier(roleLabel) {
  return roleLabel === 'Teacher' ? 'teacher' : 'owner';
}

const ROLE_COLOR = {
  'School Owner': 'navy',
  'Principal': 'purple',
  'Vice Principal': 'purple',
  'Accountant': 'teal',
  'Receptionist': 'blue',
  'Teacher': 'green',
};

function initials(name) {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function Users() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showError } = useToast();
  const { teachers, cascadeUnlinkTeacher } = useSchoolData();
  const { settings } = useSettings();
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [welcomeInfo, setWelcomeInfo] = useState(null);

  const reportError = (message, err) => {
    console.error(message, err);
    showError(message);
  };
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    if (!profile?.schoolCode) {
      setUsers([]);
      setUsersLoading(false);
      return undefined;
    }
    setUsersLoading(true);
    const unsubscribe = subscribeToStaff(
      profile.schoolCode,
      (list) => {
        setUsers(list);
        setUsersLoading(false);
      },
      (err) => {
        reportError(t('users.errors.fetchFailed'), err);
        setUsersLoading(false);
      }
    );
    return unsubscribe;
  }, [profile?.schoolCode]);

  // Doc-yada shaqaalaha hore loo abuuray (ka hor intaan 'title'/'status' la
  // darin) ma laha labadaas field — u dhig default si UI-gu uusan u jabin.
  const displayUsers = users.map((u) => ({
    ...u,
    title: u.title || (u.role === 'owner' ? 'School Owner' : 'Teacher'),
    status: u.status || 'active',
  }));

  const filtered = displayUsers.filter((u) => {
    const matchesSearch = (u.fullName || '').toLowerCase().includes(search.toLowerCase()) || (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.title === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Macallimiinta la soo bandhigi karo dropdown-ka "Xiriirinta Diiwaanka
  // Macallinka" (UserFormModal) — Audit (2026-08-02), gap #3: hore dhammaan
  // teachers ayaa la soo bandhigi jiray isla mar oo kaliya, taasoo u ogolaan
  // jirtay in laba account (users doc) oo kala duwan labaduba isku macallin
  // (teacherDocId) xiran yihiin (isku qas xog — labaduba isla fasallada ayay
  // arki lahaayeen). Halkan waxaa laga saarayaa: (1) macallimiinta 'inactive'
  // ah (isla filter-ka Teachers.jsx/ClassFormModal/SubjectFormModal), (2)
  // macallimiinta horeba account KALE (mid aan ahayn kan hadda la wax-ka-
  // beddelayo) ku xiran yahay — account-ka hadda la wax-ka-beddelayo (editingUser)
  // wuxuu sii haystaa xaqa uu ku xiran yahay macallinkiisa hadda jira.
  const linkedTeacherIds = new Set(
    users.filter((u) => u.teacherDocId && u.id !== editingUser?.id).map((u) => u.teacherDocId)
  );
  const availableTeacherOptions = teachers.filter((tc) => tc.status !== 'inactive' && !linkedTeacherIds.has(tc.id));

  const openAddModal = () => { setEditingUser(null); setShowFormModal(true); };
  const openEditModal = (user) => { setEditingUser(user); setShowFormModal(true); };

  // Waxay soo tuurtaa (throw) khaladaadka — UserFormModal ayaa isaga qabta
  // oo tusaya gudaha modal-ka, si aan modal-ku isugu xidhmin marka email-ku
  // horeba loo isticmaalay iwm.
  const handleSaveUser = async (payload, userId) => {
    if (userId) {
      await updateStaffDoc(userId, {
        fullName: payload.fullName,
        title: payload.title,
        role: permissionTier(payload.title),
        teacherDocId: payload.teacherDocId,
        salaryAmount: payload.salaryAmount,
      });
    } else {
      await createStaffAccount({
        schoolCode: profile.schoolCode,
        fullName: payload.fullName,
        email: payload.email,
        password: payload.password,
        role: permissionTier(payload.title),
        title: payload.title,
        teacherDocId: payload.teacherDocId,
        salaryAmount: payload.salaryAmount,
      });

      // WhatsApp welcome (macallin cusub kaliya) — password-ka plain-text
      // ah waxaa la heli karaa HALKAN OO KELIYA (payload.password), Firebase
      // Auth marnaba dib uma soo celiyo — sidaas darteed fariinta waa in
      // halkan la diyaariyaa, ma aha marka dib loo eego user-ka kadib.
      if (payload.title === 'Teacher') {
        const linkedTeacher = teachers.find((tc) => tc.id === payload.teacherDocId);
        const loginLink = `${window.location.origin}/?email=${encodeURIComponent(payload.email)}`;
        const message = t('users.whatsappWelcome.message', {
          name: payload.fullName,
          schoolName: settings.school.name || '',
          email: payload.email,
          password: payload.password,
          loginLink,
        });
        const link = buildWhatsAppLink(linkedTeacher?.phone, message);
        setWelcomeInfo({ name: payload.fullName, link });
      }
    }
  };

  const toggleStatus = async (user) => {
    try {
      await setStaffStatus(user.id, user.status === 'active' ? 'suspended' : 'active');
    } catch (err) {
      reportError(t('users.errors.statusUpdateFailed'), err);
    }
  };

  const handleRemove = async (userId, name) => {
    if (userId === profile?.uid) return;
    if (window.confirm(t('users.confirmRemove', { name }))) {
      try {
        // Haddii shaqaalahan uu xiriir la lahaa diiwaan "teachers" (macallin),
        // marka hore ka nadiifi fasallada/maadooyinka isaga hor intaan
        // account-ka gelitaanka la tirtirin (fiiri SchoolDataContext.jsx:
        // cascadeUnlinkTeacher) — haddii kale fasal/maado ayaa sii muujin
        // lahaa macallin aan hadda jirin.
        const target = users.find((u) => u.id === userId);
        if (target?.teacherDocId) {
          await cascadeUnlinkTeacher(target.teacherDocId);
        }
        await removeStaffDoc(userId);
      } catch (err) {
        reportError(t('users.errors.removeFailed'), err);
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>{t('users.pageTitle')}</h2>
          <p>{t('users.pageSubtitle')}</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            {t('common.backToDashboard')}
          </button>
          <button className="btn-primary" onClick={openAddModal}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            {t('users.addNew')}
          </button>
        </div>
      </div>

      {welcomeInfo && (
        <div className="users-whatsapp-banner">
          <div className="users-whatsapp-banner-icon">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.6 6.32A7.85 7.85 0 0012.05 4a7.94 7.94 0 00-6.9 11.9L4 20l4.2-1.1a7.9 7.9 0 003.83 1h.01a7.94 7.94 0 007.94-7.94 7.9 7.9 0 00-2.38-5.64zm-5.55 12.2h-.01a6.6 6.6 0 01-3.36-.92l-.24-.14-2.5.65.67-2.43-.16-.25a6.6 6.6 0 01-1.01-3.51 6.6 6.6 0 016.6-6.6 6.56 6.56 0 014.67 1.94 6.56 6.56 0 011.93 4.66 6.6 6.6 0 01-6.59 6.6zm3.62-4.94c-.2-.1-1.17-.58-1.35-.64-.18-.07-.31-.1-.45.1-.13.2-.51.64-.63.77-.11.13-.23.15-.43.05-.2-.1-.83-.31-1.58-.98-.58-.52-.98-1.16-1.09-1.36-.11-.2-.01-.31.09-.4.09-.1.2-.24.3-.36.1-.13.13-.2.2-.34.07-.13.03-.25-.02-.35-.05-.1-.45-1.08-.61-1.48-.16-.39-.32-.33-.45-.34h-.38c-.13 0-.35.05-.53.25-.18.2-.7.68-.7 1.66s.72 1.93.82 2.06c.1.13 1.4 2.14 3.4 3 .47.2.85.33 1.14.42.48.15.92.13 1.26.08.39-.06 1.17-.48 1.34-.94.16-.46.16-.86.11-.94-.05-.08-.18-.13-.38-.23z"/></svg>
          </div>
          <div className="users-whatsapp-banner-text">
            <strong>{t('users.whatsappWelcome.title')}</strong>
            <p>
              {welcomeInfo.link
                ? t('users.whatsappWelcome.subtitle', { name: welcomeInfo.name })
                : t('users.whatsappWelcome.noPhone')}
            </p>
          </div>
          <div className="users-whatsapp-banner-actions">
            {welcomeInfo.link && (
              <a className="btn-primary" href={welcomeInfo.link} target="_blank" rel="noopener noreferrer" onClick={() => setWelcomeInfo(null)}>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                {t('users.whatsappWelcome.button')}
              </a>
            )}
            <button className="btn-secondary" onClick={() => setWelcomeInfo(null)}>{t('users.whatsappWelcome.dismiss')}</button>
          </div>
        </div>
      )}

      <div className="dash-card">
        <div className="table-toolbar">
          <div className="table-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder={t('users.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="filter-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">{t('users.allRoles')}</option>
            {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{t(`users.roles.${r}`)}</option>)}
          </select>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('users.table.staff')}</th>
                <th>{t('users.table.email')}</th>
                <th>{t('users.table.role')}</th>
                <th>{t('users.table.teacherLink')}</th>
                <th>{t('users.table.status')}</th>
                <th>{t('users.table.joined')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="cell-person">
                      <div className="cell-avatar">{initials(u.fullName)}</div>
                      <span className="cell-name">{u.fullName || '—'}</span>
                    </div>
                  </td>
                  <td className="cell-sub">{u.email || '—'}</td>
                  <td><span className={`users-role-badge ${ROLE_COLOR[u.title] || 'navy'}`}>{t(`users.roles.${u.title}`, u.title)}</span></td>
                  <td className="cell-sub">
                    {u.title === 'Teacher'
                      ? (teachers.find((tc) => tc.id === u.teacherDocId)?.fullName || t('users.table.notLinked'))
                      : '—'}
                  </td>
                  <td>
                    <button
                      className={`users-status-btn ${u.status}`}
                      onClick={() => toggleStatus(u)}
                      disabled={u.id === profile?.uid}
                      title={u.id === profile?.uid ? t('users.cannotChangeSelfStatus') : undefined}
                    >
                      {u.status === 'active' ? t('common.status.active') : t('common.status.suspended')}
                    </button>
                  </td>
                  <td className="cell-sub">{u.createdAt?.toDate ? u.createdAt.toDate().toISOString().split('T')[0] : ''}</td>
                  <td>
                    <div className="row-actions">
                      <button className="row-action-btn" title={t('common.actions.edit')} onClick={() => openEditModal(u)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z"/></svg>
                      </button>
                      <button
                        className="row-action-btn danger"
                        title={u.id === profile?.uid ? t('users.cannotRemoveSelf') : t('common.actions.delete')}
                        onClick={() => handleRemove(u.id, u.fullName)}
                        disabled={u.id === profile?.uid}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {usersLoading && (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>{t('common.loading')}</td></tr>
              )}
              {!usersLoading && filtered.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>{t('common.noResults')}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-pagination">
          <span className="pagination-info">{t('users.pagination', { shown: filtered.length, total: users.length })}</span>
        </div>
      </div>

      <UserFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSave={handleSaveUser}
        user={editingUser}
        roleOptions={ROLE_OPTIONS}
        teacherOptions={availableTeacherOptions}
      />
    </div>
  );
}

export default Users;
