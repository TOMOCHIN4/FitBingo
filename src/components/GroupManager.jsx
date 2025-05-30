import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createGroup, joinGroupByCode } from '../firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const GroupManager = ({ onGroupSelect }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'join'
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [userGroups, setUserGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ユーザーの所属グループを取得
  useEffect(() => {
    const fetchUserGroups = async () => {
      if (!currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const groupIds = userDoc.data().groups || [];
          const groups = [];
          
          for (const groupId of groupIds) {
            const groupDoc = await getDoc(doc(db, 'groups', groupId));
            if (groupDoc.exists()) {
              groups.push({ id: groupId, ...groupDoc.data() });
            }
          }
          
          setUserGroups(groups);
        }
      } catch (error) {
        console.error('グループ取得エラー:', error);
      }
    };

    fetchUserGroups();
  }, [currentUser, success]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const newGroup = await createGroup(currentUser.uid, {
        name: groupName,
        description: groupDescription
      });
      
      setSuccess(`グループ「${groupName}」を作成しました！招待コード: ${newGroup.inviteCode}`);
      setGroupName('');
      setGroupDescription('');
    } catch (error) {
      setError('グループ作成に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const group = await joinGroupByCode(currentUser.uid, inviteCode);
      setSuccess(`グループ「${group.name}」に参加しました！`);
      setInviteCode('');
    } catch (error) {
      setError('グループ参加に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group-manager">
      <h2>グループ管理</h2>

      {/* 所属グループ一覧 */}
      {userGroups.length > 0 && (
        <div className="user-groups">
          <h3>所属グループ</h3>
          <div className="group-list">
            {userGroups.map(group => (
              <div key={group.id} className="group-item">
                <div className="group-info">
                  <h4>{group.name}</h4>
                  <p>{group.description}</p>
                  <span className="invite-code">招待コード: {group.inviteCode}</span>
                </div>
                <button 
                  onClick={() => onGroupSelect(group)}
                  className="btn-secondary"
                >
                  選択
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* タブ切り替え */}
      <div className="tab-container">
        <button
          className={`tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          グループ作成
        </button>
        <button
          className={`tab ${activeTab === 'join' ? 'active' : ''}`}
          onClick={() => setActiveTab('join')}
        >
          グループ参加
        </button>
      </div>

      {/* グループ作成フォーム */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateGroup} className="group-form">
          <div className="form-group">
            <label htmlFor="group-name">グループ名</label>
            <input
              id="group-name"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
              placeholder="例: 朝活フィットネス部"
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label htmlFor="group-description">説明（任意）</label>
            <textarea
              id="group-description"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="グループの目的や目標など"
              rows={3}
              maxLength={200}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '作成中...' : 'グループを作成'}
          </button>
        </form>
      )}

      {/* グループ参加フォーム */}
      {activeTab === 'join' && (
        <form onSubmit={handleJoinGroup} className="group-form">
          <div className="form-group">
            <label htmlFor="invite-code">招待コード</label>
            <input
              id="invite-code"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              required
              placeholder="6文字の招待コード"
              maxLength={6}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '参加中...' : 'グループに参加'}
          </button>
        </form>
      )}

      {/* メッセージ表示 */}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
    </div>
  );
};

export default GroupManager;