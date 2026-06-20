import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { addStore, addProduct, getProducts, downloadTemplate, uploadExcelData } from '../api';
import { Spinner, StoreTypeBadge } from '../components/UI';

const STORE_TYPE_ICONS = { general: '🏪', electronics: '💻', automotive: '🚗' };

// ── Small reusable modal backdrop ──────────────────────────────────────────

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.45)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:999
    }}>
      <div style={{
        background:'var(--bg)', border:'1px solid var(--border)',
        borderRadius:'10px', padding:'24px 28px', width:'100%',
        maxWidth:'480px', maxHeight:'90vh', overflowY:'auto', position:'relative'
      }}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'18px'}}>
          <div style={{fontWeight:700, fontSize:'15px'}}>{title}</div>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:'18px',
            cursor:'pointer', color:'var(--muted)', lineHeight:1}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Add Store modal ────────────────────────────────────────────────────────

function AddStoreModal({ onClose, onAdded }) {
  const { addNewStore, switchStore } = useAuth();
  const [name,         setName]        = useState('');
  const [storeType,    setStoreType]   = useState('general');
  const [customType,   setCustomType]  = useState('');
  const [loading,      setLoading]     = useState(false);
  const [error,        setError]       = useState('');

  const resolvedType = storeType === 'other'
    ? (customType.trim().toLowerCase().replace(/\s+/g, '_') || 'other')
    : storeType;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Store name is required'); return; }
    if (storeType === 'other' && !customType.trim()) {
      setError('Please specify the store type'); return;
    }
    setLoading(true); setError('');
    try {
      const res = await addStore({ name: name.trim(), store_type: resolvedType });
      const newStore = res.data;
      addNewStore(newStore);
      switchStore(newStore);
      onAdded(newStore);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add store');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Add New Store" onClose={onClose}>
      {error && <div className="error-msg">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Store Name <span style={{color:'var(--danger)'}}>*</span></label>
          <input className="form-input" value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. My Fashion Store" required />
        </div>
        <div className="form-group">
          <label className="form-label">Store Type <span style={{color:'var(--danger)'}}>*</span></label>
          <select className="form-input" value={storeType}
            onChange={e => { setStoreType(e.target.value); setCustomType(''); }}>
            <option value="general">General Retail</option>
            <option value="electronics">Electronics</option>
            <option value="automotive">Automotive / Motors</option>
            <option value="other">Other (specify below)</option>
          </select>
        </div>
        {storeType === 'other' && (
          <div className="form-group">
            <label className="form-label">
              Specify Type <span style={{color:'var(--danger)'}}>*</span>
            </label>
            <input className="form-input" value={customType}
              onChange={e => setCustomType(e.target.value)}
              placeholder="e.g. Pharmacy, Bakery, Textile…" required />
          </div>
        )}
        <div style={{display:'flex',gap:'10px',marginTop:'4px'}}>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{flex:1}}>
            {loading ? 'Adding…' : 'Add Store'}
          </button>
          <button className="btn btn-secondary" type="button" onClick={onClose} style={{flex:1}}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Add Product modal ──────────────────────────────────────────────────────

function AddProductModal({ store, onClose, onAdded }) {
  const [form, setForm] = useState({
    name:'', category:'', subcategory:'', brand:'', variant:'',
    unit_price:'', cost_price:'', quantity:'0',
    reorder_level:'10', max_capacity:'200', is_perishable: false
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())      { setError('Product name is required'); return; }
    if (!form.category.trim())  { setError('Category is required'); return; }
    if (!form.unit_price || parseFloat(form.unit_price) <= 0) {
      setError('Unit price must be greater than 0'); return;
    }
    setLoading(true); setError('');
    try {
      const payload = {
        ...form,
        unit_price:   parseFloat(form.unit_price),
        cost_price:   parseFloat(form.cost_price || 0),
        quantity:     parseInt(form.quantity || 0),
        reorder_level:parseInt(form.reorder_level || 10),
        max_capacity: parseInt(form.max_capacity || 200),
      };
      await addProduct(store.id, payload);
      onAdded();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  const field = (label, key, type='text', required=false, placeholder='') => (
    <div className="form-group">
      <label className="form-label">
        {label}{required && <span style={{color:'var(--danger)'}}> *</span>}
      </label>
      <input className="form-input" type={type} value={form[key]}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder} required={required} />
    </div>
  );

  return (
    <Modal title={`Add Product — ${store.name}`} onClose={onClose}>
      {error && <div className="error-msg">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 14px'}}>
          <div style={{gridColumn:'1/-1'}}>{field('Product Name','name','text',true,'e.g. Cold Beverages')}</div>
          {field('Category','category','text',true,'e.g. beverages')}
          {field('Subcategory','subcategory','text',false,'e.g. drinks')}
          {field('Brand','brand','text',false,'e.g. Coca-Cola')}
          {field('Variant','variant','text',false,'e.g. 500ml')}
          {field('Unit Price (₹)','unit_price','number',true,'0')}
          {field('Cost Price (₹)','cost_price','number',false,'0')}
          {field('Current Stock','quantity','number',false,'0')}
          {field('Reorder Level','reorder_level','number',false,'10')}
          {field('Max Capacity','max_capacity','number',false,'200')}
        </div>
        <div className="form-group" style={{marginTop:'4px'}}>
          <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer'}}>
            <input type="checkbox" checked={form.is_perishable}
              onChange={e => set('is_perishable', e.target.checked)}
              style={{width:'16px',height:'16px'}} />
            <span className="form-label" style={{margin:0}}>Perishable item?</span>
          </label>
        </div>
        <div style={{display:'flex',gap:'10px',marginTop:'4px'}}>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{flex:1}}>
            {loading ? 'Adding…' : 'Add Product'}
          </button>
          <button className="btn btn-secondary" type="button" onClick={onClose} style={{flex:1}}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Excel upload section ───────────────────────────────────────────────────

function ExcelUploadSection({ store }) {
  const [uploading,  setUploading]  = useState(false);
  const [result,     setResult]     = useState(null);
  const [dragOver,   setDragOver]   = useState(false);
  const fileRef = useRef();

  const handleDownloadTemplate = async () => {
    try {
      const res = await downloadTemplate(store.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `RetailAI_Upload_Template_${store.name.replace(/\s+/g,'_')}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Could not download template. Make sure openpyxl is installed (pip install openpyxl).');
    }
  };

  const handleFile = async (file) => {
    if (!file || !file.name.endsWith('.xlsx')) {
      alert('Please select a valid .xlsx file.');
      return;
    }
    setUploading(true); setResult(null);
    try {
      const res = await uploadExcelData(store.id, file);
      setResult(res.data);
    } catch (err) {
      setResult({ error: err.response?.data?.error || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card" style={{marginTop:'0'}}>
      <div className="card-title">Upload Historical Data (Excel)</div>

      {/* Download template prompt */}
      <div style={{
        background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'6px',
        padding:'12px 14px', marginBottom:'16px', fontSize:'13px'
      }}>
        <strong style={{color:'var(--accent)'}}>New here?</strong> Download our Excel template first.
        It contains two sheets — <strong>Products</strong> and <strong>Sales History</strong> —
        with instructions and sample data. Required fields are marked with a{' '}
        <strong style={{color:'var(--danger)'}}>red ★</strong> in the header.
        <div style={{marginTop:'10px'}}>
          <button className="btn btn-primary" onClick={handleDownloadTemplate}
            style={{fontSize:'13px', padding:'7px 16px'}}>
            ⬇ Download Excel Template
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius:'8px', padding:'32px 20px', textAlign:'center',
          cursor:'pointer', background: dragOver ? '#eff6ff' : 'var(--surface)',
          transition:'all 0.15s', marginBottom:'12px'
        }}
      >
        <div style={{fontSize:'28px', marginBottom:'8px'}}>📂</div>
        <div style={{fontWeight:600, fontSize:'14px', color:'var(--text)'}}>
          {uploading ? 'Uploading…' : 'Drag & drop your .xlsx file here'}
        </div>
        <div style={{fontSize:'12px', color:'var(--muted)', marginTop:'4px'}}>
          or click to browse
        </div>
        <input ref={fileRef} type="file" accept=".xlsx"
          style={{display:'none'}}
          onChange={e => handleFile(e.target.files[0])} />
      </div>

      {uploading && <div style={{textAlign:'center', padding:'12px'}}><Spinner /></div>}

      {/* Result */}
      {result && !result.error && (
        <div style={{background:'#f0fdf4', border:'1px solid #86efac', borderRadius:'6px', padding:'14px'}}>
          <div style={{fontWeight:600, color:'#15803d', marginBottom:'8px'}}>Upload Complete</div>
          <div style={{fontSize:'13px', lineHeight:'1.8'}}>
            <div>Products added: <strong>{result.products_added}</strong></div>
            <div>Products updated (existing): <strong>{result.products_updated}</strong></div>
            <div>Sales records imported: <strong>{result.sales_added}</strong></div>
            {result.sales_skipped > 0 && <div style={{color:'var(--warning)'}}>Rows skipped: {result.sales_skipped}</div>}
          </div>
          {result.errors?.length > 0 && (
            <div style={{marginTop:'10px'}}>
              <div style={{fontWeight:600, fontSize:'12px', color:'var(--warning)', marginBottom:'4px'}}>
                Warnings / Skipped Rows:
              </div>
              <ul style={{fontSize:'11px', color:'var(--muted)', paddingLeft:'16px', lineHeight:'1.7'}}>
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
      {result?.error && (
        <div className="error-msg">{result.error}</div>
      )}
    </div>
  );
}

// ── Main Settings Page ──────────────────────────────────────────────────────

export default function SettingsPage() {
  const { owner, stores, activeStore, switchStore } = useAuth();
  const [showAddStore,   setShowAddStore]   = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [products,       setProducts]       = useState([]);
  const [prodLoading,    setProdLoading]    = useState(false);
  const [prodMsg,        setProdMsg]        = useState('');
  const [addedStores,    setAddedStores]    = useState([]);

  const loadProducts = useCallback(async () => {
    if (!activeStore) return;
    setProdLoading(true);
    try {
      const res = await getProducts(activeStore.id);
      setProducts(res.data);
    } catch {
      setProducts([]);
    } finally {
      setProdLoading(false);
    }
  }, [activeStore?.id]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleProductAdded = () => {
    setProdMsg('Product added successfully!');
    loadProducts();
    setTimeout(() => setProdMsg(''), 3000);
  };

  if (!activeStore) return (
    <div className="main-content">
      <div className="page-header"><div className="page-title">Settings</div></div>
    </div>
  );

  return (
    <div className="main-content">
      <div className="page-header">
        <div className="page-title">Settings</div>
        <div className="page-subtitle">Manage stores, products, and data uploads</div>
      </div>

      {/* ── My Stores ── */}
      <div style={{marginBottom:'24px'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center',
          marginBottom:'12px'}}>
          <div style={{fontWeight:700, fontSize:'14px'}}>My Stores</div>
          <button className="btn btn-primary" onClick={() => setShowAddStore(true)}
            style={{fontSize:'12px', padding:'6px 14px'}}>
            + Add New Store
          </button>
        </div>
        <div className="store-cards">
          {stores.map(s => (
            <div key={s.id}
              className={`store-card ${activeStore?.id === s.id ? 'selected' : ''}`}
              onClick={() => switchStore(s)}
            >
              <div className="store-card-icon">{STORE_TYPE_ICONS[s.store_type] || '🏬'}</div>
              <div className="store-card-name">{s.name}</div>
              <StoreTypeBadge type={s.store_type} />
              {activeStore?.id === s.id && (
                <div style={{fontSize:'11px', color:'var(--accent)', marginTop:'5px', fontWeight:600}}>
                  Active
                </div>
              )}
            </div>
          ))}
          {/* Placeholder card to add store */}
          <div className="store-card" onClick={() => setShowAddStore(true)}
            style={{opacity:0.6, borderStyle:'dashed'}}>
            <div className="store-card-icon">➕</div>
            <div className="store-card-name">Add Store</div>
            <div style={{fontSize:'12px', color:'var(--muted)'}}>Click to register</div>
          </div>
        </div>
      </div>

      <div style={{borderTop:'1px solid var(--border)', margin:'0 0 24px'}} />

      {/* ── Products for active store ── */}
      <div style={{marginBottom:'24px'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center',
          marginBottom:'12px'}}>
          <div>
            <div style={{fontWeight:700, fontSize:'14px'}}>
              Products — {activeStore.name}
              <StoreTypeBadge type={activeStore.store_type} style={{marginLeft:'8px'}} />
            </div>
            <div style={{fontSize:'12px', color:'var(--muted)', marginTop:'2px'}}>
              {products.length} product{products.length !== 1 ? 's' : ''} in inventory
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddProduct(true)}
            style={{fontSize:'12px', padding:'6px 14px'}}>
            + Add Product
          </button>
        </div>

        {prodMsg && <div className="success-msg">{prodMsg}</div>}

        {prodLoading ? <Spinner /> : products.length === 0 ? (
          <div className="card text-center text-muted" style={{padding:'32px'}}>
            No products yet for <strong>{activeStore.name}</strong>.
            Click <strong>"+ Add Product"</strong> to add your first product,
            or <strong>upload an Excel file</strong> below.
          </div>
        ) : (
          <div className="card" style={{padding:0}}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Brand</th>
                    <th className="text-right">Unit Price</th>
                    <th className="text-right">In Stock</th>
                    <th className="text-right">Reorder At</th>
                    <th>Perishable</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td style={{fontWeight:500}}>{p.name}</td>
                      <td style={{color:'var(--muted)'}}>{p.category}</td>
                      <td style={{color:'var(--muted)'}}>{p.brand || '—'}</td>
                      <td className="text-right">₹{p.unit_price?.toLocaleString('en-IN')}</td>
                      <td className="text-right" style={{
                        fontWeight:600,
                        color: p.quantity === 0 ? 'var(--critical)'
                             : p.quantity <= p.reorder_level ? 'var(--warning)'
                             : 'var(--success)'
                      }}>{p.quantity}</td>
                      <td className="text-right" style={{color:'var(--muted)'}}>{p.reorder_level}</td>
                      <td>
                        {p.is_perishable
                          ? <span className="badge badge-high">YES</span>
                          : <span style={{color:'var(--muted)',fontSize:'12px'}}>No</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div style={{borderTop:'1px solid var(--border)', margin:'0 0 24px'}} />

      {/* ── Excel Upload ── */}
      <ExcelUploadSection store={activeStore} />

      {/* Modals */}
      {showAddStore && (
        <AddStoreModal
          onClose={() => setShowAddStore(false)}
          onAdded={(s) => setAddedStores(prev => [...prev, s])}
        />
      )}
      {showAddProduct && (
        <AddProductModal
          store={activeStore}
          onClose={() => setShowAddProduct(false)}
          onAdded={handleProductAdded}
        />
      )}
    </div>
  );
}
