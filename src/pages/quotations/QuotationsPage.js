// import React, { useEffect, useState, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { quotationsAPI } from '../../api';
// import Modal from '../../components/common/Modal';
// import ConfirmDialog from '../../components/common/ConfirmDialog';
// import ItemsForm from '../../components/common/ItemsForm';
// import { formatCurrency, getError } from '../../utils/helpers';
// import toast from 'react-hot-toast';

// const EMPTY_FORM = {
//   client_name: '',
//   notes: '',
//   valid_until: '',
//   status: 'draft',
// };

// const EMPTY_ITEM = { description: '', quantity: 1, rate: 0, amount: 0 };
// const handleDownloadPDF = async (quot) => {
//   try {
//     const res = await quotationsAPI.downloadPDF(quot.id);
//     const blob = new Blob([res.data], { type: 'application/pdf' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `${quot.quotation_number}.pdf`;
//     a.click();
//     URL.revokeObjectURL(url);
//     toast.success('PDF downloaded');
//   } catch {
//     toast.error('PDF download failed');
//   }
// };
// export default function QuotationsPage() {
//   const [search, setSearch] = useState('');
//   const [quotations, setQuotations] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [modalOpen, setModalOpen] = useState(false);
//   const [form, setForm] = useState(EMPTY_FORM);
//   const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
//   const [taxRate, setTaxRate] = useState(0);
//   const [saving, setSaving] = useState(false);
//   const [deleteTarget, setDeleteTarget] = useState(null);
//   const [deleting, setDeleting] = useState(false);
//   const [converting, setConverting] = useState(null);

//   const navigate = useNavigate();

//   const filteredQuotations = quotations.filter((q) => {
//     const s = search.toLowerCase();
//     return (
//       q.quotation_number?.toLowerCase().includes(s) ||
//       q.site_name?.toLowerCase().includes(s) ||
//       q.client_name?.toLowerCase().includes(s)
//     );
//   });

//   const fetchData = useCallback(async () => {
//     try {
//       const res = await quotationsAPI.getAll();
//       setQuotations(res.data);
//     } catch {
//       toast.error('Failed to load quotations');
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchData();
//   }, [fetchData]);

//   const openCreate = () => {
//     setForm(EMPTY_FORM);
//     setItems([{ ...EMPTY_ITEM }]);
//     setTaxRate(0);
//     setModalOpen(true);
//   };

// const handleCreate = async (e) => {
//   e.preventDefault();

//   if (!form.client_name || !form.client_name.trim()) {
//     return toast.error('Please enter client name');
//   }

//   if (items.some((i) => !i.description || !i.rate)) {
//     return toast.error('Fill all item fields');
//   }

//   setSaving(true);
//   try {
//     const payload = {
//       client_name: form.client_name.trim(),
//       tax_rate: parseFloat(taxRate) || 0,
//       status: form.status,
//       valid_until: form.valid_until || null,
//       notes: form.notes || null,
//       items,
//     };

//     console.log('PAYLOAD BEING SENT:', payload); // ← check this in browser console

//     await quotationsAPI.create(payload);
//     toast.success('Quotation created');
//     setModalOpen(false);
//     fetchData();
//   } catch (err) {
//     toast.error(getError(err));
//   } finally {
//     setSaving(false);
//   }
// };

//   const handleConvert = async (quot) => {
//     if (quot.status === 'converted') return;
//     setConverting(quot.id);
//     try {
//       await quotationsAPI.convert(quot.id);
//       toast.success('Converted to invoice!');
//       fetchData();
//       navigate('/invoices');
//     } catch (err) {
//       toast.error(getError(err));
//     } finally {
//       setConverting(null);
//     }
//   };

//   const handleDelete = async () => {
//     setDeleting(true);
//     try {
//       await quotationsAPI.delete(deleteTarget.id);
//       toast.success('Deleted');
//       setDeleteTarget(null);
//       fetchData();
//     } catch (err) {
//       toast.error(getError(err));
//     } finally {
//       setDeleting(false);
//     }
//   };

//   return (
//     <div>
//       <div className="page-header">
//         <div>
//           <p className="page-subtitle">{quotations.length} quotations</p>
//         </div>
//         <button className="btn btn-primary" onClick={openCreate}>
//           + Create Quotation
//         </button>
//       </div>

//       {/* Search */}
//       <input
//         type="text"
//         placeholder="Search by number or client..."
//         value={search}
//         onChange={(e) => setSearch(e.target.value)}
//         className="form-control"
//         style={{ maxWidth: 260, marginBottom: 10 }}
//       />

//       <div className="card">
//         {loading ? (
//           <p>Loading...</p>
//         ) : filteredQuotations.length === 0 ? (
//           <p>No quotations found</p>
//         ) : (
//           <table>
//             <thead>
//               <tr>
//                 <th>#</th>
//                 <th>Client</th>
//                 <th>Total</th>
//                 <th>Status</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filteredQuotations.map((q) => (
//                 <tr key={q.id}>
//                   <td>{q.quotation_number}</td>
//                   <td>{q.site_name || q.client_name || '—'}</td>
//                   <td>{formatCurrency(q.total)}</td>
//                   <td>
//                     <span style={{
//                       padding: '2px 8px',
//                       borderRadius: 4,
//                       fontSize: 12,
//                       background:
//                         q.status === 'converted' ? '#d1fae5' :
//                         q.status === 'sent'      ? '#dbeafe' : '#f3f4f6',
//                       color:
//                         q.status === 'converted' ? '#065f46' :
//                         q.status === 'sent'      ? '#1e40af' : '#374151',
//                     }}>
//                       {q.status}
//                     </span>
//                   </td>
// <td style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
//   <button
//     className="btn btn-sm"
//     title="View Details"
//     onClick={() => navigate(`/quotations/${q.id}`)}
//   >
//     👁️
//   </button>
//   <button
//     className="btn btn-sm"
//     title="Download PDF"
//     onClick={() => handleDownloadPDF(q)}
//   >
//     📄
//   </button>
//   <button
//     className="btn btn-sm"
//     title="Convert to Invoice"
//     disabled={q.status === 'converted' || converting === q.id}
//     onClick={() => handleConvert(q)}
//   >
//     {converting === q.id ? '...' : '→ Invoice'}
//   </button>
//   <button
//     className="btn btn-sm btn-danger"
//     title="Delete"
//     onClick={() => setDeleteTarget(q)}
//   >
//     🗑️
//   </button>
// </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>

//       {/* Create Modal */}
//       <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Quotation">
//         <form onSubmit={handleCreate}>
//           <div className="modal-body">

//             {/* CLIENT NAME */}
//            <div className="form-group">
//   <label>Client Name *</label>
//   <input
//     type="text"
//     className="form-control"
//     placeholder="Enter client / person name"
//     value={form.client_name}
//     onChange={(e) => setForm({ ...form, client_name: e.target.value })}
//   />
// </div>

//             {/* STATUS */}
//             <div className="form-group">
//               <label>Status</label>
//               <select
//                 className="form-control"
//                 value={form.status}
//                 onChange={(e) => setForm({ ...form, status: e.target.value })}
//               >
//                 <option value="draft">Draft</option>
//                 <option value="sent">Sent</option>
//               </select>
//             </div>

//             {/* VALID UNTIL */}
//             <div className="form-group">
//               <label>Valid Until</label>
//               <input
//                 type="date"
//                 className="form-control"
//                 value={form.valid_until}
//                 onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
//               />
//             </div>

//             <ItemsForm
//               items={items}
//               setItems={setItems}
//               taxRate={taxRate}
//               setTaxRate={setTaxRate}
//             />

//             <div className="form-group" style={{ marginTop: 12 }}>
//               <label>Notes</label>
//               <textarea
//                 className="form-control"
//                 placeholder="Optional notes..."
//                 value={form.notes}
//                 onChange={(e) => setForm({ ...form, notes: e.target.value })}
//               />
//             </div>
//           </div>

//           <div className="modal-footer">
//             <button type="button" onClick={() => setModalOpen(false)}>
//               Cancel
//             </button>
//             <button type="submit" className="btn btn-primary" disabled={saving}>
//               {saving ? 'Creating...' : 'Create'}
//             </button>
//           </div>
//         </form>
//       </Modal>

//       <ConfirmDialog
//         open={!!deleteTarget}
//         onClose={() => setDeleteTarget(null)}
//         onConfirm={handleDelete}
//         loading={deleting}
//         title="Delete Quotation"
//         message={`Are you sure you want to delete ${deleteTarget?.quotation_number}?`}
//       />
//     </div>
//   );
// }

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { quotationsAPI, sitesAPI } from '../../api';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ItemsForm from '../../components/common/ItemsForm';
import { formatCurrency, getError } from '../../utils/helpers';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  client_name: '',
  site_id: null,
  notes: '',
  valid_until: '',
  status: 'draft',
};

const EMPTY_ITEM = { description: '', quantity: 1, rate: 0, amount: 0 };

export default function QuotationsPage() {
  const [search, setSearch] = useState('');
  const [quotations, setQuotations] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [taxRate, setTaxRate] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState(null);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteRef = useRef(null);

  const navigate = useNavigate();

  const filteredQuotations = quotations.filter((q) => {
    const s = search.toLowerCase();
    return (
      q.quotation_number?.toLowerCase().includes(s) ||
      q.site_name?.toLowerCase().includes(s) ||
      q.client_name?.toLowerCase().includes(s)
    );
  });

  const fetchData = useCallback(async () => {
    try {
      const [quotRes, sitesRes] = await Promise.all([
        quotationsAPI.getAll(),
        sitesAPI.getAll(),
      ]);
      setQuotations(quotRes.data);
      setSites(sitesRes.data);
    } catch {
      toast.error('Failed to load quotations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClientNameChange = (value) => {
    setForm({ ...form, client_name: value, site_id: null }); // reset site_id on manual type
    if (value.trim().length > 0) {
      const filtered = sites.filter((s) =>
        s.name?.toLowerCase().includes(value.toLowerCase()) ||
        s.owner_name?.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSite = (site) => {
    setForm({
      ...form,
      client_name: site.name,
      site_id: site.id,
    });
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setItems([{ ...EMPTY_ITEM }]);
    setTaxRate(0);
    setSuggestions([]);
    setShowSuggestions(false);
    setModalOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!form.client_name || !form.client_name.trim()) {
      return toast.error('Please enter client name');
    }

    if (items.some((i) => !i.description || !i.rate)) {
      return toast.error('Fill all item fields');
    }

    setSaving(true);
    try {
      await quotationsAPI.create({
        client_name: form.client_name.trim(),
        site_id: form.site_id || null,
        tax_rate: parseFloat(taxRate) || 0,
        status: form.status,
        valid_until: form.valid_until || null,
        notes: form.notes || null,
        items,
      });

      toast.success('Quotation created');
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async (quot) => {
    try {
      const res = await quotationsAPI.downloadPDF(quot.id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${quot.quotation_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch {
      toast.error('PDF download failed');
    }
  };

  const handleConvert = async (quot) => {
    if (quot.status === 'converted') return;
    setConverting(quot.id);
    try {
      await quotationsAPI.convert(quot.id);
      toast.success('Converted to invoice!');
      fetchData();
      navigate('/invoices');
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setConverting(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await quotationsAPI.delete(deleteTarget.id);
      toast.success('Deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="page-subtitle">{quotations.length} quotations</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Create Quotation
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by number or client..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="form-control"
        style={{ maxWidth: 260, marginBottom: 10 }}
      />

      <div className="card">
        {loading ? (
          <p>Loading...</p>
        ) : filteredQuotations.length === 0 ? (
          <p>No quotations found</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Client</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotations.map((q) => (
                <tr key={q.id}>
                  <td>{q.quotation_number}</td>
                  <td>{q.site_name || q.client_name || '—'}</td>
                  <td>{formatCurrency(q.total)}</td>
                  <td>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      background:
                        q.status === 'converted' ? '#d1fae5' :
                        q.status === 'sent'      ? '#dbeafe' : '#f3f4f6',
                      color:
                        q.status === 'converted' ? '#065f46' :
                        q.status === 'sent'      ? '#1e40af' : '#374151',
                    }}>
                      {q.status}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button
                      className="btn btn-sm"
                      title="View Details"
                      onClick={() => navigate(`/quotations/${q.id}`)}
                    >
                      👁️
                    </button>
                    <button
                      className="btn btn-sm"
                      title="Download PDF"
                      onClick={() => handleDownloadPDF(q)}
                    >
                      📄
                    </button>
                    <button
                      className="btn btn-sm"
                      title="Convert to Invoice"
                      disabled={q.status === 'converted' || converting === q.id}
                      onClick={() => handleConvert(q)}
                    >
                      {converting === q.id ? '...' : '→ Invoice'}
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      title="Delete"
                      onClick={() => setDeleteTarget(q)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Quotation">
        <form onSubmit={handleCreate}>
          <div className="modal-body">

            {/* CLIENT NAME WITH AUTOCOMPLETE */}
            <div className="form-group" ref={autocompleteRef} style={{ position: 'relative' }}>
              <label>Client Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Type name or search existing site..."
                value={form.client_name}
                onChange={(e) => handleClientNameChange(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                autoComplete="off"
              />

              {/* Site tag if a site is selected */}
              {form.site_id && (
                <div style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: '#1e40af',
                  background: '#dbeafe',
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: 4,
                }}>
                  🏢 Site linked
                </div>
              )}

              {/* Suggestions Dropdown */}
              {showSuggestions && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#fff',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                  maxHeight: 200,
                  overflowY: 'auto',
                }}>
                  {suggestions.map((site) => (
                    <div
                      key={site.id}
                      onMouseDown={() => handleSelectSite(site)}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f3f4f6',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f0f9ff'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                    >
                      <span style={{ fontWeight: 600, fontSize: 14 }}>🏢 {site.name}</span>
                      {site.owner_name && (
                        <span style={{ fontSize: 12, color: '#6b7280' }}>
                          Owner: {site.owner_name}
                        </span>
                      )}
                      {site.phone && (
                        <span style={{ fontSize: 12, color: '#6b7280' }}>
                          📞 {site.phone}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* STATUS */}
            <div className="form-group">
              <label>Status</label>
              <select
                className="form-control"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
              </select>
            </div>

            {/* VALID UNTIL */}
            <div className="form-group">
              <label>Valid Until</label>
              <input
                type="date"
                className="form-control"
                value={form.valid_until}
                onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
              />
            </div>

            <ItemsForm
              items={items}
              setItems={setItems}
              taxRate={taxRate}
              setTaxRate={setTaxRate}
            />

            <div className="form-group" style={{ marginTop: 12 }}>
              <label>Notes</label>
              <textarea
                className="form-control"
                placeholder="Optional notes..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Quotation"
        message={`Are you sure you want to delete ${deleteTarget?.quotation_number}?`}
      />
    </div>
  );
}