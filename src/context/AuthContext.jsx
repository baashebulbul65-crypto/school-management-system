// context/AuthContext.jsx
// Wadaagista xaaladda user-ka (logged in / logged out) gudaha App-ka oo dhan

import { createContext, useContext, useEffect, useState } from 'react';
import { subscribeToAuthChanges, getUserProfile, logout as firebaseLogout } from '../firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      setCurrentUser(user);

      if (user) {
        const userProfile = await getUserProfile(user.uid);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
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