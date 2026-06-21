import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout, getStores } from '../api';

const AuthContext = createContext(null);

function formatTimestamp(date) {
  if (!date) return null;
  const d = new Date(date);
  const day   = String(d.getDate()).padStart(2, '0');
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const mon   = MONTHS[d.getMonth()];
  const yr    = d.getFullYear();
  const hh    = String(d.getHours()).padStart(2, '0');
  const mm    = String(d.getMinutes()).padStart(2, '0');
  const ss    = String(d.getSeconds()).padStart(2, '0');
  return `${day} ${mon} ${yr}, ${hh}:${mm}:${ss}`;
}

export function AuthProvider({ children }) {
  const [owner,        setOwner]       = useState(null);
  const [stores,       setStores]      = useState([]);
  const [activeStore,  setActiveStore] = useState(null);
  const [loading,      setLoading]     = useState(true);
  const [lastRefresh,  setLastRefresh] = useState(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const token  = localStorage.getItem('token');
    const saved  = localStorage.getItem('owner');
    const savedStores = localStorage.getItem('stores');
    const savedActive = localStorage.getItem('activeStore');
    const savedRefresh = localStorage.getItem('lastRefresh');
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
    if (savedRefresh) {
      setLastRefresh(savedRefresh);
    }
    setLoading(false);
  }, []);

  const touchRefresh = useCallback(() => {
    const ts = new Date().toISOString();
    localStorage.setItem('lastRefresh', ts);
    setLastRefresh(ts);
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
    // Update refresh timestamp on login
    touchRefresh();
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
    touchRefresh();
  };

  const doLogout = async () => {
    try { await apiLogout(); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('owner');
    localStorage.removeItem('stores');
    localStorage.removeItem('activeStore');
    localStorage.removeItem('lastRefresh');
    setOwner(null);
    setStores([]);
    setActiveStore(null);
    setLastRefresh(null);
  };

  return (
    <AuthContext.Provider value={{
      owner, stores, activeStore,
      loading, login, switchStore,
      addNewStore, logout: doLogout,
      lastRefresh, touchRefresh,
      formatTimestamp,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
