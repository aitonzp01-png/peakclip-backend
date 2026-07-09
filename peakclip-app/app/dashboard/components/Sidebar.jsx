import React from 'react';
import '../dashboard.css';

export default function Sidebar({
  activeTab,
  setActiveTab,
  user,
  plan = 'free',
  handleLogout,
  sidebarOpen,
  setSidebarOpen
}) {
  const email = user?.email || '';
  const name = user?.user_metadata?.name || email.split('@')[0] || 'User';
  const initial = name.charAt(0).toUpperCase();

  const handleTabClick = (tabId, e) => {
    e.preventDefault();
    setActiveTab(tabId);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  // Capitalize plan name
  const planFormatted = plan ? plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase() : 'Free';

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {sidebarOpen && (
        <div className="db-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`db-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* LOGO */}
        <a href="/dashboard" onClick={(e) => handleTabClick('generate', e)} className="db-logo">
          PEAK<span>CLIP</span><span className="db-logo-dot" />
        </a>

        {/* PLAN BADGE */}
        <div className="db-plan-badge">
          {planFormatted}
          {plan?.toLowerCase() === 'free' && (
            <a href="/pricing" onClick={(e) => handleTabClick('upgrade', e)} className="db-plan-upgrade">
              Upgrade →
            </a>
          )}
        </div>

        {/* CREATE SECTION */}
        <div className="db-section-label">CREATE</div>
        
        <button
          onClick={(e) => handleTabClick('generate', e)}
          className={`db-nav-item ${activeTab === 'generate' ? 'active' : ''}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Home
        </button>

        <button
          onClick={(e) => handleTabClick('new_campaign', e)}
          className={`db-nav-item ${activeTab === 'new_campaign' ? 'active' : ''}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          New campaign
        </button>

        <button
          onClick={(e) => handleTabClick('clips', e)}
          className={`db-nav-item ${activeTab === 'clips' ? 'active' : ''}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="2" y="2" width="20" height="20" rx="3" />
            <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
          </svg>
          My clips
        </button>

        {/* PUBLISH SECTION */}
        <div className="db-section-label">PUBLISH</div>

        <button
          onClick={(e) => handleTabClick('calendar', e)}
          className={`db-nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Calendar
          <span className="db-nav-badge">Soon</span>
        </button>

        <button
          onClick={(e) => handleTabClick('analytics', e)}
          className={`db-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Analytics
          <span className="db-nav-badge">Soon</span>
        </button>

        <button
          onClick={(e) => handleTabClick('social', e)}
          className={`db-nav-item ${activeTab === 'social' ? 'active' : ''}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Social accounts
        </button>

        {/* FOOTER */}
        <div className="db-sidebar-footer">
          <div className="db-divider" />
          
          <div className="db-user-row">
            <div className="db-user-avatar">{initial}</div>
            <div className="db-user-info">
              <span className="db-user-name">{name}</span>
              <span className="db-user-email">{email}</span>
            </div>
          </div>

          <button onClick={(e) => handleTabClick('upgrade', e)} className="db-footer-link">
            Subscription
          </button>
          <button onClick={handleLogout} className="db-footer-link logout">
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
