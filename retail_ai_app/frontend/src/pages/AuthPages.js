import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api';
import { addStore as apiAddStore } from '../api';

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
        <div className="auth-title">RetailAI</div>
        <div className="auth-sub">Multi-store retail intelligence platform</div>

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


export function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
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
        <div className="auth-title">Create Account</div>
        <div className="auth-sub">Register as a store owner</div>

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
              onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" required />
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

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
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
