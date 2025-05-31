import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getActiveTournaments, 
  joinTournament, 
  updateTournamentStatus,
  TOURNAMENT_STATUS 
} from '../firebase/tournamentSystem';
import TournamentCreator from './TournamentCreator';
import './TournamentList.css';

const TournamentList = ({ onTournamentSelected }) => {
  const { currentUser } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreator, setShowCreator] = useState(false);
  const [joiningTournament, setJoiningTournament] = useState(null);

  useEffect(() => {
    loadTournaments();
    
    // 30秒ごとに大会ステータスを更新
    const interval = setInterval(() => {
      updateTournamentStatus();
      loadTournaments();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadTournaments = async () => {
    try {
      await updateTournamentStatus(); // まずステータス更新
      const tournamentList = await getActiveTournaments();
      setTournaments(tournamentList);
    } catch (error) {
      console.error('大会一覧取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTournament = async (tournamentId) => {
    if (!currentUser) return;
    
    setJoiningTournament(tournamentId);
    
    try {
      await joinTournament(
        tournamentId, 
        currentUser.uid, 
        currentUser.displayName || 'プレイヤー'
      );
      
      alert('大会に参加しました！');
      await loadTournaments();
      
      // 参加した大会を選択状態にする
      onTournamentSelected(tournamentId);
    } catch (error) {
      console.error('大会参加エラー:', error);
      alert(error.message || '大会参加に失敗しました');
    } finally {
      setJoiningTournament(null);
    }
  };

  const formatDateTime = (date) => {
    if (!date) return '';
    
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case TOURNAMENT_STATUS.RECRUITING:
        return { text: '募集中', className: 'recruiting' };
      case TOURNAMENT_STATUS.ACTIVE:
        return { text: '開催中', className: 'active' };
      default:
        return { text: '終了', className: 'finished' };
    }
  };

  const isParticipant = (tournament) => {
    return tournament.participants?.includes(currentUser?.uid);
  };

  if (loading) {
    return (
      <div className="tournament-list-loading">
        <div className="loading-spinner">🏆</div>
        <p>大会一覧を読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="tournament-list">
      <div className="tournament-list-header">
        <h2>🏆 大会一覧</h2>
        <button 
          className="create-tournament-button"
          onClick={() => setShowCreator(true)}
        >
          ➕ 新しい大会を開催
        </button>
      </div>

      {tournaments.length === 0 ? (
        <div className="no-tournaments">
          <div className="no-tournaments-icon">🎯</div>
          <h3>開催中の大会がありません</h3>
          <p>新しい大会を開催して、みんなでフィットネスを楽しみましょう！</p>
          <button 
            className="create-first-tournament"
            onClick={() => setShowCreator(true)}
          >
            最初の大会を開催する
          </button>
        </div>
      ) : (
        <div className="tournaments-grid">
          {tournaments.map((tournament) => {
            const statusInfo = getStatusLabel(tournament.status);
            const participated = isParticipant(tournament);
            
            return (
              <div key={tournament.id} className="tournament-card">
                <div className="tournament-header">
                  <h3 className="tournament-name">{tournament.name}</h3>
                  <span className={`tournament-status ${statusInfo.className}`}>
                    {statusInfo.text}
                  </span>
                </div>
                
                <div className="tournament-info">
                  <div className="tournament-host">
                    <span className="info-label">主催者:</span>
                    <span className="info-value">{tournament.hostUserName}</span>
                  </div>
                  
                  <div className="tournament-schedule">
                    <div className="schedule-item">
                      <span className="info-label">開始:</span>
                      <span className="info-value">
                        {formatDateTime(tournament.startDate)}
                      </span>
                    </div>
                    <div className="schedule-item">
                      <span className="info-label">終了:</span>
                      <span className="info-value">
                        {formatDateTime(tournament.endDate)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="tournament-participants">
                    <span className="info-label">参加者:</span>
                    <span className="info-value">
                      {tournament.participantCount || 0}人
                    </span>
                  </div>
                </div>
                
                <div className="tournament-actions">
                  {participated ? (
                    <button 
                      className="tournament-button participated"
                      onClick={() => onTournamentSelected(tournament.id)}
                    >
                      ✅ 参加中 - 詳細を見る
                    </button>
                  ) : tournament.status === TOURNAMENT_STATUS.RECRUITING ? (
                    <button 
                      className="tournament-button join"
                      onClick={() => handleJoinTournament(tournament.id)}
                      disabled={joiningTournament === tournament.id}
                    >
                      {joiningTournament === tournament.id ? '参加中...' : '参加する'}
                    </button>
                  ) : (
                    <button 
                      className="tournament-button view"
                      onClick={() => onTournamentSelected(tournament.id)}
                    >
                      👀 観戦する
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreator && (
        <TournamentCreator
          onTournamentCreated={loadTournaments}
          onClose={() => setShowCreator(false)}
        />
      )}
    </div>
  );
};

export default TournamentList;