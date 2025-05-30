import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToGroupRanking } from '../firebase/firestore';

const GroupRanking = ({ group }) => {
  const { currentUser } = useAuth();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!group) return;

    setLoading(true);
    
    // ランキングのリアルタイム監視
    const unsubscribe = subscribeToGroupRanking(group.id, (updatedRankings) => {
      setRankings(updatedRankings);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [group]);

  if (!group) {
    return (
      <div className="group-ranking">
        <div className="no-group">
          <p>グループを選択するか、新しくグループを作成してください</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="group-ranking">
        <div className="loading">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="group-ranking">
      <h3>{group.name} のランキング</h3>
      
      {rankings.length === 0 ? (
        <div className="no-data">
          <p>まだランキングデータがありません</p>
        </div>
      ) : (
        <div className="ranking-list">
          {rankings.map((member, index) => (
            <div 
              key={member.userId} 
              className={`ranking-item ${member.userId === currentUser?.uid ? 'current-user' : ''}`}
            >
              <div className="rank">
                {index === 0 && '🥇'}
                {index === 1 && '🥈'}
                {index === 2 && '🥉'}
                {index > 2 && `${index + 1}位`}
              </div>
              
              <div className="member-info">
                <div className="nickname">
                  {member.nickname}
                  {member.userId === currentUser?.uid && ' (自分)'}
                </div>
                <div className="stats">
                  <span className="level">Lv.{member.level}</span>
                  <span className="points">{member.points}pt</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="group-invite-info">
        <p>招待コード: <strong>{group.inviteCode}</strong></p>
        <small>このコードを友達に共有してグループに招待しよう！</small>
      </div>
    </div>
  );
};

export default GroupRanking;