import React, { useState, useEffect } from 'react';
import BingoCard from './components/BingoCard';
import WeightPage from './components/WeightPage';
import Navigation from './components/Navigation';
import ExerciseModal from './components/ExerciseModal';
import Auth from './components/Auth';
import GroupManager from './components/GroupManager';
import GroupRanking from './components/GroupRanking';
import { exercises, calculateTargetValue } from './data/exercises';
import { useAuth } from './contexts/AuthContext';
import { 
  getUserProgress, 
  saveUserProgress, 
  updatePoints 
} from './firebase/firestore';
import './App.css';

// LocalStorageのキー
const STORAGE_KEY = 'fitbingo_data';

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

// ビンゴ判定
const checkBingo = (completedCells) => {
  return BINGO_PATTERNS.some(pattern => 
    pattern.every(index => completedCells[index])
  );
};

// LocalStorageからデータを読み込み
const loadFromLocalStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('LocalStorage読み込みエラー:', error);
  }
  return null;
};

// LocalStorageにデータを保存
const saveToLocalStorage = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('LocalStorage保存エラー:', error);
  }
};

function App() {
  const { currentUser, logout } = useAuth();
  const [level, setLevel] = useState(1);
  const [cardLayout, setCardLayout] = useState([]);
  const [completedCells, setCompletedCells] = useState(Array(9).fill(false));
  const [activeTab, setActiveTab] = useState('bingo');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  // 初回読み込み時にデータを復元
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        // Firestoreからデータを取得
        const progressData = await getUserProgress(currentUser.uid);
        
        if (progressData.bingoCard) {
          setCardLayout(progressData.bingoCard);
          setCompletedCells(progressData.completedCells || Array(9).fill(false));
          setLevel(progressData.level || 1);
        } else {
          // LocalStorageからデータを移行
          const localData = loadFromLocalStorage();
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
  const handleCellToggle = (index) => {
    const exercise = cardLayout[index];
    setSelectedExercise(exercise);
    setSelectedIndex(index);
    setModalOpen(true);
  };

  // エクササイズ完了時の処理
  const handleExerciseComplete = async (actualValue, isCompleted) => {
    if (selectedIndex !== null && currentUser) {
      const newCompletedCells = [...completedCells];
      const wasCompleted = completedCells[selectedIndex];
      newCompletedCells[selectedIndex] = isCompleted;
      setCompletedCells(newCompletedCells);

      // ポイント更新（初回完了時のみ）
      if (isCompleted && !wasCompleted) {
        await updatePoints(currentUser.uid, 1 * level, level);
      }

      // ビンゴ判定
      if (checkBingo(newCompletedCells)) {
        // ビンゴポイント
        await updatePoints(currentUser.uid, 10 * level, level);
        
        setTimeout(() => {
          alert('ビンゴ！');
          // レベルアップと新しいカード生成
          setLevel(prevLevel => prevLevel + 1);
          setCardLayout(generateCardLayout());
          setCompletedCells(Array(9).fill(false));
        }, 100);
      }
    }
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
        <h1>FitBingo</h1>
        {activeTab === 'bingo' && (
          <div className="level-display">
            レベル {level}
          </div>
        )}
        <button onClick={logout} className="logout-button">
          ログアウト
        </button>
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
            <GroupManager onGroupSelect={setSelectedGroup} />
            <GroupRanking group={selectedGroup} />
          </>
        )}
      </main>

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {selectedExercise && (
        <ExerciseModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          exercise={selectedExercise}
          targetValue={calculateTargetValue(selectedExercise.baseValue, level)}
          onComplete={handleExerciseComplete}
        />
      )}
    </div>
  );
}

export default App
