import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  addTrainingVideo, 
  getAllVideos, 
  updateTrainingVideo, 
  deleteTrainingVideo,
  getVideoCategories 
} from '../firebase/videoManagement';
import './VideoManager.css';

const VideoManager = () => {
  const { currentUser } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    videoId: '',
    duration: '',
    category: 'トレーニング',
    description: ''
  });

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const videoList = await getAllVideos();
      setVideos(videoList);
    } catch (error) {
      console.error('動画読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingVideo) {
        // 更新処理
        await updateTrainingVideo(editingVideo.id, formData);
        alert('動画情報を更新しました');
      } else {
        // 新規追加
        await addTrainingVideo(formData, currentUser.uid);
        alert('動画を追加しました');
      }
      
      resetForm();
      loadVideos();
    } catch (error) {
      console.error('動画保存エラー:', error);
      alert('エラーが発生しました');
    }
  };

  const handleDelete = async (videoId) => {
    if (!window.confirm('この動画を削除しますか？')) return;
    
    try {
      await deleteTrainingVideo(videoId);
      alert('動画を削除しました');
      loadVideos();
    } catch (error) {
      console.error('動画削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  const handleEdit = (video) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      videoId: video.videoId,
      duration: video.duration,
      category: video.category,
      description: video.description || ''
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      videoId: '',
      duration: '',
      category: 'トレーニング',
      description: ''
    });
    setEditingVideo(null);
    setShowAddForm(false);
  };

  const extractVideoId = (url) => {
    // YouTube URLから動画IDを抽出
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/;
    const match = url.match(regex);
    return match ? match[1] : url;
  };

  if (loading) {
    return <div className="video-manager-loading">動画一覧を読み込み中...</div>;
  }

  return (
    <div className="video-manager">
      <div className="video-manager-header">
        <h2>🎥 トレーニング動画管理</h2>
        <button 
          className="add-video-button"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '✕ 閉じる' : '➕ 動画を追加'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="video-form">
          <h3>{editingVideo ? '動画を編集' : '新しい動画を追加'}</h3>
          
          <div className="form-group">
            <label>動画タイトル *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
              placeholder="例: 10分間腹筋トレーニング"
            />
          </div>

          <div className="form-group">
            <label>YouTube URL または 動画ID *</label>
            <input
              type="text"
              value={formData.videoId}
              onChange={(e) => setFormData({...formData, videoId: extractVideoId(e.target.value)})}
              required
              placeholder="例: https://youtu.be/xxxxx または xxxxx"
            />
            <small>YouTubeのURLを貼り付けると自動で動画IDを抽出します</small>
          </div>

          <div className="form-group">
            <label>動画の長さ</label>
            <input
              type="text"
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: e.target.value})}
              placeholder="例: 10:30"
            />
          </div>

          <div className="form-group">
            <label>カテゴリー</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option value="トレーニング">トレーニング</option>
              <option value="ストレッチ">ストレッチ</option>
              <option value="HIIT">HIIT</option>
              <option value="ヨガ">ヨガ</option>
              <option value="その他">その他</option>
            </select>
          </div>

          <div className="form-group">
            <label>説明（任意）</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              placeholder="動画の説明を入力..."
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={resetForm}>
              キャンセル
            </button>
            <button type="submit">
              {editingVideo ? '更新' : '追加'}
            </button>
          </div>
        </form>
      )}

      <div className="video-list">
        <h3>登録済み動画一覧 ({videos.length}件)</h3>
        {videos.length === 0 ? (
          <p className="no-videos">まだ動画が登録されていません</p>
        ) : (
          <div className="video-grid">
            {videos.map((video) => (
              <div key={video.id} className="video-card">
                <div className="video-thumbnail">
                  <img 
                    src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                    alt={video.title}
                  />
                </div>
                <div className="video-info">
                  <h4>{video.title}</h4>
                  <p className="video-meta">
                    <span>📁 {video.category}</span>
                    {video.duration && <span>⏱️ {video.duration}</span>}
                  </p>
                  {video.description && (
                    <p className="video-description">{video.description}</p>
                  )}
                  <div className="video-actions">
                    <button onClick={() => handleEdit(video)}>
                      ✏️ 編集
                    </button>
                    <button onClick={() => handleDelete(video.id)} className="delete-button">
                      🗑️ 削除
                    </button>
                    <a 
                      href={`https://www.youtube.com/watch?v=${video.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="view-button"
                    >
                      ▶️ 見る
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoManager;