import { useState } from 'react';
import UserFormModal from './UserFormModal';
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
function permissionTier(roleLabel) {
  return roleLabel === 'Teacher' ? 'teacher' : 'owner';
}

const INITIAL_USERS = [
  { id: 1, fullName: 'Xasan Cabdulle Nuur', email: 'xasan@xarun.com', role: 'School Owner', status: 'active', joined: '2025-09-01' },
  { id: 2, fullName: 'Sahra Maxamed Cige', email: 'sahra@xarun.com', role: 'Principal', status: 'active', joined: '2025-09-05' },
  { id: 3, fullName: 'Cabdiqaadir Nuur Cali', email: 'cabdiqaadir@xarun.com', role: 'Vice Principal', status: 'active', joined: '2025-09-10' },
  { id: 4, fullName: 'Zaynab Cali Warsame', email: 'zaynab@xarun.com', role: 'Accountant', status: 'active', joined: '2025-10-01' },
  { id: 5, fullName: 'Halima Xuseen Nuur', email: 'halima@xarun.com', role: 'Receptionist', status: 'active', joined: '2025-10-12' },
  { id: 6, fullName: 'Cali Xasan Warsame', email: 'cali.warsame@xarun.com', role: 'Teacher', status: 'active', joined: '2025-09-15' },
  { id: 7, fullName: 'Faadumo Nuur Cige', email: 'faadumo.nuur@xarun.com', role: 'Teacher', status: 'suspended', joined: '2025-09-20' },
];

const ROLE_COLOR = {
  'School Owner': 'navy',
  'Principal': 'purple',
  'Vice Principal': 'purple',
  'Accountant': 'teal',
  'Receptionist': 'blue',
  'Teacher': 'green',
};

function initials(name) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function Users() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const filtered = users.filter((u) => {
    const matchesSearch = u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const openAddModal = () => { setEditingUser(null); setShowFormModal(true); };
  const openEditModal = (user) => { setEditingUser(user); setShowFormModal(true); };

  const handleSaveUser = (payload, userId) => {
    if (userId) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...payload } : u)));
    } else {
      setUsers((prev) => [...prev, { ...payload, id: Date.now(), status: 'active', joined: new Date().toISOString().split('T')[0] }]);
    }
  };

  const toggleStatus = (userId) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' } : u)));
  };

  const handleRemove = (userId, name) => {
    if (window.confirm(`Ma hubtaa inaad ka saarayso "${name}" nidaamka? Tallaabadan lama noqon karo.`)) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
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
                      <span className="cell-name">{u.fullName}</span>
                    </div>
                  </td>
                  <td className="cell-sub">{u.email}</td>
                  <td><span className={`users-role-badge ${ROLE_COLOR[u.role]}`}>{u.role}</span></td>
                  <td>
                    <button className={`users-status-btn ${u.status}`} onClick={() => toggleStatus(u.id)}>
                      {u.status === 'active' ? 'Firfircoon' : 'La Joojiyay'}
                    </button>
                  </td>
                  <td className="cell-sub">{u.joined}</td>
                  <td>
                    <div className="row-actions">
                      <button className="row-action-btn" title="Wax Ka Beddel" onClick={() => openEditModal(u)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z"/></svg>
                      </button>
                      <button className="row-action-btn danger" title="Ka Saar" onClick={() => handleRemove(u.id, u.fullName)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>Wax lama helin.</td></tr>
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
      />
    </div>
  );
}

export default Users;