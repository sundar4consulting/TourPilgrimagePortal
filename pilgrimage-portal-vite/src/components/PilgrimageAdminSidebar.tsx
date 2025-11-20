import React from 'react';
import './PilgrimageAdminSidebar.css';

interface PilgrimageAdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isMinimized?: boolean;
}

const PilgrimageAdminSidebar: React.FC<PilgrimageAdminSidebarProps> = ({ 
  isOpen, 
  onToggle, 
  activeTab, 
  onTabChange,
  isMinimized = false
}) => {

  const navigationItems = [
    {
      key: 'home',
      icon: 'fa-home',
      label: 'Home',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      key: 'expenses',
      icon: 'fa-wallet',
      label: 'Expenses',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      key: 'tours',
      icon: 'fa-mountain',
      label: 'Tours',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      key: 'accommodations',
      icon: 'fa-hotel',
      label: 'Accommodations',
      gradient: 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)'
    },
    {
      key: 'member-contacts',
      icon: 'fa-address-book',
      label: 'Member Contacts',
      gradient: 'linear-gradient(135deg, #9795f0 0%, #fbc8d4 100%)'
    },
    {
      key: 'bookings',
      icon: 'fa-ticket-alt',
      label: 'Bookings',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    },
    {
      key: 'analytics',
      icon: 'fa-chart-line',
      label: 'Analytics',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    },
    {
      key: 'approvals',
      icon: 'fa-check-circle',
      label: 'Approvals',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    },
    {
      key: 'misc',
      icon: 'fa-users-cog',
      label: 'Misc',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }
  ];

  return (
    <>
      {/* Sidebar */}
      <div className={`pilgrimage-admin-sidebar ${isOpen ? 'show' : ''} ${isMinimized ? 'minimized' : ''}`}>
        {/* Sidebar Header */}
        <div className="pilgrimage-sidebar-header">
          <div className="pilgrimage-logo">
            <i className="fas fa-om text-white"></i>
            {!isMinimized && (
              <div className="pilgrimage-brand-info">
                <span className="pilgrimage-brand-text">Sri Vishnu Chitra Yatra</span>
                <span className="pilgrimage-brand-subtitle">Spiritual Journeys</span>
              </div>
            )}
          </div>
          <button
            className="pilgrimage-sidebar-toggle-btn"
            onClick={onToggle}
            title={isMinimized ? "Expand Sidebar" : "Minimize Sidebar"}
          >
            <i className={isMinimized ? "fas fa-angle-double-right" : "fas fa-bars"}></i>
          </button>
        </div>

        {/* Navigation */}
        <nav className="pilgrimage-sidebar-nav">
          <ul className="pilgrimage-nav-list">
            {navigationItems.map((item, index) => (
              <li key={index} className="pilgrimage-nav-item">
                <button
                  className={`pilgrimage-nav-link ${activeTab === item.key ? 'active' : ''}`}
                  data-tooltip={item.label}
                  onClick={() => {
                    onTabChange(item.key);
                    window.innerWidth < 768 && onToggle();
                  }}
                >
                  <div 
                    className="pilgrimage-nav-icon"
                    style={{ background: item.gradient }}
                  >
                    <i className={`fas ${item.icon}`}></i>
                  </div>
                  {!isMinimized && <span className="pilgrimage-nav-text">{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="pilgrimage-sidebar-footer">
          <div className="pilgrimage-admin-user">
            <div className="pilgrimage-user-avatar">
              <i className="fas fa-user-shield"></i>
            </div>
            {!isMinimized && (
              <div className="pilgrimage-user-info">
                <span className="pilgrimage-user-name">Admin User</span>
                <span className="pilgrimage-user-role">System Administrator</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PilgrimageAdminSidebar;