// import React, { useEffect } from 'react';

// export default function Modal({ open, onClose, title, children, size = '' }) {
//   useEffect(() => {
//     const handler = (e) => { if (e.key === 'Escape') onClose(); };
//     if (open) document.addEventListener('keydown', handler);
//     return () => document.removeEventListener('keydown', handler);
//   }, [open, onClose]);

//   if (!open) return null;

//   return (
//     <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
//       <div className={`modal ${size === 'lg' ? 'modal-lg' : ''}`}>
//         <div className="modal-header">
//           <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1e293b' }}>{title}</h2>
//           <button
//             onClick={onClose}
//             style={{
//               background: 'none', border: 'none', cursor: 'pointer',
//               fontSize: 20, color: '#94a3b8', lineHeight: 1,
//               width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
//               borderRadius: 6,
//             }}
//           >
//             ✕
//           </button>
//         </div>
//         {children}
//       </div>
//     </div>
//   );
// }
import React, { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, size = '' }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (open) {
      document.addEventListener('keydown', handler);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 9999,
        overflowY: 'auto',
      }}
    >
      <div
        className={`modal ${size === 'lg' ? 'modal-lg' : ''}`}
        style={{
          width: '100%',
          maxWidth: size === 'lg' ? '900px' : '560px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          maxHeight: '90vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div
          className="modal-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 18px',
            borderBottom: '1px solid #e2e8f0',
            position: 'sticky',
            top: 0,
            background: '#fff',
            zIndex: 2,
          }}
        >
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1e293b', margin: 0 }}>
            {title}
          </h2>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 20,
              color: '#94a3b8',
              lineHeight: 1,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            padding: '16px 18px 20px',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}