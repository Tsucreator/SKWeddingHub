# 結婚式当日限定ゲスト専用Webサイト 仕様書 (v8.0)

## 1. プロジェクト概要
披露宴当日にゲストがスマホで「メニュー」「座席表」「プロフィール」「引出物」をスムーズに確認でき、かつ新郎新婦のプロフィールや思い出を楽しめる、品格のあるWebサイト。

**開発方針:**
- 実用機能（メニュー、座席表、引出物）を最優先。
- 演出機能（プロフィール、ギャラリー）を付加。
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

### 3.1 基本方針
- **コンセプト:** Dignified & Luxurious（落ち着いた高級感）
- **モバイルファースト:** すべての UI は 375px 幅を起点に設計。タップターゲット最低 44×44px。フォントサイズ最低 16px。

### 3.2 デザイントークン (CSS カスタムプロパティ)
| トークン | 値 | 用途 |
| :--- | :--- | :--- |
| `--color-gold` | `#D4AF37` | アクセント・アイコンハイライト |
| `--color-gold-dark` | `#B89130` | 見出し・サブカラー |
| `--color-black` | `#1A1A1A` | ナビ背景・ボタン |
| `--color-white` | `#FFFFFF` | 白背景 |
| `--color-bg-light` | `#FFFFFF` | ページ背景 |
| `--color-text` | `#333333` | 本文 |
| `--color-text-light` | `#666666` | 補足テキスト |
| `--color-text-muted` | `#999999` | 注釈 |
| `--font-serif` | `'Noto Serif JP', serif` | 全体フォント |

### 3.3 ナビゲーション
- 下部固定ナビ (Layout コンポーネント)。6 タブ構成。
- アクティブタブはゴールド (`--color-gold`) でハイライト。
- 各タブは `flex: 1` で均等幅配置。`justify-content: space-evenly`。

| 順序 | パス | アイコン | ラベル |
| :--- | :--- | :--- | :--- |
| 1 | `/` | Home | Top |
| 2 | `/map` | MapPin | 座席表 |
| 3 | `/menu` | Utensils | お料理 |
| 4 | `/about` | Heart | プロフィール |
| 5 | `/gallery` | Camera | ギャラリー |
| 6 | `/gift` | Gift | 引出物 |

### 3.4 画面遷移アニメーション
- **方式:** `React.lazy` + `Suspense` による遅延ロード。`Suspense fallback={null}` で読み込み中は空白表示。
- **PageTransition コンポーネント:** マウント時にフェードイン (0.6s ease-out) + 微上昇 (translateY 10px→0) のアニメーション。
- **再マウント制御:** Layout 内で `<PageTransition key={location.key}>` を使用し、ルート変更のたびにコンポーネントを再マウントしてアニメーションを発火。
- **Login → Home:** Login ページも `<PageTransition>` で囲み、同じフェードイン演出を適用。
- **スクロールリセット:** PageTransition マウント時に `window.scrollTo(0, 0)` で先頭に戻す。

---

## 4. 機能仕様の詳細（全ページ）

### 4.1 ログイン (Login) — ✅ 実装済み
- **パス:** `/login`
- **ファイル:** `Login.jsx` / `Login.module.css`
- 招待状送付先メールアドレスによる簡易認証。
- **フロー:** メールアドレス入力 → API Gateway (POST) → Lambda (`weddingGuestLogin`) → DynamoDB `WeddingGuests` テーブルを `email` で検索 → ゲスト情報返却。
- **DB 検索方式:** パーティションキーは `guest_id` (Number) のため、`email` での検索には GSI (Global Secondary Index) または Scan + FilterExpression を使用する。
- **セッション保持:** `localStorage` にゲスト情報 (JSON) を保存。再アクセス時はログイン画面をスキップ。
- **認証ガード:** 未ログイン時は全ページを `/login` にリダイレクト (React Router `<Navigate>`)。
- **API エンドポイント:** 環境変数 `VITE_API_ENDPOINT` で管理（フォールバックとしてハードコード URL あり）。
- **表示内容:** 「WELCOME」タイトル、日付 (2026.03.20)、「Shinnosuke & Kaho Wedding Reception」

### 4.2 トップページ (Home) — ✅ 実装済み
- **パス:** `/` (index)
- **ファイル:** `Home.jsx` / `Home.module.css`
- **ヒーローセクション:** ゲストのローマ字名 (`roma`)、「Welcome to Our Party」タイトル、日付 (2026.03.20)。背景画像 (`hero.webp`)。
- **メッセージセクション:** ゲスト名 + 「様」、挨拶文、ナビへの誘導ヒント。

### 4.3 お料理・お飲物 (Menu) — ✅ 実装済み
- **パス:** `/menu`
- **ファイル:** `Menu.jsx` / `Menu.module.css`
- **タブ切り替え:** 「お飲み物」/「お料理」の 2 タブ構成。
- **お料理:** フレンチコースメニュー（前菜〜デザートの 7 品）を明朝体で表示。
- **お飲み物:** カテゴリ別ドリンクリスト（ビール、ワイン、ウイスキー、カクテル等 9 カテゴリ）。
- **キッズメニュー対応:** `guest_id === 14` の場合、キッズ専用のお料理・ドリンクメニューを表示。

### 4.4 座席表 (SeatMap) — ✅ 実装済み
- **パス:** `/map`
- **ファイル:** `SeatMap.jsx` / `SeatMap.module.css`
- **全体マップ:** SVG ベースのテーブル配置図 (A〜J テーブル)。ユーザーのテーブルをゴールドでハイライト + パルスアニメーション。
- **テーブル詳細ビュー:** タップで円形テーブルの席配置を表示。API からゲスト名一覧を取得。自分の席をゴールドでハイライト。
- **ピンチズーム:** `react-quick-pinch-zoom` で全体マップのピンチズーム対応。
- **座席 API:** `VITE_SEATS_API_ENDPOINT` でテーブルごとのゲスト情報を取得。

### 4.5 プロフィール (About Us) — ✅ 実装済み
- **パス:** `/about`
- **ファイル:** `AboutUs.jsx` / `AboutUs.module.css`
- **内容:** 新郎新婦それぞれのプロフィールカード（写真プレースホルダー、名前、役割、趣味・自己紹介）。二人をつなぐ「&」記号。「出会いのきっかけ」ストーリーセクション。
- **TODO:** プロフィール写真の差し替え、テキスト内容のカスタマイズ。

### 4.6 引出物 (Gift) — ✅ 実装済み (仮ページ)
- **パス:** `/gift`
- **ファイル:** `Gift.jsx` / `Gift.module.css`
- **内容:** ログインユーザー名を表示し、引出物カタログサービスへの外部リンクを案内するページ。
- **UX:** ゲストごとに個別のギフト選択用リンクを発行予定。リンクカードUIで案内。
- **TODO:** ゲストごとのギフトURL（DynamoDB に `gift_url` フィールドを追加するか、別テーブルで管理）。リンクの有効期限表示。

### 4.7 ギャラリー (Gallery) — 🔲 未実装
- **パス:** `/gallery`
- **内容:** 前撮り写真等の閲覧 ＋ Google Drive への写真アップロード/閲覧ボタン。YouTube 埋め込み動画。
- **TODO:** コンポーネント作成、Google Drive / YouTube 連携実装。

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
| seat_id | Number | 席番号 (例: 1, 3) |
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

## 6. コンポーネント構成

### 共通コンポーネント
| ファイル | 概要 |
| :--- | :--- |
| `Layout.jsx` / `Layout.module.css` | 共通シェル + 下部固定ナビ (6タブ)。`<Outlet>` でページコンテンツを描画。 |
| `PageTransition.jsx` / `PageTransition.module.css` | マウント時フェードインラッパー。`key={location.key}` で再マウント制御。 |

### ページコンポーネント
| ファイル | パス | 状態 |
| :--- | :--- | :--- |
| `Login.jsx` | `/login` | ✅ 実装済み |
| `Home.jsx` | `/` | ✅ 実装済み |
| `Menu.jsx` | `/menu` | ✅ 実装済み |
| `SeatMap.jsx` | `/map` | ✅ 実装済み |
| `AboutUs.jsx` | `/about` | ✅ 実装済み |
| `Gift.jsx` | `/gift` | ✅ 仮実装 |
| (Gallery) | `/gallery` | 🔲 未実装 |

---

## 7. ファイル構成

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
      App.jsx               # ルーティング定義 (React Router + lazy/Suspense)
      App.css               # グローバルレイアウト (#root)
      index.css             # グローバルスタイル (CSS カスタムプロパティ)
      components/
        Layout.jsx           # 共通レイアウト + 下部固定ナビ
        Layout.module.css
        PageTransition.jsx   # 画面遷移フェードインアニメーション
        PageTransition.module.css
      pages/
        Login.jsx            # ログイン画面
        Login.module.css
        Home.jsx             # トップページ (ヒーロー + メッセージ)
        Home.module.css
        Menu.jsx             # お料理・お飲物 (タブ切り替え)
        Menu.module.css
        SeatMap.jsx          # 座席表 (SVG + ピンチズーム)
        SeatMap.module.css
        AboutUs.jsx          # プロフィール (二人の紹介 + ストーリー)
        AboutUs.module.css
        Gift.jsx             # 引出物案内 (ギフトリンク)
        Gift.module.css
```

---

## 8. 開発ロードマップ (4週間)

- **第1週: 基盤構築 & 認証** — ✅ 完了 (2026-02-11)
    - AWS インフラ設定 (S3, CloudFront, API Gateway, DynamoDB, Lambda)。
    - ログイン Lambda (`weddingGuestLogin`) + React ログイン画面実装。
    - GitHub Actions ワークフロー整備。
    - 下部固定ナビ付き Layout + React Router によるページルーティング。
- **第2週: コンテンツ実装** — ✅ 完了 (2026-02-15)
    - メニュー (Menu) ページ実装（キッズメニュー対応含む）。
    - 座席表 (SeatMap) 実装（SVG テーブル配置 + 詳細ビュー + ピンチズーム）。
    - プロフィール (AboutUs) ページ実装。
    - 引出物 (Gift) 仮ページ作成。
    - 画面遷移アニメーション (PageTransition + React.lazy) 導入。
    - Noto Serif JP フォント導入、グローバル CSS テーマ確定。
- **第3週: 演出コンテンツ & 仕上げ**
    - ギャラリー (Gallery) ページ実装。
    - YouTube 埋め込み、Google Drive 連携。
    - 引出物ページのゲスト別リンク実装。
    - プロフィール写真・テキストの本番データ差し替え。
- **第4週: データ投入 & 実機確認**
    - 全ゲストデータの DynamoDB 投入。
    - iPhone Safari / Android Chrome でのレイアウト確認。
    - Lighthouse モバイルスコア計測・最適化。
    - オフライン対策。

---

## 9. 運用上のルール
- **ネットワーク:** 画像はWebP形式などで軽量化し、読み込み速度を優先。
- **アクセシビリティ:** 年配のゲストも考慮し、文字サイズは小さくしすぎない。
- **クローズ:** 2026/5/31に全 AWS リソースおよびデータを削除しクローズ。

---

## 10. 既知の課題・TODO

| # | 内容 | 優先度 | 状態 |
| :--- | :--- | :--- | :--- |
| 1 | CORS の `Access-Control-Allow-Origin` を本番ドメインに制限 | 中 | 未着手 |
| 2 | ギャラリーページ (Gallery) の実装 | 中 | 未着手 |
| 3 | 引出物ページのゲスト別ギフトURL 実装 (DynamoDB フィールド追加 or 別管理) | 中 | 未着手 |
| 4 | プロフィール写真・テキストを本番データに差し替え | 中 | 未着手 |
| 5 | ヒーロー画像 (`hero.webp`) の本番素材差し替え | 中 | 未着手 |
| 6 | Noto Serif JP フォント未導入 (現在はブラウザ既定の serif) | 低 | 未着手 |