# FitBingo 開発ログ

## プロジェクト概要
- **プロジェクト名**: FitBingo
- **説明**: 筋トレをゲーム化するビンゴアプリケーション
- **開発期間**: 2025年5月30日〜
- **本番URL**: https://fit-bingo-weld.vercel.app/
- **GitHubリポジトリ**: https://github.com/TOMOCHIN4/FitBingo (Private)

## 技術スタック
- **フロントエンド**: React + Vite
- **スタイリング**: Pure CSS (ライブラリ不使用)
- **データ可視化**: Chart.js
- **日付処理**: date-fns
- **バックエンド**: Firebase (Authentication, Firestore)
- **ホスティング**: Vercel
- **バージョン管理**: Git/GitHub

## 開発フェーズ

### フェーズ1: MVP版 (2025/05/30 完了)
#### 実装内容
- 3×3のビンゴカード表示
- 9種類のエクササイズ（ランダム配置）
- レベルシステム（目標値 = 基本値 × (1 + (レベル-1) × 0.5)）
- マスクリックで完了/未完了切り替え
- ビンゴ判定（縦・横・斜め）
- ビンゴ達成時のレベルアップと新カード生成
- LocalStorageによるデータ永続化
- モバイルファーストのレスポンシブデザイン

#### 検収基準達成
- ✅ 9マスのビンゴカードが表示される
- ✅ マスクリックで完了/未完了が切り替わる
- ✅ ビンゴ達成でレベルアップする
- ✅ リロードしてもデータが保持される
- ✅ スマートフォンで問題なく操作できる

### フェーズ2: 記録機能追加 (2025/05/30 完了)
#### 実装内容
- エクササイズ実行モーダル（実行値入力）
- 目標値以上で自動的に達成扱い
- 体重記録機能（日付選択、小数点第一位まで）
- 過去7日分の記録表示
- Chart.jsによる30日間の体重推移グラフ
- ナビゲーションタブ（ビンゴ/体重）
- 体重データのLocalStorage保存

#### 追加パッケージ
- chart.js: ^4.4.9
- react-chartjs-2: ^5.3.0
- date-fns: ^4.1.0

### フェーズ3: グループ機能 (2025/05/30 完了)
#### 実装内容
- Firebase Authentication（メール/パスワード認証）
- Firestore Databaseによるデータ同期
- ユーザー登録/ログイン機能
- ニックネーム設定（20文字以内）
- グループ作成/参加（6桁の招待コード）
- グループ内ランキング（リアルタイム更新）
- ポイントシステム
  - マス完了: 1ポイント × レベル
  - ビンゴ達成: 10ポイント × レベル
- LocalStorageからFirestoreへの自動データ移行

#### Firebase設定
- プロジェクトID: fitbingo-70a5e
- リージョン: asia-northeast1（東京）
- 認証: メール/パスワード
- データベース: Firestore（テストモード）

#### Firestoreデータ構造
```
users/
  userId/
    - email
    - nickname
    - createdAt
    - groups[]

groups/
  groupId/
    - name
    - description
    - inviteCode
    - createdBy
    - members[]

userProgress/
  userId/
    - level
    - points
    - bingoCard
    - completedCells
    - weights[]
    - updatedAt
```

## 管理者機能とバトルシステム (2025/05/30 実装)
### 実装内容
- 管理者権限システム
  - isAdminフラグによる権限管理
  - 管理者用ダッシュボード
  - バトル作成・管理機能
  
- 新ポイントシステム（体重:トレーニング = 6:4）
  - エクササイズ完了: 2ポイント×レベル
  - ライン完成: 20ポイント×レベル（同一カードで複数回獲得可能）
  - 全マスクリア: 50ポイント×レベル
  - 体重減少: 100ポイント/kg
  - 週間目標達成: 50ポイント（-0.5kg/週）
  - 体重維持: 10ポイント（±0.5kg以内）
  
- バトルシステム
  - 期間設定（開始日・終了日）
  - 週間表彰（管理者が実行）
  - リアルタイムランキング
  - 参加者の体重変化追跡
  
- その他の改善
  - 全マスクリア時の自動カード切り替え
  - 同一カードでの複数ライン達成対応

## 今後の開発予定（フェーズ4）
- UI/UXの向上
  - ローディング表示
  - エラーハンドリング
  - トースト通知
  - ビンゴ達成時のアニメーション
- PWA対応
  - manifest.json作成
  - Service Worker実装
  - オフライン時の基本動作
- プロフィール機能
  - アバター画像アップロード
  - 身長/初期体重の設定
  - 体重減少率の自動計算
- 通知機能
  - 毎日の運動リマインダー
  - グループメンバーのビンゴ達成通知

## 重要な注意事項
1. **Firebase設定の保護**
   - 本番環境では環境変数を使用
   - `.env`ファイルはGitにコミットしない
   
2. **セキュリティ**
   - Firestoreルールは現在テストモード
   - 本番環境では適切なセキュリティルールを設定
   - Personal Access Tokenは定期的に更新

3. **パフォーマンス**
   - ビルドサイズが大きい（800KB+）
   - 今後コード分割を検討

## 開発メモ
- WSL環境での開発時は`npm run dev -- --host`でサーバー起動
- Vercelへの自動デプロイ設定済み
- GitHubはプライベートリポジトリ

## 更新履歴
- 2025/05/30: フェーズ1〜3完了、本番環境デプロイ
- 2025/05/30: 管理者機能とバトルシステム実装
- 2025/05/31: セキュリティ改善とコード品質向上
- 2025/05/31: 一人モード/大会モードとオープン大会システム実装
- 2025/05/31: 豪華なログイン画面とYouTube動画背景実装
- 2025/06/01: 本番環境デバッグ（Firebaseインデックスエラー修正、UI問題解決）

## セキュリティ改善 (2025/05/31 実装)
### 実装内容
- Firebase設定の環境変数化
  - `.env.local`ファイルでFirebase設定を管理
  - `import.meta.env`を使用した環境変数の読み込み
  - ハードコードされた機密情報の除去
  
- コード品質の向上
  - ESLintエラー16個を全て修正
  - 未使用変数・関数の削除
  - 未使用インポートの整理
  - React Hooks依存関係の警告を解決

### 環境変数設定
```bash
# .env.local に以下を設定
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
```

### 削除された未使用コード
- `App.jsx`: `checkBingo`関数、`saveToLocalStorage`関数
- `firestore.js`: `arrayRemove`、`orderBy`、`limit`インポート
- 各コンポーネントの未使用state変数

## 一人モード/大会モード実装 (2025/05/31 実装)
### 新機能
- **2つのモード切り替え**
  - 一人モード: 個人記録とモチベーション維持の得点表示
  - 大会モード: オープン大会による競争システム

- **オープン大会システム**
  - 誰でも大会を主催可能
  - 大会名、開始日時、終了日時を設定
  - 自動的なステータス管理（募集中→開催中→終了）
  - リアルタイムランキング

- **優勝者表彰システム**
  - 過去3日間の優勝者を表示
  - アニメーション付き表彰UI

### 削除機能
- グループ管理機能を削除（よりシンプルな大会システムに統合）

### 新規ファイル
- `ModeSelector.jsx/css`: モード切り替えUI
- `SoloPointsDisplay.jsx/css`: 一人モード得点表示
- `TournamentCreator.jsx/css`: 大会作成UI
- `TournamentList.jsx/css`: 大会一覧・参加UI
- `WinnersDisplay.jsx/css`: 優勝者表彰UI
- `soloMode.js`: 一人モード得点管理
- `tournamentSystem.js`: 大会システム管理

## 豪華なログイン画面実装 (2025/05/31 実装)
### 新機能
- **YouTube動画背景**
  - OKUNOSAMPEIさんのトレーニング動画3本をランダム再生
  - 自動再生・ミュート・ループ設定
  - 動画切り替えボタン

- **ビジュアルエフェクト**
  - パーティクルアニメーション
  - グラデーション＆ブラーオーバーレイ
  - ネオンエフェクト付きタイトル

- **情報表示**
  - アクティブな大会一覧
  - 最近の優勝者表彰
  - モチベーショナルな名言

- **動画管理システム**
  - 管理者向け動画管理画面
  - YouTube URLから自動ID抽出
  - 動画の追加・編集・削除機能

### 導入動画
1. `hGjl9voD0hg` - OKUNOSAMPEIトレーニング動画1
2. `tmY9AO3SFKQ` - OKUNOSAMPEIトレーニング動画2
3. `a0xpRe0hdmc` - OKUNOSAMPEIトレーニング動画3

### 新規ファイル
- `AuthEnhanced.jsx/css`: 豪華なログイン画面
- `VideoManager.jsx/css`: 動画管理コンポーネント
- `trainingVideos.js`: 動画リストデータ
- `videoManagement.js`: Firebase動画管理システム

## 本番環境デバッグと修正 (2025/06/01 実装)
### 対応した問題
1. **Firebaseインデックスエラー**
   - 複合クエリによるインデックス要求エラーを解消
   - 大会クエリと動画クエリを単純化
   - クライアント側でのフィルタリングに変更

2. **動画切り替えボタンのクリック問題**
   - CSSのz-indexとpointer-eventsの競合を修正
   - 背景要素のpointer-events: noneとボタンのpointer-events: autoを適切に設定

3. **フォーム警告対応**
   - パスワードフィールドにautocomplete属性を追加
   - メールフィールドにもautocomplete="email"を設定

### 技術的改善
- Firebaseクエリの最適化
  - `where` + `orderBy`の複合クエリを避ける
  - `getDocs`で全データ取得後にJavaScript側でフィルタリング
  - インデックス作成不要で本番環境でも即座に動作

### 修正ファイル
- `tournamentSystem.js`: getActiveTournaments、getRecentWinnersのクエリ簡素化
- `videoManagement.js`: getAllVideos、getVideosByCategoryのクエリ簡素化
- `AuthEnhanced.css`: 動画切り替えボタンのCSS修正
- `AuthEnhanced.jsx`: autocomplete属性の追加