import React from 'react';
import './ModeSelector.css';

const ModeSelector = ({ currentMode, onModeChange }) => {
  return (
    <div className="mode-selector">
      <button 
        className={`mode-button ${currentMode === 'solo' ? 'active' : ''}`}
        onClick={() => onModeChange('solo')}
      >
        <span className="mode-icon">🎯</span>
        <span className="mode-text">一人モード</span>
      </button>
      <button 
        className={`mode-button ${currentMode === 'tournament' ? 'active' : ''}`}
        onClick={() => onModeChange('tournament')}
      >
        <span className="mode-icon">🏆</span>
        <span className="mode-text">大会モード</span>
      </button>
    </div>
  );
};

export default ModeSelector;