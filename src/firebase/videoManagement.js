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
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './config';

// 動画を追加（管理者のみ）
export const addTrainingVideo = async (videoData, userId) => {
  try {
    const video = {
      title: videoData.title,
      videoId: videoData.videoId,
      duration: videoData.duration,
      category: videoData.category,
      description: videoData.description || '',
      addedBy: userId,
      createdAt: serverTimestamp(),
      active: true
    };

    const videoRef = await addDoc(collection(db, 'trainingVideos'), video);
    console.log('動画追加完了:', videoRef.id);
    return videoRef.id;
  } catch (error) {
    console.error('動画追加エラー:', error);
    throw error;
  }
};

// すべての動画を取得
export const getAllVideos = async () => {
  try {
    // シンプルなクエリで取得してからフィルタリング
    const snapshot = await getDocs(collection(db, 'trainingVideos'));
    const allVideos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // アクティブな動画のみフィルタリング
    const activeVideos = allVideos.filter(video => video.active !== false);
    
    // 作成日順でソート
    return activeVideos.sort((a, b) => {
      const aDate = a.createdAt?.toDate?.() || new Date(0);
      const bDate = b.createdAt?.toDate?.() || new Date(0);
      return bDate - aDate;
    });
  } catch (error) {
    console.error('動画取得エラー:', error);
    return [];
  }
};

// カテゴリー別に動画を取得
export const getVideosByCategory = async (category) => {
  try {
    // シンプルなクエリで取得してからフィルタリング
    const snapshot = await getDocs(collection(db, 'trainingVideos'));
    const allVideos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // アクティブかつカテゴリーが一致する動画のみフィルタリング
    const categoryVideos = allVideos.filter(video => 
      video.active !== false && video.category === category
    );
    
    // 作成日順でソート
    return categoryVideos.sort((a, b) => {
      const aDate = a.createdAt?.toDate?.() || new Date(0);
      const bDate = b.createdAt?.toDate?.() || new Date(0);
      return bDate - aDate;
    });
  } catch (error) {
    console.error('カテゴリー別動画取得エラー:', error);
    return [];
  }
};

// ランダムな動画を取得
export const getRandomVideoFromDB = async (category = null, excludeVideoId = null) => {
  try {
    let videos;
    if (category) {
      videos = await getVideosByCategory(category);
    } else {
      videos = await getAllVideos();
    }
    
    // 現在の動画を除外
    if (excludeVideoId && videos.length > 1) {
      videos = videos.filter(v => v.videoId !== excludeVideoId);
    }
    
    if (videos.length === 0) {
      // デフォルトの動画を返す（OKUNOSAMPEIさんの動画から選択）
      const defaultVideos = [
        { videoId: 'hGjl9voD0hg', title: 'OKUNOSAMPEIトレーニング1' },
        { videoId: 'tmY9AO3SFKQ', title: 'OKUNOSAMPEIトレーニング2' },
        { videoId: 'a0xpRe0hdmc', title: 'OKUNOSAMPEIトレーニング3' }
      ];
      
      // 現在の動画を除外
      let availableVideos = defaultVideos;
      if (excludeVideoId && defaultVideos.length > 1) {
        availableVideos = defaultVideos.filter(v => v.videoId !== excludeVideoId);
      }
      
      const randomDefault = availableVideos[Math.floor(Math.random() * availableVideos.length)];
      return {
        id: 'default_' + randomDefault.videoId,
        title: randomDefault.title,
        videoId: randomDefault.videoId,
        duration: '未設定',
        category: 'トレーニング'
      };
    }
    
    const randomIndex = Math.floor(Math.random() * videos.length);
    return videos[randomIndex];
  } catch (error) {
    console.error('ランダム動画取得エラー:', error);
    throw error; // nullではなくエラーをスロー
  }
};

// 動画を更新（管理者のみ）
export const updateTrainingVideo = async (videoId, updates) => {
  try {
    const videoRef = doc(db, 'trainingVideos', videoId);
    await updateDoc(videoRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    console.log('動画更新完了:', videoId);
    return true;
  } catch (error) {
    console.error('動画更新エラー:', error);
    throw error;
  }
};

// 動画を削除（実際には非アクティブ化）
export const deleteTrainingVideo = async (videoId) => {
  try {
    const videoRef = doc(db, 'trainingVideos', videoId);
    await updateDoc(videoRef, {
      active: false,
      deletedAt: serverTimestamp()
    });
    console.log('動画削除（非アクティブ化）完了:', videoId);
    return true;
  } catch (error) {
    console.error('動画削除エラー:', error);
    throw error;
  }
};

// カテゴリー一覧を取得
export const getVideoCategories = async () => {
  try {
    const videos = await getAllVideos();
    const categories = [...new Set(videos.map(video => video.category))];
    return categories.sort();
  } catch (error) {
    console.error('カテゴリー取得エラー:', error);
    return [];
  }
};