import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  arrayUnion,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';

// ポイント設定（体重:トレーニング = 6:4）
const POINTS = {
  // トレーニング関連（全体の40%）
  EXERCISE_COMPLETE: 2,        // エクササイズ完了（レベル倍率あり）
  LINE_CLEAR: 20,             // ライン完成（レベル倍率あり）
  FULL_CLEAR_BONUS: 50,       // 全マスクリアボーナス（レベル倍率あり）
  
  // 体重関連（全体の60%）
  WEIGHT_LOSS_PER_KG: 100,    // 1kg減少ごと
  WEIGHT_LOSS_WEEK: 50,       // 週間目標達成（-0.5kg/週）
  WEIGHT_MAINTAIN: 10,        // 体重維持ボーナス（±0.5kg以内）
  
  // 特別ボーナス
  STREAK_BONUS: 30,           // 連続記録ボーナス（7日連続）
  PARTICIPATION: 5            // 参加ボーナス（毎日）
};

// バトル作成（管理者のみ）
export const createBattle = async (adminId, battleData) => {
  try {
    const battleRef = doc(collection(db, 'battles'));
    const newBattle = {
      ...battleData,
      createdBy: adminId,
      createdAt: serverTimestamp(),
      status: 'active',
      currentWeek: 1,
      participants: [],
      weeklyWinners: []
    };
    
    await setDoc(battleRef, newBattle);
    return { id: battleRef.id, ...newBattle };
  } catch (error) {
    console.error('バトル作成エラー:', error);
    throw error;
  }
};

// バトル参加
export const joinBattle = async (userId, battleId) => {
  try {
    const battleRef = doc(db, 'battles', battleId);
    const battleDoc = await getDoc(battleRef);
    
    if (!battleDoc.exists()) {
      throw new Error('バトルが見つかりません');
    }
    
    const battleData = battleDoc.data();
    
    // 期間チェック
    const now = new Date();
    const startDate = battleData.startDate.toDate();
    if (now < startDate) {
      throw new Error('バトルはまだ開始していません');
    }
    
    // 参加者追加
    await updateDoc(battleRef, {
      participants: arrayUnion(userId)
    });
    
    // 初期スコア作成
    const scoreRef = doc(db, 'battleScores', `${battleId}_${userId}`);
    await setDoc(scoreRef, {
      battleId,
      userId,
      totalPoints: 0,
      weeklyPoints: {},
      pointHistory: [],
      initialWeight: null,
      currentWeight: null,
      joinedAt: serverTimestamp()
    });
    
  } catch (error) {
    console.error('バトル参加エラー:', error);
    throw error;
  }
};

// ポイント追加
export const addPoints = async (userId, battleId, pointType, value = 1, metadata = {}) => {
  try {
    const scoreRef = doc(db, 'battleScores', `${battleId}_${userId}`);
    const scoreDoc = await getDoc(scoreRef);
    
    if (!scoreDoc.exists()) {
      throw new Error('バトルスコアが見つかりません');
    }
    
    const scoreData = scoreDoc.data();
    const battleDoc = await getDoc(doc(db, 'battles', battleId));
    const currentWeek = battleDoc.data().currentWeek;
    
    // ポイント計算
    let points = 0;
    switch (pointType) {
      case 'EXERCISE_COMPLETE':
        points = POINTS.EXERCISE_COMPLETE * (metadata.level || 1);
        break;
      case 'LINE_CLEAR':
        points = POINTS.LINE_CLEAR * (metadata.level || 1);
        break;
      case 'FULL_CLEAR_BONUS':
        points = POINTS.FULL_CLEAR_BONUS * (metadata.level || 1);
        break;
      case 'WEIGHT_LOSS':
        points = Math.floor(value * POINTS.WEIGHT_LOSS_PER_KG);
        break;
      case 'WEIGHT_LOSS_WEEK':
        points = POINTS.WEIGHT_LOSS_WEEK;
        break;
      case 'WEIGHT_MAINTAIN':
        points = POINTS.WEIGHT_MAINTAIN;
        break;
      case 'STREAK_BONUS':
        points = POINTS.STREAK_BONUS;
        break;
      case 'PARTICIPATION':
        points = POINTS.PARTICIPATION;
        break;
      default:
        points = value;
    }
    
    // スコア更新
    const weeklyPoints = scoreData.weeklyPoints || {};
    weeklyPoints[`week${currentWeek}`] = (weeklyPoints[`week${currentWeek}`] || 0) + points;
    
    await updateDoc(scoreRef, {
      totalPoints: scoreData.totalPoints + points,
      weeklyPoints,
      pointHistory: arrayUnion({
        type: pointType,
        points,
        metadata,
        timestamp: serverTimestamp()
      })
    });
    
    return points;
  } catch (error) {
    console.error('ポイント追加エラー:', error);
    throw error;
  }
};

// 体重更新とポイント計算
export const updateWeightAndCalculatePoints = async (userId, battleId, newWeight) => {
  try {
    const scoreRef = doc(db, 'battleScores', `${battleId}_${userId}`);
    const scoreDoc = await getDoc(scoreRef);
    
    if (!scoreDoc.exists()) {
      throw new Error('バトルスコアが見つかりません');
    }
    
    const scoreData = scoreDoc.data();
    const initialWeight = scoreData.initialWeight || newWeight;
    const previousWeight = scoreData.currentWeight || initialWeight;
    
    // 初回記録
    if (!scoreData.initialWeight) {
      await updateDoc(scoreRef, {
        initialWeight: newWeight,
        currentWeight: newWeight
      });
      return 0;
    }
    
    // 体重変化計算
    const weightLoss = previousWeight - newWeight;
    
    let pointsEarned = 0;
    
    // 体重減少ポイント
    if (weightLoss > 0) {
      pointsEarned += await addPoints(userId, battleId, 'WEIGHT_LOSS', weightLoss);
    }
    
    // 体重維持ボーナス
    if (Math.abs(weightLoss) <= 0.5) {
      pointsEarned += await addPoints(userId, battleId, 'WEIGHT_MAINTAIN');
    }
    
    // 現在の体重を更新
    await updateDoc(scoreRef, {
      currentWeight: newWeight,
      lastWeightUpdate: serverTimestamp()
    });
    
    return pointsEarned;
  } catch (error) {
    console.error('体重更新エラー:', error);
    throw error;
  }
};

// 週次集計と表彰
export const performWeeklyAward = async (battleId) => {
  try {
    const battleRef = doc(db, 'battles', battleId);
    const battleDoc = await getDoc(battleRef);
    
    if (!battleDoc.exists()) {
      throw new Error('バトルが見つかりません');
    }
    
    const battleData = battleDoc.data();
    const currentWeek = battleData.currentWeek;
    
    // 参加者のスコアを取得
    const scoresQuery = query(
      collection(db, 'battleScores'),
      where('battleId', '==', battleId)
    );
    const scoresSnapshot = await getDocs(scoresQuery);
    
    // 週間ランキング作成
    const weeklyRanking = [];
    scoresSnapshot.forEach(doc => {
      const data = doc.data();
      const weeklyPoints = data.weeklyPoints[`week${currentWeek}`] || 0;
      weeklyRanking.push({
        userId: data.userId,
        points: weeklyPoints
      });
    });
    
    // ポイント順にソート
    weeklyRanking.sort((a, b) => b.points - a.points);
    
    // 上位3名を表彰
    const winners = weeklyRanking.slice(0, 3);
    
    // バトル情報を更新
    await updateDoc(battleRef, {
      weeklyWinners: arrayUnion({
        week: currentWeek,
        winners,
        awardedAt: serverTimestamp()
      }),
      currentWeek: currentWeek + 1
    });
    
    return winners;
  } catch (error) {
    console.error('週次表彰エラー:', error);
    throw error;
  }
};

// バトル終了と最終結果
export const finalizeBattle = async (battleId) => {
  try {
    const battleRef = doc(db, 'battles', battleId);
    
    // 全参加者のスコアを取得
    const scoresQuery = query(
      collection(db, 'battleScores'),
      where('battleId', '==', battleId)
    );
    const scoresSnapshot = await getDocs(scoresQuery);
    
    // 最終ランキング作成
    const finalRanking = [];
    scoresSnapshot.forEach(doc => {
      const data = doc.data();
      finalRanking.push({
        userId: data.userId,
        totalPoints: data.totalPoints,
        weightLoss: (data.initialWeight || 0) - (data.currentWeight || 0)
      });
    });
    
    // ポイント順にソート
    finalRanking.sort((a, b) => b.totalPoints - a.totalPoints);
    
    // バトル終了
    await updateDoc(battleRef, {
      status: 'completed',
      finalRanking,
      completedAt: serverTimestamp()
    });
    
    return finalRanking;
  } catch (error) {
    console.error('バトル終了エラー:', error);
    throw error;
  }
};

// 管理者権限チェック
export const checkAdminRole = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().isAdmin === true;
    }
    return false;
  } catch (error) {
    console.error('管理者権限チェックエラー:', error);
    return false;
  }
};