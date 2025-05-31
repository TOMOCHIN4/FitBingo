// 管理者権限設定スクリプト
// 使用方法: ブラウザのコンソールで実行

import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

// 管理者に設定したいユーザーのメールアドレス
const ADMIN_EMAIL = 'your-admin@email.com'; // ここを変更

export const setAdminByEmail = async (email) => {
  try {
    // まずusersコレクションから該当ユーザーを検索
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.error('ユーザーが見つかりません:', email);
      return;
    }
    
    // ユーザーを管理者に設定
    const userDoc = snapshot.docs[0];
    await updateDoc(doc(db, 'users', userDoc.id), {
      isAdmin: true
    });
    
    console.log('管理者権限を付与しました:', email);
    console.log('ユーザーID:', userDoc.id);
  } catch (error) {
    console.error('エラー:', error);
  }
};

// 実行例
// setAdminByEmail('tomochin4@gmail.com');