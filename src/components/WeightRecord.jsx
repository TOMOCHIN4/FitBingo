import React, { useState, useEffect } from 'react';
import { format, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { updateWeightAndCalculatePoints } from '../firebase/battleSystem';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const WEIGHT_STORAGE_KEY = 'fitbingo_weights';

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

// LocalStorageに体重データを保存
const saveWeights = (weights) => {
  try {
    localStorage.setItem(WEIGHT_STORAGE_KEY, JSON.stringify(weights));
  } catch (error) {
    console.error('体重データの保存エラー:', error);
  }
};

const WeightRecord = () => {
  const { currentUser } = useAuth();
  const [weights, setWeights] = useState([]);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [weight, setWeight] = useState('');
  const [currentBattleId, setCurrentBattleId] = useState(null);

  useEffect(() => {
    setWeights(loadWeights());
    
    // アクティブなバトルを取得
    const findActiveBattle = async () => {
      if (!currentUser) return;
      
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
    };
    
    findActiveBattle();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!weight || parseFloat(weight) <= 0) return;

    const newWeight = {
      date: startOfDay(new Date(date)).toISOString(),
      weight: parseFloat(weight),
      recordedAt: new Date().toISOString()
    };

    // 同じ日付のデータがあれば更新、なければ追加
    const updatedWeights = [...weights];
    const existingIndex = updatedWeights.findIndex(
      w => startOfDay(new Date(w.date)).toISOString() === newWeight.date
    );

    if (existingIndex >= 0) {
      updatedWeights[existingIndex] = newWeight;
    } else {
      updatedWeights.push(newWeight);
    }

    // 日付順にソート
    updatedWeights.sort((a, b) => new Date(b.date) - new Date(a.date));

    setWeights(updatedWeights);
    saveWeights(updatedWeights);
    
    // バトルポイント計算
    let battlePoints = 0;
    if (currentBattleId && currentUser) {
      try {
        battlePoints = await updateWeightAndCalculatePoints(
          currentUser.uid,
          currentBattleId,
          parseFloat(weight)
        );
      } catch (error) {
        console.error('バトルポイント計算エラー:', error);
      }
    }
    
    setWeight('');
    
    if (battlePoints > 0) {
      alert(`体重を記録しました！\n${battlePoints}ポイント獲得！`);
    } else {
      alert('体重を記録しました！');
    }
    
    // カスタムイベントを発火（同一タブ内の更新用）
    window.dispatchEvent(new Event('weightUpdated'));
  };

  // 直近7日分のデータ
  const recentWeights = weights.slice(0, 7);

  return (
    <div className="weight-record">
      <h2>体重記録</h2>
      
      <form onSubmit={handleSubmit} className="weight-form">
        <div className="form-group">
          <label htmlFor="date">日付：</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={format(new Date(), 'yyyy-MM-dd')}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="weight">体重：</label>
          <div className="weight-input-group">
            <input
              id="weight"
              type="number"
              step="0.1"
              min="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="65.5"
              required
            />
            <span className="unit">kg</span>
          </div>
        </div>

        <button type="submit" className="btn-primary">
          記録
        </button>
      </form>

      <div className="recent-records">
        <h3>過去7日間の記録</h3>
        {recentWeights.length > 0 ? (
          <table className="weight-table">
            <thead>
              <tr>
                <th>日付</th>
                <th>体重</th>
              </tr>
            </thead>
            <tbody>
              {recentWeights.map((record, index) => (
                <tr key={index}>
                  <td>
                    {format(new Date(record.date), 'M月d日(E)', { locale: ja })}
                  </td>
                  <td>{record.weight.toFixed(1)} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-records">まだ記録がありません</p>
        )}
      </div>
    </div>
  );
};

export default WeightRecord;