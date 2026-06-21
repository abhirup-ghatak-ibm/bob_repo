import React from 'react';

export default function ContactPage() {
  return (
    <div className="main-content">
      <div className="page-header">
        <div className="page-title">Contact RetailAI</div>
        <div className="page-subtitle">Get in touch with our support team</div>
      </div>

      <div className="card" style={{ maxWidth: '520px' }}>
        <div className="card-title">Support &amp; Help</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '12px' }}>
          {/* Email */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '8px',
              background: '#eff6ff', border: '1px solid #bfdbfe',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', flexShrink: 0,
            }}>✉</div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase',
                letterSpacing: '0.5px', marginBottom: '3px' }}>Email Support</div>
              <a href="mailto:support@RetailAI.com"
                style={{ fontSize: '15px', fontWeight: 600, color: 'var(--accent)' }}>
                support@RetailAI.com
              </a>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '3px' }}>
                We typically respond within 1 business day.
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)' }} />

          {/* Phone */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '8px',
              background: '#f0fdf4', border: '1px solid #86efac',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', flexShrink: 0,
            }}>☎</div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase',
                letterSpacing: '0.5px', marginBottom: '3px' }}>Phone Support</div>
              <a href="tel:9876543210"
                style={{ fontSize: '15px', fontWeight: 600, color: 'var(--success)' }}>
                9876543210
              </a>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '3px' }}>
                Mon–Fri, 9 AM – 6 PM IST
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)' }} />

          {/* Note */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '6px', padding: '12px 14px', fontSize: '13px',
            color: 'var(--muted)',
          }}>
            For technical issues, please include your store name and a brief description
            of the problem when contacting support.
          </div>
        </div>
      </div>
    </div>
  );
}
