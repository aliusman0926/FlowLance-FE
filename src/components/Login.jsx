// Login.jsx - REPLACE ENTIRE FILE
import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import GoogleAuth from '../components/GoogleAuth';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post('http://localhost:3000/api/users/login', { 
        email, 
        password 
      });
      
      onLogin({
        token: res.data.token,
        user: res.data.user
      });
      navigate(`/user/${res.data.user._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center' }}>Login</h2>
      
      {/* GOOGLE BUTTON */}
      <GoogleAuth onLogin={onLogin} />
      
      <div style={{ textAlign: 'center', margin: '20px 0', color: '#666' }}>
        <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '10px 0' }} />
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '10px', 
            background: '#4caf50', 
            color: 'white', 
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      {error && <p style={{ color: 'red', textAlign: 'center', marginTop: '10px' }}>{error}</p>}
      <p style={{ textAlign: 'center', marginTop: '10px' }}>
        No account? <Link to="/register" style={{ color: 'var(--accent-green' }}>Register</Link>
      </p>
    </div>
  );
}

export default Login;