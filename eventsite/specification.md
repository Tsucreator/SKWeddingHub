# 結婚式当日限定ゲスト専用Webサイト 仕様書 (v7.0)

## 1. プロジェクト概要
披露宴当日にゲストがスマホで「進行」「メニュー」「自分の席」をスムーズに確認でき、かつ新郎新婦のプロフィールや思い出を楽しめる、品格のあるWebサイト。

**開発方針:**
- 実用機能（メニュー、進行、座席）を最優先。
- 演出機能（プロフィール、ギャラリー、動画）を付加。
- 1ヶ月の短期間で「安定動作」と「高級感」を両立。

---

## 2. システム構成 (AWS アーキテクチャ)
- **Frontend:** React 19 + Vite 7 (S3 + CloudFront)
- **API:** Amazon API Gateway + AWS Lambda (Node.js 24.x)
- **Database:** Amazon DynamoDB — テーブル名 `WeddingGuests`
- **Content:** YouTube(動画埋め込み) / Google Drive(写真一括閲覧・投稿)
- **CI/CD:** GitHub Actions（フロントエンド・Lambda 個別デプロイ）

### 主要ライブラリ
| パッケージ | 用途 |
| :--- | :--- |
| react-router-dom | SPA ルーティング |
| axios | API 通信 |
| lucide-react | ナビゲーションアイコン |
| react-quick-pinch-zoom | 座席表ピンチズーム |

---

## 3. UI/UX デザインガイドライン
- **コンセプト:** Dignified & Luxurious（落ち着いた高級感）
- **モバイルファースト:** すべての UI は 375px 幅を起点に設計。タップターゲット最低 44×44px。フォントサイズ最低 16px。
- **ナビゲーション:** 下部固定ナビ (Layout コンポーネント)。4 タブ構成 — Top / 進行 / 料理 / お席。アクティブタブはゴールドでハイライト。
- **デザインのキーカラー:**
    - シャンパンゴールド: `#D4AF37` (アクセント・見出し), `#B89130` (サブ)
    - 漆黒: `#1A1A1A` (ナビ背景・ボタン)
    - 背景: `#FAFAFA` (ページ), `#fff` (コンテンツ)
- **フォント:** serif (明朝体) を基調。本番では Noto Serif JP を導入予定。
- **画像:** WebP 形式、`srcset` + `loading="lazy"` を使用。

---

## 4. 機能仕様の詳細（全メニュー）

### 4.1 ログイン (Auth) — ✅ 実装済み
- 招待状送付先メールアドレスによる簡易認証。
- **フロー:** メールアドレス入力 → API Gateway (POST) → Lambda (`weddingGuestLogin`) → DynamoDB `WeddingGuests` テーブルを `email` で検索 → ゲスト情報返却。
- **DB 検索方式:** パーティションキーは `guest_id` (Number) のため、`email` での検索には GSI (Global Secondary Index) または Scan + FilterExpression を使用する。（TODO: 方式を確定し Lambda を修正）
- **セッション保持:** `localStorage` にゲスト情報 (JSON) を保存。再アクセス時はログイン画面をスキップ。
- **認証ガード:** 未ログイン時は全ページを `/login` にリダイレクト (React Router `<Navigate>`)。
- **API エンドポイント:** 環境変数 `VITE_API_ENDPOINT` で管理予定（現在はハードコード — 要改善）。

### 4.2 進行表 (SCHEDULE) - **必須**
- **内容:** 披露宴のタイムライン（開宴、ケーキ入刀、お色直し、結び等）。
- **UX:** 現在の時刻に合わせて、進行中の項目がさりげなく強調される仕組みを検討。

### 4.3 お料理・お飲物 (MENU & DRINK) - **必須**
- **お料理:** 格式高いコースメニューを明朝体で美しく表示。
- **お飲物:** ドリンク名、カクテルの内容等をリスト表示。
- **UX:** アレルギー対応などでメニューが異なるゲストがいる場合、ログイン情報に基づき出し分けを行うことも可能（任意）。

### 4.4 座席表 (SEAT MAP) - **必須**
- **内容:** 会場のテーブル配置図。
- **UX:** 自分の座席をゴールドの枠線でハイライト。ピンチズーム対応 (`react-quick-pinch-zoom`)。
- **データ:** ログインユーザの `table_id` / `seat_id` を使用して該当席を特定・ハイライト。

### 4.5 会場案内・インフォメーション (INFO) - **必須**
- **内容:** クローク、喫煙所、お手洗いの場所、式場Wi-Fi情報、送迎バスの時刻表、SNSハッシュタグの案内。

### 4.6 プロフィール (OUR STORY) - **追加**
- **内容:** 新郎新婦の紹介、Q&A、出会いから今日までのエピソード。

### 4.7 ギャラリー & アーカイブ (MEMORIES) - **追加**
- **Photo Gallery:** 前撮り写真等の閲覧 ＋ Google Driveへのアップロード/閲覧ボタン。
- **Movies:** プロフィールムービー等のYouTube埋め込み再生。
- **Music List:** 当日のBGMリスト（曲名・アーティスト名）。

---

## 5. データ構造 (DynamoDB)

### WeddingGuests テーブル
| 項目 | 型 | 説明 |
| :--- | :--- | :--- |
| guest_id | Number (PK) | ゲスト識別子 |
| name | String | ゲスト名 |
| kana | String | ふりがな |
| roma | String | ローマ字表記 |
| attendance | String | 出欠状況 |
| email | String | メールアドレス（ログインキー） |
| allergy | String | アレルギー情報 |
| side | String | 新郎側 / 新婦側 |
| relationship | String | 間柄（友人、親族等） |
| honorific | String | 敬称 |
| seat_id | Number | 席番号 (例: "1", "3") |
| table_id | String | 所属テーブルID (例: "A", "B") |

### Login API レスポンス例
```json
{
  "guest_id": 1,
  "name": "山田 太郎",
  "kana": "やまだ たろう",
  "roma": "Taro Yamada",
  "attendance": "出席",
  "email": "guest@example.com",
  "allergy": "",
  "side": "groom",
  "relationship": "友人",
  "honorific": "様",
  "table_id": "A",
  "seat_id": "1"
}
```

### エラーレスポンス
| ステータス | 内容 |
| :--- | :--- |
| 200 | ゲスト情報返却（ログイン成功） |
| 400 | リクエスト不正（email 未送信等） |
| 401 | ゲスト未登録 `{"message": "Guest not found"}` |
| 500 | サーバーエラー |

---

## 6. 開発ロードマップ (4週間)

- **第1週: 基盤構築 & 認証** — ✅ 完了 (2026-02-11)
    - AWS インフラ設定 (S3, CloudFront, API Gateway, DynamoDB, Lambda)。
    - ログイン Lambda (`weddingGuestLogin`) + React ログイン画面実装。
    - GitHub Actions ワークフロー整備 (`deploy-eventsite-login.yml`, `deploy-eventsite-frontend.yml`)。
    - 下部固定ナビ付き Layout + React Router によるページルーティング。
    - ローカル環境での DynamoDB 疎通確認済み。
- **第2週: 必須コンテンツ実装 (実用フェーズ)**
    - 進行表 (Schedule)、メニュー (Menu)、会場案内 (Info) ページの実装。
    - Noto Serif JP フォント導入、グローバル CSS テーマ確定。
    - API エンドポイントの環境変数化 (`VITE_API_ENDPOINT`)。
- **第3週: 座席表 & 演出コンテンツ実装 (おもてなしフェーズ)**
    - 座席表の `react-quick-pinch-zoom` 実装 + ハイライトロジック。
    - プロフィール (OUR STORY)、ギャラリー (MEMORIES) ページ。
    - YouTube 埋め込み、Google Drive 連携。
- **第4週: データ投入 & 実機確認**
    - 全ゲストデータの DynamoDB 投入。
    - iPhone Safari / Android Chrome でのレイアウト確認。
    - Lighthouse モバイルスコア計測・最適化。
    - オフライン対策。

---

## 7. 運用上のルール
- **ネットワーク:** 画像はWebP形式などで軽量化し、読み込み速度を優先。
- **アクセシビリティ:** 年配のゲストも考慮し、文字サイズは小さくしすぎない、または「文字サイズ拡大」ボタンの設置を検討。
- **クローズ:** 2026/5/31に全 AWS リソースおよびデータを削除しクローズ。

---

## 8. ファイル構成

```
eventsite/
  specification.md          # 本仕様書
  api/
    login/
      index.js              # ログイン Lambda (Node.js — DynamoDB 認証)
    lambda/                 # (将来拡張用)
  guest-site/
    index.html              # エントリポイント
    vite.config.js          # Vite 設定
    package.json            # 依存管理
    src/
      main.jsx              # React エントリ
      App.jsx               # ルーティング定義 (React Router)
      components/
        Layout.jsx           # 共通レイアウト + 下部固定ナビ
      pages/
        Login.jsx            # ログイン画面
        Home.jsx             # トップページ
        Schedule.jsx         # 進行表
        Menu.jsx             # お料理・お飲物
        SeatMap.jsx          # 座席表
```

### 今後追加予定のページ
| ルート | ファイル | 内容 |
| :--- | :--- | :--- |
| `/info` | `Info.jsx` | 会場案内・インフォメーション |
| `/story` | `Story.jsx` | プロフィール (OUR STORY) |
| `/memories` | `Memories.jsx` | ギャラリー & アーカイブ (MEMORIES) |

---

## 9. 既知の課題・TODO

| # | 内容 | 優先度 |
| :--- | :--- | :--- |
| 1 | API エンドポイントがハードコード → `VITE_API_ENDPOINT` 環境変数に移行 | 高 |
| 2 | CORS の `Access-Control-Allow-Origin` を本番ドメインに制限 | 中 |
| 3 | Login.jsx の日付表記 "2025.07.07" がプレースホルダーのまま | 中 |
| 4 | ナビゲーションに INFO / STORY / MEMORIES タブ未追加 | 中 |
| 5 | Noto Serif JP フォント未導入 (現在はブラウザ既定の serif) | 低 |