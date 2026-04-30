import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoicesAPI, sitesAPI } from '../../api';
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
  due_date: '',
  status: 'unpaid',
  advance_amount: '',
};

const EMPTY_ITEM = { description: '', quantity: 1, rate: 0, amount: 0 };

export default function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [invoices, setInvoices] = useState([]);
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
  const [filterStatus, setFilterStatus] = useState('');

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteRef = useRef(null);

  const navigate = useNavigate();

  const filteredInvoices = invoices.filter((inv) => {
    const s = search.toLowerCase().trim();
    return (
      inv.invoice_number?.toLowerCase().includes(s) ||
      inv.site_name?.toLowerCase().includes(s) ||
      inv.client_name?.toLowerCase().includes(s)
    );
  });

  const fetchData = useCallback(async () => {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;

      const [invRes, sitesRes] = await Promise.all([
        invoicesAPI.getAll(params),
        sitesAPI.getAll(),
      ]);

      setInvoices(invRes.data);
      setSites(sitesRes.data);
    } catch {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

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

  const handleEdit = async (inv) => {
    try {
      const res = await invoicesAPI.getById(inv.id);
      const fullInv = res.data;

      setEditingId(fullInv.id);

      setForm({
        client_name: fullInv.client_name || fullInv.site?.name || '',
        site_id: fullInv.site_id || null,
        address: fullInv.address || fullInv.site?.address || '',
        phone: fullInv.phone || fullInv.site?.phone || '',
        gst_number: fullInv.gst_number || fullInv.site?.gst_number || '',
        notes: fullInv.notes || '',
        due_date: fullInv.due_date ? String(fullInv.due_date).split('T')[0] : '',
        status: fullInv.status || 'unpaid',
        advance_amount: fullInv.advance_amount || '',
      });

      setItems(
        fullInv.items && fullInv.items.length > 0
          ? fullInv.items
          : [{ ...EMPTY_ITEM }]
      );

      setTaxRate(fullInv.tax_rate || 0);
      setSuggestions([]);
      setShowSuggestions(false);
      setModalOpen(true);
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.client_name.trim()) return toast.error('Please enter client name');
    if (items.some((i) => !i.description || !i.rate)) return toast.error('Fill all item fields');

    const payload = {
      client_name: form.client_name.trim(),
      site_id: form.site_id || null,
      address: form.address || null,
      phone: form.phone || null,
      gst_number: form.gst_number || null,
      tax_rate: parseFloat(taxRate) || 0,
      status: form.status,
      due_date: form.due_date || null,
      notes: form.notes || null,
      advance_amount: parseFloat(form.advance_amount) || 0,
      items,
    };

    setSaving(true);

    try {
      if (editingId) {
        await invoicesAPI.update(editingId, payload);
        toast.success('Invoice updated');
      } else {
        await invoicesAPI.create(payload);
        toast.success('Invoice created');
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

  const handleDownloadPDF = async (inv) => {
    try {
      const res = await invoicesAPI.downloadPDF(inv.id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${inv.invoice_number}.pdf`;
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
      await invoicesAPI.delete(deleteTarget.id);
      toast.success('Invoice deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setDeleting(false);
    }
  };

  const ActionButtons = ({ inv }) => (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button className="btn btn-outline btn-sm" onClick={() => handleDownloadPDF(inv)} title="Download">
        📥
      </button>

      <button className="btn btn-outline btn-sm" onClick={() => navigate(`/invoices/${inv.id}`)} title="View">
        👁️
      </button>

      <button
        className="btn btn-outline btn-sm"
        style={{ color: '#2563eb' }}
        onClick={() => handleEdit(inv)}
        title="Edit"
      >
        ✏️
      </button>

      <button
        className="btn btn-outline btn-sm"
        style={{ color: '#dc2626' }}
        onClick={() => setDeleteTarget(inv)}
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
          <h2 className="page-title">Invoices</h2>
          <p className="page-subtitle">
            {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
          </p>
        </div>

        <button className="btn btn-primary" onClick={openCreate}>
          + Create Invoice
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
          <option value="unpaid">Proforma Invoice</option>
          <option value="paid">Tax Invoice</option>
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
        ) : filteredInvoices.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🧾</div>
            <p>No invoices yet</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper desktop-table">
              <table>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Advance</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td
                        style={{ fontWeight: 600, color: '#1e40af', cursor: 'pointer' }}
                        onClick={() => navigate(`/invoices/${inv.id}`)}
                      >
                        {inv.invoice_number}
                      </td>

                      <td>{inv.site_name || inv.client_name || '—'}</td>
                      <td>{formatDate(inv.date)}</td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(inv.total)}</td>

                      <td style={{ color: '#16a34a', fontWeight: 600 }}>
                        {formatCurrency(inv.advance_amount || 0)}
                      </td>

                      <td>
                        <span className={`badge ${statusColor(inv.status)}`}>
                          {inv.status === 'paid'
                            ? 'Tax Invoice'
                            : inv.status === 'unpaid'
                            ? 'Proforma Invoice'
                            : inv.status}
                        </span>
                      </td>

                      <td>
                        <ActionButtons inv={inv} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-cards">
              {filteredInvoices.map((inv) => (
                <div key={inv.id} className="invoice-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>#{inv.invoice_number}</strong>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>
                      {formatDate(inv.date)}
                    </span>
                  </div>

                  <div>{inv.site_name || inv.client_name || '—'}</div>
                  <div>Total: {formatCurrency(inv.total)}</div>

                  <div style={{ color: '#16a34a', fontWeight: 600 }}>
                    Advance: {formatCurrency(inv.advance_amount || 0)}
                  </div>

                  <div>
                    Status:{' '}
                    <span className={`badge ${statusColor(inv.status)}`}>
                      {inv.status === 'paid'
                        ? 'Tax Invoice'
                        : inv.status === 'unpaid'
                        ? 'Proforma Invoice'
                        : inv.status}
                    </span>
                  </div>

                  <div className="card-actions">
                    <ActionButtons inv={inv} />
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
        title={editingId ? 'Edit Invoice' : 'Create Invoice'}
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
                  <option value="paid">Tax Invoice</option>
                  <option value="unpaid">Proforma Invoice</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
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
                ? '✏️ Update Invoice'
                : '🧾 Create Invoice'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Invoice"
        message={`Delete invoice ${deleteTarget?.invoice_number}?`}
      />
    </div>
  );
}