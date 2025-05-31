import React, { useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { getRandomVideoFromDB } from '../firebase/videoManagement';
import { getActiveTournaments, getRecentWinners } from '../firebase/tournamentSystem';
import WinnersDisplay from './WinnersDisplay';
import './AuthEnhanced.css';

const AuthEnhanced = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [activeTournaments, setActiveTournaments] = useState([]);
  const [motivationalQuote, setMotivationalQuote] = useState('');

  // モチベーショナル名言リスト
  const quotes = [
    "今日の一歩が、明日の大きな変化を生む 💪",
    "最高の投資は、自分の健康への投資 🌟",
    "できないと思うな、やってみろ！ 🔥",
    "筋肉は裏切らない 💯",
    "昨日の自分を超えていけ！ 🚀",
    "継続は力なり、今日も頑張ろう！ ⭐",
    "健康な体に、健康な心が宿る 🌈",
    "限界は自分が決めるもの 💫"
  ];

  useEffect(() => {
    // ランダム動画を設定
    loadRandomVideo();
    
    // ランダム名言を設定
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setMotivationalQuote(randomQuote);
    
    // アクティブな大会を取得
    loadActiveTournaments();
  }, []);

  const loadRandomVideo = async () => {
    try {
      console.log('動画切り替え開始...');
      const video = await getRandomVideoFromDB();
      console.log('取得した動画:', video);
      setCurrentVideo(video);
    } catch (error) {
      console.error('動画読み込みエラー:', error);
      // フォールバック動画を設定（OKUNOSAMPEIさんの動画からランダム選択）
      const fallbackVideos = [
        { videoId: "hGjl9voD0hg", title: "OKUNOSAMPEIトレーニング1" },
        { videoId: "tmY9AO3SFKQ", title: "OKUNOSAMPEIトレーニング2" },
        { videoId: "a0xpRe0hdmc", title: "OKUNOSAMPEIトレーニング3" }
      ];
      
      // 現在の動画と異なる動画を選択
      let randomFallback;
      do {
        randomFallback = fallbackVideos[Math.floor(Math.random() * fallbackVideos.length)];
      } while (currentVideo && randomFallback.videoId === currentVideo.videoId && fallbackVideos.length > 1);
      
      console.log('フォールバック動画を選択:', randomFallback);
      setCurrentVideo({
        title: randomFallback.title,
        videoId: randomFallback.videoId,
        duration: "未設定",
        category: "トレーニング"
      });
    }
  };

  const loadActiveTournaments = async () => {
    try {
      const tournaments = await getActiveTournaments();
      setActiveTournaments(tournaments.slice(0, 3)); // 最新3つまで表示
    } catch (error) {
      console.error('大会情報取得エラー:', error);
    }
  };

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

  const handleVideoChange = () => {
    loadRandomVideo();
  };

  return (
    <div className="auth-enhanced-container">
      {/* YouTube背景動画 */}
      {currentVideo && (
        <div className="video-background">
          <iframe
            src={`https://www.youtube.com/embed/${currentVideo.videoId}?autoplay=1&mute=1&loop=1&playlist=${currentVideo.videoId}&controls=0&showinfo=0&modestbranding=1&fs=0&cc_load_policy=0&iv_load_policy=3&autohide=1`}
            title="Training Video"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
          <div className="video-overlay" />
          <button className="video-shuffle" onClick={handleVideoChange} title="別の動画に切り替え">
            🔀
          </button>
        </div>
      )}

      {/* パーティクルエフェクト */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle" />
        ))}
      </div>

      <div className="auth-content">
        {/* ヘッダー部分 */}
        <div className="auth-header">
          <h1 className="auth-title">
            <span className="title-fit">Fit</span>
            <span className="title-bingo">Bingo</span>
            <span className="title-emoji">💪</span>
          </h1>
          <p className="auth-subtitle">{motivationalQuote}</p>
        </div>

        {/* メインコンテンツ */}
        <div className="auth-main">
          {/* 左側: ログインフォーム */}
          <div className="auth-form-section">
            <div className="auth-card-enhanced">
              <div className="form-header">
                <h2>{isLogin ? 'おかえりなさい！' : 'ようこそ！'}</h2>
                <p>{isLogin ? '今日もトレーニング頑張りましょう' : '一緒にフィットネスを楽しみましょう'}</p>
              </div>
              
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
                    className="input-enhanced"
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
                    className="input-enhanced"
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
                      className="input-enhanced"
                    />
                  </div>
                )}

                {error && <div className="error-message-enhanced">{error}</div>}

                <button type="submit" className="btn-primary-enhanced" disabled={loading}>
                  <span className="btn-text">
                    {loading ? '処理中...' : (isLogin ? 'ログイン' : '新規登録')}
                  </span>
                  <span className="btn-icon">→</span>
                </button>
              </form>

              <div className="auth-switch">
                <button 
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                  className="link-button-enhanced"
                >
                  {isLogin ? '初めての方はこちら →' : 'すでにアカウントをお持ちの方 →'}
                </button>
              </div>
            </div>
          </div>

          {/* 右側: 大会情報 */}
          <div className="tournament-info-section">
            {/* アクティブな大会 */}
            {activeTournaments.length > 0 && (
              <div className="active-tournaments">
                <h3>🏆 開催中の大会</h3>
                <div className="tournament-cards">
                  {activeTournaments.map(tournament => (
                    <div key={tournament.id} className="tournament-card-mini">
                      <div className="tournament-status-badge">
                        {tournament.status === 'recruiting' ? '募集中' : '開催中'}
                      </div>
                      <h4>{tournament.name}</h4>
                      <p>参加者: {tournament.participantCount || 0}人</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 優勝者表彰 */}
            <div className="winners-section">
              <WinnersDisplay />
            </div>
          </div>
        </div>

        {/* フッター統計 */}
        <div className="auth-footer">
          <div className="stats-container">
            <div className="stat-item">
              <span className="stat-icon">💪</span>
              <span className="stat-label">今日のトレーニング動画</span>
              <span className="stat-value">{currentVideo?.title || 'Loading...'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthEnhanced;