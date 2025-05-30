import React, { useState, useEffect } from 'react';
import BingoCard from './components/BingoCard';
import { exercises } from './data/exercises';
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
  const [level, setLevel] = useState(1);
  const [cardLayout, setCardLayout] = useState([]);
  const [completedCells, setCompletedCells] = useState(Array(9).fill(false));

  // 初回読み込み時にLocalStorageから復元
  useEffect(() => {
    const savedData = loadFromLocalStorage();
    if (savedData) {
      setLevel(savedData.level || 1);
      setCardLayout(savedData.cardLayout || generateCardLayout());
      setCompletedCells(savedData.completedCells || Array(9).fill(false));
    } else {
      // 初回起動時は新しいカードを生成
      setCardLayout(generateCardLayout());
    }
  }, []);

  // データが変更されたらLocalStorageに保存
  useEffect(() => {
    if (cardLayout.length > 0) {
      saveToLocalStorage({
        level,
        cardLayout,
        completedCells
      });
    }
  }, [level, cardLayout, completedCells]);

  // セルをクリックしたときの処理
  const handleCellToggle = (index) => {
    const newCompletedCells = [...completedCells];
    newCompletedCells[index] = !newCompletedCells[index];
    setCompletedCells(newCompletedCells);

    // ビンゴ判定
    if (checkBingo(newCompletedCells)) {
      setTimeout(() => {
        alert('ビンゴ！');
        // レベルアップと新しいカード生成
        setLevel(prevLevel => prevLevel + 1);
        setCardLayout(generateCardLayout());
        setCompletedCells(Array(9).fill(false));
      }, 100);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>FitBingo</h1>
        <div className="level-display">
          レベル {level}
        </div>
      </header>
      
      <main className="app-main">
        {cardLayout.length > 0 && (
          <BingoCard
            cardLayout={cardLayout}
            completedCells={completedCells}
            level={level}
            onCellToggle={handleCellToggle}
          />
        )}
      </main>
    </div>
  );
}

export default App
