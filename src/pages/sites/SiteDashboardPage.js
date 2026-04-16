import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sitesAPI, transactionsAPI } from '../../api';
import StatCard from '../../components/common/StatCard';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatCurrency, formatDate, getError } from '../../utils/helpers';
import toast from 'react-hot-toast';

// MySQL backend expects: type, amount, site_id, name, description, note, payment_mode, date
const EMPTY_TXN = {
  type: 'IN', amount: '', name: '', description: '', note: '',
  payment_mode: 'Cash', date: new Date().toISOString().split('T')[0],
};

export default function SiteDashboardPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTxn, setEditTxn] = useState(null);
  const [form, setForm] = useState(EMPTY_TXN);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [exporting, setExporting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, txnRes] = await Promise.all([
        sitesAPI.getDashboard(id),
        transactionsAPI.getAll({ site_id: id }),
      ]);
      setData(dashRes.data);
      setTransactions(txnRes.data);
    } catch {
      toast.error('Failed to load site data');
      navigate('/sites');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = (type = 'IN') => {
    setEditTxn(null);
    setForm({ ...EMPTY_TXN, type, date: new Date().toISOString().split('T')[0] });
    setModalOpen(true);
  };

  const openEdit = (txn) => {
    setEditTxn(txn);
    setForm({
      type:         txn.type,
      amount:       txn.amount,
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
    if (!form.amount || !form.name) return toast.error('Amount and name are required');

    setSaving(true);
    try {
      if (editTxn) {
        await transactionsAPI.update(editTxn.id, { ...form, site_id: id });
        toast.success('Transaction updated');
      } else {
        await transactionsAPI.create({ ...form, site_id: id });
        toast.success(`${form.type === 'IN' ? 'Income' : 'Expense'} added`);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await transactionsAPI.delete(deleteTarget.id);
      toast.success('Transaction deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await transactionsAPI.exportExcel({ site_id: id });
      const blob = new Blob([res.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data?.site?.name || 'site'}-transactions.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel downloaded');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const filtered = filter === 'ALL' ? transactions : transactions.filter((t) => t.type === filter);

  if (loading) return <div className="empty-state"><p>Loading...</p></div>;

  const site = data?.site;

  return (
    <div style={{ overflowX: 'hidden', width: '100%', maxWidth: '100vw' }}>
      {/* Header */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/sites')} style={{ marginRight: 12 }}>
              ← Sites
            </button>
            <strong style={{ fontSize: 18 }}>{site?.name}</strong>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setShowDetails(!showDetails)}>
            {showDetails ? '🙈 Hide' : '👁️ Details'}
          </button>
        </div>
        {showDetails && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
            {site?.address    && <p style={{ color: '#64748b', fontSize: 14 }}>📍 {site.address}</p>}
            {/* MySQL: project_name, owner_name */}
            {site?.project_name && <p style={{ color: '#64748b', fontSize: 14 }}>📁 {site.project_name}</p>}
            {site?.owner_name   && <p style={{ color: '#64748b', fontSize: 14 }}>👤 {site.owner_name}</p>}
            {site?.phone        && <p style={{ color: '#64748b', fontSize: 14 }}>📞 {site.phone}</p>}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ gap: 12, marginBottom: 12 }}>
        <StatCard label="Total IN"  value={formatCurrency(data?.totalIn)}  icon="💵" />
        <StatCard label="Total OUT" value={formatCurrency(data?.totalOut)} icon="📤" />
        <StatCard label="Balance"   value={formatCurrency(data?.balance)}  icon="💰" />
      </div>

      {/* Filter + Export */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {['ALL', 'IN', 'OUT'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}>
            {f === 'ALL' ? 'All' : f === 'IN' ? '💚 IN' : '🔴 OUT'}
          </button>
        ))}
        <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }}
          onClick={handleExport} disabled={exporting}>
          {exporting ? '...' : '📊 Export Excel'}
        </button>
      </div>

      {/* Transactions */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <h3 style={{ marginBottom: 12, fontSize: 15, fontWeight: 700 }}>
          Transactions ({filtered.length})
        </h3>
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 400 }}>
          <table style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th>Date</th><th>Name</th><th>Description</th>
                <th>Payment Mode</th><th>Type</th><th>Amount</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  No transactions yet
                </td></tr>
              ) : filtered.map((txn) => (
                <tr key={txn.id}>
                  <td>{formatDate(txn.date)}</td>
                  <td>{txn.name}</td>
                  <td>{txn.description || '—'}</td>
                  {/* MySQL: payment_mode */}
                  <td>{txn.payment_mode}</td>
                  <td style={{ color: txn.type === 'IN' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                    {txn.type}
                  </td>
                  <td style={{ color: txn.type === 'IN' ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
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
      </div>

      {/* Fixed bottom buttons */}
<div className="site-dashboard-bottom-bar">
  <button
    className="btn btn-success"
    style={{ flex: 1, height: 48, fontSize: 15, fontWeight: 600 }}
    onClick={() => openAdd('IN')}
  >
    + Money IN
  </button>

  <button
    className="btn btn-danger"
    style={{ flex: 1, height: 48, fontSize: 15, fontWeight: 600 }}
    onClick={() => openAdd('OUT')}
  >
    - Money OUT
  </button>
</div>
<div style={{ height: 70 }} />

<style>{`
  .site-dashboard-bottom-bar {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 1200px;
    display: flex;
    gap: 10px;
    padding: 10px;
    background: #fff;
    border-top: 1px solid #e2e8f0;
    z-index: 50;
  }

  /* Desktop only */
  @media (min-width: 1024px) {
    .site-dashboard-bottom-bar {
      left: 290px;
      right: 20px;
      transform: none;
      width: auto;
      max-width: none;
      padding: 12px 16px;
      gap: 12px;
      border-radius: 12px 12px 0 0;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.06);
    }
  }
`}</style>
      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editTxn ? 'Edit Transaction' : `Add ${form.type === 'IN' ? 'Income' : 'Expense'}`}>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-control" value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="IN">Money IN</option>
                  <option value="OUT">Money OUT</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount *</label>
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
                <label className="form-label">Date</label>
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
              {saving ? 'Saving...' : editTxn ? '💾 Update' : '+ Save'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Transaction" message="Are you sure you want to delete this transaction?" />
    </div>
  );
}
