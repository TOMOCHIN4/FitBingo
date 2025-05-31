import React, { useEffect, useState } from 'react';
import './BingoCelebration.css';

const BingoCelebration = ({ isVisible, onClose, type = 'line' }) => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setShowButton(true);
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      setShowButton(false);
    }
  }, [isVisible]);

  const getContent = () => {
    switch (type) {
      case 'line':
        return {
          mainText: '🎉 BINGO! 🎉',
          subtitle: 'ライン完成おめでとう！'
        };
      case 'allClear':
        return {
          mainText: '🏆 ALL CLEAR! 🏆',
          subtitle: '全マス完了！レベルアップ！'
        };
      default:
        return {
          mainText: '🎉 BINGO! 🎉',
          subtitle: 'おめでとう！'
        };
    }
  };

  if (!isVisible) return null;

  const content = getContent();

  return (
    <div className="bingo-celebration">
      {/* 背景エフェクト */}
      <div className="celebration-confetti">
        {Array.from({ length: 18 }, (_, i) => (
          <div key={i} className="confetti" />
        ))}
      </div>

      <div className="celebration-fireworks">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="firework" />
        ))}
      </div>

      <div className="celebration-stars">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="star">⭐</div>
        ))}
      </div>

      {/* メインコンテンツ */}
      <div className="celebration-text">
        {content.mainText}
      </div>

      <div className="celebration-subtitle">
        {content.subtitle}
      </div>

      {showButton && (
        <button 
          className="celebration-button"
          onClick={onClose}
        >
          続ける
        </button>
      )}
    </div>
  );
};

export default BingoCelebration;