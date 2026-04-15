import React, { useEffect, useState, useCallback } from 'react';
import { transactionsAPI, sitesAPI } from '../../api';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatCurrency, formatDate, getError } from '../../utils/helpers';
import toast from 'react-hot-toast';

// MySQL backend expects: type, amount, site_id, name, description, note, payment_mode, date
const EMPTY_FORM = {
  type: 'IN', amount: '', site_id: '', name: '', description: '',
  note: '', payment_mode: 'Cash', date: new Date().toISOString().split('T')[0],
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTxn, setEditTxn] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState({ site_id: '', type: '', payment_mode: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const params = {};
      if (filters.site_id)      params.site_id      = filters.site_id;
      if (filters.type)         params.type         = filters.type;
      if (filters.payment_mode) params.payment_mode = filters.payment_mode;
      const [txnRes, sitesRes] = await Promise.all([
        transactionsAPI.getAll(params),
        sitesAPI.getAll(),
      ]);
      setTransactions(txnRes.data);
      setSites(sitesRes.data);
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // MySQL flat join: site_name (not txn.siteId?.name)
  const filteredTransactions = transactions.filter((txn) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return txn.name?.toLowerCase().includes(q) || txn.site_name?.toLowerCase().includes(q);
  });

  const openAdd = () => { setEditTxn(null); setForm(EMPTY_FORM); setModalOpen(true); };

  const openEdit = (txn) => {
    setEditTxn(txn);
    setForm({
      type:         txn.type,
      amount:       txn.amount,
      site_id:      txn.site_id,       // MySQL: site_id
      name:         txn.name,
      description:  txn.description || '',
      note:         txn.note        || '',
      payment_mode: txn.payment_mode,  // MySQL: payment_mode
      date:         new Date(txn.date).toISOString().split('T')[0],
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.name || !form.site_id) return toast.error('Amount, name, and site are required');
    setSaving(true);
    try {
      if (editTxn) { await transactionsAPI.update(editTxn.id, form); toast.success('Updated'); }
      else { await transactionsAPI.create(form); toast.success('Transaction added'); }
      setModalOpen(false);
      fetchData();
    } catch (err) { toast.error(getError(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await transactionsAPI.delete(deleteTarget.id);
      toast.success('Deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) { toast.error(getError(err)); }
    finally { setDeleting(false); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = filters.site_id ? { site_id: filters.site_id } : {};
      const res = await transactionsAPI.exportExcel(params);
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'transactions.xlsx'; a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel exported!');
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const totalIn  = transactions.filter((t) => t.type === 'IN').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const totalOut = transactions.filter((t) => t.type === 'OUT').reduce((s, t) => s + parseFloat(t.amount || 0), 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h2 className="page-title">Transactions</h2>
          <p className="page-subtitle">{filteredTransactions.length} of {transactions.length} records</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={handleExport} disabled={exporting}>
            {exporting ? '...' : '📥 Export Excel'}
          </button>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Transaction</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total IN',  val: totalIn,            color: '#16a34a' },
          { label: 'Total OUT', val: totalOut,           color: '#dc2626' },
          { label: 'Balance',   val: totalIn - totalOut, color: '#1e40af' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 10, padding: '12px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', flex: '1 1 130px', minWidth: 130 }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color }}>{formatCurrency(val)}</div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <input className="form-control" type="text" placeholder="🔍 Search by name or site..."
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: '1 1 200px', minWidth: 180 }} />

        <select className="form-control" style={{ flex: '1 1 130px' }} value={filters.site_id}
          onChange={(e) => setFilters({ ...filters, site_id: e.target.value })}>
          <option value="">All Sites</option>
          {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <select className="form-control" style={{ flex: '1 1 130px' }} value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option value="">All Types</option>
          <option value="IN">Money IN</option>
          <option value="OUT">Money OUT</option>
        </select>

        <select className="form-control" style={{ flex: '1 1 130px' }} value={filters.payment_mode}
          onChange={(e) => setFilters({ ...filters, payment_mode: e.target.value })}>
          <option value="">All Modes</option>
          <option>Cash</option><option>UPI</option><option>Bank</option>
        </select>

        <button className="btn btn-outline btn-sm"
          onClick={() => { setFilters({ site_id: '', type: '', payment_mode: '' }); setSearchQuery(''); }}>
          Clear
        </button>
      </div>

      {/* Desktop Table */}
      <div className="card desktop-table">
        {loading ? (
          <div className="empty-state"><p>Loading...</p></div>
        ) : filteredTransactions.length === 0 ? (
          <div className="empty-state"><div className="icon">💸</div><p>No transactions found</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Site</th><th>Name</th>
                  <th>Description</th><th>Mode</th><th>Type</th><th>Amount</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((txn) => (
                  <tr key={txn.id}>
                    <td>{formatDate(txn.date)}</td>
                    {/* MySQL flat join: site_name */}
                    <td style={{ fontWeight: 500, color: '#1e40af' }}>{txn.site_name || '—'}</td>
                    <td style={{ fontWeight: 500 }}>{txn.name}</td>
                    <td style={{ color: '#64748b', maxWidth: 160 }}>{txn.description || '—'}</td>
                    {/* MySQL: payment_mode */}
                    <td><span style={{ fontSize: 12, padding: '2px 8px', background: '#f1f5f9', borderRadius: 4 }}>{txn.payment_mode}</span></td>
                    <td>
                      <span className={`badge badge-${txn.type === 'IN' ? 'in' : 'out'}`}>{txn.type}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: txn.type === 'IN' ? '#16a34a' : '#dc2626' }}>
                      {txn.type === 'IN' ? '+' : '-'}{formatCurrency(txn.amount)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(txn)}>✏️</button>
                        <button className="btn btn-outline btn-sm" style={{ color: '#dc2626' }}
                          onClick={() => setDeleteTarget(txn)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="mobile-cards">
        {loading ? (
          <div className="empty-state"><p>Loading...</p></div>
        ) : filteredTransactions.length === 0 ? (
          <div className="empty-state"><div className="icon">💸</div><p>No transactions found</p></div>
        ) : filteredTransactions.map((txn) => (
          <div key={txn.id} style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{txn.name}</span>
              <span style={{ fontWeight: 700, fontSize: 15, color: txn.type === 'IN' ? '#16a34a' : '#dc2626' }}>
                {txn.type === 'IN' ? '+' : '-'}{formatCurrency(txn.amount)}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 12, color: '#64748b', marginBottom: 8 }}>
              <span style={{ background: '#f1f5f9', borderRadius: 4, padding: '2px 8px' }}>🏗 {txn.site_name || '—'}</span>
              <span style={{ background: '#f1f5f9', borderRadius: 4, padding: '2px 8px' }}>📅 {formatDate(txn.date)}</span>
              <span style={{ background: '#f1f5f9', borderRadius: 4, padding: '2px 8px' }}>{txn.payment_mode}</span>
              <span className={`badge badge-${txn.type === 'IN' ? 'in' : 'out'}`}>{txn.type}</span>
            </div>
            {txn.description && <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{txn.description}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => openEdit(txn)}>✏️ Edit</button>
              <button className="btn btn-outline btn-sm" style={{ flex: 1, color: '#dc2626' }}
                onClick={() => setDeleteTarget(txn)}>🗑️ Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editTxn ? 'Edit Transaction' : 'Add Transaction'}>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Site *</label>
                <select className="form-control" value={form.site_id}
                  onChange={(e) => setForm({ ...form, site_id: e.target.value })}>
                  <option value="">Select site</option>
                  {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-control" value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="IN">Money IN</option>
                  <option value="OUT">Money OUT</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount (₹) *</label>
                <input type="number" className="form-control" placeholder="0.00" min="0" step="0.01"
                  value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-control" placeholder="Transaction name" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Mode</label>
                <select className="form-control" value={form.payment_mode}
                  onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}>
                  <option>Cash</option><option>UPI</option><option>Bank</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input type="date" className="form-control" value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-control" placeholder="Description" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Note</label>
              <textarea className="form-control" rows={2} placeholder="Additional note"
                value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editTxn ? '💾 Update' : '+ Add'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting} title="Delete Transaction"
        message={`Delete transaction "${deleteTarget?.name}"?`} />
    </div>
  );
}
