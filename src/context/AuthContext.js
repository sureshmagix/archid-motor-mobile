import React, {createContext, useContext, useMemo, useState} from 'react';
import {loginWithHardcodedCredentials} from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [loginError, setLoginError] = useState('');

  const login = (username, password) => {
    const result = loginWithHardcodedCredentials(username, password);

    if (!result.ok) {
      setLoginError(result.message);
      return false;
    }

    setLoginError('');
    setUser(result.user);
    return true;
  };

  const logout = () => {
    setUser(null);
    setLoginError('');
  };

  const value = useMemo(
    () => ({user, isAuthenticated: Boolean(user), login, logout, loginError}),
    [user, loginError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
