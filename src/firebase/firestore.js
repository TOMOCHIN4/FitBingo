import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './config';

// ユーザーの進捗データを保存/更新
export const saveUserProgress = async (userId, progressData) => {
  try {
    const userProgressRef = doc(db, 'userProgress', userId);
    await setDoc(userProgressRef, {
      ...progressData,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('進捗保存エラー:', error);
    throw error;
  }
};

// ユーザーの進捗データを取得
export const getUserProgress = async (userId) => {
  try {
    const userProgressRef = doc(db, 'userProgress', userId);
    const docSnap = await getDoc(userProgressRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // 初期データを作成
      const initialData = {
        level: 1,
        points: 0,
        bingoCard: null,
        completedCells: Array(9).fill(false),
        weights: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(userProgressRef, initialData);
      return initialData;
    }
  } catch (error) {
    console.error('進捗取得エラー:', error);
    throw error;
  }
};

// グループを作成
export const createGroup = async (userId, groupData) => {
  try {
    // 6桁の招待コードを生成
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const groupRef = doc(collection(db, 'groups'));
    const newGroup = {
      ...groupData,
      inviteCode,
      createdBy: userId,
      members: [userId],
      createdAt: serverTimestamp()
    };
    
    await setDoc(groupRef, newGroup);
    
    // ユーザーのグループリストに追加
    await updateDoc(doc(db, 'users', userId), {
      groups: arrayUnion(groupRef.id)
    });
    
    return { id: groupRef.id, ...newGroup };
  } catch (error) {
    console.error('グループ作成エラー:', error);
    throw error;
  }
};

// 招待コードでグループに参加
export const joinGroupByCode = async (userId, inviteCode) => {
  try {
    // 招待コードでグループを検索
    const groupsRef = collection(db, 'groups');
    const q = query(groupsRef, where('inviteCode', '==', inviteCode.toUpperCase()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('招待コードが無効です');
    }
    
    const groupDoc = querySnapshot.docs[0];
    const groupId = groupDoc.id;
    const groupData = groupDoc.data();
    
    // 既にメンバーかチェック
    if (groupData.members.includes(userId)) {
      throw new Error('既にこのグループのメンバーです');
    }
    
    // グループにメンバーを追加
    await updateDoc(doc(db, 'groups', groupId), {
      members: arrayUnion(userId)
    });
    
    // ユーザーのグループリストに追加
    await updateDoc(doc(db, 'users', userId), {
      groups: arrayUnion(groupId)
    });
    
    return { id: groupId, ...groupData };
  } catch (error) {
    console.error('グループ参加エラー:', error);
    throw error;
  }
};

// グループ内ランキングを取得
export const getGroupRanking = async (groupId) => {
  try {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (!groupDoc.exists()) {
      throw new Error('グループが見つかりません');
    }
    
    const members = groupDoc.data().members;
    const rankings = [];
    
    // 各メンバーの情報を取得
    for (const memberId of members) {
      const userDoc = await getDoc(doc(db, 'users', memberId));
      const progressDoc = await getDoc(doc(db, 'userProgress', memberId));
      
      if (userDoc.exists() && progressDoc.exists()) {
        rankings.push({
          userId: memberId,
          nickname: userDoc.data().nickname,
          level: progressDoc.data().level || 1,
          points: progressDoc.data().points || 0
        });
      }
    }
    
    // ポイント順にソート
    rankings.sort((a, b) => b.points - a.points);
    
    return rankings;
  } catch (error) {
    console.error('ランキング取得エラー:', error);
    throw error;
  }
};

// グループランキングのリアルタイム監視
export const subscribeToGroupRanking = (groupId, callback) => {
  const groupRef = doc(db, 'groups', groupId);
  
  return onSnapshot(groupRef, async (doc) => {
    if (doc.exists()) {
      const rankings = await getGroupRanking(groupId);
      callback(rankings);
    }
  });
};

// ポイントを更新（マス完了・ビンゴ達成時）
export const updatePoints = async (userId, pointsToAdd, level) => {
  try {
    const userProgressRef = doc(db, 'userProgress', userId);
    const currentData = await getDoc(userProgressRef);
    
    if (currentData.exists()) {
      const currentPoints = currentData.data().points || 0;
      await updateDoc(userProgressRef, {
        points: currentPoints + pointsToAdd,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('ポイント更新エラー:', error);
    throw error;
  }
};