import React, { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement,
  Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import { getDashboard, getMonthlySales, getCategorySales, getStockoutLosses, getGstSummary } from '../api';
import { Spinner, StatCard, StoreTypeBadge } from '../components/UI';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement,
  Title, Tooltip, Legend
);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CHART_COLORS = [
  '#3b82d4','#7c5cd8','#22c55e','#f59e0b','#ef4444',
  '#06b6d4','#f97316','#a855f7','#84cc16','#ec4899'
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Format a rupee amount compactly: 2,10,00,000 → ₹210L, 31,00,000 → ₹31L, 5,000 → ₹5K */
function fmtRs(amount) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000)   return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000)     return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${Math.round(amount)}`;
}

/**
 * Filter monthlySales rows to the FY window: Apr 2024 → Mar 2026.
 * Returns an object with filtered labels and data arrays.
 */
function filterFYWindow(monthlySales) {
  // FY window: Apr 2024 (yr=2024, mo=4) inclusive → Mar 2026 (yr=2026, mo=3) inclusive
  const filtered = monthlySales.filter(r => {
    const yr = parseInt(r.yr);
    const mo = parseInt(r.mo);
    if (yr === 2024 && mo >= 4) return true;
    if (yr === 2025) return true;
    if (yr === 2026 && mo <= 3) return true;
    return false;
  });
  return filtered;
}

export default function DashboardPage() {
  const { activeStore } = useAuth();
  const [summary,      setSummary]     = useState(null);
  const [monthlySales, setMonthlySales] = useState([]);
  const [catSales,     setCatSales]    = useState([]);
  const [losses,       setLosses]      = useState([]);
  const [gstData,      setGstData]     = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [error,        setError]       = useState('');

  const load = useCallback(async () => {
    if (!activeStore) return;
    setLoading(true); setError('');
    try {
      const [sumRes, monthRes, catRes, lossRes, gstRes] = await Promise.all([
        getDashboard(activeStore.id),
        getMonthlySales(activeStore.id),
        getCategorySales(activeStore.id),
        getStockoutLosses(activeStore.id),
        getGstSummary(activeStore.id),
      ]);
      setSummary(sumRes.data);
      setMonthlySales(monthRes.data);
      setCatSales(catRes.data);
      setLosses(lossRes.data);
      setGstData(gstRes.data);
    } catch (e) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [activeStore?.id]);

  useEffect(() => { load(); }, [load]);

  if (!activeStore) return (
    <div className="main-content">
      <div className="page-header">
        <div className="page-title">Dashboard</div>
        <div className="page-subtitle">Please select a store</div>
      </div>
    </div>
  );

  if (loading) return <div className="main-content"><Spinner /></div>;
  if (error)   return <div className="main-content"><div className="error-msg">{error}</div></div>;

  // ── FY-windowed chart data (Apr 2024 → Mar 2026) ─────────────────────────
  const fyRows        = filterFYWindow(monthlySales);
  const fyLabels      = fyRows.map(r => `${MONTHS[parseInt(r.mo) - 1]} ${r.yr}`);
  const fyRevenue     = fyRows.map(r => r.revenue);
  const fyOrders      = fyRows.map(r => r.orders);

  // Revenue bar — FY window
  const barChartData = {
    labels: fyLabels,
    datasets: [{
      label: 'Revenue (₹)',
      data:  fyRevenue,
      backgroundColor: 'rgba(59,130,212,0.7)',
      borderColor: '#3b82d4',
      borderWidth: 1,
    }],
  };

  // Orders line — FY window
  const lineChartData = {
    labels: fyLabels,
    datasets: [{
      label: 'Orders',
      data:  fyOrders,
      borderColor: '#7c5cd8',
      backgroundColor: 'rgba(124,92,216,0.1)',
      tension: 0.35,
      fill: true,
      pointRadius: 2,
    }],
  };

  // ── Chart options with improved tick resolution ───────────────────────────
  // Show every tick (all 24 months in FY window) — they fit at ~45° rotation
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        ticks: {
          // Show all months; rotate labels so none are clipped
          maxTicksLimit: fyLabels.length,
          maxRotation: 45,
          minRotation: 45,
          autoSkip: false,
          font: { size: 9 },
        },
      },
      y: { ticks: { font: { size: 10 } } },
    },
    layout: { padding: { bottom: 8 } },
  };

  // ── Category doughnut (all-time) ──────────────────────────────────────────
  const catTotals = {};
  catSales.forEach(r => {
    if (!catTotals[r.category]) catTotals[r.category] = 0;
    catTotals[r.category] += r.revenue;
  });
  const catLabels = Object.keys(catTotals);
  const catValues = catLabels.map(k => Math.round(catTotals[k]));

  const doughnutData = {
    labels: catLabels,
    datasets: [{
      data: catValues,
      backgroundColor: CHART_COLORS.slice(0, catLabels.length),
      borderWidth: 1,
    }],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { font: { size: 11 }, boxWidth: 12 } }
    },
  };

  // ── KPI numbers ───────────────────────────────────────────────────────────
  const inv         = summary?.inventory || {};
  // "All-Time Revenue" — sum of ALL months across ALL FYs in the DB
  const totalRevFmt = summary?.total_revenue_2yr ? fmtRs(summary.total_revenue_2yr) : '₹—';
  const recentRevFmt= summary?.recent_3mo_revenue ? fmtRs(summary.recent_3mo_revenue) : '₹—';
  const totalLoss   = losses.reduce((sum, l) => sum + l.estimated_weekly_loss, 0);

  // ── GST stat cards ────────────────────────────────────────────────────────
  const completedFYs = gstData.filter(g => !g.is_current);
  const currentFY    = gstData.find(g => g.is_current);
  // Last-2-FYs total revenue (for transparency next to "All-Time")
  const last2FYsRevenue = completedFYs.slice(-2).reduce((s, g) => s + g.revenue, 0);

  return (
    <div className="main-content">
      <div className="page-header">
        <div className="flex items-center gap-8">
          <div className="page-title">{activeStore.name}</div>
          <StoreTypeBadge type={activeStore.store_type} />
        </div>
        <div className="page-subtitle">
          Sales performance &amp; inventory health — FY 2024-25 &amp; FY 2025-26
        </div>
      </div>

      {/* ── Stat Cards row 1: core KPIs ── */}
      <div className="stats-grid">
        <StatCard label="All-Time Revenue"  value={totalRevFmt}
          sub={`All FYs combined`} />
        {last2FYsRevenue > 0 && (
          <StatCard label="Last 2 FYs Revenue" value={fmtRs(last2FYsRevenue)}
            sub={completedFYs.slice(-2).map(g => g.fy).join(' + ')} />
        )}
        <StatCard label="Last 3 Months"    value={recentRevFmt}  sub="Recent performance" />
        <StatCard label="Total Orders"
          value={summary?.total_orders?.toLocaleString('en-IN') || 0}
          sub="Completed transactions" />
        <StatCard label="Total Products"   value={inv.total_products || 0} sub="SKUs tracked" />
        <StatCard label="Stockouts"
          value={inv.stockouts || 0}
          sub="Need immediate restock"
          color={inv.stockouts > 0 ? 'var(--critical)' : 'var(--success)'} />
        <StatCard label="Overstock"
          value={inv.overstock || 0}
          sub="Excess inventory risk"
          color={inv.overstock > 0 ? 'var(--warning)' : 'var(--success)'} />
        <StatCard label="Low Stock"
          value={inv.low_stock || 0}
          sub="Below reorder level"
          color={inv.low_stock > 0 ? 'var(--warning)' : 'var(--success)'} />
        {totalLoss > 0 && (
          <StatCard
            label="Est. Stockout Loss"
            value={`${fmtRs(totalLoss)}/wk`}
            sub="Revenue at risk"
            color="var(--critical)" />
        )}
      </div>

      {/* ── Current FY highlight (Fix 5) ── */}
      {currentFY && (
        <div style={{
          background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'8px',
          padding:'12px 18px', marginBottom:'16px',
          display:'flex', flexWrap:'wrap', gap:'24px', alignItems:'center',
        }}>
          <div style={{fontSize:'11px', fontWeight:700, color:'var(--accent)',
            textTransform:'uppercase', letterSpacing:'0.5px', minWidth:'120px'}}>
            {currentFY.fy} — Current FY (YTD)
          </div>
          <div>
            <div style={{fontSize:'11px', color:'var(--muted)'}}>Revenue till date</div>
            <div style={{fontWeight:700, fontSize:'18px', color:'var(--text)'}}>
              {fmtRs(currentFY.revenue)}
            </div>
          </div>
          <div>
            <div style={{fontSize:'11px', color:'var(--muted)'}}>GST Paid (18%)</div>
            <div style={{fontWeight:700, fontSize:'18px', color:'var(--accent)'}}>
              {fmtRs(currentFY.gst_paid)}
            </div>
          </div>
          <div style={{fontSize:'11px', color:'var(--muted)', marginLeft:'auto'}}>
            * GST calculated at flat 18% on revenue for demo purposes
          </div>
        </div>
      )}

      {/* ── Historical GST stat cards (last 2 complete FYs) ── */}
      {completedFYs.length > 0 && (
        <>
          <div style={{
            fontSize: '11px', fontWeight: 600, color: 'var(--muted)',
            textTransform: 'uppercase', letterSpacing: '0.5px',
            marginBottom: '8px', marginTop: '4px',
          }}>
            GST Paid — Last 2 Completed Financial Years (18% of Revenue)
          </div>
          <div className="stats-grid" style={{ marginBottom: '20px' }}>
            {completedFYs.slice(-2).map(g => (
              <StatCard
                key={g.fy}
                label={`GST Paid — ${g.fy}`}
                value={fmtRs(g.gst_paid)}
                sub={`FY Revenue: ${fmtRs(g.revenue)}`}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Charts: Revenue + Orders (FY Apr 2024 → Mar 2026) ── */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Monthly Revenue — FY 2024-25 &amp; FY 2025-26 (₹)</h3>
          {/* Extra height to accommodate rotated labels without clipping */}
          <div style={{ height: 240 }}>
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>
        <div className="chart-card">
          <h3>Monthly Order Volume — FY 2024-25 &amp; FY 2025-26</h3>
          <div style={{ height: 240 }}>
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* ── Category doughnut + Stockout losses ── */}
      <div className="charts-grid">
        {catLabels.length > 0 && (
          <div className="chart-card">
            <h3>Revenue by Category</h3>
            <div style={{ height: 220 }}>
              <Doughnut data={doughnutData} options={pieOptions} />
            </div>
          </div>
        )}
        {losses.length > 0 && (
          <div className="chart-card">
            <h3>Stockout Revenue Losses (Est. Weekly)</h3>
            <div className="table-wrap" style={{ maxHeight: 220, overflow: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th className="text-right">Loss/Week</th>
                  </tr>
                </thead>
                <tbody>
                  {losses.map((l, i) => (
                    <tr key={i}>
                      <td>{l.product}</td>
                      <td>{l.category}</td>
                      <td className="text-right"
                        style={{ color: 'var(--critical)', fontWeight: 600 }}>
                        {fmtRs(l.estimated_weekly_loss)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
