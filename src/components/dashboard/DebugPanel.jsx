// TIJAABO KU MEEL GAADH AH (2026-08-16) — CILAD 1/2 audit (data leakage +
// finance permissions). Waxaa lagu daray si loo arko xogta RAW ee Firestore
// (profile-ka isticmaale + doc-ka dugsiga) + badhamo backfill "role" ah
// (fiiri firestore.rules qaybta "KU MEEL GAADH AH, role-backfill audit").
// WAA IN LA SAARAA (component-kan + qaybta rules-ka + import-ka Overview.jsx)
// marka backfill-ku dhammaan schools-ka ku dhammaado.
import { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';

function permissionTier(title) {
  return title === 'Teacher' ? 'teacher' : 'owner';
}

function DebugPanel() {
  const { profile, currentUser } = useAuth();
  const [schoolDoc, setSchoolDoc] = useState(undefined);
  const [selfHealStatus, setSelfHealStatus] = useState('');
  const [backfillStatus, setBackfillStatus] = useState('');

  useEffect(() => {
    if (!profile?.schoolCode) {
      setSchoolDoc(null);
      return;
    }
    getDoc(doc(db, 'schools', profile.schoolCode))
      .then((snap) => setSchoolDoc(snap.exists() ? snap.data() : null))
      .catch((err) => setSchoolDoc({ ERROR: err.message, code: err.code }));
  }, [profile?.schoolCode]);

  const fixMyRole = async () => {
    if (!currentUser?.uid || !profile?.title) return;
    setSelfHealStatus('Waa la hagaajinayaa...');
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { role: permissionTier(profile.title) });
      setSelfHealStatus('✅ Waa la hagaajiyay — role-kaaga cusub: ' + permissionTier(profile.title));
    } catch (err) {
      setSelfHealStatus('❌ Khalad: ' + err.message);
    }
  };

  const backfillSchoolStaff = async () => {
    if (!profile?.schoolCode) return;
    setBackfillStatus('Waa la baadhayaa shaqaalaha...');
    try {
      const snap = await getDocs(query(
        collection(db, 'users'),
        where('schoolCode', '==', profile.schoolCode),
        where('accountType', '==', 'staff')
      ));
      const batch = writeBatch(db);
      const fixed = [];
      snap.forEach((d) => {
        const data = d.data();
        if (!data.role && data.title) {
          batch.update(d.ref, { role: permissionTier(data.title) });
          fixed.push(`${data.fullName || d.id} (${data.title} → ${permissionTier(data.title)})`);
        }
      });
      if (fixed.length > 0) await batch.commit();
      setBackfillStatus(fixed.length > 0
        ? `✅ ${fixed.length} shaqaale ayaa la hagaajiyay:\n` + fixed.join('\n')
        : '✅ Dhammaan shaqaalaha school-kan horeba role bay leeyihiin — waxba lama beddelin.');
    } catch (err) {
      setBackfillStatus('❌ Khalad: ' + err.message);
    }
  };

  const missingRole = profile && !profile.role && profile.title;

  return (
    <div style={{
      background: '#FFF7E0', border: '2px solid #C99A1F', borderRadius: 12,
      padding: 16, marginBottom: 20, fontFamily: 'monospace', fontSize: 12.5,
    }}>
      <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>
        🔧 DEBUG PANEL (ku meel gaadh ah — CILAD 1/2 audit)
      </div>

      {missingRole && (
        <div style={{ marginBottom: 12, padding: 10, background: '#fff', borderRadius: 8 }}>
          <div style={{ marginBottom: 6 }}>⚠️ Account-kan "role" field-ku wuu ka maqan yahay (title = "{profile.title}").</div>
          <button type="button" onClick={fixMyRole} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#0B1F2B', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
            Hagaaji role-kayga ({permissionTier(profile.title)})
          </button>
          {selfHealStatus && <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{selfHealStatus}</div>}
        </div>
      )}

      {profile?.role === 'owner' && (
        <div style={{ marginBottom: 12, padding: 10, background: '#fff', borderRadius: 8 }}>
          <button type="button" onClick={backfillSchoolStaff} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#16C784', color: '#0B1F2B', fontWeight: 700, cursor: 'pointer' }}>
            Backfill: hagaaji shaqaalaha school-kan oo dhan
          </button>
          {backfillStatus && <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{backfillStatus}</div>}
        </div>
      )}

      <div style={{ marginBottom: 10 }}>
        <strong>auth.currentUser.uid:</strong> {currentUser?.uid || '(null)'}
      </div>
      <div style={{ marginBottom: 10 }}>
        <strong>users/{'{uid}'} doc (profile — AuthContext):</strong>
        <pre style={{ whiteSpace: 'pre-wrap', background: '#fff', padding: 10, borderRadius: 8, marginTop: 4 }}>
          {JSON.stringify(profile, null, 2)}
        </pre>
      </div>
      <div>
        <strong>schools/{'{'}profile.schoolCode{'}'} doc:</strong>
        <pre style={{ whiteSpace: 'pre-wrap', background: '#fff', padding: 10, borderRadius: 8, marginTop: 4 }}>
          {schoolDoc === undefined ? 'Sugaya...' : JSON.stringify(schoolDoc, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default DebugPanel;
