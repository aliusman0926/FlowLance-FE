import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import UserDetails from './components/UserDetails';
import './App.css'; // If you have any additional styles

function App() {
  const [userId, setUserId] = useState(localStorage.getItem('userId') || null);

  const handleLogin = (id) => {
    setUserId(id);
    localStorage.setItem('userId', id);
  };

  const handleLogout = () => {
    setUserId(null);
    localStorage.removeItem('userId');
  };

  return (
    <Router>
      <div className="container">
        <nav style={{ textAlign: 'center', marginBottom: '20px' }}>
          <Link to="/register">Register</Link> | <Link to="/login">Login</Link>
          {userId && (
            <>
              {' | '}
              <Link to={`/user/${userId}`}>User Details</Link>
              {' | '}
              <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#4caf50', cursor: 'pointer' }}>
                Logout
              </button>
            </>
          )}
        </nav>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/user/:id" element={<UserDetails />} />
          <Route path="/" element={<h2>Welcome! Please login or register.</h2>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;