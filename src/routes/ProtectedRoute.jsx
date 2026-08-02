import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
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
  useEffect(() => {
    if (!loading && isAuthenticated && !profile) {
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

  if (!isAuthenticated || !profile) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;