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
 * Filter monthlySales rows to the historical FY window: Apr 2024 → Mar 2026.
 */
function filterHistoricalFYWindow(monthlySales) {
  return monthlySales.filter(r => {
    const yr = parseInt(r.yr);
    const mo = parseInt(r.mo);
    if (yr === 2024 && mo >= 4) return true;
    if (yr === 2025) return true;
    if (yr === 2026 && mo <= 3) return true;
    return false;
  });
}

/**
 * Filter monthlySales rows to the current real FY window:
 *   Apr of current-FY-start year → current real calendar month (inclusive).
 * Current FY start: if current month >= April → this year; else last year.
 */
function filterCurrentFYWindow(monthlySales) {
  const today = new Date();
  const nowYr = today.getFullYear();
  const nowMo = today.getMonth() + 1; // 1-based
  const fyStart = nowMo >= 4 ? nowYr : nowYr - 1;

  return monthlySales.filter(r => {
    const yr = parseInt(r.yr);
    const mo = parseInt(r.mo);
    // Must be within [Apr fyStart, nowMo nowYr]
    const rowIsAfterStart = (yr > fyStart) || (yr === fyStart && mo >= 4);
    const rowIsBeforeOrAtNow = (yr < nowYr) || (yr === nowYr && mo <= nowMo);
    return rowIsAfterStart && rowIsBeforeOrAtNow;
  });
}

/**
 * Build chart labels from rows, hiding label text for even-numbered months.
 * Data points still exist for all months; only the tick label is blank for even months.
 */
function buildLabels(rows) {
  return rows.map(r => {
    const mo = parseInt(r.mo);
    // Odd months: 1=Jan,3=Mar,5=May,7=Jul,9=Sep,11=Nov — show label
    // Even months: 2=Feb,4=Apr,6=Jun,8=Aug,10=Oct,12=Dec — blank label
    if (mo % 2 === 0) return ''; // even month — no label
    return `${MONTHS[mo - 1]} ${r.yr}`;
  });
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

  // ── Historical FY chart data (Apr 2024 → Mar 2026) ───────────────────────
  const histRows    = filterHistoricalFYWindow(monthlySales);
  const histLabels  = buildLabels(histRows);
  const histRevenue = histRows.map(r => r.revenue);
  const histOrders  = histRows.map(r => r.orders);

  // ── Current FY chart data (Apr current-FY-start → real current month) ────
  const today    = new Date();
  const nowYr    = today.getFullYear();
  const nowMo    = today.getMonth() + 1;
  const fyStart  = nowMo >= 4 ? nowYr : nowYr - 1;
  const fyLabel  = `FY ${fyStart}-${String(fyStart + 1).slice(-2)}`;

  const curRows    = filterCurrentFYWindow(monthlySales);
  const curLabels  = buildLabels(curRows);
  const curRevenue = curRows.map(r => r.revenue);
  const curOrders  = curRows.map(r => r.orders);

  // ── Chart datasets ────────────────────────────────────────────────────────

  // Historical Revenue bar
  const histBarData = {
    labels: histLabels,
    datasets: [{
      label: 'Revenue (₹)',
      data:  histRevenue,
      backgroundColor: 'rgba(59,130,212,0.7)',
      borderColor: '#3b82d4',
      borderWidth: 1,
    }],
  };

  // Historical Orders line
  const histLineData = {
    labels: histLabels,
    datasets: [{
      label: 'Orders',
      data:  histOrders,
      borderColor: '#7c5cd8',
      backgroundColor: 'rgba(124,92,216,0.1)',
      tension: 0.35,
      fill: true,
      pointRadius: 2,
    }],
  };

  // Current FY Revenue bar
  const curBarData = {
    labels: curLabels,
    datasets: [{
      label: 'Revenue (₹)',
      data:  curRevenue,
      backgroundColor: 'rgba(34,197,94,0.7)',
      borderColor: '#22c55e',
      borderWidth: 1,
    }],
  };

  // Current FY Orders line
  const curLineData = {
    labels: curLabels,
    datasets: [{
      label: 'Orders',
      data:  curOrders,
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245,158,11,0.1)',
      tension: 0.35,
      fill: true,
      pointRadius: 2,
    }],
  };

  // ── Chart options ─────────────────────────────────────────────────────────
  const makeChartOptions = (labelCount) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        ticks: {
          maxTicksLimit: labelCount,
          maxRotation: 45,
          minRotation: 45,
          autoSkip: false,
          font: { size: 9 },
        },
      },
      y: { ticks: { font: { size: 10 } } },
    },
    layout: { padding: { bottom: 8 } },
  });

  const histChartOptions = makeChartOptions(histLabels.length);
  const curChartOptions  = makeChartOptions(curLabels.length);

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
  const totalRevFmt = summary?.total_revenue_2yr ? fmtRs(summary.total_revenue_2yr) : '₹—';
  const recentRevFmt= summary?.recent_3mo_revenue ? fmtRs(summary.recent_3mo_revenue) : '₹—';
  const totalLoss   = losses.reduce((sum, l) => sum + l.estimated_weekly_loss, 0);

  // ── GST stat cards ────────────────────────────────────────────────────────
  const completedFYs = gstData.filter(g => !g.is_current);
  const currentFY    = gstData.find(g => g.is_current);
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

      {/* ── Current FY highlight bar ── */}
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

      {/* ── Section: Current FY Charts ── */}
      {curRows.length > 0 && (
        <>
          <div style={{
            fontSize: '12px', fontWeight: 700, color: 'var(--text)',
            textTransform: 'uppercase', letterSpacing: '0.5px',
            marginBottom: '10px', marginTop: '8px',
            borderLeft: '3px solid var(--success)', paddingLeft: '10px',
          }}>
            {fyLabel} — Current Financial Year (Apr {fyStart} → {MONTHS[nowMo - 1]} {nowYr})
          </div>
          <div className="charts-grid" style={{ marginBottom: '24px' }}>
            <div className="chart-card">
              <h3>Monthly Revenue — {fyLabel} YTD (₹)</h3>
              <div style={{ height: 240 }}>
                <Bar data={curBarData} options={curChartOptions} />
              </div>
            </div>
            <div className="chart-card">
              <h3>Monthly Order Volume — {fyLabel} YTD</h3>
              <div style={{ height: 240 }}>
                <Line data={curLineData} options={curChartOptions} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Section: Historical FY Charts (Apr 2024 → Mar 2026) ── */}
      <div style={{
        fontSize: '12px', fontWeight: 700, color: 'var(--text)',
        textTransform: 'uppercase', letterSpacing: '0.5px',
        marginBottom: '10px',
        borderLeft: '3px solid var(--accent)', paddingLeft: '10px',
      }}>
        Historical — FY 2024-25 &amp; FY 2025-26 (Apr 2024 → Mar 2026)
      </div>
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Monthly Revenue — FY 2024-25 &amp; FY 2025-26 (₹)</h3>
          <div style={{ height: 240 }}>
            <Bar data={histBarData} options={histChartOptions} />
          </div>
        </div>
        <div className="chart-card">
          <h3>Monthly Order Volume — FY 2024-25 &amp; FY 2025-26</h3>
          <div style={{ height: 240 }}>
            <Line data={histLineData} options={histChartOptions} />
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
