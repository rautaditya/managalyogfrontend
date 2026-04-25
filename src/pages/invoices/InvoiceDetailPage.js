import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoicesAPI } from '../../api';
import { formatCurrency, formatDate, statusColor, getError } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    invoicesAPI.getById(id)
      .then((res) => setInvoice(res.data))
      .catch(() => { toast.error('Invoice not found'); navigate('/invoices'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleStatusChange = async (status) => {
    setUpdatingStatus(true);
    try {
      const res = await invoicesAPI.update(id, { status });
      setInvoice(res.data);
      toast.success('Status updated');
    } catch (err) { toast.error(getError(err)); }
    finally { setUpdatingStatus(false); }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await invoicesAPI.downloadPDF(id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoice_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch { toast.error('Download failed'); }
    finally { setDownloading(false); }
  };

  if (loading) return <div className="empty-state"><p>Loading invoice...</p></div>;
  if (!invoice) return null;

  const site = invoice.site;

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/invoices')}>← Invoices</button>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', flex: 1 }}>{invoice.invoice_number}</h2>
        <span className={`badge ${statusColor(invoice.status)}`} style={{ fontSize: 13 }}>{invoice.status}</span>
        <button className="btn btn-outline" onClick={handleDownload} disabled={downloading}>
          {downloading ? '...' : '📄 Download PDF'}
        </button>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#64748b', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
            Invoice Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Invoice #', invoice.invoice_number],
              ['Date', formatDate(invoice.date)],
              ['Due Date', formatDate(invoice.due_date)],
              ['Status', <span className={`badge ${statusColor(invoice.status)}`}>{invoice.status}</span>],
              ['Total', <strong style={{ color: '#1e40af' }}>{formatCurrency(invoice.total)}</strong>],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: '#64748b' }}>{label}</span>
                <span style={{ color: '#1e293b', fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>Update Status:</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['paid', 'unpaid', 'cancelled'].map((s) => (
                <button key={s} disabled={updatingStatus || invoice.status === s}
                  onClick={() => handleStatusChange(s)}
                  className={`btn btn-sm ${invoice.status === s ? 'btn-primary' : 'btn-outline'}`}
                  style={{ textTransform: 'capitalize' }}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#64748b', marginBottom: 14 }}>
            Billed To
          </h3>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{site?.name}</div>
          {site?.address && <div>📍 {site.address}</div>}
          {site?.owner_name && <div>👤 {site.owner_name}</div>}
          {site?.phone && <div>📞 {site.phone}</div>}
          {site?.gst_number && <div>GST: {site.gst_number}</div>}
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700 }}>Items</h3>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>{formatCurrency(item.rate)}</td>
                <td>{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ✅ UPDATED SECTION */}
        <div style={{ marginTop: 20 }}>
          <div>
            <strong>Advance Amount:</strong> {formatCurrency(invoice.advance_amount || 0)}
          </div>

          {invoice.tax_rate > 0 && (
            <div>
              <strong>Tax ({invoice.tax_rate}%):</strong> {formatCurrency(invoice.tax_amount)}
            </div>
          )}

          <div style={{ fontWeight: 'bold', fontSize: 18 }}>
            Total: {formatCurrency(invoice.total)}
          </div>
        </div>

        {invoice.notes && (
          <div style={{ marginTop: 10 }}>
            <strong>Notes:</strong> {invoice.notes}
          </div>
        )}
      </div>
    </div>
  );
}