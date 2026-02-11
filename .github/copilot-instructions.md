## Copilot / AI agent instructions for this repository

このリポジトリは **2 つのサブプロジェクト** を含むモノレポです。

| サブプロジェクト | ディレクトリ | 概要 |
|---|---|---|
| **招待状 (Invitation)** | `invitation/` | 静的 HTML/CSS/JS の招待状 LP + RSVP フォーム (API Gateway → Lambda → SES) |
| **当日ゲストサイト (Event Site)** | `eventsite/` | React (Vite) SPA。ログイン認証 + 進行表・メニュー・座席表など当日コンテンツ |

共通インフラ: S3 + CloudFront (静的ホスティング), API Gateway + Lambda (バックエンド), DynamoDB (ゲスト管理)。Lambda Layer は `layers/` に格納。

---

### リポジトリ構成

```
invitation/          # 招待状
  site/              # 静的フロントエンド (HTML/CSS/JS)
  api/lambda/        # RSVP Lambda (Node.js — SES 送信 + Google Sheets 更新)
eventsite/           # 当日ゲストサイト
  specification.md   # 機能仕様書 (v7.0)
  guest-site/        # React + Vite SPA
  api/login/         # ログイン Lambda (Node.js — DynamoDB 認証)
  api/lambda/        # (将来拡張用)
layers/              # Lambda Layer (gspread 等)
.github/workflows/   # CI/CD
```

---

### 設計原則

#### モバイルファースト (最重要)
- **すべての UI はモバイル画面 (375px) を起点に設計し、タブレット・デスクトップへ拡張する。**
- タッチ操作を前提とし、タップターゲットは最低 44×44px を確保。
- 年配ゲストも利用するため、フォントサイズは最低 16px。文字サイズ拡大ボタンの設置を検討。
- 画像は WebP 形式で軽量化し、`srcset` + `loading="lazy"` を必ず使用。
- ビューポートメタタグ (`width=device-width, initial-scale=1`) を必ず含める。
- CSS はモバイルをデフォルトとし、`min-width` メディアクエリで拡張する。

#### デザイン
- コンセプト: **Dignified & Luxurious**（落ち着いた高級感）
- キーカラー: シャンパンゴールド (#C9A96E 系) × 漆黒 (#1A1A1A 系)
- 明朝体フォント (Noto Serif JP 等) を基調とする。

---

### サブプロジェクト別ガイド

#### 招待状 (`invitation/`)
- フロントエンドは静的ファイル。ビルドツール不要。
- RSVP フォームのフィールド名・必須/任意ルールは `invitation/site/README.md` に準拠。
  - 必須: お名前, ふりがな, ご出席/ご欠席, メールアドレス
  - 任意: アレルギー, メッセージ
- フォーム送信は POST JSON → API Gateway → Lambda (SES メール通知)。
- ローカルモックでも同じレスポンス形状を返し、成功メッセージは「ご回答ありがとうございます」。
- Google Maps 埋め込みは `iframe` を使用 (SDK 不要)。

#### 当日ゲストサイト (`eventsite/`)
- フロントエンドは **React + Vite** (`eventsite/guest-site/`)。
- 機能仕様は `eventsite/specification.md` が正。
- 認証: メールアドレスで DynamoDB (`WeddingGuests` テーブル) を参照する簡易ログイン。
  - Lambda: `eventsite/api/login/index.js` (Node.js, `@aws-sdk/client-dynamodb`)
  - ログイン状態は `localStorage` に保持し、再入力を不要にする。
- 必須ページ: 進行表 (SCHEDULE), メニュー (MENU & DRINK), 座席表 (SEAT MAP), 会場案内 (INFO)
- 追加ページ: プロフィール (OUR STORY), ギャラリー (MEMORIES)
- 座席表はログインユーザの `table_id` / `seat_id` に基づきハイライト。ピンチズーム対応必須。
- 動画は YouTube 埋め込み、写真は Google Drive 連携。

---

### バックエンド・インフラ規約
- AWS 構成 (S3/CloudFront, API Gateway, Lambda, DynamoDB, SES) を変更する場合は PR で理由を説明すること。
- Lambda 関数は `package.json` (Node.js) または `requirements.txt` (Python) で依存を管理。
- DynamoDB テーブル `WeddingGuests` のスキーマ:
  | 項目 | 型 | 説明 |
  |---|---|---|
  | email | String (PK) | ログインキー |
  | name | String | ゲスト名 |
  | table_id | String | テーブルID |
  | seat_id | String | 席番号 |
  | memo | String | 備考 |

---

### CI/CD (GitHub Actions)
- `deploy-frontend.yml` — `invitation/site/**` の変更時に S3 へ同期 + CloudFront 無効化。
- `deploy-backend.yml` — `invitation/api/lambda/**` の変更時に Lambda をデプロイ (Python)。
- `deploy-eventsite-login.yml` — `eventsite/api/login/**` の変更時にログイン Lambda をデプロイ (Node.js)。
- `deploy-eventsite-frontend.yml` — `eventsite/guest-site/**` の変更時に Vite ビルド → S3 同期 + CloudFront 無効化。
- シークレットは GitHub Repository Secrets に格納: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`, `CLOUDFRONT_DISTRIBUTION_ID`, 各 Lambda 関数名。

---

### AI エージェント行動規約
- 最小限・目的が明確な変更を行い、コミットメッセージで意図を説明する。
- 不明な点は推測せず、TODO コメントを残してオーナーに確認する。
- インフラ変更にはローカルテスト方法と AWS デプロイ手順を添える。
- モバイルでの表示確認を最優先とする。Lighthouse モバイルスコアを意識した実装を行う。
- 全データは 2026/5/31 にクローズ (削除) 予定。
