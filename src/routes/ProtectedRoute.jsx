import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, requireAccountType }) {
  const { isAuthenticated, profile, loading, logout } = useAuth();

  // Shaqaale laga saaray Users.jsx ("Ka Saar") waxaa laga tirtiray doc-ga
  // "users/{uid}" (fiiri firebase/staff.js: removeStaffDoc), laakiin Firebase
  // Auth account-kiisu (email/password) wuu sii shaqeyn karaa — SDK-ga
  // browser-ku qof kale kama tirtiri/kama xannibi karo account (waxaa loo
  // baahan yahay Admin SDK/Cloud Function, fiiri README: Auth Cleanup).
  // Sidaas darteed haddii isticmaale login uu galo isagoo profile-kiisu
  // (Firestore doc) uu jirin (la tirtiray), waa in aan si toos ah dib ugu
  // celino bogga gelitaanka + session-kiisa xirno (sign-out qasab ah) — ma
  // aha in aan u ogolaano inuu galo dashboard shell-ka isagoo aan xog
  // akhrin karin (firestore.rules way diidi doonaan, laakiin UI-gu waa in
  // uusan waligiis ka gudbin bogga gelitaanka).
  //
  // "profile.status === 'suspended'" (Suspend Enforcement, 2026-08-02):
  // AuthContext.jsx wuxuu isticmaalaa onSnapshot (real-time) marka la
  // akhrinayo profile-ka — sidaas darteed haddii owner-ku joojiyo
  // (suspend) shaqaale isagoo session horeba furan (browser tab), profile-ku
  // wuxuu isla markiiba isbeddelayaa gudaha app-ka isaga oo aan refresh
  // loo baahnayn. Halkan waa meesha ugu horeysa ee taas ka fal-celinaysa —
  // firestore.rules (isStaffOf: me().get('status','active') != 'suspended')
  // ayaa xogta ka xannibaysa xittaa haddii boggan la mari lahaa, laakiin waa
  // in UI-gu isla markiiba dib ugu celiyo bogga gelitaanka halkii uu ku sii
  // hadhi lahaa dashboard shell oo wax kasta oo uu isku dayo akhrin/qoris
  // ay noqonayaan Permission Denied toast-yo isku bacsan.
  useEffect(() => {
    if (!loading && isAuthenticated && (!profile || profile.status === 'suspended')) {
      logout();
    }
  }, [loading, isAuthenticated, profile, logout]);

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Inter, sans-serif', color: '#64748A'
      }}>
        Sugaya...
      </div>
    );
  }

  if (!isAuthenticated || !profile || profile.status === 'suspended') {
    return <Navigate to="/" replace />;
  }

  // "requireAccountType" (Students audit HIGH, 2026-08-26): '/dashboard/*'
  // iyo '/parent' waxay isticmaalaan labaduba isla ProtectedRoute-kan, laakiin
  // wax kama xannibayn isbeddel waalid (accountType:'student-parent') uu
  // si toos ah URL-ka ugu galo '/dashboard/students' iwm — Firestore Rules
  // way xannibi lahaayeen xogta dhabta ah, laakiin UI-gu wuxuu tusi lahaa
  // badhamada Edit/Delete + error-toast celceliya (fiiri Students.jsx:
  // isOwner = profile?.role !== 'teacher', kaas oo 'true' u soo baxa waalid
  // maadaama uusan lahayn field-ka 'role' ee staff-ka). Hadda App.jsx wuxuu
  // ku daraa requireAccountType="staff"/"student-parent" labada route-tree.
  if (requireAccountType && profile.accountType !== requireAccountType) {
    return <Navigate to={profile.accountType === 'staff' ? '/dashboard' : '/parent'} replace />;
  }

  return children;
}

export default ProtectedRoute;