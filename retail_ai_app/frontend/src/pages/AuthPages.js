import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api';

// ── Password policy ──────────────────────────────────────────────────────────
// Min 8 chars, ≥1 uppercase, ≥1 lowercase, ≥1 digit, ≥1 special character

function validatePassword(pw) {
  if (pw.length < 8)              return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(pw))          return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(pw))          return 'Password must contain at least one lowercase letter.';
  if (!/[0-9]/.test(pw))          return 'Password must contain at least one number.';
  if (!/[^A-Za-z0-9]/.test(pw))   return 'Password must contain at least one special character (e.g. @, #, !, $).';
  return null;
}

// ── Shared RetailAI logo block ───────────────────────────────────────────────

function AuthLogo() {
  return (
    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '22px', fontWeight: 700, letterSpacing: '0.3px',
        color: '#1e293b',
      }}>
        Retail<span style={{ color: '#3b82d4' }}>AI</span>
      </div>
    </div>
  );
}

// ── Login Page ───────────────────────────────────────────────────────────────

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <AuthLogo />
        <div className="auth-title" style={{ textAlign: 'center' }}>Sign In</div>
        <div className="auth-sub" style={{ textAlign: 'center' }}>
          Multi-store retail intelligence platform
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={{marginTop:'16px', fontSize:'12px', color:'var(--muted)', textAlign:'center'}}>
          Don't have an account? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
}


// ── Register Page ────────────────────────────────────────────────────────────

export function RegisterPage() {
  const { touchRefresh } = useAuth();
  const navigate = useNavigate();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [pwError,  setPwError]  = useState('');
  const [stores,   setStores]   = useState([{ name: '', store_type: 'general', custom_type: '' }]);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const addStoreRow = () =>
    setStores(prev => [...prev, { name: '', store_type: 'general', custom_type: '' }]);

  const removeStoreRow = (i) =>
    setStores(prev => prev.filter((_, idx) => idx !== i));

  const updateStore = (i, field, value) =>
    setStores(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

  // Resolve the actual store_type to send (handles "other" → custom text)
  const resolveType = (s) => {
    if (s.store_type === 'other') {
      return s.custom_type.trim().toLowerCase().replace(/\s+/g, '_') || 'other';
    }
    return s.store_type;
  };

  const handlePasswordChange = (v) => {
    setPassword(v);
    setPwError(validatePassword(v) || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);

    // Client-side password policy check
    const pwErr = validatePassword(password);
    if (pwErr) {
      setPwError(pwErr);
      setLoading(false);
      return;
    }

    const otherWithoutType = stores.find(s => s.store_type === 'other' && !s.custom_type.trim());
    if (otherWithoutType) {
      setError('Please specify the type for all stores marked "Other".');
      setLoading(false); return;
    }
    const validStores = stores.filter(s => s.name.trim()).map(s => ({
      name: s.name, store_type: resolveType(s)
    }));
    if (!validStores.length) {
      setError('Please add at least one store name.');
      setLoading(false);
      return;
    }
    try {
      const res = await register({ name, email, password, stores: validStores });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('owner', JSON.stringify(res.data.owner));
      localStorage.setItem('stores', JSON.stringify(res.data.stores));
      const active = res.data.stores[0] || null;
      localStorage.setItem('activeStore', JSON.stringify(active));
      touchRefresh();
      navigate('/dashboard');
      window.location.reload(); // refresh auth state
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{maxWidth:'480px'}}>
        <AuthLogo />
        <div className="auth-title" style={{ textAlign: 'center' }}>Create Account</div>
        <div className="auth-sub" style={{ textAlign: 'center' }}>Register as a store owner</div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Owner Name</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)}
              placeholder="Full name" required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="Email address" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password}
              onChange={e => handlePasswordChange(e.target.value)}
              placeholder="Min 8 chars, upper + lower + number + special"
              required />
            {/* Live password hint */}
            {password.length === 0 ? (
              <div style={{fontSize:'11px', color:'var(--muted)', marginTop:'4px', lineHeight:'1.5'}}>
                Must be ≥8 characters with at least one uppercase, one lowercase,
                one number, and one special character (e.g. @, #, !, $).
              </div>
            ) : pwError ? (
              <div style={{fontSize:'11px', color:'var(--critical)', marginTop:'4px'}}>{pwError}</div>
            ) : (
              <div style={{fontSize:'11px', color:'var(--success)', marginTop:'4px'}}>✓ Password looks good</div>
            )}
          </div>

          <div style={{marginBottom:'12px'}}>
            <div className="form-label" style={{marginBottom:'8px'}}>Your Stores</div>
            {stores.map((s, i) => (
              <div key={i} style={{marginBottom:'10px'}}>
                <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                  <input className="form-input" value={s.name}
                    onChange={e => updateStore(i, 'name', e.target.value)}
                    placeholder={`Store name`} style={{flex:2}} />
                  <select className="form-input" value={s.store_type}
                    onChange={e => { updateStore(i, 'store_type', e.target.value); updateStore(i, 'custom_type', ''); }}
                    style={{flex:1}}>
                    <option value="general">General</option>
                    <option value="electronics">Electronics</option>
                    <option value="automotive">Automotive</option>
                    <option value="other">Other…</option>
                  </select>
                  {stores.length > 1 &&
                    <button type="button" onClick={() => removeStoreRow(i)}
                      style={{background:'none', border:'none', color:'var(--danger)', fontSize:'16px',
                        cursor:'pointer', padding:'0 4px'}}>✕</button>
                  }
                </div>
                {s.store_type === 'other' && (
                  <input className="form-input" value={s.custom_type}
                    onChange={e => updateStore(i, 'custom_type', e.target.value)}
                    placeholder="Specify type (e.g. Pharmacy, Bakery…)"
                    style={{marginTop:'6px', fontSize:'12px'}} required />
                )}
              </div>
            ))}
            <button type="button" onClick={addStoreRow} className="btn btn-secondary"
              style={{fontSize:'12px', padding:'6px 12px'}}>
              + Add Another Store
            </button>
          </div>

          <button className="btn btn-primary btn-full" type="submit" disabled={loading || !!pwError}>
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <div style={{marginTop:'14px', fontSize:'12px', color:'var(--muted)', textAlign:'center'}}>
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
