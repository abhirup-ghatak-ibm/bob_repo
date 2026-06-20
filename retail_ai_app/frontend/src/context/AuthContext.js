import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, logout as apiLogout, getStores } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [owner,        setOwner]       = useState(null);
  const [stores,       setStores]      = useState([]);
  const [activeStore,  setActiveStore] = useState(null);
  const [loading,      setLoading]     = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const token  = localStorage.getItem('token');
    const saved  = localStorage.getItem('owner');
    const savedStores = localStorage.getItem('stores');
    const savedActive = localStorage.getItem('activeStore');
    if (token && saved) {
      try {
        const o  = JSON.parse(saved);
        const ss = savedStores ? JSON.parse(savedStores) : [];
        const sa = savedActive ? JSON.parse(savedActive) : (ss[0] || null);
        setOwner(o);
        setStores(ss);
        setActiveStore(sa);
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await apiLogin(email, password);
    const { token, owner: o, stores: ss } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('owner', JSON.stringify(o));
    localStorage.setItem('stores', JSON.stringify(ss));
    const active = ss[0] || null;
    localStorage.setItem('activeStore', JSON.stringify(active));
    setOwner(o);
    setStores(ss);
    setActiveStore(active);
    return res.data;
  };

  const switchStore = (store) => {
    setActiveStore(store);
    localStorage.setItem('activeStore', JSON.stringify(store));
  };

  const addNewStore = (store) => {
    const updated = [...stores, store];
    setStores(updated);
    localStorage.setItem('stores', JSON.stringify(updated));
  };

  const doLogout = async () => {
    try { await apiLogout(); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('owner');
    localStorage.removeItem('stores');
    localStorage.removeItem('activeStore');
    setOwner(null);
    setStores([]);
    setActiveStore(null);
  };

  return (
    <AuthContext.Provider value={{
      owner, stores, activeStore,
      loading, login, switchStore,
      addNewStore, logout: doLogout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
