import React from 'react';
import '../dashboard.css';

export default function Topbar({
  activeTab,
  setActiveTab,
  credits = 3,
  plan = 'free',
  setSidebarOpen,
  notificationsCount = 2
}) {
  // Page Title mapping based on active tab
  const getPageTitle = () => {
    switch (activeTab) {
      case 'generate':
        return 'Inicio';
      case 'new_campaign':
        return 'Nueva campaña';
      case 'clips':
        return 'Mis clips';
      case 'calendar':
        return 'Calendario de publicaciones';
      case 'analytics':
        return 'Analíticas de rendimiento';
      case 'social':
        return 'Redes sociales vinculadas';
      case 'upgrade':
        return 'Suscripciones y planes';
      case 'settings':
        return 'Ajustes del perfil';
      default:
        return 'Dashboard';
    }
  };

  const handleUpgradeClick = (e) => {
    e.preventDefault();
    setActiveTab('upgrade');
  };

  return (
    <header className="db-topbar">
      {/* LEFT: Title & Hamburger toggle on mobile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => setSidebarOpen(prev => !prev)}
          className="db-topbar-mobile-btn"
          aria-label="Abrir barra lateral"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f0f0f" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="db-topbar-title">{getPageTitle()}</span>
      </div>

      {/* RIGHT: Credits & Actions */}
      <div className="db-topbar-right">
        {/* Credits Badge */}
        <div className="db-credits-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#c4ff3d">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span className="db-credits-text db-topbar-credits-text">
            {plan?.toLowerCase() === 'pro' ? '∞' : credits} {plan?.toLowerCase() === 'pro' ? 'clips' : credits === 1 ? 'clip' : 'clips'} restantes
          </span>
        </div>

        {/* Add Credits Button */}
        <button
          onClick={handleUpgradeClick}
          className="db-btn-accent"
          aria-label="Añadir créditos"
        >
          <svg className="db-btn-accent-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="db-topbar-btn-text">Añadir créditos</span>
        </button>

        {/* Notification Bell */}
        <button
          className="db-notification-btn"
          aria-label="Ver notificaciones"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {notificationsCount > 0 && (
            <div className="db-notification-dot">
              {notificationsCount}
            </div>
          )}
        </button>
      </div>
    </header>
  );
}
