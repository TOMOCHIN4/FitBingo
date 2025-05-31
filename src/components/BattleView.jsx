import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { joinBattle } from '../firebase/battleSystem';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

const BattleView = () => {
  const { currentUser } = useAuth();
  const [availableBattles, setAvailableBattles] = useState([]);
  const [myBattles, setMyBattles] = useState([]);
  const [battleScores, setBattleScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedBattle, setSelectedBattle] = useState(null);

  useEffect(() => {
    loadBattles();
  }, [currentUser]);

  const loadBattles = async () => {
    if (!currentUser) return;

    try {
      // すべてのアクティブなバトルを取得
      const battlesQuery = query(
        collection(db, 'battles'),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(battlesQuery);
      
      const allBattles = [];
      const joined = [];
      const available = [];
      
      snapshot.forEach(doc => {
        const battle = { id: doc.id, ...doc.data() };
        allBattles.push(battle);
        
        if (battle.participants?.includes(currentUser.uid)) {
          joined.push(battle);
        } else {
          available.push(battle);
        }
      });
      
      setMyBattles(joined);
      setAvailableBattles(available);
      
      // 参加中のバトルのスコアを監視
      if (joined.length > 0) {
        subscribeToScores(joined[0].id);
      }
    } catch (error) {
      console.error('バトル読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToScores = (battleId) => {
    const scoresQuery = query(
      collection(db, 'battleScores'),
      where('battleId', '==', battleId),
      orderBy('totalPoints', 'desc')
    );

    const unsubscribe = onSnapshot(scoresQuery, async (snapshot) => {
      const scores = [];
      
      for (const scoreDoc of snapshot.docs) {
        const scoreData = scoreDoc.data();
        const userDoc = await getDoc(doc(db, 'users', scoreData.userId));
        
        if (userDoc.exists()) {
          scores.push({
            ...scoreData,
            nickname: userDoc.data().nickname,
            isCurrentUser: scoreData.userId === currentUser.uid
          });
        }
      }
      
      setBattleScores({ [battleId]: scores });
    });

    return unsubscribe;
  };

  const handleJoinBattle = async (battleId) => {
    try {
      await joinBattle(currentUser.uid, battleId);
      alert('バトルに参加しました！');
      await loadBattles();
    } catch (error) {
      alert('参加エラー: ' + error.message);
    }
  };

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  return (
    <div className="battle-view">
      {myBattles.length > 0 ? (
        <div className="my-battles">
          <h3>参加中のバトル</h3>
          {myBattles.map(battle => (
            <div key={battle.id} className="battle-card active">
              <h4>{battle.name}</h4>
              <p>{battle.description}</p>
              <div className="battle-info">
                <span>週: {battle.currentWeek}</span>
                <span>期間: {format(battle.startDate.toDate(), 'M/d', { locale: ja })} - {format(battle.endDate.toDate(), 'M/d', { locale: ja })}</span>
              </div>
              
              {battleScores[battle.id] && (
                <div className="battle-ranking">
                  <h5>現在のランキング</h5>
                  <div className="score-list">
                    {battleScores[battle.id].map((score, index) => (
                      <div 
                        key={score.userId}
                        className={`score-item ${score.isCurrentUser ? 'current-user' : ''}`}
                      >
                        <span className="rank">{index + 1}位</span>
                        <span className="nickname">{score.nickname}</span>
                        <span className="points">{score.totalPoints}pt</span>
                        {score.currentWeight && score.initialWeight && (
                          <span className="weight-change">
                            {(score.initialWeight - score.currentWeight).toFixed(1)}kg減
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {battle.weeklyWinners && battle.weeklyWinners.length > 0 && (
                <div className="weekly-winners">
                  <h5>週間表彰履歴</h5>
                  {battle.weeklyWinners.map((week, index) => (
                    <div key={index} className="week-winner">
                      <span>第{week.week}週</span>
                      <span>🥇 {week.winners[0]?.userId || '-'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="no-battles">
          <p>参加中のバトルはありません</p>
        </div>
      )}

      {availableBattles.length > 0 && (
        <div className="available-battles">
          <h3>参加可能なバトル</h3>
          {availableBattles.map(battle => (
            <div key={battle.id} className="battle-card">
              <h4>{battle.name}</h4>
              <p>{battle.description}</p>
              <div className="battle-info">
                <span>参加者: {battle.participants?.length || 0}人</span>
                <span>期間: {format(battle.startDate.toDate(), 'M/d', { locale: ja })} - {format(battle.endDate.toDate(), 'M/d', { locale: ja })}</span>
              </div>
              <button 
                onClick={() => handleJoinBattle(battle.id)}
                className="btn-primary"
              >
                参加する
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BattleView;