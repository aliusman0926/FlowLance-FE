import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import UserDetails from './components/UserDetails';
import GoogleAuth from './components/GoogleAuth';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [userId, setUserId] = useState(localStorage.getItem('userId') || null);

  const handleLogin = (data) => {
    setToken(data.token);
    setUserId(data.user._id);
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.user._id);
  };

  const handleLogout = () => {
    setToken(null);
    setUserId(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
  };

  // Protected Route Component
  const ProtectedRoute = ({ children }) => {
    return token ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <div className="container">
        <nav style={{ textAlign: 'center', marginBottom: '20px', padding: '10px', background: '#f5f5f5' }}>
          {!token ? (
            <>
              <Link to="/register" style={{ margin: '0 10px' }}>Register</Link> | 
              <Link to="/login" style={{ margin: '0 10px' }}>Login</Link>
            </>
          ) : (
            <>
              <Link to={`/user/${userId}`} style={{ margin: '0 10px' }}>Dashboard</Link> | 
              <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#f44336', cursor: 'pointer', margin: '0 10px' }}>
                Logout
              </button>
            </>
          )}
        </nav>
        <Routes>
          <Route path="/auth/callback" element={<GoogleAuth onLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route 
            path="/user/:id" 
            element={
              <ProtectedRoute>
                <UserDetails token={token} />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to={token ? `/user/${userId}` : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;