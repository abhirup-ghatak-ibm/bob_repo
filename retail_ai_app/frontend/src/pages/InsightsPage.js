import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getInsights } from '../api';
import { Spinner, StoreTypeBadge, InsightCard } from '../components/UI';

export default function InsightsPage() {
  const { activeStore } = useAuth();
  const [insights,  setInsights]  = useState([]);
  const [filter,    setFilter]    = useState('all');
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  const load = useCallback(async () => {
    if (!activeStore) return;
    setLoading(true); setError('');
    try {
      const res = await getInsights(activeStore.id);
      setInsights(res.data);
    } catch {
      setError('Failed to load AI insights.');
    } finally {
      setLoading(false);
    }
  }, [activeStore?.id]);

  useEffect(() => { load(); }, [load]);

  if (!activeStore) return (
    <div className="main-content">
      <div className="page-header"><div className="page-title">Store Insights(AI)</div></div>
    </div>
  );

  if (loading) return <div className="main-content"><Spinner /></div>;
  if (error)   return <div className="main-content"><div className="error-msg">{error}</div></div>;

  const types = ['all', 'critical', 'high', 'medium', 'low'];
  const counts = {
    all:      insights.length,
    critical: insights.filter(i => i.priority === 'critical').length,
    high:     insights.filter(i => i.priority === 'high').length,
    medium:   insights.filter(i => i.priority === 'medium').length,
    low:      insights.filter(i => i.priority === 'low').length,
  };

  const filtered = filter === 'all' ? insights : insights.filter(i => i.priority === filter);

  const criticalCount = counts.critical;
  const opportunities = insights.filter(i => i.type === 'opportunity').length;
  const risks         = insights.filter(i => i.type === 'risk').length;
  const losses        = insights.filter(i => i.type === 'loss').length;

  return (
    <div className="main-content">
      <div className="page-header">
        <div className="flex items-center gap-8">
          <div className="page-title">Store Insights(AI)</div>
          <StoreTypeBadge type={activeStore.store_type} />
        </div>
        <div className="page-subtitle">
          {activeStore.name} — AI-generated demand forecasting &amp; supply recommendations
        </div>
      </div>

      {/* Summary */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Insights</div>
          <div className="stat-value">{insights.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Critical</div>
          <div className="stat-value" style={{color: criticalCount > 0 ? 'var(--critical)' : 'var(--success)'}}>
            {criticalCount}
          </div>
          <div className="stat-sub">Require immediate action</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Opportunities</div>
          <div className="stat-value" style={{color:'var(--secondary)'}}>{opportunities}</div>
          <div className="stat-sub">Growth potential</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Risks</div>
          <div className="stat-value" style={{color:'var(--warning)'}}>{risks}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Losses</div>
          <div className="stat-value" style={{color: losses > 0 ? 'var(--critical)' : 'var(--success)'}}>
            {losses}
          </div>
          <div className="stat-sub">Stock-out revenue risk</div>
        </div>
      </div>

      {/* Filter */}
      <div className="filter-bar">
        {types.map(t => (
          <button
            key={t}
            className={`filter-btn ${filter === t ? 'active' : ''}`}
            onClick={() => setFilter(t)}
          >
            {t === 'all' ? `All (${counts.all})` : `${t.toUpperCase()} (${counts[t]})`}
          </button>
        ))}
      </div>

      {/* Insight Cards */}
      {filtered.length === 0 ? (
        <div className="card text-center text-muted" style={{padding:'32px'}}>
          No insights for this filter. The store is performing well!
        </div>
      ) : (
        <div className="insight-list">
          {filtered.map((rec, i) => (
            <InsightCard key={i} rec={rec} showStore={false} />
          ))}
        </div>
      )}
    </div>
  );
}
