import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
// use your own icon import if react-icons is not available
import { GoArrowUpRight } from 'react-icons/go';
import { TbChevronDown, TbMoonStars, TbSunHigh, TbUserCircle } from 'react-icons/tb';
import { Link } from 'react-router-dom';
import './CardNav.css';

const FIVERR_LOGIN_URL = 'https://www.fiverr.com/login';
const UPWORK_LOGIN_URL = 'https://www.upwork.com/ab/account-security/login';

const CardNav = ({
  logo,
  logoAlt = 'Logo',
  items,
  className = '',
  ease = 'power3.out',
  baseColor = '#fff',
  menuColor,
  buttonBgColor,
  buttonTextColor,
  theme = 'dark',
  onToggleTheme,
  username,
  onLogout
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const navRef = useRef(null);
  const cardsRef = useRef([]);
  const tlRef = useRef(null);
  const accountMenuRef = useRef(null);
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  const navStyles = {
    '--card-nav-base': baseColor,
    '--card-nav-menu': menuColor || '#000',
    '--card-nav-button-bg': buttonBgColor,
    '--card-nav-button-text': buttonTextColor,
  };

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 260;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      const contentEl = navEl.querySelector('.card-nav-content');
      if (contentEl) {
        const wasVisible = contentEl.style.visibility;
        const wasPointerEvents = contentEl.style.pointerEvents;
        const wasPosition = contentEl.style.position;
        const wasHeight = contentEl.style.height;

        contentEl.style.visibility = 'visible';
        contentEl.style.pointerEvents = 'auto';
        contentEl.style.position = 'static';
        contentEl.style.height = 'auto';

        contentEl.offsetHeight;

        const topBar = 60;
        const padding = 16;
        const contentHeight = contentEl.scrollHeight;

        contentEl.style.visibility = wasVisible;
        contentEl.style.pointerEvents = wasPointerEvents;
        contentEl.style.position = wasPosition;
        contentEl.style.height = wasHeight;

        return topBar + contentHeight + padding;
      }
    }
    return 260;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;

    gsap.set(navEl, { height: 60, overflow: 'hidden' });
    gsap.set(cardsRef.current, { y: 50, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    tl.to(navEl, {
      height: calculateHeight,
      duration: 0.4,
      ease
    });

    tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 }, '-=0.1');

    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;

    return () => {
      tl?.kill();
      tlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ease, items]);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;

      if (isExpanded) {
        const newHeight = calculateHeight();
        gsap.set(navRef.current, { height: newHeight });

        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          newTl.progress(1);
          tlRef.current = newTl;
        }
      } else {
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          tlRef.current = newTl;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  useEffect(() => {
    if (!isAccountMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAccountMenuOpen]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;

    setIsAccountMenuOpen(false);

    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      tl.play(0);
    } else {
      setIsHamburgerOpen(false);
      tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
      tl.reverse();
    }
  };

  const setCardRef = i => el => {
    if (el) cardsRef.current[i] = el;
  };

  const handleAccountToggle = () => {
    setIsAccountMenuOpen(currentValue => !currentValue);
  };

  const handleAccountLinkClick = () => {
    setIsAccountMenuOpen(false);
  };

  const handleLogoutClick = () => {
    setIsAccountMenuOpen(false);
    onLogout?.();
  };

  return (
    <div className={`card-nav-container ${className}`}>
      <nav
        ref={navRef}
        className={`card-nav ${isExpanded ? 'open' : ''} ${isAccountMenuOpen ? 'account-open' : ''}`}
        style={navStyles}
      >
        <div className="card-nav-top">
          <div
            className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            role="button"
            aria-label={isExpanded ? 'Close menu' : 'Open menu'}
            tabIndex={0}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </div>

          <div className="logo-container">
            <Link to="/dashboard">
              <img src={logo} alt={logoAlt} className="logo" />
            </Link>
          </div>

          <div className="card-nav-actions">
            <button
              type="button"
              className={`card-nav-theme-toggle ${theme === 'light' ? '' : 'is-light'}`}
              onClick={onToggleTheme}
              role="switch"
              aria-checked={theme === 'light'}
              aria-label={`Switch to ${nextTheme} mode`}
              title={`Switch to ${nextTheme} mode`}
            >
              <span className="card-nav-theme-toggle-track">
                <span className="card-nav-theme-toggle-thumb" aria-hidden="true" />
                <span className={`card-nav-theme-toggle-option ${theme === 'light' ? 'active' : ''}`}>
                  <TbSunHigh className="card-nav-theme-toggle-icon" aria-hidden="true" />
                </span>
                <span className={`card-nav-theme-toggle-option ${theme === 'dark' ? 'active' : ''}`}>
                  <TbMoonStars className="card-nav-theme-toggle-icon" aria-hidden="true" />
                </span>
              </span>
            </button>

            <div className="card-nav-account" ref={accountMenuRef}>
              <button
                type="button"
                className={`card-nav-account-button ${isAccountMenuOpen ? 'is-open' : ''}`}
                onClick={handleAccountToggle}
                aria-haspopup="menu"
                aria-expanded={isAccountMenuOpen}
                aria-label="Open account menu"
              >
                <TbUserCircle className="card-nav-account-icon" aria-hidden="true" />
                <TbChevronDown className="card-nav-account-chevron" aria-hidden="true" />
              </button>

              {isAccountMenuOpen && (
                <div className="card-nav-account-dropdown" role="menu" aria-label="Account menu">
                  <div className="card-nav-account-greeting">
                    <span className="card-nav-account-greeting-label">Hi, {username || 'User'}</span>
                  </div>

                  <button type="button" className="card-nav-account-item is-disabled" disabled>
                    <span>Upload New Resume</span>
                    <span className="card-nav-account-item-note">Coming soon</span>
                  </button>

                  <a
                    className="card-nav-account-item"
                    href={FIVERR_LOGIN_URL}
                    target="_blank"
                    rel="noreferrer"
                    role="menuitem"
                    onClick={handleAccountLinkClick}
                  >
                    <span>Connect to Fiverr</span>
                  </a>

                  <a
                    className="card-nav-account-item"
                    href={UPWORK_LOGIN_URL}
                    target="_blank"
                    rel="noreferrer"
                    role="menuitem"
                    onClick={handleAccountLinkClick}
                  >
                    <span>Connect to Upwork</span>
                  </a>

                  <button type="button" className="card-nav-account-item is-disabled" disabled>
                    <span>Account Settings</span>
                    <span className="card-nav-account-item-note">Coming soon</span>
                  </button>

                  <button
                    type="button"
                    className="card-nav-account-item is-danger"
                    role="menuitem"
                    onClick={handleLogoutClick}
                  >
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card-nav-content" aria-hidden={!isExpanded}>
          {(items || []).slice(0, 3).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card"
              ref={setCardRef(idx)}
              style={{ backgroundColor: item.bgColor, color: item.textColor }}
            >
              <div className="nav-card-label">{item.label}</div>
              <div className="nav-card-links">
                {item.links?.map((lnk, i) => (
                  <a key={`${lnk.label}-${i}`} className="nav-card-link" href={lnk.href} aria-label={lnk.ariaLabel}>
                    <GoArrowUpRight className="nav-card-link-icon" aria-hidden="true" />
                    {lnk.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
