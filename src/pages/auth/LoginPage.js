// import React, { useState } from 'react';
// import { useAuth } from '../../context/AuthContext';
// import { useNavigate } from 'react-router-dom';
// import toast from 'react-hot-toast';

// export default function LoginPage() {
//   const { login, loading } = useAuth();
//   const navigate = useNavigate();
//   const [form, setForm] = useState({ email: '', password: '' });
//   const [showPass, setShowPass] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!form.email || !form.password) return toast.error('Please fill all fields');
//     const result = await login(form.email, form.password);
//     if (result.success) {
//       toast.success('Welcome back!');
//       navigate('/');
//     } else {
//       toast.error(result.message);
//     }
//   };

//   return (
//     <div style={{
//       minHeight: '100vh',
//       background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)',
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: 'center',
//       padding: 20,
//     }}>
//       <div style={{
//         background: '#fff',
//         borderRadius: 20,
//         padding: '44px 40px',
//         width: '100%',
//         maxWidth: 420,
//         boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
//       }}>
//         {/* Logo */}
//         <div style={{ textAlign: 'center', marginBottom: 32 }}>
//           <div style={{
//             width: 64, height: 64, borderRadius: 16,
//             background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
//             display: 'flex', alignItems: 'center', justifyContent: 'center',
//             fontSize: 32, margin: '0 auto 16px',
//           }}>🏢</div>
//           <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>Mangalyog Enterprise</h1>
//           <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Billing & Site Management System</p>
//         </div>

//         <form onSubmit={handleSubmit}>
//           <div className="form-group">
//             <label className="form-label">Email Address</label>
//             <input
//               type="email"
//               className="form-control"
//               placeholder="admin@mangalyog.com"
//               value={form.email}
//               onChange={(e) => setForm({ ...form, email: e.target.value })}
//               autoFocus
//             />
//           </div>

//           <div className="form-group">
//             <label className="form-label">Password</label>
//             <div style={{ position: 'relative' }}>
//               <input
//                 type={showPass ? 'text' : 'password'}
//                 className="form-control"
//                 placeholder="Enter password"
//                 value={form.password}
//                 onChange={(e) => setForm({ ...form, password: e.target.value })}
//                 style={{ paddingRight: 44 }}
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowPass(!showPass)}
//                 style={{
//                   position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
//                   background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#94a3b8',
//                 }}
//               >
//                 {showPass ? '🙈' : '👁️'}
//               </button>
//             </div>
//           </div>

//           <button
//             type="submit"
//             className="btn btn-primary"
//             disabled={loading}
//             style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, marginTop: 8 }}
//           >
//             {loading ? 'Signing in...' : '🔐 Sign In'}
//           </button>
//         </form>

//         <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 24 }}>
//           Default: admin@mangalyog.com / admin123
//         </p>
//       </div>
//     </div>
//   );
// }
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import logo from '../../assets/logo.png';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      return toast.error('Please fill all fields');
    }

    const result = await login(form.email, form.password);

    if (result.success) {
      toast.success('Welcome back!');
      navigate('/');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Inter, sans-serif',
        background: `
          linear-gradient(160deg, #f8fbff 0%, #ffffff 48%, #eaf2ff 48%, #1e3a8a 100%)
        `,
      }}
    >
      {/* soft glow */}
      <div
        style={{
          position: 'absolute',
          top: '-80px',
          left: '-60px',
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'rgba(59,130,246,0.16)',
          filter: 'blur(50px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: '-70px',
          bottom: '-90px',
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.18)',
          filter: 'blur(50px)',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: 380,
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* small top brand */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 14,
          }}
        >
          <div
  style={{
    width: 70,
    height: 70,
    borderRadius: 18,
    margin: '0 auto 12px',
    background: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 14px 30px rgba(15,23,42,0.15)',
    overflow: 'hidden',
  }}
>
  <img
    src={logo}
    alt="Mangalyog Logo"
    style={{
      width: '80%',
      height: '80%',
      objectFit: 'contain',
    }}
  />
</div>

          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.15,
            }}
          >
            Mangalyog Enterprise
          </div>

          <div
            style={{
              fontSize: 13,
              color: '#64748b',
              marginTop: 6,
            }}
          >
            Billing & Management System
          </div>
        </div>

        {/* card */}
        <div
          style={{
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.8)',
            borderRadius: 24,
            padding: '24px 18px 20px',
            boxShadow: '0 24px 60px rgba(15,23,42,0.14)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 26,
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.02em',
              }}
            >
              Sign In
            </h1>

            <p
              style={{
                margin: '8px 0 0',
                fontSize: 13,
                color: '#64748b',
                lineHeight: 1.6,
              }}
            >
              Access your dashboard securely
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#334155',
                }}
              >
                Email Address
              </label>

              <input
                type="email"
                placeholder="admin@mangalyog.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoFocus
                style={{
                  width: '100%',
                  height: 50,
                  borderRadius: 14,
                  border: '1px solid #d8e1ec',
                  background: '#f8fafc',
                  padding: '0 14px',
                  fontSize: 14,
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#334155',
                }}
              >
                Password
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  style={{
                    width: '100%',
                    height: 50,
                    borderRadius: 14,
                    border: '1px solid #d8e1ec',
                    background: '#f8fafc',
                    padding: '0 42px 0 14px',
                    fontSize: 14,
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: 16,
                    color: '#64748b',
                  }}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: 50,
                border: 'none',
                borderRadius: 14,
                background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 14px 30px rgba(37,99,235,0.25)',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div
            style={{
              marginTop: 16,
              textAlign: 'center',
              fontSize: 12,
              color: '#64748b',
              lineHeight: 1.6,
            }}
          >
            {/* Default: <span style={{ color: '#1e3a8a', fontWeight: 700 }}>admin@mangalyog.com / admin123</span> */}
          </div>
        </div>
      </div>
    </div>
  );
}