import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { quotationsAPI, sitesAPI } from '../../api';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ItemsForm from '../../components/common/ItemsForm';
import { formatCurrency, formatDate, statusColor, getError } from '../../utils/helpers';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  client_name: '',
  site_id: null,
  address: '',
  phone: '',
  gst_number: '',
  notes: '',
  valid_until: '',
  status: 'draft',
  advance_amount: '',
};

const EMPTY_ITEM = { description: '', quantity: 1, rate: 0, amount: 0 };

export default function QuotationsPage() {
  const [search, setSearch] = useState('');
  const [quotations, setQuotations] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [taxRate, setTaxRate] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteRef = useRef(null);

  const navigate = useNavigate();

  const filteredQuotations = quotations.filter((quot) => {
    const s = search.toLowerCase().trim();

    const matchesSearch =
      quot.quotation_number?.toLowerCase().includes(s) ||
      quot.site_name?.toLowerCase().includes(s) ||
      quot.client_name?.toLowerCase().includes(s);

    const matchesStatus = filterStatus ? quot.status === filterStatus : true;

    return matchesSearch && matchesStatus;
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
    setForm({
      ...form,
      client_name: value,
      site_id: null,
    });

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
      client_name: site.name || '',
      site_id: site.id,
      address: site.address || '',
      phone: site.phone || '',
      gst_number: site.gst_number || '',
    });

    setSuggestions([]);
    setShowSuggestions(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setItems([{ ...EMPTY_ITEM }]);
    setTaxRate(0);
    setSuggestions([]);
    setShowSuggestions(false);
    setModalOpen(true);
  };

  const handleEdit = async (quot) => {
    try {
      const res = await quotationsAPI.getById(quot.id);
      const fullQuot = res.data;

      setEditingId(fullQuot.id);

      setForm({
        client_name: fullQuot.client_name || fullQuot.site?.name || '',
        site_id: fullQuot.site_id || null,
        address: fullQuot.address || fullQuot.site?.address || '',
        phone: fullQuot.phone || fullQuot.site?.phone || '',
        gst_number: fullQuot.gst_number || fullQuot.site?.gst_number || '',
        notes: fullQuot.notes || '',
        valid_until: fullQuot.valid_until ? String(fullQuot.valid_until).split('T')[0] : '',
        status: fullQuot.status || 'draft',
        advance_amount: fullQuot.advance_amount || '',
      });

      setItems(
        fullQuot.items && fullQuot.items.length > 0
          ? fullQuot.items
          : [{ ...EMPTY_ITEM }]
      );

      setTaxRate(fullQuot.tax_rate || 0);
      setSuggestions([]);
      setShowSuggestions(false);
      setModalOpen(true);
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.client_name.trim()) {
      return toast.error('Please enter client name');
    }

    if (items.some((i) => !i.description || !i.rate)) {
      return toast.error('Fill all item fields');
    }

    const payload = {
      client_name: form.client_name.trim(),
      site_id: form.site_id || null,
      address: form.address || null,
      phone: form.phone || null,
      gst_number: form.gst_number || null,
      tax_rate: parseFloat(taxRate) || 0,
      status: form.status,
      valid_until: form.valid_until || null,
      notes: form.notes || null,
      advance_amount: parseFloat(form.advance_amount) || 0,
      items,
    };

    setSaving(true);

    try {
      if (editingId) {
        await quotationsAPI.update(editingId, payload);
        toast.success('Quotation updated');
      } else {
        await quotationsAPI.create(payload);
        toast.success('Quotation created');
      }

      setModalOpen(false);
      setEditingId(null);
      fetchData();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleConvert = async (quot) => {
    if (quot.status === 'converted') {
      return toast.error('Already converted');
    }

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

  const handleDelete = async () => {
    setDeleting(true);

    try {
      await quotationsAPI.delete(deleteTarget.id);
      toast.success('Quotation deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setDeleting(false);
    }
  };

  const ActionButtons = ({ quot }) => (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button
        className="btn btn-outline btn-sm"
        onClick={() => handleDownloadPDF(quot)}
        title="Download"
      >
        📥
      </button>

      <button
        className="btn btn-outline btn-sm"
        onClick={() => navigate(`/quotations/${quot.id}`)}
        title="View"
      >
        👁️
      </button>

      <button
        className="btn btn-outline btn-sm"
        style={{ color: '#2563eb' }}
        onClick={() => handleEdit(quot)}
        title="Edit"
      >
        ✏️
      </button>

      {quot.status !== 'converted' && (
        <button
  className="btn btn-outline btn-sm"
  style={{ color: '#7c3aed', fontSize: 11 }}
  onClick={() => handleConvert(quot)}
  disabled={converting === quot.id}
  title="Convert to Invoice"
>
  {converting === quot.id ? '...' : '→ Invoice'}
</button>
      )}

      <button
        className="btn btn-outline btn-sm"
        style={{ color: '#dc2626' }}
        onClick={() => setDeleteTarget(quot)}
        title="Delete"
      >
        🗑️
      </button>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Quotations</h2>
          <p className="page-subtitle">
            {quotations.length} quotation{quotations.length !== 1 ? 's' : ''}
          </p>
        </div>

        <button className="btn btn-primary" onClick={openCreate}>
          + Create Quotation
        </button>
      </div>

      <div className="filters-bar">
        <input
          type="text"
          placeholder="Search by number or client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-control"
          style={{ maxWidth: 260 }}
        />

        <select
          className="form-control"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="converted">Converted</option>
        </select>

        <button
          className="btn btn-outline btn-sm"
          onClick={() => {
            setFilterStatus('');
            setSearch('');
          }}
        >
          Clear
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state">
            <p>Loading...</p>
          </div>
        ) : filteredQuotations.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📋</div>
            <p>No quotations yet</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper desktop-table">
              <table>
                <thead>
                  <tr>
                    <th>Quotation #</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Advance</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredQuotations.map((quot) => (
                    <tr key={quot.id}>
                      <td
                        style={{ fontWeight: 600, color: '#1e40af', cursor: 'pointer' }}
                        onClick={() => navigate(`/quotations/${quot.id}`)}
                      >
                        {quot.quotation_number}
                      </td>

                      <td>{quot.site_name || quot.client_name || '—'}</td>
                      <td>{formatDate(quot.date)}</td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(quot.total)}</td>

                      <td style={{ color: '#16a34a', fontWeight: 600 }}>
                        {formatCurrency(quot.advance_amount || 0)}
                      </td>

                      <td>
                        <span className={`badge ${statusColor(quot.status)}`}>
                          {quot.status}
                        </span>
                      </td>

                      <td>
                        <ActionButtons quot={quot} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-cards">
              {filteredQuotations.map((quot) => (
                <div key={quot.id} className="invoice-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>#{quot.quotation_number}</strong>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>
                      {formatDate(quot.date)}
                    </span>
                  </div>

                  <div>{quot.site_name || quot.client_name || '—'}</div>
                  <div>Total: {formatCurrency(quot.total)}</div>

                  <div style={{ color: '#16a34a', fontWeight: 600 }}>
                    Advance: {formatCurrency(quot.advance_amount || 0)}
                  </div>

                  <div>
                    Status:{' '}
                    <span className={`badge ${statusColor(quot.status)}`}>
                      {quot.status}
                    </span>
                  </div>

                  <div className="card-actions">
                    <ActionButtons quot={quot} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
        }}
        title={editingId ? 'Edit Quotation' : 'Create Quotation'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="grid-2" style={{ marginBottom: 20 }}>
              <div className="form-group" ref={autocompleteRef} style={{ position: 'relative' }}>
                <label className="form-label">Client Name *</label>
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

                {form.site_id && (
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      color: '#1e40af',
                      background: '#dbeafe',
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}
                  >
                    🏢 Site linked
                  </div>
                )}

                {showSuggestions && (
                  <div
                    style={{
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
                    }}
                  >
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
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f9ff')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
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

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-control"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  {editingId && <option value="converted">Converted</option>}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Valid Until</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.valid_until}
                  onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Advance Amount</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Enter advance amount"
                  value={form.advance_amount}
                  onChange={(e) => setForm({ ...form, advance_amount: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter mobile number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">GST Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter GST number"
                  value={form.gst_number}
                  onChange={(e) => setForm({ ...form, gst_number: e.target.value })}
                />
              </div>
            </div>

            <ItemsForm
              items={items}
              setItems={setItems}
              taxRate={taxRate}
              setTaxRate={setTaxRate}
            />

            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Notes</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Notes..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setModalOpen(false);
                setEditingId(null);
              }}
            >
              Cancel
            </button>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving
                ? editingId
                  ? 'Updating...'
                  : 'Creating...'
                : editingId
                ? '✏️ Update Quotation'
                : '📋 Create Quotation'}
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
        message={`Delete quotation ${deleteTarget?.quotation_number}?`}
      />
    </div>
  );
}