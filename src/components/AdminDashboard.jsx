import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { checkAdminRole, createBattle, performWeeklyAward, finalizeBattle } from '../firebase/battleSystem';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import VideoManager from './VideoManager';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [battles, setBattles] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState('battles');
  
  // バトル作成フォームの状態
  const [battleName, setBattleName] = useState('');
  const [battleDescription, setBattleDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [weeklyAwardDay, setWeeklyAwardDay] = useState('1'); // 月曜日

  useEffect(() => {
    const checkAdmin = async () => {
      if (currentUser) {
        const adminStatus = await checkAdminRole(currentUser.uid);
        setIsAdmin(adminStatus);
        if (adminStatus) {
          await loadBattles();
        }
      }
      setLoading(false);
    };
    
    checkAdmin();
  }, [currentUser]);

  const loadBattles = async () => {
    try {
      const battlesQuery = query(
        collection(db, 'battles'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(battlesQuery);
      const battlesData = [];
      snapshot.forEach(doc => {
        battlesData.push({ id: doc.id, ...doc.data() });
      });
      setBattles(battlesData);
    } catch (error) {
      console.error('バトル読み込みエラー:', error);
    }
  };

  const handleCreateBattle = async (e) => {
    e.preventDefault();
    
    try {
      const battleData = {
        name: battleName,
        description: battleDescription,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        weeklyAwardDay: parseInt(weeklyAwardDay),
        groupId: null // 後でグループ選択機能を追加
      };
      
      await createBattle(currentUser.uid, battleData);
      alert('バトルを作成しました！');
      
      // フォームリセット
      setBattleName('');
      setBattleDescription('');
      setStartDate('');
      setEndDate('');
      setShowCreateForm(false);
      
      // リロード
      await loadBattles();
    } catch (error) {
      alert('バトル作成エラー: ' + error.message);
    }
  };

  const handleWeeklyAward = async (battleId) => {
    try {
      const winners = await performWeeklyAward(battleId);
      alert(`週間表彰を実行しました！\n1位: ${winners[0]?.userId || '-'}\n2位: ${winners[1]?.userId || '-'}\n3位: ${winners[2]?.userId || '-'}`);
      await loadBattles();
    } catch (error) {
      alert('週間表彰エラー: ' + error.message);
    }
  };

  const handleFinalizeBattle = async (battleId) => {
    if (!window.confirm('このバトルを終了しますか？')) return;
    
    try {
      await finalizeBattle(battleId);
      alert('バトルを終了しました！');
      await loadBattles();
    } catch (error) {
      alert('バトル終了エラー: ' + error.message);
    }
  };

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="admin-dashboard">
        <div className="no-access">
          <p>管理者権限がありません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <h2>管理者ダッシュボード</h2>
      
      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'battles' ? 'active' : ''}`}
          onClick={() => setActiveTab('battles')}
        >
          ⚔️ バトル管理
        </button>
        <button 
          className={`admin-tab ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          🎥 動画管理
        </button>
      </div>

      {activeTab === 'battles' && (
        <>

      <div className="admin-section">
        <h3>バトル管理</h3>
        
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary"
        >
          新しいバトルを作成
        </button>

        {showCreateForm && (
          <form onSubmit={handleCreateBattle} className="battle-form">
            <div className="form-group">
              <label>バトル名</label>
              <input
                type="text"
                value={battleName}
                onChange={(e) => setBattleName(e.target.value)}
                required
                placeholder="例: 2025年春のダイエットバトル"
              />
            </div>

            <div className="form-group">
              <label>説明</label>
              <textarea
                value={battleDescription}
                onChange={(e) => setBattleDescription(e.target.value)}
                placeholder="バトルの詳細やルールなど"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>開始日</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>終了日</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                min={startDate}
              />
            </div>

            <div className="form-group">
              <label>週間表彰日</label>
              <select
                value={weeklyAwardDay}
                onChange={(e) => setWeeklyAwardDay(e.target.value)}
              >
                <option value="0">日曜日</option>
                <option value="1">月曜日</option>
                <option value="2">火曜日</option>
                <option value="3">水曜日</option>
                <option value="4">木曜日</option>
                <option value="5">金曜日</option>
                <option value="6">土曜日</option>
              </select>
            </div>

            <div className="button-group">
              <button type="submit" className="btn-primary">
                作成
              </button>
              <button 
                type="button" 
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary"
              >
                キャンセル
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="admin-section">
        <h3>進行中のバトル</h3>
        
        {battles.length === 0 ? (
          <p className="no-data">バトルがありません</p>
        ) : (
          <div className="battle-list">
            {battles.map(battle => (
              <div key={battle.id} className="battle-item">
                <div className="battle-info">
                  <h4>{battle.name}</h4>
                  <p>{battle.description}</p>
                  <div className="battle-meta">
                    <span>状態: {battle.status === 'active' ? '進行中' : '終了'}</span>
                    <span>週: {battle.currentWeek}</span>
                    <span>参加者: {battle.participants?.length || 0}人</span>
                  </div>
                </div>
                
                {battle.status === 'active' && (
                  <div className="battle-actions">
                    <button 
                      onClick={() => handleWeeklyAward(battle.id)}
                      className="btn-secondary"
                    >
                      週間表彰実行
                    </button>
                    <button 
                      onClick={() => handleFinalizeBattle(battle.id)}
                      className="btn-danger"
                    >
                      バトル終了
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

          <div className="admin-section">
            <h3>管理者機能</h3>
            <p>今後実装予定:</p>
            <ul>
              <li>ユーザー管理（管理者権限の付与・剥奪）</li>
              <li>グループ管理（削除・編集）</li>
              <li>統計情報の表示</li>
              <li>通知の一括送信</li>
            </ul>
          </div>
        </>
      )}

      {activeTab === 'videos' && (
        <VideoManager />
      )}
    </div>
  );
};

export default AdminDashboard;