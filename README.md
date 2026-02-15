# Wedding Hub — 結婚式 Web サイト モノレポ

結婚式に関する 2 つの Web サイトを管理するモノレポです。

| サイト | ディレクトリ | 技術スタック | 概要 |
|---|---|---|---|
| **招待状** | `invitation/` | 静的 HTML/CSS/JS | Web 招待状 + RSVP フォーム |
| **当日ゲストサイト** | `eventsite/` | React 19 + Vite 7 | 披露宴当日のゲスト専用 SPA (ログイン・座席表・引出物案内) |

---

## アーキテクチャ

```
┌──────────────┐     ┌──────────────┐
│  invitation  │     │  eventsite   │
│  (静的 HTML) │     │ (React SPA)  │
└──────┬───────┘     └──────┬───────┘
       │   S3 + CloudFront  │
       └────────┬───────────┘
                │
         API Gateway
        ┌───────┴────────┐
        │                │
   Lambda (Python)  Lambda (Node.js)
   RSVP → Sheets    Login → DynamoDB
```

---

## クイックスタート

### 前提条件
- Node.js 20+
- Python 3.11+ (招待状 Lambda 開発時のみ)
- AWS CLI (デプロイ時)
- GitHub CLI `gh` (Issue 管理に使用)

### 招待状 (invitation)

```bash
# ローカル起動 — ビルドツール不要
cd invitation/site
python3 -m http.server 8000
# → http://localhost:8000
```

RSVP フォームの送信先は `config.json` で制御。ローカルでは `apiEndpoint` を空にするとモック動作します。

```bash
# config.json を生成
cp config.sample.json config.json
# apiEndpoint を空欄のままにすればモック送信
```

### 当日ゲストサイト (eventsite)

```bash
cd eventsite/guest-site
npm ci
npm run dev
# → http://localhost:5173
```

ログイン機能を使うには AWS 上の DynamoDB (`WeddingGuests` テーブル) と API Gateway が必要です。
`.env` に以下の環境変数を設定し、API 先を切り替えます。

```
VITE_API_ENDPOINT=https://qlydtknsq4.execute-api.ap-northeast-1.amazonaws.com/prod/login
VITE_SEATS_API_ENDPOINT=https://qlydtknsq4.execute-api.ap-northeast-1.amazonaws.com/prod/seats
```

```bash
# 本番ビルド
npm run build    # → dist/ に出力
npm run preview  # ビルド成果物をローカルプレビュー
```

---

## リポジトリ構成

```
.github/
  README.md                  # ← 本ドキュメント
  copilot-instructions.md    # AI エージェント向け指示書
  workflows/
    deploy-frontend.yml      # 招待状フロントエンド → S3
    deploy-backend.yml       # 招待状 Lambda → AWS Lambda
    deploy-eventsite-frontend.yml  # ゲストサイト → S3
    deploy-eventsite-login.yml     # ログイン Lambda → AWS Lambda

invitation/                  # 招待状サイト
  specification.md           # 仕様書
  site/
    index.html               # シングルページ (ヒーロー, カウントダウン, RSVP, マップ等)
    script.js                # フォーム送信, カウントダウン, カルーセル
    config.json              # ランタイム設定 (Git管理外)
    config.sample.json       # 設定テンプレート
    animation/               # オープニング動画, 手書き風 GIF
    image/                   # WebP 画像素材
  api/lambda/
    lambda_function.py       # RSVP Lambda (Python 3.12 — Sheets 書込 + SES)
    index.js                 # RSVP Lambda (Node.js — SES版, 現在未使用)
    requirements.txt         # Python 依存

eventsite/                   # 当日ゲストサイト
  specification.md           # 仕様書 (v8.0)
  api/login/
    index.js                 # ログイン Lambda (Node.js 24 — DynamoDB 認証)
  guest-site/
    src/
      App.jsx                # React Router ルーティング (lazy + Suspense)
      components/Layout.jsx  # 共通レイアウト + 下部固定ナビ (6タブ)
      components/PageTransition.jsx  # 画面遷移フェードイン
      pages/
        Login.jsx            # ログイン画面
        Home.jsx             # トップページ
        Menu.jsx             # お料理・お飲物
        SeatMap.jsx          # 座席表
        AboutUs.jsx          # プロフィール
        Gift.jsx             # 引出物案内

layers/
  gspread-layer/             # Lambda Layer (gspread + 依存)

infrastructure-notes.md      # インフラ設定メモ (Git管理外 ⚠️)
```

---

## CI/CD

`main` ブランチへのプッシュ時に、変更パスに応じて自動デプロイが実行されます。

| ワークフロー | トリガーパス | 処理内容 |
|---|---|---|
| `deploy-frontend.yml` | `invitation/site/**` | config.json 生成 → S3 同期 → CloudFront 無効化 |
| `deploy-backend.yml` | `invitation/api/lambda/**` | pip install → zip → Lambda デプロイ |
| `deploy-eventsite-frontend.yml` | `eventsite/guest-site/**` | npm ci → vite build → S3 同期 → CloudFront 無効化 |
| `deploy-eventsite-login.yml` | `eventsite/api/login/**` | npm ci → zip → Lambda デプロイ |

すべてのワークフローは `workflow_dispatch` にも対応しているため、GitHub UI から手動実行も可能です。

### 必要な GitHub Secrets

| Secret 名 | 用途 |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM アクセスキー |
| `AWS_SECRET_ACCESS_KEY` | IAM シークレットキー |
| `AWS_REGION` | デプロイ先リージョン |
| `S3_BUCKET_NAME` | 静的サイト S3 バケット |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront Distribution ID |
| `LAMBDA_FUNCTION_NAME` | 招待状 RSVP Lambda 関数名 |
| `PROD_API_ENDPOINT` | 招待状 API Gateway URL |
| `EVENTSITE_LOGIN_LAMBDA_NAME` | ログイン Lambda 関数名 |
| `EVENTSITE_API_ENDPOINT` | ゲストサイト API Gateway URL |
| `EVENTSITE_SEATS_API_ENDPOINT` | 座席表 API Gateway URL |

> 💡 各 Secret の実際の値は `infrastructure-notes.md` (Git 管理外) に記録しています。

---

## AWS 構成概要

| サービス | 招待状 | ゲストサイト |
|---|---|---|
| **S3** | `/invitation/` | `/eventsite/` |
| **CloudFront** | 共通ディストリビューション | 同左 |
| **API Gateway** | POST `/submit` | POST `/prod/login` |
| **Lambda** | `writeGoogleSpreadSheet` (Python 3.12) | `weddingGuestLogin` (Node.js 24), 座席情報 Lambda (TBD) |
| **DynamoDB** | — | `WeddingGuests` テーブル |
| **SES** | RSVP メール通知 (現在無効化中) | — |
| **Secrets Manager** | Google Sheets 認証情報 | — |

---

## デザインガイドライン

両サイト共通のデザインコンセプト: **Dignified & Luxurious（落ち着いた高級感）**

| 要素 | 値 |
|---|---|
| キーカラー (ゴールド) | `#D4AF37` / `#B89130` |
| キーカラー (漆黒) | `#1A1A1A` |
| 背景色 | `#FAFAFA` / `#fff` |
| フォント (招待状) | Old Standard TT + Noto Sans JP |
| フォント (ゲストサイト) | serif (Noto Serif JP 導入予定) |
| 画像形式 | WebP 必須, `loading="lazy"` |
| モバイル基準幅 | 375px |
| 最小フォントサイズ | 16px |
| 最小タップターゲット | 44×44px |

---

## 仕様書

各サブプロジェクトの詳細仕様は以下を参照してください。

- **招待状:** [`invitation/specification.md`](../invitation/specification.md)
- **ゲストサイト:** [`eventsite/specification.md`](../eventsite/specification.md)

---

## 開発ルール

1. **モバイルファースト** — すべての UI は 375px を起点に設計する。
2. **最小限の変更** — 1 コミット 1 目的。コミットメッセージで意図を説明する。
3. **インフラ変更は PR 必須** — AWS 構成を変更する場合は理由とデプロイ手順を記載。
4. **機密情報は Git に載せない** — API キー・エンドポイント URL は `infrastructure-notes.md` (Git 管理外) または GitHub Secrets で管理。
5. **画像は WebP** — 新規追加時は必ず WebP に変換し、`alt` テキストを設定する。

---

## プロジェクトスケジュール

| フェーズ | 期間 | 状況 |
|---|---|---|
| 第1週: 基盤構築 & 認証 | 〜2026-02-11 | ✅ 完了 |
| 第2週: コンテンツ実装 | 〜2026-02-18 | ✅ 完了 |
| 第3週: ギャラリー & 仕上げ | 〜2026-02-25 | 🔄 進行中 |
| 第4週: データ投入 & 実機確認 | 〜2026-03-04 | ⬜ 未着手 |
| **挙式日** | **2026-03-20** | |
| 全リソース削除 | 2026-05-31 | |

---

## ライセンス

プライベートリポジトリ。個人利用目的。