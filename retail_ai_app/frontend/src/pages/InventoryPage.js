import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getInventory, updateProduct } from '../api';
import { Spinner, StoreTypeBadge, ProgressBar } from '../components/UI';


const STATUS_LABELS = {
  stockout:  'STOCKOUT',
  low:       'LOW STOCK',
  overstock: 'OVERSTOCK',
  normal:    'NORMAL',
};

// Derive status same way as backend
function deriveStatus(qty, reorder, maxCap) {
  if (qty <= 0)                       return 'stockout';
  if (qty <= reorder)                 return 'low';
  if (qty >= maxCap * 0.9)            return 'overstock';
  return 'normal';
}

// Compact inline qty adjuster
function QtyAdjuster({ item, onChanged }) {
  const [qty,     setQty]     = useState(item.quantity);
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [draft,   setDraft]   = useState(String(item.quantity));

  // Keep in sync when parent refreshes
  useEffect(() => {
    setQty(item.quantity);
    setDraft(String(item.quantity));
  }, [item.quantity]);

  const save = async (newQty) => {
    const val = Math.max(0, parseInt(newQty) || 0);
    setSaving(true);
    try {
      await updateProduct(item.store_id || item.id, item.id, { quantity: val });
      setQty(val);
      setDraft(String(val));
      onChanged(item.id, val);
    } catch {
      setDraft(String(qty)); // revert
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const step = async (delta) => {
    const newVal = Math.max(0, qty + delta);
    await save(newVal);
  };

  const status = deriveStatus(qty, item.reorder_level, item.max_capacity);
  const qtyColor =
    status === 'stockout' ? 'var(--critical)'
  : status === 'low'      ? 'var(--warning)'
  : 'var(--text)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
      <button
        onClick={() => step(-1)}
        disabled={saving || qty <= 0}
        title="Decrease by 1"
        style={{
          width: '22px', height: '22px', borderRadius: '4px',
          border: '1px solid var(--border)', background: 'var(--surface)',
          cursor: qty > 0 ? 'pointer' : 'not-allowed', fontWeight: 700,
          fontSize: '14px', lineHeight: 1, color: 'var(--muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >−</button>

      {editing ? (
        <input
          type="number" min="0" value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={() => save(draft)}
          onKeyDown={e => { if (e.key === 'Enter') save(draft); if (e.key === 'Escape') { setDraft(String(qty)); setEditing(false); } }}
          autoFocus
          style={{
            width: '52px', textAlign: 'center', fontWeight: 700,
            border: '1px solid var(--accent)', borderRadius: '4px',
            padding: '1px 4px', fontSize: '13px',
          }}
        />
      ) : (
        <span
          title="Click to edit directly"
          onClick={() => { setEditing(true); setDraft(String(qty)); }}
          style={{
            fontWeight: 700, fontSize: '13px', color: qtyColor,
            minWidth: '32px', textAlign: 'center', cursor: 'pointer',
            borderBottom: '1px dashed var(--border)', padding: '0 2px',
          }}
        >{saving ? '…' : qty}</span>
      )}

      <button
        onClick={() => step(+1)}
        disabled={saving}
        title="Increase by 1"
        style={{
          width: '22px', height: '22px', borderRadius: '4px',
          border: '1px solid var(--border)', background: 'var(--surface)',
          cursor: 'pointer', fontWeight: 700,
          fontSize: '14px', lineHeight: 1, color: 'var(--muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >+</button>
    </div>
  );
}

export default function InventoryPage() {
  const { activeStore, touchRefresh } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [filter,    setFilter]    = useState('all');
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [toast,     setToast]     = useState('');

  const load = useCallback(async () => {
    if (!activeStore) return;
    setLoading(true); setError('');
    try {
      const res = await getInventory(activeStore.id);
      setInventory(res.data);
    } catch {
      setError('Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  }, [activeStore?.id]);

  useEffect(() => { load(); }, [load]);

  // Optimistic local update — recalculate status immediately so filter counts refresh
  const handleQtyChanged = useCallback((productId, newQty) => {
    setInventory(prev => prev.map(item => {
      if (item.id !== productId) return item;
      const newStatus = deriveStatus(newQty, item.reorder_level, item.max_capacity);
      return { ...item, quantity: newQty, status: newStatus };
    }));
    setToast('Stock updated — AI recommendations will reflect the new levels.');
    setTimeout(() => setToast(''), 3500);
    touchRefresh();
  }, []);

  if (!activeStore) return (
    <div className="main-content">
      <div className="page-header"><div className="page-title">Inventory</div></div>
    </div>
  );

  if (loading) return <div className="main-content"><Spinner /></div>;
  if (error)   return <div className="main-content"><div className="error-msg">{error}</div></div>;

  const filtered = inventory.filter(item => {
    const matchFilter = filter === 'all' || item.status === filter;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
      || item.category.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    all:       inventory.length,
    stockout:  inventory.filter(i => i.status === 'stockout').length,
    low:       inventory.filter(i => i.status === 'low').length,
    overstock: inventory.filter(i => i.status === 'overstock').length,
    normal:    inventory.filter(i => i.status === 'normal').length,
  };

  const totalValue = inventory.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

  return (
    <div className="main-content">
      <div className="page-header">
        <div className="flex items-center gap-8">
          <div className="page-title">Inventory</div>
          <StoreTypeBadge type={activeStore.store_type} />
        </div>
        <div className="page-subtitle">
          {activeStore.name} — {inventory.length} SKUs &nbsp;|&nbsp;
          Total stock value: ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div style={{
          background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'6px',
          padding:'8px 14px', fontSize:'13px', color:'var(--accent)',
          marginBottom:'12px', fontWeight:500,
        }}>
          {toast}
        </div>
      )}

      {/* Summary stat cards */}
      <div className="stats-grid" style={{marginBottom:'16px'}}>
        <div className="stat-card">
          <div className="stat-label">Total SKUs</div>
          <div className="stat-value">{counts.all}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Stockouts</div>
          <div className="stat-value" style={{color: counts.stockout>0?'var(--critical)':'var(--success)'}}>
            {counts.stockout}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Low Stock</div>
          <div className="stat-value" style={{color: counts.low>0?'var(--warning)':'var(--success)'}}>
            {counts.low}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Overstock</div>
          <div className="stat-value" style={{color: counts.overstock>0?'var(--warning)':'var(--success)'}}>
            {counts.overstock}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{display:'flex', gap:'10px', marginBottom:'14px', flexWrap:'wrap', alignItems:'center'}}>
        <div className="filter-bar" style={{margin:0}}>
          {['all','stockout','low','overstock','normal'].map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? `All (${counts.all})`
                : `${STATUS_LABELS[f]} (${counts[f]})`}
            </button>
          ))}
        </div>
        <input
          className="form-input"
          style={{maxWidth:'220px', padding:'5px 10px'}}
          placeholder="Search product or category…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="btn btn-secondary" onClick={load}
          style={{fontSize:'12px', padding:'5px 12px', marginLeft:'auto'}}>
          ↺ Refresh
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{padding:0}}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Brand</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right" style={{minWidth:'120px'}}>
                  Quantity
                  <div style={{fontSize:'9px', fontWeight:400, color:'var(--muted)', marginTop:'1px'}}>
                    − click + to adjust
                  </div>
                </th>
                <th className="text-right">Reorder At</th>
                <th style={{minWidth:'100px'}}>Stock Level</th>
                <th>Status</th>
                <th>Perishable</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center text-muted" style={{padding:'24px'}}>
                  No items found.
                </td></tr>
              ) : (
                filtered.map(item => {
                  const liveStatus = deriveStatus(item.quantity, item.reorder_level, item.max_capacity);
                  return (
                    <tr key={item.id}>
                      <td style={{fontWeight:500}}>{item.name}</td>
                      <td style={{color:'var(--muted)'}}>{item.category}</td>
                      <td style={{color:'var(--muted)'}}>{item.brand || '—'}</td>
                      <td className="text-right">
                        ₹{item.unit_price?.toLocaleString('en-IN')}
                      </td>
                      <td>
                        {/* Pass store_id so the PUT route is correct */}
                        <QtyAdjuster
                          item={{ ...item, store_id: activeStore.id }}
                          onChanged={handleQtyChanged}
                        />
                      </td>
                      <td className="text-right" style={{color:'var(--muted)'}}>
                        {item.reorder_level}
                      </td>
                      <td style={{minWidth:'100px'}}>
                        <ProgressBar
                          value={item.quantity}
                          max={item.max_capacity}
                          color={
                            liveStatus === 'stockout'  ? '#ef4444'
                          : liveStatus === 'low'       ? '#f59e0b'
                          : liveStatus === 'overstock' ? '#3b82d4'
                          : '#22c55e'
                          }
                        />
                        <div className="text-sm text-muted mt-4">
                          {item.quantity}/{item.max_capacity}
                        </div>
                      </td>
                      <td>
                        <span className={`badge status-${liveStatus}`}>
                          {STATUS_LABELS[liveStatus]}
                        </span>
                      </td>
                      <td>
                        {item.is_perishable
                          ? <span className="badge badge-high">YES</span>
                          : <span style={{color:'var(--muted)',fontSize:'12px'}}>No</span>
                        }
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reorder suggestions */}
      {(counts.stockout + counts.low) > 0 && (
        <div className="card mt-16">
          <div className="card-title">Reorder Suggestions</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Current Stock</th>
                  <th>Reorder Level</th>
                  <th>Suggested Order Qty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {inventory
                  .filter(i => {
                    const s = deriveStatus(i.quantity, i.reorder_level, i.max_capacity);
                    return s === 'stockout' || s === 'low';
                  })
                  .map(item => {
                    const s = deriveStatus(item.quantity, item.reorder_level, item.max_capacity);
                    return (
                      <tr key={item.id}>
                        <td style={{fontWeight:500}}>{item.name}</td>
                        <td style={{color: s==='stockout'?'var(--critical)':'var(--warning)',fontWeight:600}}>
                          {item.quantity}
                        </td>
                        <td>{item.reorder_level}</td>
                        <td style={{color:'var(--accent)',fontWeight:600}}>
                          {Math.max(item.max_capacity - item.quantity, item.reorder_level * 3)}
                        </td>
                        <td>
                          <span className={`badge status-${s}`}>{STATUS_LABELS[s]}</span>
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
