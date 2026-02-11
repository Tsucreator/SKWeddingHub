# 結婚式招待状 Web サイト 仕様書 (v1.0)

## 1. プロジェクト概要
郵送の招待状に代わり、結婚式の案内・出欠回答をオンラインで完結させる Web 招待状。
モバイルファーストで「品格のある高級感」を演出し、年配ゲストにもわかりやすい UI を提供する。

**挙式情報:**
- 日時: 2026年3月20日 (金) 挙式 10:00〜 / 披露宴 12:00〜14:30
- 会場: Brighton TOKYO Bay
- RSVP 締切: 2026-02-21

---

## 2. システム構成 (AWS アーキテクチャ)

| レイヤー | サービス | 詳細 |
| :--- | :--- | :--- |
| **Frontend** | S3 + CloudFront | 静的 HTML/CSS/JS（ビルドツール不要） |
| **API** | API Gateway (POST) | エンドポイント: `/submit` |
| **Backend** | Lambda (`writeGoogleSpreadSheet`) | Python 3.12.x |
| **通知** | AWS SES | 管理者へのメール通知 (現在無効化中) |
| **データ保存** | Google Sheets (gspread) | Secrets Manager 経由で認証 |
| **Lambda Layer** | `layers/gspread-layer/` | gspread + 依存ライブラリ群 |
| **CI/CD** | GitHub Actions | `deploy-frontend.yml` / `deploy-backend.yml` |

### Lambda 環境変数
| 変数名 | 用途 |
| :--- | :--- |
| `SENDER_EMAIL` | SES 送信元メールアドレス |
| `RECIPIENT_EMAIL` | SES 通知先メールアドレス |
| `SECRET_NAME` | Secrets Manager のシークレット名 (Google 認証情報) |
| `SPREADSHEET_KEY` | Google Sheets のスプレッドシートキー |
| `WORKSHEET_NAME` | 書き込み先ワークシート名 |

---

## 3. UI/UX デザインガイドライン

- **コンセプト:** Dignified & Luxurious（落ち着いた高級感）
- **モバイルファースト:** 375px 幅を起点に設計。`viewport-fit=cover` 対応済み。
- **フォント:**
    - 英字: Old Standard TT (Google Fonts)
    - 和文: Noto Sans JP (Google Fonts)
- **アイコン:** Font Awesome 5.15.4
- **画像:** すべて WebP 形式で最適化。`loading="lazy"` / `decoding="async"` を使用。
- **カラーパレット:** シャンパンゴールド × 漆黒を基調（CSS で定義）。

---

## 4. ページ構成 (シングルページ)

サイトは 1 枚の `index.html` にすべてのセクションを配置するシングルページ構成。

### 4.1 オープニングアニメーション
- フルスクリーンオーバーレイ上に動画 (`WelcomeToOurWedding.mp4`) を自動再生。
- 再生終了後にメインコンテンツへフェードイン。

### 4.2 ヒーロー画像 (Hero Section)
- 新郎新婦のメイン写真 (`hero_img.webp`) をフルスクリーン表示。
- グラデーションオーバーレイで文字の可読性を確保。

### 4.3 カウントダウン (Countdown)
- 挙式日までのリアルタイムカウントダウン (日・時・分・秒)。
- `config.json` の `eventDateISO` から対象日を取得。

### 4.4 メッセージ (Message)
- 招待のご挨拶文。
- 手書き風アニメーション GIF (`Message.webp`) をヘッダーに表示。

### 4.5 プロフィール (Profile)
- 新郎・新婦それぞれの写真と名前を表示。
- フェードインアニメーション付き。

### 4.6 RSVP フォーム (出欠回答) — ✅ 実装済み
- **必須フィールド:**
    - 出欠 (attend / absent) — ラジオボタン
    - 新郎ゲスト / 新婦ゲスト (`guest_side`) — ラジオボタン
    - お名前 (姓・名 分割入力 → `name` として結合送信)
    - ふりがな (姓・名 分割入力 → `kana` として結合送信)
    - メールアドレス (`email`)
- **任意フィールド:**
    - 性別 (`gender`) — 男性 / 女性 / 回答しない
    - アレルギー (`allergy`) — チェックボックス + 自由記述
    - メッセージ (`message`)
- **バリデーション:** クライアント側でリアルタイム検証（必須チェック・メール形式）。
- **送信先:** `config.json` の `apiEndpoint` → API Gateway → Lambda。
- **成功メッセージ:** 「回答を受け付けました。ありがとうございます。」

### 4.7 式場案内 (Event Details)
- 挙式日・会場名・スケジュールをカード形式で表示。

### 4.8 フォトカルーセル (Photos)
- 前撮り写真をスライドショー形式で表示。
- 前後ナビボタン + インジケーター付き。

### 4.9 アクセスマップ (Access)
- Google Maps を `iframe` で埋め込み。
- SDK は不使用。

---

## 5. API 仕様

### RSVP 送信 (POST)

**エンドポイント:** API Gateway → Lambda (`writeGoogleSpreadSheet`)

#### リクエスト
```json
{
  "name": "山田 太郎",
  "kana": "やまだ たろう",
  "attendance": "attend",
  "email": "guest@example.com",
  "guest_side": "新郎ゲスト",
  "gender": "男性",
  "allergy": "卵, 乳製品",
  "message": "おめでとうございます",
  "submitted_at": "2026-02-10T12:00:00.000Z"
}
```

#### レスポンス
| ステータス | 内容 |
| :--- | :--- |
| 200 | `{"message": "回答を受け付けました。ありがとうございます。", "success": true}` |
| 400 | 必須項目不足 or メール形式不正 |
| 500 | スプレッドシート書き込み失敗 / 予期しないエラー |

#### バックエンド処理フロー
1. JSON パース → サニタイゼーション (各フィールド最大 500 文字)
2. 必須フィールド検証 (`name`, `kana`, `email`, `attendance`)
3. メールアドレス形式検証
4. `attendance` 値の正規化 (attend → ご出席, absent → ご欠席)
5. Google Sheets への行追加 (タイムスタンプ, 名前, ふりがな, 出欠, メール, アレルギー, メッセージ)
6. SES メール通知 (現在無効化中)

---

## 6. ランタイム設定 (config.json)

デプロイ時に `config.sample.json` から生成。**Git 管理外** (`.gitignore` で除外)。

```json
{
  "apiEndpoint": "https://xxxxx.execute-api.ap-northeast-1.amazonaws.com/submit",
  "deadline": "2026-02-21",
  "eventDateISO": "2026-03-20T10:00:00"
}
```

| キー | 用途 |
| :--- | :--- |
| `apiEndpoint` | RSVP フォーム送信先 (API Gateway URL) |
| `deadline` | RSVP 締切日 (フォーム上に表示) |
| `eventDateISO` | カウントダウンの対象日時 |

---

## 7. CI/CD (GitHub Actions)

| ワークフロー | トリガー | 処理 |
| :--- | :--- | :--- |
| `deploy-frontend.yml` | `invitation/site/**` 変更時 | `config.json` 生成 → S3 同期 (`/invitation/`) → CloudFront 無効化 |
| `deploy-backend.yml` | `invitation/api/lambda/**` 変更時 | pip install → zip → Lambda デプロイ |

### 使用する GitHub Secrets
| Secret 名 | 用途 |
| :--- | :--- |
| `AWS_ACCESS_KEY_ID` | IAM アクセスキー |
| `AWS_SECRET_ACCESS_KEY` | IAM シークレットキー |
| `AWS_REGION` | ap-northeast-1 |
| `S3_BUCKET_NAME` | S3 バケット名 |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront Distribution ID |
| `LAMBDA_FUNCTION_NAME` | Lambda 関数名 (`writeGoogleSpreadSheet`) |
| `PROD_API_ENDPOINT` | API Gateway URL (config.json 生成用) |

---

## 8. ファイル構成

```
invitation/
  specification.md              # 本仕様書
  site/
    index.html                  # メインページ (シングルページ)
    invitation.html             # 招待状ページ (バリエーション)
    invitation_f.html           # 招待状ページ (バリエーション)
    invitation.css              # 招待状用スタイル
    script.js                   # フォーム送信・カウントダウン・カルーセル等
    config.json                 # ランタイム設定 (Git管理外)
    config.sample.json          # 設定テンプレート
    README.md                   # フロントエンド説明
    animation/
      WelcomeToOurWedding.mp4   # オープニング動画 (※未確認)
      Message.webp              # メッセージ手書きアニメーション
      Profile.webp              # プロフィール手書きアニメーション
      Gallery.webp              # ギャラリー手書きアニメーション
      Information.webp          # インフォメーション手書きアニメーション
    image/
      hero_img.webp             # ヒーロー画像
      countdown_img.webp        # カウントダウン背景
      profile_img_groom.webp    # 新郎プロフィール写真
      profile_img_bride.webp    # 新婦プロフィール写真
      gallery_img*.webp         # ギャラリー写真 (6枚)
  api/lambda/
    lambda_function.py          # RSVP Lambda (Python 3.12)
    index.js                    # RSVP Lambda (Node.js — SES版、現在未使用)
    package.json                # Node.js 依存 (index.js 用)
    requirements.txt            # Python 依存 (boto3, gspread, oauth2client)
    README.md                   # Lambda デプロイ手順
```

---

## 9. 既知の課題・TODO

| # | 内容 | 優先度 |
| :--- | :--- | :--- |
| 1 | SES メール通知が無効化中 → 必要に応じて再有効化 | 低 |
| 2 | CORS `Access-Control-Allow-Origin: *` → 本番ドメインに制限 | 中 |
| 3 | Google Maps iframe の座標がプレースホルダーのまま | 高 |
| 4 | 会場名「〇〇迎賓館」がプレースホルダー | 高 |
| 5 | フッターの著作権表記が `© 2025` → `© 2026` に修正 | 低 |
| 6 | `invitation.html` / `invitation_f.html` の用途・使い分けを明記 | 中 |

---

## 10. 運用ルール
- **画像:** WebP 形式で軽量化。新規追加時も必ず WebP に変換すること。
- **フォーム締切:** `config.json` の `deadline` を更新すれば画面に自動反映。
- **クローズ:** 2026/05/31 に全 AWS リソースおよびデータを削除予定。