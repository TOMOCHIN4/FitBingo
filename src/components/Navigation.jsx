import React from 'react';

const Navigation = ({ activeTab, onTabChange }) => {
  return (
    <nav className="navigation">
      <button
        className={`nav-tab ${activeTab === 'bingo' ? 'active' : ''}`}
        onClick={() => onTabChange('bingo')}
      >
        <span className="nav-icon">🎯</span>
        <span className="nav-label">ビンゴ</span>
      </button>
      <button
        className={`nav-tab ${activeTab === 'weight' ? 'active' : ''}`}
        onClick={() => onTabChange('weight')}
      >
        <span className="nav-icon">⚖️</span>
        <span className="nav-label">体重</span>
      </button>
    </nav>
  );
};

export default Navigation;