import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const Auth = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // ログイン処理
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onAuthSuccess(userCredential.user);
      } else {
        // サインアップ処理
        if (!nickname.trim() || nickname.length > 20) {
          setError('ニックネームは1〜20文字で入力してください');
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // プロフィール更新
        await updateProfile(user, {
          displayName: nickname
        });

        // Firestoreにユーザー情報を保存
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          nickname: nickname,
          createdAt: serverTimestamp(),
          level: 1,
          points: 0,
          groups: []
        });

        onAuthSuccess(user);
      }
    } catch (error) {
      // エラーメッセージを日本語化
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('このメールアドレスは既に使用されています');
          break;
        case 'auth/invalid-email':
          setError('無効なメールアドレスです');
          break;
        case 'auth/weak-password':
          setError('パスワードは6文字以上で設定してください');
          break;
        case 'auth/user-not-found':
          setError('ユーザーが見つかりません');
          break;
        case 'auth/wrong-password':
          setError('パスワードが間違っています');
          break;
        default:
          setError('エラーが発生しました: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isLogin ? 'ログイン' : '新規登録'}</h2>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">メールアドレス</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="example@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="6文字以上"
              minLength={6}
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="nickname">ニックネーム</label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required={!isLogin}
                placeholder="20文字以内"
                maxLength={20}
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '処理中...' : (isLogin ? 'ログイン' : '登録')}
          </button>
        </form>

        <div className="auth-switch">
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="link-button"
          >
            {isLogin ? '新規登録はこちら' : 'ログインはこちら'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;