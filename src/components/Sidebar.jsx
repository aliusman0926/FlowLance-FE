// components/Sidebar.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Sidebar({ userId, username, onLogout, isCollapsed, setIsCollapsed }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <>
      {/* Overlay for mobile when collapsed */}
      {isCollapsed && window.innerWidth < 768 && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 998
          }}
          onClick={() => setIsCollapsed(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: isCollapsed ? '60px' : '250px',
          height: '100vh',
          background: 'var(--bg-darker)',
          borderRight: '1px solid var(--border-color)',
          transition: 'width 0.3s ease',
          zIndex: 999,
          overflow: 'hidden'
        }}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            position: 'absolute',
            top: '15px',
            right: isCollapsed ? '-20px' : '10px',
            width: '30px',
            height: '30px',
            background: 'var(--accent-green)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            fontSize: '14px'
          }}
        >
          {isCollapsed ? '→' : '←'}
        </button>

        {/* User Info */}
        <div style={{ padding: '80px 20px 20px', textAlign: 'center' }}>
          {isCollapsed ? (
            <div style={{ width: '40px', height: '40px', background: 'var(--accent-green)', borderRadius: '50%' }}></div>
          ) : (
            <>
              <h3 style={{ 
                margin: '0 0 10px', 
                color: 'var(--text-primary)', 
                fontSize: '18px',
                whiteSpace: 'nowrap'
              }}>
                {username}
              </h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px' }}>
                Dashboard
              </p>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ padding: '0 10px' }}>
          <Link 
            to={`/user/${userId}`}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '12px', 
              color: 'var(--text-secondary)', 
              textDecoration: 'none',
              borderRadius: '8px',
              marginBottom: '5px',
              transition: 'all 0.2s ease'
            }}
            className={isCollapsed ? '' : 'nav-active'}
            onMouseEnter={(e) => {
              if (isCollapsed) {
                e.target.style.background = 'var(--accent-green)';
                e.target.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (isCollapsed) {
                e.target.style.background = '';
                e.target.style.color = 'var(--text-secondary)';
              }
            }}
          >
            <span style={{ marginRight: isCollapsed ? 0 : '12px', minWidth: '20px' }}>📊</span>
            {isCollapsed ? '' : 'Dashboard'}
          </Link>
        </nav>

        {/* Logout - Footer */}
        <div style={{ 
          position: 'absolute', 
          bottom: '20px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          width: isCollapsed ? '40px' : 'auto'
        }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px',
              background: 'var(--error-red)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              width: '100%',
              justifyContent: isCollapsed ? 'center' : 'flex-start'
            }}
          >
            <span style={{ marginRight: isCollapsed ? 0 : '8px' }}>🚪</span>
            {isCollapsed ? '' : 'Logout'}
          </button>
        </div>
      </div>

      {/* Main Content Spacer */}
      <div style={{ marginLeft: isCollapsed ? '60px' : '250px', minHeight: '100vh' }}></div>
    </>
  );
}

export default Sidebar;