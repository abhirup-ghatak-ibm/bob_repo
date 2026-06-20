import React from 'react';

export function Spinner() {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
    </div>
  );
}

export function Badge({ type, label }) {
  return <span className={`badge badge-${type}`}>{label}</span>;
}

export function StoreTypeBadge({ type }) {
  const labels = { general: 'General', electronics: 'Electronics', automotive: 'Automotive' };
  return (
    <span className={`store-type-badge type-${type}`}>
      {labels[type] || type}
    </span>
  );
}

export function ProgressBar({ value, max, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const barColor = color || (pct > 90 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#22c55e');
  return (
    <div className="progress-bar-wrap" title={`${value} / ${max}`}>
      <div className="progress-bar" style={{ width: `${pct}%`, background: barColor }} />
    </div>
  );
}

export function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={color ? { color } : {}}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export function InsightCard({ rec, showStore }) {
  const typeColors = {
    opportunity: 'badge-opportunity',
    risk:        'badge-risk',
    loss:        'badge-loss',
  };
  return (
    <div className={`insight-card ${rec.priority}`}>
      <div className="insight-header">
        <span className={`badge badge-${rec.priority}`}>{rec.priority?.toUpperCase()}</span>
        <span className={`badge ${typeColors[rec.type] || 'badge-medium'}`}>{rec.type?.toUpperCase()}</span>
        {showStore && rec.store_name && (
          <span className="insight-store">{rec.store_name}</span>
        )}
        <span className="insight-title">{rec.title}</span>
      </div>
      <p className="insight-body">{rec.message}</p>
      {rec.timeline && (
        <div className="insight-timeline">⏱ Timeline: {rec.timeline}</div>
      )}
      {rec.estimated_loss && (
        <div className="insight-timeline" style={{color:'var(--danger)'}}>
          ₹ Estimated Loss: ₹{rec.estimated_loss?.toLocaleString('en-IN')}
        </div>
      )}
    </div>
  );
}
