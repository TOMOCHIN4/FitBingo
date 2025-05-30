import React, { useState, useEffect } from 'react';
import WeightRecord from './WeightRecord';
import WeightChart from './WeightChart';

const WEIGHT_STORAGE_KEY = 'fitbingo_weights';

const WeightPage = () => {
  const [weights, setWeights] = useState([]);

  useEffect(() => {
    // LocalStorageから体重データを読み込み
    const loadWeights = () => {
      try {
        const saved = localStorage.getItem(WEIGHT_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
      } catch (error) {
        console.error('体重データの読み込みエラー:', error);
        return [];
      }
    };

    setWeights(loadWeights());

    // LocalStorageの変更を監視
    const handleStorageChange = () => {
      setWeights(loadWeights());
    };

    window.addEventListener('storage', handleStorageChange);
    
    // カスタムイベントも監視（同一タブ内の更新用）
    window.addEventListener('weightUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('weightUpdated', handleStorageChange);
    };
  }, []);

  return (
    <div className="weight-page">
      <WeightRecord />
      <WeightChart weights={weights} />
    </div>
  );
};

export default WeightPage;