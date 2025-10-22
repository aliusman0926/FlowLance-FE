import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import UserDetails from './components/UserDetails';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [userId, setUserId] = useState(localStorage.getItem('userId') || null);
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // ✅ State

  const handleLogin = (data) => {
    setToken(data.token);
    setUserId(data.user._id);
    setUsername(data.user.username || data.user.email.split('@')[0]);
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.user._id);
    localStorage.setItem('username', data.user.username || data.user.email.split('@')[0]);
  };

  const handleLogout = () => {
    setToken(null);
    setUserId(null);
    setUsername('');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
  };

  const ProtectedRoute = ({ children }) => {
    return token ? children : <Navigate to="/login" />;
  };

  // NON-AUTHENTICATED PAGES (Login/Register)
  if (!token) {
    return (
      <Router>
        <div className="container" style={{ backgroundColor: 'var(--bg-dark)', minHeight: '100vh' }}>
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </Router>
    );
  }

  // AUTHENTICATED PAGES (With Sidebar)
  return (
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-dark)' }}>
        {/* ✅ FIXED: Pass setIsSidebarCollapsed prop */}
        <Sidebar 
          userId={userId} 
          username={username}
          onLogout={handleLogout}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}  // ← THIS WAS MISSING!
        />
        
        <div style={{ 
          flex: 1, 
          marginLeft: isSidebarCollapsed ? '60px' : '250px',
          padding: '20px',
          transition: 'margin-left 0.3s ease'
        }}>
          <Routes>
            <Route 
              path="/user/:id" 
              element={
                <ProtectedRoute>
                  <UserDetails token={token} />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to={`/user/${userId}`} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;