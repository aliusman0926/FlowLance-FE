import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import GoogleAuth from './GoogleAuth'; // This path is correct
import './Auth.css'; // This path is correct

// 1. Import the logo
import Logo from '../assets/logo.svg';

// Set the base URL for your API
const API_BASE_URL = 'http://localhost:3000/api';

function Register({ onLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }
    
    try {
      await axios.post(`${API_BASE_URL}/users/register`, { 
        username, 
        email, 
        password 
      });
      
      // Redirect to login with a success message
      navigate('/login?registration=success');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* 2. Logo added here, centered above the card by CSS */}
      <img src={Logo} alt="Company Logo" className="auth-logo" />

      <div className="auth-card">
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Get started with a free account</p>

        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label htmlFor="username">Username</label>
            <input 
              id="username"
              type="text" 
              placeholder="yourusername" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
              className="auth-input"
            />
          </div>
          <div className="auth-input-group">
            <label htmlFor="email">Email</label>
            <input 
              id="email"
              type="email" 
              placeholder="you@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="auth-input"
            />
          </div>
          <div className="auth-input-group">
            <label htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              minLength={6}
              className="auth-input"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="auth-button"
          >
            {loading ? <span className="auth-spinner"></span> : 'Create Account'}
          </button>
        </form>
        
        <div className="auth-divider">
          <span>OR</span>
        </div>
        
        <GoogleAuth onLogin={onLogin} />
        
        <p className="auth-toggle">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;