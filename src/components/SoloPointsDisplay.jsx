import React, { useState, useEffect } from 'react';
import { getSoloScore } from '../firebase/soloMode';
import './SoloPointsDisplay.css';

const SoloPointsDisplay = ({ userId }) => {
  const [soloData, setSoloData] = useState({
    totalScore: 0,
    exerciseCount: 0,
    lineCount: 0,
    allClearCount: 0,
    highestLevel: 1
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const loadSoloData = async () => {
      try {
        const data = await getSoloScore(userId);
        setSoloData(data);
      } catch (error) {
        console.error('一人モードデータ読み込みエラー:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSoloData();

    // 5秒ごとにデータを更新
    const interval = setInterval(loadSoloData, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  if (loading) {
    return (
      <div className="solo-points-display loading">
        <span>📊</span>
        <span>読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="solo-points-display">
      <div className="solo-score-main">
        <span className="score-icon">🏆</span>
        <span className="score-value">{soloData.totalScore?.toLocaleString() || 0}</span>
        <span className="score-label">pts</span>
      </div>
      
      <div className="solo-stats">
        <div className="stat-item">
          <span className="stat-icon">💪</span>
          <span className="stat-value">{soloData.exerciseCount || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🎯</span>
          <span className="stat-value">{soloData.lineCount || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">⭐</span>
          <span className="stat-value">L{soloData.highestLevel || 1}</span>
        </div>
      </div>
    </div>
  );
};

export default SoloPointsDisplay;