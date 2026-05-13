import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Outlet } from 'react-router-dom'; // Import Outlet
import axios from 'axios';
// e.g., in your top-level App.jsx or in the file where you use DatePicker
import "react-datepicker/dist/react-datepicker.css";

// Import Auth Components
import Login from './components/Login';
import Register from './components/Register';
import CardNav from './components/CardNav';
import LandingPage from './components/LandingPage';
import logo from './assets/logo.svg';
import logoDark from './assets/logo-dark.svg';
import TransactionDashboard from './components/TransactionDashboard';
import GigBoard from './components/GigBoard';
import CalendarPage from './components/CalendarPage';
import SummaryDashboard from './components/SummaryDashboard';
import ExpenseSummary from './components/ExpenseSummary';
import SettingsPage from './components/SettingsPage';

// Agents Imports
import ProposalAgent from './components/Agents/ProposalAgent/ProposalAgent';
import AnalyticsDashboard from './components/Agents/Analytics/AnalyticsDashboard';
import MessagingAgent from './components/Agents/MessagingAgent/MessagingAgent';
import ResumeOptimizer from './components/Agents/ResumeOptimizer/ResumeOptimizer';

// Import Global CSS
import './Global.css';

const CARD_NAV_POSITION_STORAGE_KEY = 'flowlanceCardNavPosition';
const MOBILE_CARD_NAV_QUERY = '(max-width: 768px)';
const VALID_CARD_NAV_POSITIONS = new Set(['top', 'bottom', 'left', 'right']);

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
      textColor: "var(--accent-contrast)",
      links: [
        { label: "Transactions", href: '/transactions' },
        { label: "Expense Summary", href: '/expense-summary' }
      ]
    },
    {
      label: "Projects", 
      bgColor: "var(--accent-color)",
      textColor: "var(--accent-contrast)",
      links: [
        { label: "Gigs", href: '/gigs' },
        { label: "Calendar", href: '/calendar' }
      ]
    },
    {
      label: "Intelligence Hub",
      bgColor: "var(--accent-color)", 
      textColor: "var(--accent-contrast)",
      links: [
        { label: "Proposal Writer Agent", href: '/agents/proposal' },
        { label: "Messages", href: '/agents/messaging' },
        { label: "AI Analytics", href: '/ai-analytics' }
      ]
    }
  ];

function ProtectedLayout({ onLogout, theme, onToggleTheme, username }) {
  const [navPosition, setNavPosition] = useState(() => {
    if (typeof window === 'undefined') {
      return 'top';
    }

    const savedPosition = window.localStorage.getItem(CARD_NAV_POSITION_STORAGE_KEY);
    return VALID_CARD_NAV_POSITIONS.has(savedPosition) ? savedPosition : 'top';
  });
  const [isMobileLayout, setIsMobileLayout] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.matchMedia(MOBILE_CARD_NAV_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia(MOBILE_CARD_NAV_QUERY);
    const handleChange = (event) => {
      setIsMobileLayout(event.matches);
    };

    setIsMobileLayout(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(CARD_NAV_POSITION_STORAGE_KEY, navPosition);
  }, [navPosition]);

  const effectiveNavPosition = isMobileLayout ? 'top' : navPosition;
  const appContainerClassName = `app-container app-container--${effectiveNavPosition}`;
  const cardNavElement = (
    <CardNav
      logo={theme === 'light' ? logoDark : logo}
      logoAlt="Company Logo"
      items={items}
      baseColor="var(--nav-base-color)"
      menuColor="var(--nav-menu-color)"
      buttonBgColor="var(--nav-button-bg)"
      buttonTextColor="var(--nav-button-text)"
      ease="power3.out"
      theme={theme}
      onToggleTheme={onToggleTheme}
      username={username}
      onLogout={onLogout}
      position={effectiveNavPosition}
      onPositionChange={setNavPosition}
    />
  );
  const mainContent = (
    <main className="app-content">
      <Outlet />
    </main>
  );

  return (
    <div className={appContainerClassName}>
      {effectiveNavPosition === 'bottom' ? (
        <>
          {mainContent}
          {cardNavElement}
        </>
      ) : (
        <>
          {cardNavElement}
          {mainContent}
        </>
      )}
    </div>
  );
}
// --- END PROTECTED LAYOUT ---


function App() {
  const getInitialTheme = () => {
    if (typeof window === 'undefined') {
      return 'dark';
    }

    const savedTheme = window.localStorage.getItem('theme');
    return savedTheme === 'light' ? 'light' : 'dark';
  };

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
  const [theme, setTheme] = useState(getInitialTheme);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem('theme', theme);
  }, [theme]);

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

  const handleToggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  };

  const handleUserUpdate = (updatedUser) => {
    setAuth((currentAuth) => {
      if (!currentAuth.token || !currentAuth.user) {
        return currentAuth;
      }

      return {
        ...currentAuth,
        user: {
          ...currentAuth.user,
          ...updatedUser,
        },
      };
    });
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LandingPage
            isAuthenticated={Boolean(auth.user)}
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />
        }
      />

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
          auth.user ? (
            <ProtectedLayout
              onLogout={handleLogout}
              theme={theme}
              onToggleTheme={handleToggleTheme}
              username={auth.user?.username}
            />
          ) : <Navigate to="/login" />
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
        <Route 
          path="/agents/proposal" 
          element={<ProposalAgent />} 
        />
        <Route 
          path="/agents/messaging" 
          element={<MessagingAgent />} 
        />
        <Route
          path="/agents/resume-optimizer"
          element={<ResumeOptimizer />}
        />
        <Route
          path="/ai-analytics"
          element={<AnalyticsDashboard />}
        />
        <Route
          path="/settings"
          element={
            <SettingsPage
              user={auth.user}
              onUserUpdate={handleUserUpdate}
              onLogout={handleLogout}
            />
          }
        />
        {/* When we add more pages, they go here. */}
      </Route>

      {/* CATCH-ALL (no changes) */}
      <Route path="*" element={<div><h2>404 Not Found</h2></div>} />
    </Routes>
  );
}

export default App;
