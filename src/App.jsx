import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Outlet, href } from 'react-router-dom'; // Import Outlet
import axios from 'axios';
// e.g., in your top-level App.jsx or in the file where you use DatePicker
import "react-datepicker/dist/react-datepicker.css";

// Import Auth Components
import Login from './components/Login';
import Register from './components/Register';
import GoogleAuth from './components/GoogleAuth';
import CardNav from './components/CardNav';
import logo from './assets/logo.svg';
import TransactionDashboard from './components/TransactionDashboard';
import GigBoard from './components/GigBoard';
import CalendarPage from './components/CalendarPage';
import SummaryDashboard from './components/SummaryDashboard';
import ExpenseSummary from './components/ExpenseSummary';

// Import Global CSS
import './Global.css';

// --- Placeholder Dashboard ---
// This is now *just* the page content. The nav is handled by ProtectedLayout.
function Dashboard({ user }) {
  return (
    // <nav> has been removed from here
    <main className="dashboard-main">
      <h2>Welcome, {user.username || 'User'}!</h2>
      <p>Summarized dashboard will appear here.</p>
      <pre>
        {JSON.stringify(user, null, 2)}
      </pre>
    </main>
  );
}
// --- End Placeholder ---

// ... AuthCallback component (no changes) ...
function AuthCallback({ onLogin }) {
  // *** FIX 2: Callback logic moved here from GoogleAuth.jsx ***
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);

  useEffect(() => {
    // This effect runs *only* when this component mounts on /auth/callback
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');
    const userId = urlParams.get('userId');

    if (token && userId) {
      // The onLogin function (handleLogin) will fetch the full user
      onLogin(token, { _id: userId });
      // We can now navigate away. handleLogin will complete in the background.
      navigate('/dashboard');
    } else {
      // Handle a failed auth redirect
      setError('Google authentication failed. Please try again.');
      setTimeout(() => navigate('/login'), 3000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only ONCE when the component mounts

  return (
    <div className="auth-container">
      <div className="auth-card">
        {error ? (
          <>
            <h2 className="auth-title">Authentication Error</h2>
            <p className="auth-subtitle">{error}</p>
          </>
        ) : (
          <>
            <h2 className="auth-title">Please wait...</h2>
            <p className="auth-subtitle">Finalizing your secure sign-in.</p>
            {/* We can show a spinner here instead of the GoogleAuth button */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <span className="auth-spinner"></span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// --- NEW PROTECTED LAYOUT ---
// This component wraps all protected pages
// and adds the CardNav header.

const items = [
    {
      label: "Financials",
      bgColor: "var(--accent-color)",
      textColor: "var(--text-primary)",
      links: [
        { label: "Transactions", href: '/transactions' },
        { label: "AI Analytics", href: '/expense-summary' }
      ]
    },
    {
      label: "Projects", 
      bgColor: "var(--accent-color)",
      textColor: "var(--text-primary)",
      links: [
        { label: "Gigs", href: '/gigs' },
        { label: "Calendar", href: '/calendar' }
      ]
    },
    {
      label: "Contact",
      bgColor: "var(--accent-color)", 
      textColor: "var(--text-primary)",
      links: [
        { label: "Email", ariaLabel: "Email us" },
        { label: "Twitter", ariaLabel: "Twitter" },
        { label: "LinkedIn", ariaLabel: "LinkedIn" }
      ]
    }
  ];

function ProtectedLayout({ user, onLogout }) {
  return (
    <div className="app-container">
      <CardNav
        logo={logo}
        logoAlt="Company Logo"
        items={items}
        baseColor="#121212"
        menuColor="#eefff6"
        buttonBgColor="#00341d"
        buttonTextColor="#eefff6"
        ease="power3.out"
        onLogout={onLogout}
      />
      <main className="app-content">
        {/* Child routes (like Dashboard) will render here */}
        <Outlet />
      </main>
    </div>
  );
}
// --- END PROTECTED LAYOUT ---


function App() {
  // ... getInitialUser function (no changes) ...
  const getInitialUser = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      // Set the default auth header for all future axios requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return { token, user: JSON.parse(user) };
    }
    return { token: null, user: null };
  };

  const [auth, setAuth] = useState(getInitialUser);
  const navigate = useNavigate();
  const location = useLocation();

  // ... useEffect for auth (no changes) ...
  useEffect(() => {
    if (auth.token && auth.user) {
      // Store in localStorage
      localStorage.setItem('token', auth.token);
      localStorage.setItem('user', JSON.stringify(auth.user));
      // Set default auth header for axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
    } else {
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Remove auth header
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [auth]);

  // ... handleLogin function (no changes) ...
  const handleLogin = (token, user) => {
    // Set partial auth state
    setAuth({ token, user });
    
    // Check if the user object from login is complete.
    // Google Auth only returns { _id: userId } initially.
    if (!user.username) {
      // *** FIX 1: Manually add Auth header to this specific request ***
      // This fixes the 401 race condition.
      axios.get(`http://localhost:3000/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => {
          // Now set the auth state again with the *full* user object
          setAuth({ token, user: res.data });
        })
        .catch(err => {
          console.error("Failed to fetch full user data", err);
          // If it fails, log out to be safe
          handleLogout();
        });
    }
  };

  // ... handleLogout function (no changes) ...
  const handleLogout = () => {
    setAuth({ token: null, user: null });
    navigate('/login');
  };

  return (
    <Routes>
      {/* PUBLIC ROUTES (no changes) */}
      <Route 
        path="/login" 
        element={
          !auth.user ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />
        } 
      />
      <Route 
        path="/register" 
        element={
          !auth.user ? <Register onLogin={handleLogin} /> : <Navigate to="/dashboard" />
        } 
      />
      
      {/* GOOGLE CALLBACK ROUTE 
        This is the route your backend redirects to.
        It renders our AuthCallback component.
      */}
      <Route 
        path="/auth/callback" 
        element={<AuthCallback onLogin={handleLogin} />} 
      />

      {/* === MODIFIED PROTECTED ROUTES ===
        We now have a parent <Route> that renders the ProtectedLayout.
        All child routes (like /dashboard) will render *inside* the <Outlet /> of that layout.
      */}
      <Route 
        element={
          auth.user ? <ProtectedLayout user={auth.user} onLogout={handleLogout} /> : <Navigate to="/login" />
        }
      >
        {/* All protected routes go inside here */}
        <Route 
          path="/dashboard" 
          element={<SummaryDashboard user={auth.user} />} 
        />
        <Route 
          path="/transactions" 
          element={<TransactionDashboard />}
        />
        <Route 
          path="/gigs" 
          element={<GigBoard />}
        />
        <Route 
          path="/calendar" 
          element={<CalendarPage />}
        />
        <Route 
          path="/expense-summary" 
          element={<ExpenseSummary />}
        />
        {/* When we add more pages, they go here:
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        */}
      </Route>
      
      {/* DEFAULT ROUTE (no changes) */}
      <Route 
        path="/dashboard" 
        element={
          auth.user ? <Dashboard user={auth.user} onLogout={handleLogout} /> : <Navigate to="/login" />
        } 
      />
      
      {/* DEFAULT ROUTE
        Redirects the root path "/" to the dashboard or login page.
      */}
      <Route 
        path="/" 
        element={
          auth.user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
        } 
      />

      {/* CATCH-ALL (no changes) */}
      <Route path="*" element={<div><h2>404 Not Found</h2></div>} />
    </Routes>
  );
}

export default App;