import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { GoArrowUpRight } from 'react-icons/go';
import { TbChevronDown, TbMoonStars, TbSunHigh, TbUserCircle } from 'react-icons/tb';
import { Link } from 'react-router-dom';
import './CardNav.css';

const FIVERR_LOGIN_URL = 'https://www.fiverr.com/login';
const UPWORK_LOGIN_URL = 'https://www.upwork.com/ab/account-security/login';
const VALID_POSITIONS = new Set(['top', 'bottom', 'left', 'right']);
const MOBILE_BREAKPOINT_QUERY = '(max-width: 768px)';
const CARD_NAV_RAIL_SIZE = 60;
const CARD_NAV_SIDEBAR_RAIL_WIDTH = 60;
const DEFAULT_EXPANDED_HEIGHT = 260;
const DEFAULT_EXPANDED_WIDTH = 360;

const isVerticalPosition = (position) => position === 'left' || position === 'right';

const getNearestPosition = ({ clientX, clientY }) => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const distances = {
    top: clientY,
    bottom: viewportHeight - clientY,
    left: clientX,
    right: viewportWidth - clientX,
  };

  return Object.entries(distances).reduce((closestPosition, currentPosition) =>
    currentPosition[1] < closestPosition[1] ? currentPosition : closestPosition
  )[0];
};

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
  onLogout,
  position = 'top',
  onPositionChange
}) => {
  const validatedPosition = VALID_POSITIONS.has(position) ? position : 'top';
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches;
  });
  const navRef = useRef(null);
  const railRef = useRef(null);
  const contentRef = useRef(null);
  const cardsRef = useRef([]);
  const tlRef = useRef(null);
  const accountMenuRef = useRef(null);
  const dragStateRef = useRef(null);
  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  const effectivePosition = isMobileViewport ? 'top' : validatedPosition;
  const isVertical = isVerticalPosition(effectivePosition);
  const itemsToRender = (items || []).slice(0, 3);

  const navStyles = {
    '--card-nav-base': baseColor,
    '--card-nav-menu': menuColor || '#000',
    '--card-nav-button-bg': buttonBgColor,
    '--card-nav-button-text': buttonTextColor,
  };

  const containerStyles = isDragging
    ? {
        transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`,
      }
    : undefined;

  const measureExpandedSize = (currentPosition) => {
    const navEl = navRef.current;
    const railEl = railRef.current;
    const contentEl = contentRef.current;

    if (!navEl || !contentEl) {
      return isVerticalPosition(currentPosition) ? DEFAULT_EXPANDED_WIDTH : DEFAULT_EXPANDED_HEIGHT;
    }

    const snapshot = {
      visibility: contentEl.style.visibility,
      pointerEvents: contentEl.style.pointerEvents,
      position: contentEl.style.position,
      width: contentEl.style.width,
      height: contentEl.style.height,
      maxWidth: contentEl.style.maxWidth,
    };

    contentEl.style.visibility = 'visible';
    contentEl.style.pointerEvents = 'auto';

    if (isVerticalPosition(currentPosition)) {
      contentEl.style.position = 'absolute';
      contentEl.style.width = '';
      contentEl.style.height = '100%';
      contentEl.style.maxWidth = 'min(320px, calc(100vw - 7rem))';

      const railWidth = railEl?.offsetWidth || CARD_NAV_SIDEBAR_RAIL_WIDTH;
      const contentWidth = contentEl.getBoundingClientRect().width || contentEl.scrollWidth;

      contentEl.style.visibility = snapshot.visibility;
      contentEl.style.pointerEvents = snapshot.pointerEvents;
      contentEl.style.position = snapshot.position;
      contentEl.style.width = snapshot.width;
      contentEl.style.height = snapshot.height;
      contentEl.style.maxWidth = snapshot.maxWidth;

      return Math.max(railWidth + contentWidth + 14, DEFAULT_EXPANDED_WIDTH);
    }

    contentEl.style.position = 'static';
    contentEl.style.width = '100%';
    contentEl.style.height = 'auto';
    contentEl.style.maxWidth = '';

    contentEl.offsetHeight;

    const contentHeight = contentEl.scrollHeight;

    contentEl.style.visibility = snapshot.visibility;
    contentEl.style.pointerEvents = snapshot.pointerEvents;
    contentEl.style.position = snapshot.position;
    contentEl.style.width = snapshot.width;
    contentEl.style.height = snapshot.height;
    contentEl.style.maxWidth = snapshot.maxWidth;

    return Math.max(CARD_NAV_RAIL_SIZE + contentHeight + 12, DEFAULT_EXPANDED_HEIGHT);
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    const visibleCards = cardsRef.current.filter(Boolean);

    if (!navEl) {
      return null;
    }

    gsap.set(navEl, {
      clearProps: 'height,width',
      overflow: 'hidden',
    });
    gsap.set(visibleCards, {
      clearProps: 'x,y,opacity',
    });

    if (isVertical) {
      gsap.set(navEl, { width: CARD_NAV_SIDEBAR_RAIL_WIDTH });
      gsap.set(visibleCards, {
        x: effectivePosition === 'left' ? 28 : -28,
        opacity: 0,
      });
    } else {
      gsap.set(navEl, { height: CARD_NAV_RAIL_SIZE });
      gsap.set(visibleCards, {
        y: effectivePosition === 'bottom' ? 18 : 28,
        opacity: 0,
      });
    }

    const timeline = gsap.timeline({ paused: true });

    timeline.to(navEl, {
      [isVertical ? 'width' : 'height']: () => measureExpandedSize(effectivePosition),
      duration: 0.4,
      ease,
    });

    timeline.to(
      visibleCards,
      isVertical
        ? { x: 0, opacity: 1, duration: 0.35, ease, stagger: 0.08 }
        : { y: 0, opacity: 1, duration: 0.35, ease, stagger: 0.08 },
      '-=0.14'
    );

    return timeline;
  };

  useLayoutEffect(() => {
    const timeline = createTimeline();
    tlRef.current = timeline;

    if (timeline && isExpanded) {
      timeline.progress(1);
    }

    return () => {
      timeline?.kill();
      tlRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ease, effectivePosition, itemsToRender.length]);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) {
        return;
      }

      tlRef.current.kill();

      const nextTimeline = createTimeline();
      if (!nextTimeline) {
        tlRef.current = null;
        return;
      }

      if (isExpanded) {
        nextTimeline.progress(1);
        gsap.set(navRef.current, {
          [isVerticalPosition(effectivePosition) ? 'width' : 'height']: measureExpandedSize(effectivePosition),
        });
      }

      tlRef.current = nextTimeline;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectivePosition, isExpanded, itemsToRender.length]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
    const handleChange = (event) => {
      setIsMobileViewport(event.matches);
    };

    setIsMobileViewport(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

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

  useEffect(() => {
    setIsAccountMenuOpen(false);
  }, [effectivePosition]);

  useEffect(() => {
    if (!isMobileViewport || !isDragging) {
      return;
    }

    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    dragStateRef.current = null;
  }, [isDragging, isMobileViewport]);

  useEffect(() => {
    const clearDragState = () => {
      setIsDragging(false);
      setDragOffset({ x: 0, y: 0 });
      dragStateRef.current = null;
    };

    const handlePointerMove = (event) => {
      if (!dragStateRef.current) {
        return;
      }

      const deltaX = event.clientX - dragStateRef.current.startX;
      const deltaY = event.clientY - dragStateRef.current.startY;

      dragStateRef.current.lastX = event.clientX;
      dragStateRef.current.lastY = event.clientY;

      if (!dragStateRef.current.isActiveDrag) {
        if (Math.hypot(deltaX, deltaY) < 6) {
          return;
        }

        dragStateRef.current.isActiveDrag = true;
        setIsDragging(true);
        setIsAccountMenuOpen(false);
      }

      setDragOffset({ x: deltaX, y: deltaY });
    };

    const handlePointerUp = (event) => {
      if (!dragStateRef.current) {
        return;
      }

      const releasePoint = {
        clientX: dragStateRef.current.lastX ?? event.clientX,
        clientY: dragStateRef.current.lastY ?? event.clientY,
      };

      if (dragStateRef.current.isActiveDrag) {
        const nextPosition = getNearestPosition(releasePoint);
        if (nextPosition && VALID_POSITIONS.has(nextPosition)) {
          onPositionChange?.(nextPosition);
        }
      }

      clearDragState();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [onPositionChange]);

  useEffect(() => {
    if (!isDragging) {
      return undefined;
    }

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';

    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging]);

  const toggleMenu = () => {
    const timeline = tlRef.current;
    if (!timeline || isDragging) {
      return;
    }

    setIsAccountMenuOpen(false);

    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      timeline.eventCallback('onReverseComplete', null);
      timeline.play(0);
      return;
    }

    setIsHamburgerOpen(false);
    timeline.eventCallback('onReverseComplete', () => {
      setIsExpanded(false);
      timeline.eventCallback('onReverseComplete', null);
    });
    timeline.reverse();
  };

  const setCardRef = (index) => (element) => {
    cardsRef.current[index] = element;
  };

  const handleAccountToggle = () => {
    setIsAccountMenuOpen((currentValue) => !currentValue);
  };

  const handleAccountLinkClick = () => {
    setIsAccountMenuOpen(false);
  };

  const handleLogoutClick = () => {
    setIsAccountMenuOpen(false);
    onLogout?.();
  };

  const handleDragStart = (event) => {
    if (isMobileViewport) {
      return;
    }

    event.stopPropagation();
    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      isActiveDrag: false,
    };
    setIsAccountMenuOpen(false);
  };

  const handleRailPointerDown = (event) => {
    if (isMobileViewport) {
      return;
    }

    if (event.target.closest('button, a, input, select, textarea, [role="button"], [role="switch"]')) {
      return;
    }

    handleDragStart(event);
  };

  return (
    <div
      className={`card-nav-container card-nav-container--${effectivePosition} ${isDragging ? 'is-dragging' : ''} ${className}`.trim()}
      style={containerStyles}
    >
      <nav
        ref={navRef}
        className={`card-nav card-nav--${effectivePosition} ${isExpanded ? 'open' : ''} ${isAccountMenuOpen ? 'account-open' : ''}`}
        style={navStyles}
      >
        <div ref={railRef} className="card-nav-top" onPointerDown={handleRailPointerDown}>
          <button
            type="button"
            className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            aria-label={isExpanded ? 'Close menu' : 'Open menu'}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </button>

          <div className="logo-container">
            <Link
              to="/dashboard"
              className="card-nav-logo-link"
              aria-label="Go to dashboard"
              title="Go to dashboard"
            >
              <img src={logo} alt={logoAlt} className="logo" draggable="false" />
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

        <div ref={contentRef} className="card-nav-content" aria-hidden={!isExpanded}>
          {itemsToRender.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              className="nav-card"
              ref={setCardRef(index)}
              style={{ backgroundColor: item.bgColor, color: item.textColor }}
            >
              <div className="nav-card-label">{item.label}</div>
              <div className="nav-card-links">
                {item.links?.map((linkItem, linkIndex) => (
                  <a
                    key={`${linkItem.label}-${linkIndex}`}
                    className="nav-card-link"
                    href={linkItem.href}
                    aria-label={linkItem.ariaLabel}
                  >
                    <GoArrowUpRight className="nav-card-link-icon" aria-hidden="true" />
                    {linkItem.label}
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
