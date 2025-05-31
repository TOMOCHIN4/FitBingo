import React from 'react';

const Navigation = ({ activeTab, onTabChange, isAdmin }) => {
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
      <button
        className={`nav-tab ${activeTab === 'group' ? 'active' : ''}`}
        onClick={() => onTabChange('group')}
      >
        <span className="nav-icon">👥</span>
        <span className="nav-label">グループ</span>
      </button>
      {isAdmin && (
        <button
          className={`nav-tab ${activeTab === 'admin' ? 'active' : ''}`}
          onClick={() => onTabChange('admin')}
        >
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">管理</span>
        </button>
      )}
    </nav>
  );
};

export default Navigation;