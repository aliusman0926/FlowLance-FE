// components/GoogleAuth.jsx
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function GoogleAuth({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Handle Google callback
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');
    const userId = urlParams.get('userId');

    if (token && userId) {
      onLogin({ token, user: { _id: userId } });
      navigate(`/user/${userId}`);
    }
  }, [location, navigate, onLogin]);

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:3000/api/auth/google';
  };

  return (
    <div style={{ 
      textAlign: 'center', 
      marginTop: '20px',
      padding: '20px',
      border: '2px solid var(--bg-darker)',
      borderRadius: '10px',
      background: 'var(--bg)'
    }}>
      <h3>🌐 Sign in with Google</h3>
      <button 
        onClick={handleGoogleLogin}
        style={{
          padding: '12px 24px',
          background: 'var(--accent-green-dark)',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          fontSize: '16px',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <span>👤</span> Continue with Google
      </button>
    </div>
  );
}

export default GoogleAuth;