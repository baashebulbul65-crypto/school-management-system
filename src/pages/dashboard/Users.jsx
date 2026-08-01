import { useState, useEffect } from 'react';
import UserFormModal from './UserFormModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSchoolData } from '../../context/SchoolDataContext';
import { subscribeToStaff, createStaffAccount, updateStaffDoc, setStaffStatus, removeStaffDoc } from '../../firebase/staff';
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
  const { profile } = useAuth();
  const { showError } = useToast();
  const { teachers } = useSchoolData();
  const [users, setUsers] = useState([]);

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
      return undefined;
    }
    const unsubscribe = subscribeToStaff(
      profile.schoolCode,
      setUsers,
      (err) => reportError('Khalad ayaa dhacay markii shaqaalaha laga soo akhriyay:', err)
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
      });
    }
  };

  const toggleStatus = async (user) => {
    try {
      await setStaffStatus(user.id, user.status === 'active' ? 'suspended' : 'active');
    } catch (err) {
      reportError('Khalad ayaa dhacay markii xaaladda shaqaalaha la beddelayay:', err);
    }
  };

  const handleRemove = async (userId, name) => {
    if (userId === profile?.uid) return;
    if (window.confirm(`Ma hubtaa inaad ka saarayso "${name}" nidaamka? Tallaabadan lama noqon karo.`)) {
      try {
        await removeStaffDoc(userId);
      } catch (err) {
        reportError('Khalad ayaa dhacay markii shaqaalaha la saarayay:', err);
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Shaqaalaha</h2>
          <p>Maamul akoonada shaqaalaha iyo doorarkooda (School Owner, Principal, Accountant, iwm).</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          Ku Dar Shaqaale
        </button>
      </div>

      <div className="dash-card">
        <div className="table-toolbar">
          <div className="table-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder="Raadi magaca ama email-ka..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="filter-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">Dhammaan Doorarka</option>
            {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Shaqaale</th>
                <th>Email</th>
                <th>Doorka</th>
                <th>Xiriirinta Macallinka</th>
                <th>Xaaladda</th>
                <th>Ku Biiray</th>
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
                  <td><span className={`users-role-badge ${ROLE_COLOR[u.title] || 'navy'}`}>{u.title}</span></td>
                  <td className="cell-sub">
                    {u.title === 'Teacher'
                      ? (teachers.find((t) => t.id === u.teacherDocId)?.fullName || '— lama xirin —')
                      : '—'}
                  </td>
                  <td>
                    <button
                      className={`users-status-btn ${u.status}`}
                      onClick={() => toggleStatus(u)}
                      disabled={u.id === profile?.uid}
                      title={u.id === profile?.uid ? 'Ma bedeli kartid xaaladdaada' : undefined}
                    >
                      {u.status === 'active' ? 'Firfircoon' : 'La Joojiyay'}
                    </button>
                  </td>
                  <td className="cell-sub">{u.createdAt?.toDate ? u.createdAt.toDate().toISOString().split('T')[0] : ''}</td>
                  <td>
                    <div className="row-actions">
                      <button className="row-action-btn" title="Wax Ka Beddel" onClick={() => openEditModal(u)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z"/></svg>
                      </button>
                      <button
                        className="row-action-btn danger"
                        title={u.id === profile?.uid ? 'Ma iska saari kartid nafta' : 'Ka Saar'}
                        onClick={() => handleRemove(u.id, u.fullName)}
                        disabled={u.id === profile?.uid}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>
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
          <span className="pagination-info">Muujinaya {filtered.length} ee {users.length} shaqaale</span>
        </div>
      </div>

      <UserFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSave={handleSaveUser}
        user={editingUser}
        roleOptions={ROLE_OPTIONS}
        teacherOptions={teachers}
      />
    </div>
  );
}

export default Users;
