import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createTournament } from '../firebase/tournamentSystem';
import './TournamentCreator.css';

const TournamentCreator = ({ onTournamentCreated, onClose }) => {
  const { currentUser } = useAuth();
  const [tournamentName, setTournamentName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  // 現在時刻をISO文字列で取得（入力フィールド用）
  const now = new Date();
  const minDateTime = now.toISOString().slice(0, 16);
  
  // 24時間後の時刻を取得
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultEndTime = tomorrow.toISOString().slice(0, 16);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!tournamentName.trim()) {
      alert('大会名を入力してください');
      return;
    }
    
    if (!startDate || !endDate) {
      alert('開始日時と終了日時を設定してください');
      return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      alert('終了日時は開始日時より後に設定してください');
      return;
    }
    
    if (start < now) {
      alert('開始日時は現在時刻より後に設定してください');
      return;
    }

    setLoading(true);
    
    try {
      const tournamentId = await createTournament(currentUser.uid, {
        name: tournamentName.trim(),
        hostUserName: currentUser.displayName || 'プレイヤー',
        startDate: start,
        endDate: end
      });
      
      alert('大会を作成しました！');
      onTournamentCreated(tournamentId);
      onClose();
    } catch (error) {
      console.error('大会作成エラー:', error);
      alert('大会の作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tournament-creator-overlay">
      <div className="tournament-creator">
        <div className="tournament-creator-header">
          <h2>🏆 新しい大会を開催</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="tournament-form">
          <div className="form-group">
            <label htmlFor="tournamentName">大会名 *</label>
            <input
              type="text"
              id="tournamentName"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              placeholder="例: 新春フィットネス大会"
              maxLength={50}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="startDate">開始日時 *</label>
            <input
              type="datetime-local"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={minDateTime}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="endDate">終了日時 *</label>
            <input
              type="datetime-local"
              id="endDate"
              value={endDate || defaultEndTime}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || minDateTime}
              required
            />
          </div>
          
          <div className="tournament-info">
            <p>💡 <strong>大会について</strong></p>
            <ul>
              <li>誰でも参加できるオープン大会です</li>
              <li>開始時刻になると自動的に大会が始まります</li>
              <li>終了時刻に最も高いスコアの参加者が優勝です</li>
              <li>優勝者は3日間表彰されます</li>
            </ul>
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              キャンセル
            </button>
            <button type="submit" disabled={loading}>
              {loading ? '作成中...' : '大会を作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TournamentCreator;