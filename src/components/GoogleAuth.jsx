// components/GoogleAuth.jsx
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Auth.css'; // Import CSS for the Google button

function GoogleAuth({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoogleLogin = () => {
    // This is the correct backend URL from your auth.route.js
    window.location.href = 'http://localhost:3000/api/auth/google';
  };

  // This component now *only* renders the button
  // The useEffect logic is dormant until it's rendered on the /auth/callback route
  return (
    <button 
      type="button"
      onClick={handleGoogleLogin}
      className="google-auth-button"
    >
      <svg className="google-icon" aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#clip0_105_127)"><path d="M19.5312 10.2031C19.5312 9.53125 19.4688 8.89062 19.3594 8.28125H10V11.9531H15.3281C15.0938 13.0625 14.5 14.0156 13.625 14.625L13.6094 14.7188L16.2969 16.7812L16.4531 16.8125C18.4375 15.0156 19.5312 12.7969 19.5312 10.2031Z" fill="#4285F4"/><path d="M10 20C12.7031 20 15.0156 19.0469 16.4531 17.375L13.625 14.625C12.7188 15.25 11.4688 15.6562 10 15.6562C7.71875 15.6562 5.76562 14.1562 5 12.1875L4.92188 12.2031L2.125 14.2812L2.04688 14.3906C3.48438 17.6562 6.51562 20 10 20Z" fill="#34A853"/><path d="M5 12.1875C4.78125 11.5312 4.65625 10.8281 4.65625 10.125C4.65625 9.42188 4.78125 8.71875 5 8.0625L4.98438 7.96875L2.21875 5.90625L2.04688 5.85938C1.32812 7.25 0.96875 8.82812 0.96875 10.5C0.96875 12.1719 1.32812 13.75 2.04688 15.1406L5 12.1875Z" fill="#FBBC05"/><path d="M10 4.34375C11.6094 4.34375 12.8281 4.9375 13.7031 5.75L16.5156 2.9375C14.9844 1.5 12.7031 0.5 10 0.5C6.51562 0.5 3.48438 2.84375 2.04688 5.85938L5 8.0625C5.76562 6.09375 7.71875 4.34375 10 4.34375Z" fill="#EA4335"/></g><defs><clipPath id="clip0_105_127"><rect width="19" height="19" fill="white" transform="translate(0.5 0.5)"/></clipPath></defs></svg>
      <span>Sign in with Google</span>
    </button>
  );
}

export default GoogleAuth;
