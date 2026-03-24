import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaBolt,
  FaCalendarCheck,
  FaChartLine,
  FaCoins,
  FaFileInvoiceDollar,
  FaLayerGroup,
  FaMagic,
  FaRegCircle,
  FaRobot,
  FaShieldAlt,
  FaUserTie,
} from 'react-icons/fa';
import { TbMoonStars, TbSunHigh } from 'react-icons/tb';
import logo from '../assets/logo.svg';
import logoDark from '../assets/logo-dark.svg';
import './LandingPage.css';

const heroPills = ['Finance', 'Gigs', 'Tax', 'AI'];

const insightCards = [
  {
    icon: FaCoins,
    title: 'Financial command',
    stat: 'Income, expenses, balances',
    copy: 'One place to read the business side of freelance work.',
    chart: 'bars',
  },
  {
    icon: FaCalendarCheck,
    title: 'Deadline rhythm',
    stat: 'Milestones in motion',
    copy: 'Keep deliveries, due dates, and invoices visually aligned.',
    chart: 'steps',
  },
  {
    icon: FaRobot,
    title: 'AI assistance',
    stat: 'Proposal and workflow support',
    copy: 'Move faster when pitching, planning, and following up.',
    chart: 'pulse',
  },
  {
    icon: FaShieldAlt,
    title: 'Tax-ready output',
    stat: 'Reporting with context',
    copy: 'Make compliance and reporting feel less fragmented.',
    chart: 'ring',
  },
];

const audienceCards = [
  {
    icon: FaUserTie,
    title: 'Marketplace freelancers',
    copy: 'For people juggling platform work, direct clients, and mixed payment streams.',
  },
  {
    icon: FaLayerGroup,
    title: 'Solo operators',
    copy: 'For independent workers who want clearer systems instead of scattered admin.',
  },
  {
    icon: FaChartLine,
    title: 'Freelancers scaling up',
    copy: 'For users who want stronger operations, visibility, and support as work grows.',
  },
];

const steps = [
  {
    number: '01',
    icon: FaBolt,
    title: 'Enter one workspace',
    copy: 'Start from a calmer front door instead of five disconnected tabs.',
  },
  {
    number: '02',
    icon: FaFileInvoiceDollar,
    title: 'Run the moving parts',
    copy: 'Handle finances, gigs, milestones, and reporting in one visual flow.',
  },
  {
    number: '03',
    icon: FaMagic,
    title: 'Add AI where it helps',
    copy: 'Use assistance for proposals, planning, and repetitive freelance admin.',
  },
];

function LandingPage({ isAuthenticated, theme, onToggleTheme }) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return undefined;
    }

    const elements = Array.from(document.querySelectorAll('[data-reveal]'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -10% 0px' }
    );

    elements.forEach((element, index) => {
      element.style.setProperty('--reveal-delay', `${(index % 5) * 80}ms`);
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const logoSrc = theme === 'light' ? logoDark : logo;
  const primaryAction = isAuthenticated
    ? { to: '/dashboard', label: 'Open Dashboard' }
    : { to: '/register', label: 'Get Started' };
  const secondaryAction = isAuthenticated
    ? { to: '/agents/proposal', label: 'Try Proposal Agent' }
    : { to: '/login', label: 'Login' };
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-shell landing-header-inner">
          <Link to="/" className="landing-brand" aria-label="FlowLance home">
            <img src={logoSrc} alt="FlowLance" className="landing-brand-logo" />
          </Link>

          <nav className="landing-nav" aria-label="Landing page sections">
            <a href="#showcase">Showcase</a>
            <a href="#capabilities">Capabilities</a>
            <a href="#workflow">Workflow</a>
          </nav>

          <div className="landing-header-actions">
            <button
              type="button"
              className={`landing-theme-toggle ${theme === 'light' ? '' : 'is-light'}`}
              onClick={onToggleTheme}
              role="switch"
              aria-checked={theme === 'light'}
              aria-label={`Switch to ${nextTheme} mode`}
              title={`Switch to ${nextTheme} mode`}
            >
              <span className="landing-theme-toggle-track">
                <span className="landing-theme-toggle-thumb" aria-hidden="true" />
                <span className={`landing-theme-toggle-option ${theme === 'light' ? 'active' : ''}`}>
                  <TbSunHigh aria-hidden="true" />
                </span>
                <span className={`landing-theme-toggle-option ${theme === 'dark' ? 'active' : ''}`}>
                  <TbMoonStars aria-hidden="true" />
                </span>
              </span>
            </button>

            <Link to={secondaryAction.to} className="landing-button landing-button-ghost">
              {secondaryAction.label}
            </Link>
            <Link to={primaryAction.to} className="landing-button landing-button-primary">
              {primaryAction.label}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero" id="showcase">
          <div className="landing-hero-backdrop" aria-hidden="true" />
          <div className="landing-shell">
            <div className="landing-hero-copy landing-reveal is-visible">
              <p className="landing-eyebrow">
                <span>Freelance</span>
                <span className="landing-eyebrow-accent">OS</span>
              </p>
              <h1>
                A simpler way to run <span className="landing-text-accent">money</span>,{' '}
                <span className="landing-text-soft">projects</span>, and{' '}
                <span className="landing-text-italic">AI support</span>.
              </h1>
              <p className="landing-lead">
                FlowLance turns scattered freelance operations into one polished workspace with more motion, less
                clutter, and clearer visual focus.
              </p>

              <div className="landing-hero-actions">
                <Link to={primaryAction.to} className="landing-button landing-button-primary landing-button-large">
                  {primaryAction.label}
                </Link>
                <Link to={secondaryAction.to} className="landing-button landing-button-ghost landing-button-large">
                  {secondaryAction.label}
                </Link>
              </div>
            </div>

            <div className="landing-stage landing-reveal is-visible">
              <div className="landing-stage-glow landing-stage-glow-a" aria-hidden="true" />
              <div className="landing-stage-glow landing-stage-glow-b" aria-hidden="true" />
              <div className="landing-stage-grid" aria-hidden="true" />

              <div className="landing-stage-topbar">
                <div className="landing-stage-pillrow">
                  {heroPills.map((pill) => (
                    <span key={pill} className="landing-stage-pill">
                      {pill}
                    </span>
                  ))}
                </div>
                <span className="landing-stage-status">Centralized workspace</span>
              </div>

              <div className="landing-stage-center">
                <p className="landing-stage-kicker">Built for independent work</p>
                <h2>Declutter the business side of freelancing.</h2>
                <p>Less spreadsheet juggling. More visibility, motion, and control.</p>
              </div>

              <article className="stage-widget stage-widget-finance">
                <div className="stage-widget-head">
                  <span className="stage-widget-icon">
                    <FaCoins aria-hidden="true" />
                  </span>
                  <div>
                    <p>Finance pulse</p>
                    <strong>$12.4k tracked</strong>
                  </div>
                </div>
                <div className="stage-bars" aria-hidden="true">
                  <span style={{ '--bar-height': '58%' }} />
                  <span style={{ '--bar-height': '76%' }} />
                  <span style={{ '--bar-height': '48%' }} />
                  <span style={{ '--bar-height': '88%' }} />
                </div>
              </article>

              <article className="stage-widget stage-widget-gigs">
                <div className="stage-widget-head">
                  <span className="stage-widget-icon">
                    <FaCalendarCheck aria-hidden="true" />
                  </span>
                  <div>
                    <p>Gig flow</p>
                    <strong>3 milestones active</strong>
                  </div>
                </div>
                <div className="stage-list">
                  <span><FaRegCircle aria-hidden="true" /> Proposal sent</span>
                  <span><FaRegCircle aria-hidden="true" /> Deposit received</span>
                  <span><FaRegCircle aria-hidden="true" /> Invoice queued</span>
                </div>
              </article>

              <article className="stage-widget stage-widget-ai">
                <div className="stage-widget-head">
                  <span className="stage-widget-icon">
                    <FaRobot aria-hidden="true" />
                  </span>
                  <div>
                    <p>AI assist</p>
                    <strong>Proposal draft ready</strong>
                  </div>
                </div>
                <div className="stage-message-stack" aria-hidden="true">
                  <span>Scope aligned</span>
                  <span>Rate suggestion prepared</span>
                  <span>Client tone adjusted</span>
                </div>
              </article>

              <article className="stage-widget stage-widget-ring">
                <div className="stage-ring-wrap" aria-hidden="true">
                  <div className="stage-ring">
                    <div className="stage-ring-core">87%</div>
                  </div>
                </div>
                <p className="stage-ring-copy">Reporting readiness</p>
              </article>
            </div>
          </div>
        </section>

        <section className="landing-section" id="capabilities">
          <div className="landing-shell">
            <div className="landing-section-heading landing-reveal" data-reveal>
              <p className="landing-section-kicker">Capabilities</p>
              <h2>A cleaner bento view of what FlowLance actually does.</h2>
            </div>

            <div className="landing-bento-grid">
              {insightCards.map((card) => {
                const Icon = card.icon;

                return (
                  <article key={card.title} className={`landing-bento-card chart-${card.chart} landing-reveal`} data-reveal>
                    <div className="landing-bento-head">
                      <span className="landing-bento-icon">
                        <Icon aria-hidden="true" />
                      </span>
                      <div>
                        <p>{card.title}</p>
                        <h3>{card.stat}</h3>
                      </div>
                    </div>

                    <div className="landing-bento-visual" aria-hidden="true">
                      {card.chart === 'bars' && (
                        <div className="visual-bars-stack">
                          <span />
                          <span />
                          <span />
                          <span />
                        </div>
                      )}
                      {card.chart === 'steps' && (
                        <div className="visual-steps-track">
                          <span />
                          <span />
                          <span />
                        </div>
                      )}
                      {card.chart === 'pulse' && (
                        <div className="visual-pulse-orb">
                          <span />
                          <span />
                          <span />
                        </div>
                      )}
                      {card.chart === 'ring' && (
                        <div className="visual-compliance-ring">
                          <div>Ready</div>
                        </div>
                      )}
                    </div>

                    <p className="landing-bento-copy">{card.copy}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="landing-section">
          <div className="landing-shell">
            <div className="landing-section-heading landing-reveal" data-reveal>
              <p className="landing-section-kicker">Audience</p>
              <h2>Built for freelancers who want a workspace that feels lighter, sharper, and more alive.</h2>
            </div>

            <div className="landing-audience-grid">
              {audienceCards.map((card) => {
                const Icon = card.icon;

                return (
                  <article key={card.title} className="landing-audience-card landing-reveal" data-reveal>
                    <span className="landing-audience-icon">
                      <Icon aria-hidden="true" />
                    </span>
                    <h3>{card.title}</h3>
                    <p>{card.copy}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="landing-section landing-workflow-section" id="workflow">
          <div className="landing-shell">
            <div className="landing-section-heading landing-reveal" data-reveal>
              <p className="landing-section-kicker">Workflow</p>
              <h2>Three simple moves to organized freelance flow.</h2>
            </div>

            <div className="landing-workflow-rail landing-reveal" data-reveal aria-hidden="true">
              <span />
              <span />
              <span />
            </div>

            <div className="landing-steps-grid">
              {steps.map((step) => {
                const Icon = step.icon;

                return (
                  <article key={step.number} className="landing-step-card landing-reveal" data-reveal>
                    <div className="landing-step-badge">{step.number}</div>
                    <span className="landing-step-icon">
                      <Icon aria-hidden="true" />
                    </span>
                    <h3>{step.title}</h3>
                    <p>{step.copy}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="landing-section landing-section-cta">
          <div className="landing-shell">
            <div className="landing-cta-card landing-reveal" data-reveal>
              <div>
                <p className="landing-section-kicker">Start here</p>
                <h2>Try the platform, feel the difference.</h2>
                <p>FlowLance now leads with motion, clarity, and a more intentional feel.</p>
              </div>

              <div className="landing-cta-actions">
                <Link to={primaryAction.to} className="landing-button landing-button-primary landing-button-large">
                  {primaryAction.label}
                </Link>
                <Link to={secondaryAction.to} className="landing-button landing-button-ghost landing-button-large">
                  {secondaryAction.label}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-shell landing-footer-inner">
          <p>FlowLance</p>
          <span>Centralized financial, operational, and AI support for freelancers.</span>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
