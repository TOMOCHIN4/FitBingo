import React, { useState, useEffect } from 'react';
import { getRecentWinners } from '../firebase/tournamentSystem';
import './WinnersDisplay.css';

const WinnersDisplay = () => {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWinners();
    
    // 1時間ごとに優勝者情報を更新
    const interval = setInterval(loadWinners, 3600000);
    return () => clearInterval(interval);
  }, []);

  const loadWinners = async () => {
    try {
      const recentWinners = await getRecentWinners();
      setWinners(recentWinners);
    } catch (error) {
      console.error('優勝者データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysAgo = (date) => {
    if (!date) return '';
    
    const d = date.toDate ? date.toDate() : new Date(date);
    const today = new Date();
    const diffTime = today - d;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今日';
    if (diffDays === 1) return '昨日';
    return `${diffDays}日前`;
  };

  if (loading) {
    return (
      <div className="winners-loading">
        <div className="loading-trophy">🏆</div>
        <p>優勝者情報を読み込み中...</p>
      </div>
    );
  }

  if (winners.length === 0) {
    return (
      <div className="no-winners">
        <div className="no-winners-icon">🎯</div>
        <h3>最近の優勝者はまだいません</h3>
        <p>大会に参加して、最初の優勝者になりましょう！</p>
      </div>
    );
  }

  return (
    <div className="winners-display">
      <div className="winners-header">
        <h2>🏆 最近の優勝者</h2>
        <p className="winners-subtitle">過去3日間の大会優勝者を表彰中</p>
      </div>
      
      <div className="winners-list">
        {winners.map((winnerData, index) => (
          <div key={winnerData.tournamentId} className={`winner-card ${index === 0 ? 'latest' : ''}`}>
            <div className="winner-rank">
              {index === 0 && <div className="crown">👑</div>}
              <div className="trophy-icon">🏆</div>
            </div>
            
            <div className="winner-info">
              <div className="tournament-name">{winnerData.tournamentName}</div>
              <div className="winner-details">
                <span className="winner-name">
                  {winnerData.winner?.userName || 'プレイヤー'}
                </span>
                <span className="winner-score">
                  {winnerData.winner?.totalScore?.toLocaleString() || 0}pts
                </span>
              </div>
              <div className="winner-date">
                {formatDate(winnerData.endDate)} ({getDaysAgo(winnerData.endDate)})
              </div>
            </div>
            
            <div className="winner-badge">
              <div className="badge-text">優勝</div>
              <div className="badge-sparkles">✨</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="winners-footer">
        <p>🎉 優勝者は3日間ここに表彰されます！</p>
      </div>
    </div>
  );
};

export default WinnersDisplay;