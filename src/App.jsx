import React, { useState, useEffect } from 'react';
import BingoCard from './components/BingoCard';
import WeightPage from './components/WeightPage';
import Navigation from './components/Navigation';
import Auth from './components/Auth';
import GroupManager from './components/GroupManager';
import GroupRanking from './components/GroupRanking';
import BattleView from './components/BattleView';
import PointsDisplay from './components/PointsDisplay';
import BingoCelebration from './components/BingoCelebration';
import { exercises } from './data/exercises';
import { useAuth } from './contexts/AuthContext';
import { 
  getUserProgress, 
  saveUserProgress 
} from './firebase/firestore';
import { 
  addPoints, 
  checkAdminRole
} from './firebase/battleSystem';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase/config';
import AdminDashboard from './components/AdminDashboard';
import './App-vibrant.css';

// LocalStorageのキー（ユーザーIDを含める）
const getStorageKey = (userId) => `fitbingo_data_${userId}`;

// ビンゴパターン（3x3）
const BINGO_PATTERNS = [
  [0, 1, 2], // 上横
  [3, 4, 5], // 中横
  [6, 7, 8], // 下横
  [0, 3, 6], // 左縦
  [1, 4, 7], // 中縦
  [2, 5, 8], // 右縦
  [0, 4, 8], // 左上から右下
  [2, 4, 6], // 右上から左下
];

// カードレイアウトをシャッフルして生成
const generateCardLayout = () => {
  const shuffled = [...exercises].sort(() => Math.random() - 0.5);
  return shuffled;
};


// LocalStorageからデータを読み込み（ユーザーID付き）
const loadFromLocalStorage = (userId) => {
  if (!userId) return null;
  try {
    const saved = localStorage.getItem(getStorageKey(userId));
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('LocalStorage読み込みエラー:', error);
  }
  return null;
};


function App() {
  const { currentUser, logout } = useAuth();
  const [level, setLevel] = useState(1);
  const [cardLayout, setCardLayout] = useState([]);
  const [completedCells, setCompletedCells] = useState(Array(9).fill(false));
  const [activeTab, setActiveTab] = useState('bingo');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentBattleId, setCurrentBattleId] = useState(null);
  const [linesClearedInCard, setLinesClearedInCard] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState('line');

  // 初回読み込み時にデータを復元
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        // 管理者権限チェック
        const adminStatus = await checkAdminRole(currentUser.uid);
        setIsAdmin(adminStatus);
        
        // アクティブなバトルを取得
        try {
          const battlesQuery = query(
            collection(db, 'battles'),
            where('status', '==', 'active'),
            where('participants', 'array-contains', currentUser.uid)
          );
          const snapshot = await getDocs(battlesQuery);
          
          if (!snapshot.empty) {
            setCurrentBattleId(snapshot.docs[0].id);
          }
        } catch (error) {
          console.error('バトル取得エラー:', error);
        }
        // Firestoreからデータを取得
        const progressData = await getUserProgress(currentUser.uid);
        
        if (progressData.bingoCard) {
          setCardLayout(progressData.bingoCard);
          setCompletedCells(progressData.completedCells || Array(9).fill(false));
          setLevel(progressData.level || 1);
        } else {
          // LocalStorageからデータを移行（ユーザーID付き）
          const localData = loadFromLocalStorage(currentUser.uid);
          if (localData) {
            setLevel(localData.level || 1);
            setCardLayout(localData.cardLayout || generateCardLayout());
            setCompletedCells(localData.completedCells || Array(9).fill(false));
            
            // Firestoreに保存
            await saveUserProgress(currentUser.uid, {
              level: localData.level || 1,
              bingoCard: localData.cardLayout || generateCardLayout(),
              completedCells: localData.completedCells || Array(9).fill(false)
            });
          } else {
            // 新規データ
            const newLayout = generateCardLayout();
            setCardLayout(newLayout);
            await saveUserProgress(currentUser.uid, {
              level: 1,
              bingoCard: newLayout,
              completedCells: Array(9).fill(false)
            });
          }
        }
      } catch (error) {
        console.error('データ読み込みエラー:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  // データが変更されたらFirestoreに保存
  useEffect(() => {
    if (currentUser && cardLayout.length > 0 && !loading) {
      saveUserProgress(currentUser.uid, {
        level,
        bingoCard: cardLayout,
        completedCells
      }).catch(error => {
        console.error('データ保存エラー:', error);
      });
    }
  }, [level, cardLayout, completedCells, currentUser, loading]);

  // セルをクリックしたときの処理
  const handleCellToggle = async (index) => {
    if (!currentUser) return;
    
    const newCompletedCells = [...completedCells];
    const wasCompleted = completedCells[index];
    
    // 既に完了している場合は何もしない
    if (wasCompleted) return;
    
    newCompletedCells[index] = true;
    setCompletedCells(newCompletedCells);

    // マス完了ポイント（バトル中のみ）
    if (currentBattleId) {
      await addPoints(currentUser.uid, 'exercise', { level }, currentBattleId);
    }
    
    // ライン完成チェック
    const completedLines = checkCompletedLines(newCompletedCells);
    const newLines = completedLines.filter(line => !linesClearedInCard.includes(line));
    
    if (newLines.length > 0) {
      // 新しいライン完成ポイント（バトル中のみ）
      if (currentBattleId) {
        for (let i = 0; i < newLines.length; i++) {
          await addPoints(currentUser.uid, 'line', { level }, currentBattleId);
        }
      }
      setLinesClearedInCard([...linesClearedInCard, ...newLines]);
      
      // BINGO祝福アニメーション表示
      setCelebrationType('line');
      setShowCelebration(true);
      console.log('ライン完成アニメーション表示');
    }
    
    // 全マスクリアチェック
    if (newCompletedCells.every(cell => cell)) {
      // 全マスクリアポイント（バトル中のみ）
      if (currentBattleId) {
        await addPoints(currentUser.uid, 'allClear', { level }, currentBattleId);
      }
      
      // ALL CLEAR祝福アニメーション表示
      setCelebrationType('allClear');
      setShowCelebration(true);
      console.log('全マスクリアアニメーション表示');
      
      // 少し遅延してカード更新（アニメーションを見せるため）
      setTimeout(() => {
        setShowCelebration(false);
        const newLayout = generateCardLayout();
        setCardLayout(newLayout);
        setCompletedCells(Array(9).fill(false));
        setLevel(level + 1);
        setLinesClearedInCard([]);
        console.log('新しいカード生成完了');
      }, 3000);
    }
  };

  // ライン完成チェック用の関数
  const checkCompletedLines = (cells) => {
    const completedLines = [];
    BINGO_PATTERNS.forEach((pattern, index) => {
      if (pattern.every(cellIndex => cells[cellIndex])) {
        completedLines.push(index);
      }
    });
    return completedLines;
  };

  // 未認証の場合
  if (!currentUser) {
    return (
      <div className="app">
        <Auth onAuthSuccess={() => window.location.reload()} />
      </div>
    );
  }

  // ローディング中
  if (loading) {
    return (
      <div className="app">
        <div className="loading">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-top">
          <h1 className="app-title">💪 FitBingo 🔥</h1>
          <button onClick={logout} className="logout-button">
            ログアウト
          </button>
        </div>
        
        {activeTab === 'bingo' && (
          <div className="header-stats">
            <div className="level-display">
              <span className="level-emoji">⭐</span>
              <span className="level-text">LEVEL</span>
              <span className="level-number">{level}</span>
            </div>
            <PointsDisplay userId={currentUser?.uid} battleId={currentBattleId} />
          </div>
        )}
      </header>
      
      <main className="app-main">
        {activeTab === 'bingo' && (
          cardLayout.length > 0 && (
            <BingoCard
              cardLayout={cardLayout}
              completedCells={completedCells}
              level={level}
              onCellToggle={handleCellToggle}
            />
          )
        )}
        {activeTab === 'weight' && <WeightPage />}
        {activeTab === 'group' && (
          <>
            <BattleView />
            <GroupManager onGroupSelect={setSelectedGroup} />
            <GroupRanking group={selectedGroup} />
          </>
        )}
        {activeTab === 'admin' && isAdmin && <AdminDashboard />}
      </main>

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} isAdmin={isAdmin} />
      
      <BingoCelebration 
        isVisible={showCelebration}
        onClose={() => setShowCelebration(false)}
        type={celebrationType}
      />
    </div>
  );
}

export default App
