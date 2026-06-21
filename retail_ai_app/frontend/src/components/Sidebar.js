import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV = [
  { path: '/dashboard',   icon: '◉', label: 'Dashboard'        },
  { path: '/inventory',   icon: '▦', label: 'Inventory'         },
  { path: '/all-recs',    icon: '◈', label: 'AI Insights'       },
  { path: '/settings',    icon: '⚙', label: 'Settings'          },
  { path: '/contact',     icon: '✉', label: 'Contact RetailAI'  },
];

const STORE_ICONS = {
  general:     '🏪',
  electronics: '💻',
  automotive:  '🚗',
};

export default function Sidebar() {
  const { owner, stores, activeStore, switchStore, logout, lastRefresh, formatTimestamp } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleNav = (path) => navigate(path);

  const handleStoreChange = (e) => {
    const id    = parseInt(e.target.value);
    const store = stores.find(s => s.id === id);
    if (store) switchStore(store);
  };

  const refreshLabel = lastRefresh ? formatTimestamp(lastRefresh) : null;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">Retail<span>AI</span></div>
        <div className="sidebar-owner">
          {owner ? `${owner.name}` : 'Loading…'}
        </div>
      </div>

      {stores.length > 1 && (
        <div className="store-selector">
          <label>Active Store</label>
          <select
            value={activeStore?.id || ''}
            onChange={handleStoreChange}
          >
            {stores.map(s => (
              <option key={s.id} value={s.id}>
                {STORE_ICONS[s.store_type] || '🏬'} {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {stores.length === 1 && activeStore && (
        <div className="store-selector">
          <label>Store</label>
          <div style={{color:'#e2e8f0',fontSize:'12px',padding:'4px 0'}}>
            {STORE_ICONS[activeStore.store_type] || '🏬'} {activeStore.name}
          </div>
        </div>
      )}

      <nav className="sidebar-nav">
        {NAV.map(item => (
          <button
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => handleNav(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        {refreshLabel && (
          <div style={{
            fontSize: '10px',
            color: '#64748b',
            marginBottom: '8px',
            lineHeight: '1.4',
            wordBreak: 'break-word',
          }}>
            <span style={{display:'block', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'2px'}}>
              Last Refreshed
            </span>
            <span style={{color:'#94a3b8'}}>{refreshLabel}</span>
          </div>
        )}
        <button className="logout-btn" onClick={logout}>⎋ Logout</button>
      </div>
    </aside>
  );
}
