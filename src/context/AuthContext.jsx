// context/AuthContext.jsx
// Wadaagista xaaladda user-ka (logged in / logged out) gudaha App-ka oo dhan

import { createContext, useContext, useEffect, useState } from 'react';
import { subscribeToAuthChanges, subscribeToUserProfile, logout as firebaseLogout } from '../firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listener-ka profile-ka ("users/{uid}") waa in la yeeshaa gooni ah oo
    // la joojiyo (unsubscribe) mar kasta oo auth-state-ku isbeddesho —
    // haddii kale listener-kii hore wuu sii socon lahaa isaga oo aan la
    // baahnayn (leak), amaba wuxuu qori lahaa profile qof kale (login/logout
    // degdeg ah).
    let unsubscribeProfile = null;

    const unsubscribeAuth = subscribeToAuthChanges((user) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      setCurrentUser(user);

      if (user) {
        unsubscribeProfile = subscribeToUserProfile(
          user.uid,
          (userProfile) => {
            setProfile(userProfile);
            setLoading(false);
          },
          (err) => {
            console.error('Khalad ayaa dhacay markii profile-ka la soo akhriyay:', err);
            setProfile(null);
            setLoading(false);
          }
        );
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const logout = async () => {
    await firebaseLogout();
    setCurrentUser(null);
    setProfile(null);
  };

  const value = {
    currentUser,
    profile,          // { fullName, role, schoolCode, accountType, ... }
    loading,
    isAuthenticated: !!currentUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth waa in loo isticmaalaa gudaha <AuthProvider>');
  }
  return context;
}