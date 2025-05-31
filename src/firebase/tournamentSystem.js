import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  increment 
} from 'firebase/firestore';
import { db } from './config';

// 大会のステータス
export const TOURNAMENT_STATUS = {
  RECRUITING: 'recruiting', // 募集中
  ACTIVE: 'active',        // 開催中
  FINISHED: 'finished'     // 終了
};

// 大会を作成
export const createTournament = async (hostUserId, tournamentData) => {
  try {
    const tournament = {
      name: tournamentData.name,
      hostUserId,
      hostUserName: tournamentData.hostUserName || '主催者',
      startDate: tournamentData.startDate,
      endDate: tournamentData.endDate,
      status: TOURNAMENT_STATUS.RECRUITING,
      participants: [hostUserId],
      participantCount: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const tournamentRef = await addDoc(collection(db, 'tournaments'), tournament);
    
    // 主催者のスコアを初期化
    await initializeTournamentScore(tournamentRef.id, hostUserId);
    
    console.log('大会作成完了:', tournamentRef.id);
    return tournamentRef.id;
  } catch (error) {
    console.error('大会作成エラー:', error);
    throw error;
  }
};

// 大会に参加
export const joinTournament = async (tournamentId, userId, userName) => {
  try {
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const tournamentDoc = await getDoc(tournamentRef);
    
    if (!tournamentDoc.exists()) {
      throw new Error('大会が見つかりません');
    }
    
    const tournamentData = tournamentDoc.data();
    
    // 既に参加しているかチェック
    if (tournamentData.participants.includes(userId)) {
      throw new Error('既に参加しています');
    }
    
    // 募集中の大会のみ参加可能
    if (tournamentData.status !== TOURNAMENT_STATUS.RECRUITING) {
      throw new Error('この大会は参加募集を終了しています');
    }
    
    // 参加者リストに追加
    await updateDoc(tournamentRef, {
      participants: [...tournamentData.participants, userId],
      participantCount: increment(1),
      updatedAt: serverTimestamp()
    });
    
    // 参加者のスコアを初期化
    await initializeTournamentScore(tournamentId, userId);
    
    console.log('大会参加完了:', tournamentId);
    return true;
  } catch (error) {
    console.error('大会参加エラー:', error);
    throw error;
  }
};

// 大会のスコアを初期化
const initializeTournamentScore = async (tournamentId, userId) => {
  try {
    const scoreRef = doc(db, 'tournamentScores', `${tournamentId}_${userId}`);
    await updateDoc(scoreRef, {
      tournamentId,
      userId,
      totalScore: 0,
      exerciseCount: 0,
      lineCount: 0,
      allClearCount: 0,
      highestLevel: 1,
      updatedAt: serverTimestamp()
    }).catch(async () => {
      // ドキュメントが存在しない場合は作成
      await addDoc(collection(db, 'tournamentScores'), {
        tournamentId,
        userId,
        totalScore: 0,
        exerciseCount: 0,
        lineCount: 0,
        allClearCount: 0,
        highestLevel: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
  } catch (error) {
    console.error('大会スコア初期化エラー:', error);
  }
};

// 大会ポイントを追加
export const addTournamentPoints = async (tournamentId, userId, type, metadata = {}) => {
  try {
    const level = metadata.level || 1;
    
    // ポイント計算（一人モードと同じ）
    const TOURNAMENT_POINTS = {
      exercise: (level) => 10 * level,
      line: (level) => 50 * level,
      allClear: (level) => 200 * level,
    };
    
    const pointsEarned = TOURNAMENT_POINTS[type](level);
    
    const scoreRef = doc(db, 'tournamentScores', `${tournamentId}_${userId}`);
    const updates = {
      totalScore: increment(pointsEarned),
      updatedAt: serverTimestamp()
    };
    
    // 種類別のカウント更新
    switch (type) {
      case 'exercise':
        updates.exerciseCount = increment(1);
        break;
      case 'line':
        updates.lineCount = increment(1);
        break;
      case 'allClear':
        updates.allClearCount = increment(1);
        updates.highestLevel = level; // レベルは上書き
        break;
    }
    
    await updateDoc(scoreRef, updates);
    
    console.log(`大会ポイント追加: ${type} +${pointsEarned}pts (レベル${level})`);
    
    return {
      pointsEarned,
      type,
      level
    };
  } catch (error) {
    console.error('大会ポイント追加エラー:', error);
    throw error;
  }
};

// 募集中・開催中の大会を取得
export const getActiveTournaments = async () => {
  try {
    // シンプルなクエリで取得してからフィルタリング
    const snapshot = await getDocs(collection(db, 'tournaments'));
    const allTournaments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // ステータスでフィルタリング
    const activeTournaments = allTournaments.filter(
      tournament => tournament.status === TOURNAMENT_STATUS.RECRUITING || 
                   tournament.status === TOURNAMENT_STATUS.ACTIVE
    );
    
    // 作成日順でソート
    return activeTournaments.sort((a, b) => {
      const aDate = a.createdAt?.toDate?.() || new Date(0);
      const bDate = b.createdAt?.toDate?.() || new Date(0);
      return bDate - aDate;
    });
  } catch (error) {
    console.error('アクティブな大会取得エラー:', error);
    return [];
  }
};

// 終了した大会の優勝者を取得（3日間表示用）
export const getRecentWinners = async () => {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    // シンプルなクエリで取得してからフィルタリング
    const snapshot = await getDocs(collection(db, 'tournaments'));
    const allTournaments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // 終了した大会を3日以内でフィルタリング
    const recentFinishedTournaments = allTournaments.filter(tournament => {
      if (tournament.status !== TOURNAMENT_STATUS.FINISHED) return false;
      
      const endDate = tournament.endDate?.toDate?.() || tournament.endDate;
      if (!endDate) return false;
      
      return new Date(endDate) >= threeDaysAgo;
    });
    
    // 終了日順でソート（最新5件）
    const sortedTournaments = recentFinishedTournaments
      .sort((a, b) => {
        const aDate = a.endDate?.toDate?.() || new Date(a.endDate);
        const bDate = b.endDate?.toDate?.() || new Date(b.endDate);
        return bDate - aDate;
      })
      .slice(0, 5);
    
    // 各大会の優勝者を取得
    const winners = [];
    for (const tournament of sortedTournaments) {
      const winner = await getTournamentWinner(tournament.id);
      if (winner) {
        winners.push({
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          endDate: tournament.endDate,
          winner
        });
      }
    }
    
    return winners;
  } catch (error) {
    console.error('最近の優勝者取得エラー:', error);
    return [];
  }
};

// 大会の優勝者を取得
export const getTournamentWinner = async (tournamentId) => {
  try {
    const q = query(
      collection(db, 'tournamentScores'),
      where('tournamentId', '==', tournamentId),
      orderBy('totalScore', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].data();
    }
    return null;
  } catch (error) {
    console.error('大会優勝者取得エラー:', error);
    return null;
  }
};

// 大会のランキングを取得
export const getTournamentRanking = async (tournamentId) => {
  try {
    const q = query(
      collection(db, 'tournamentScores'),
      where('tournamentId', '==', tournamentId),
      orderBy('totalScore', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc, index) => ({
      rank: index + 1,
      ...doc.data()
    }));
  } catch (error) {
    console.error('大会ランキング取得エラー:', error);
    return [];
  }
};

// 大会のステータスを更新（開始・終了の自動処理用）
export const updateTournamentStatus = async () => {
  try {
    const now = new Date();
    
    // 全ての大会を取得
    const snapshot = await getDocs(collection(db, 'tournaments'));
    
    for (const doc of snapshot.docs) {
      const tournament = doc.data();
      const startDate = tournament.startDate?.toDate?.() || tournament.startDate;
      const endDate = tournament.endDate?.toDate?.() || tournament.endDate;
      
      let shouldUpdate = false;
      let newStatus = tournament.status;
      
      // 募集中 → 開催中
      if (tournament.status === TOURNAMENT_STATUS.RECRUITING && 
          startDate && new Date(startDate) <= now) {
        newStatus = TOURNAMENT_STATUS.ACTIVE;
        shouldUpdate = true;
      }
      // 開催中 → 終了
      else if (tournament.status === TOURNAMENT_STATUS.ACTIVE && 
               endDate && new Date(endDate) <= now) {
        newStatus = TOURNAMENT_STATUS.FINISHED;
        shouldUpdate = true;
      }
      
      if (shouldUpdate) {
        await updateDoc(doc.ref, {
          status: newStatus,
          updatedAt: serverTimestamp()
        });
        console.log(`大会 ${doc.id} のステータスを ${newStatus} に更新`);
      }
    }
    
    console.log('大会ステータス更新完了');
  } catch (error) {
    console.error('大会ステータス更新エラー:', error);
  }
};