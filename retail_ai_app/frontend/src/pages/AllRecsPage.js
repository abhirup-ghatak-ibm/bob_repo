import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAllRecommendations } from '../api';
import { Spinner, InsightCard } from '../components/UI';

const STORE_TYPE_ICONS = {
  general:     '🏪',
  electronics: '💻',
  automotive:  '🚗',
};

export default function AllRecsPage() {
  const { owner, stores } = useAuth();
  const navigate = useNavigate();
  const [recs,    setRecs]    = useState([]);
  const [filter,  setFilter]  = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [typeFilter,  setTypeFilter]  = useState('all');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await getAllRecommendations();
      setRecs(res.data);
    } catch {
      setError('Failed to load recommendations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="main-content"><Spinner /></div>;
  if (error)   return <div className="main-content"><div className="error-msg">{error}</div></div>;

  const priorities = ['all','critical','high','medium','low'];
  const types      = ['all','opportunity','risk','loss'];

  const filtered = recs.filter(r => {
    const matchP = filter      === 'all' || r.priority  === filter;
    const matchS = storeFilter === 'all' || String(r.store_id) === storeFilter;
    const matchT = typeFilter  === 'all' || r.type      === typeFilter;
    return matchP && matchS && matchT;
  });

  const total = recs.length;
  const critical = recs.filter(r => r.priority === 'critical').length;
  const opportunities = recs.filter(r => r.type === 'opportunity').length;

  // Group by store for summary
  const byStore = {};
  recs.forEach(r => {
    if (!byStore[r.store_id]) byStore[r.store_id] = { name: r.store_name, type: r.store_type, count: 0 };
    byStore[r.store_id].count++;
  });

  return (
    <div className="main-content">
      <div className="page-header">
        <div className="page-title">All Recommendations</div>
        <div className="page-subtitle">
          {owner?.name} — combined AI insights across all your stores
        </div>
      </div>

      {/* Store summary cards */}
      <div className="store-cards" style={{marginBottom:'20px'}}>
        {Object.entries(byStore).map(([sid, info]) => (
          <div
            key={sid}
            className={`store-card ${storeFilter === sid ? 'selected' : ''}`}
            onClick={() => setStoreFilter(storeFilter === sid ? 'all' : sid)}
          >
            <div className="store-card-icon">
              {STORE_TYPE_ICONS[info.type] || '🏬'}
            </div>
            <div className="store-card-name">{info.name}</div>
            <div style={{fontSize:'13px', color:'var(--accent)', fontWeight:600}}>
              {info.count} recommendations
            </div>
          </div>
        ))}
        {/* Always show "Add Store" card — navigates to Settings */}
        <div className="store-card" onClick={() => navigate('/settings')}
          style={{borderStyle:'dashed', opacity:0.75}}>
          <div className="store-card-icon">➕</div>
          <div className="store-card-name">Add Store</div>
          <div style={{fontSize:'12px', color:'var(--accent)', fontWeight:500}}>
            Click to open Settings
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Insights</div>
          <div className="stat-value">{total}</div>
          <div className="stat-sub">Across {stores.length} store{stores.length > 1 ? 's' : ''}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Critical Actions</div>
          <div className="stat-value" style={{color: critical > 0 ? 'var(--critical)' : 'var(--success)'}}>
            {critical}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Opportunities</div>
          <div className="stat-value" style={{color:'var(--secondary)'}}>{opportunities}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Filtered Results</div>
          <div className="stat-value">{filtered.length}</div>
        </div>
      </div>

      {/* Filter bars */}
      <div style={{marginBottom:'8px'}}>
        <div style={{fontSize:'11px', color:'var(--muted)', marginBottom:'5px',
          textTransform:'uppercase', letterSpacing:'0.5px'}}>Priority</div>
        <div className="filter-bar">
          {priorities.map(p => (
            <button key={p} className={`filter-btn ${filter === p ? 'active' : ''}`}
              onClick={() => setFilter(p)}>
              {p === 'all' ? `All` : p.toUpperCase()}
              {p !== 'all' && ` (${recs.filter(r => r.priority === p).length})`}
            </button>
          ))}
        </div>
      </div>
      <div style={{marginBottom:'16px'}}>
        <div style={{fontSize:'11px', color:'var(--muted)', marginBottom:'5px',
          textTransform:'uppercase', letterSpacing:'0.5px'}}>Type</div>
        <div className="filter-bar">
          {types.map(t => (
            <button key={t} className={`filter-btn ${typeFilter === t ? 'active' : ''}`}
              onClick={() => setTypeFilter(t)}>
              {t === 'all' ? `All Types` : t.charAt(0).toUpperCase() + t.slice(1)}
              {t !== 'all' && ` (${recs.filter(r => r.type === t).length})`}
            </button>
          ))}
        </div>
      </div>

      {storeFilter !== 'all' && (
        <div style={{marginBottom:'12px'}}>
          <button className="filter-btn active" onClick={() => setStoreFilter('all')}>
            ✕ Clear Store Filter
          </button>
        </div>
      )}

      {/* Recommendations */}
      {filtered.length === 0 ? (
        <div className="card text-center text-muted" style={{padding:'32px'}}>
          No recommendations match the selected filters.
        </div>
      ) : (
        <div className="insight-list">
          {filtered.map((rec, i) => (
            <InsightCard key={i} rec={rec} showStore={true} />
          ))}
        </div>
      )}
    </div>
  );
}
