import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

// 一人モード用のスコア計算
const SOLO_POINTS = {
  exercise: (level) => 10 * level,      // マス完了: レベル × 10ポイント
  line: (level) => 50 * level,          // ライン完成: レベル × 50ポイント
  allClear: (level) => 200 * level,     // 全マスクリア: レベル × 200ポイント
};

// 一人モードのスコアを取得
export const getSoloScore = async (userId) => {
  try {
    const soloRef = doc(db, 'soloScores', userId);
    const soloDoc = await getDoc(soloRef);
    
    if (soloDoc.exists()) {
      return soloDoc.data();
    } else {
      // 初回作成
      const initialData = {
        totalScore: 0,
        exerciseCount: 0,
        lineCount: 0,
        allClearCount: 0,
        highestLevel: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(soloRef, initialData);
      return initialData;
    }
  } catch (error) {
    console.error('一人モードスコア取得エラー:', error);
    return {
      totalScore: 0,
      exerciseCount: 0,
      lineCount: 0,
      allClearCount: 0,
      highestLevel: 1
    };
  }
};

// 一人モードのポイントを追加
export const addSoloPoints = async (userId, type, metadata = {}) => {
  try {
    const soloRef = doc(db, 'soloScores', userId);
    const currentData = await getSoloScore(userId);
    
    const level = metadata.level || 1;
    const pointsEarned = SOLO_POINTS[type](level);
    
    const updates = {
      totalScore: currentData.totalScore + pointsEarned,
      updatedAt: serverTimestamp()
    };
    
    // 種類別のカウント更新
    switch (type) {
      case 'exercise':
        updates.exerciseCount = (currentData.exerciseCount || 0) + 1;
        break;
      case 'line':
        updates.lineCount = (currentData.lineCount || 0) + 1;
        break;
      case 'allClear':
        updates.allClearCount = (currentData.allClearCount || 0) + 1;
        updates.highestLevel = Math.max(currentData.highestLevel || 1, level);
        break;
    }
    
    await updateDoc(soloRef, updates);
    
    console.log(`一人モード: ${type} +${pointsEarned}ポイント (レベル${level})`);
    
    return {
      pointsEarned,
      newTotal: updates.totalScore
    };
  } catch (error) {
    console.error('一人モードポイント追加エラー:', error);
    throw error;
  }
};

// 一人モードの統計情報を取得
export const getSoloStats = async (userId) => {
  try {
    const scoreData = await getSoloScore(userId);
    
    return {
      totalScore: scoreData.totalScore || 0,
      exerciseCount: scoreData.exerciseCount || 0,
      lineCount: scoreData.lineCount || 0,
      allClearCount: scoreData.allClearCount || 0,
      highestLevel: scoreData.highestLevel || 1,
      averagePointsPerLevel: scoreData.allClearCount > 0 
        ? Math.round(scoreData.totalScore / scoreData.allClearCount) 
        : 0
    };
  } catch (error) {
    console.error('一人モード統計取得エラー:', error);
    return {
      totalScore: 0,
      exerciseCount: 0,
      lineCount: 0,
      allClearCount: 0,
      highestLevel: 1,
      averagePointsPerLevel: 0
    };
  }
};