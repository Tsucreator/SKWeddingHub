# Gallery Upload Infrastructure Setup

この手順は、Gallery の画像・動画アップロード機能を AWS 上で有効にするための実作業チェックリストです。

対象実装:
- Lambda: [eventsite/api/gallery/index.js](eventsite/api/gallery/index.js)
- Frontend: [eventsite/guest-site/src/pages/Gallery.jsx](eventsite/guest-site/src/pages/Gallery.jsx)
- Deploy workflow: [.github/workflows/deploy-eventsite-gallery.yml](.github/workflows/deploy-eventsite-gallery.yml)

前提:
- リージョンは既存の eventsite と同じにする
- 既存テーブル `WeddingGuests` は存在している
- 既存の GitHub Actions 用 AWS 権限は利用可能

## 1. S3 バケットを作成する

用途:
- ゲストがアップロードした画像・動画を private 保存する

推奨:
- eventsite 本体の静的ホスティング用バケットとは分ける
- Public access は全て Block のままにする

推奨バケット名の例:
- `wedding-gallery-uploads-prod`

設定:
- Region: 既存の eventsite と同じ
- Object Ownership: Bucket owner enforced
- Block Public Access: 全て ON
- Versioning: 任意

### S3 CORS 設定

S3 コンソールの CORS 設定に以下を入れる。

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:5173",
      "https://YOUR_CLOUDFRONT_DOMAIN"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

置き換える値:
- `https://YOUR_CLOUDFRONT_DOMAIN` → 実際の eventsite 配信ドメイン

## 2. DynamoDB テーブルを作成する

テーブル名:
- `WeddingGuestUploads`

キー:
- Partition key: `guest_id` Number
- Sort key: `upload_id` String

推奨設定:
- Capacity mode: On-demand
- Table class: Standard

このテーブルは、誰が何をアップロードしたかを保持する。

### 列設計の考え方

DynamoDB は RDB のように全列を事前定義するというより、まず以下を決める。

1. 主キーを何にするか
2. どういう単位で一覧取得したいか
3. 管理画面や集計で別検索が必要か

今回の MVP では、画面要件が「ログイン中ゲスト本人のアップロード一覧を出す」なので、
`guest_id` をパーティションキーにするのが最も自然。

理由:
- フロントはログイン済み `guest_id` を持っている
- メールアドレスは変更や表記ゆれがあり得る
- `guest_id` は既存の `WeddingGuests` と整合しやすい

### 必須属性

以下は今の Gallery 実装が前提としている属性。属性名はこのまま使うのが安全。

保存される主な属性:
- `guest_id`
- `upload_id`
- `name`
- `email`
- `file_name`
- `original_file_name`
- `media_kind`
- `content_type`
- `file_size`
- `status`
- `s3_bucket`
- `s3_key`
- `created_at`
- `completed_at`
- `updated_at`

### 属性の型と用途

| 属性名 | 型 | 必須 | 用途 |
|---|---|---:|---|
| `guest_id` | Number | 必須 | PK。ログインゲストとの紐づけ |
| `upload_id` | String | 必須 | SK。UUID を推奨 |
| `name` | String | 必須 | アップロード時点の表示名 |
| `email` | String | 必須 | サーバー照合済みメール |
| `file_name` | String | 必須 | サニタイズ済み表示名 |
| `original_file_name` | String | 必須 | 元のファイル名 |
| `media_kind` | String | 必須 | `image` / `video` |
| `content_type` | String | 必須 | MIME type |
| `file_size` | Number | 必須 | バイト数 |
| `status` | String | 必須 | `PENDING` / `COMPLETE` |
| `s3_bucket` | String | 必須 | 保存先バケット名 |
| `s3_key` | String | 必須 | 保存先キー |
| `created_at` | String | 必須 | ISO8601。作成日時 |
| `completed_at` | String | 任意 | 完了日時 |
| `updated_at` | String | 必須 | 最終更新日時 |

### 追加を推奨する属性

MVP の動作には不要だが、後で便利になる属性。

| 属性名 | 型 | 用途 |
|---|---|---|
| `duration_seconds` | Number | 動画の長さ保存。将来の制限確認や表示用 |
| `device_source` | String | `ios` / `android` / `desktop` などの簡易判定 |
| `uploader_version` | String | フロントバージョン調査用 |
| `etag` | String | S3 オブジェクト検証用 |
| `delete_at_epoch` | Number | TTL 用。2026/05/31 クローズ対応 |

### TTL の推奨

このプロジェクトは 2026/05/31 にクローズ予定なので、TTL を使う設計がよい。

推奨属性:
- `delete_at_epoch` Number

例:
- 2026-05-31 23:59:59 JST を epoch seconds に変換して保存

補足:
- DynamoDB TTL は即時削除ではなく遅延がある
- 厳密な削除日が必要なら、TTL に加えて手動削除やバッチ削除も検討する

### GSI は必要か

結論:
- MVP では不要

理由:
- 現在の UI は `guest_id` 単位の一覧だけで足りる
- 管理画面もまだない

将来追加するなら候補は以下。

#### 管理用 GSI 候補 1

- Index name: `status-created_at-index`
- PK: `status`
- SK: `created_at`

用途:
- 未完了アップロード一覧
- 新着順の確認

#### 管理用 GSI 候補 2

- Index name: `media_kind-created_at-index`
- PK: `media_kind`
- SK: `created_at`

用途:
- 動画だけ抽出
- 画像だけ抽出

管理画面を作る予定がないなら、今は作らなくてよい。

### サンプルアイテム

```json
{
  "guest_id": 12,
  "upload_id": "4d5a36f8-2df3-4d1d-a115-0e9821917137",
  "name": "山田 花子",
  "email": "guest@example.com",
  "file_name": "IMG_1234.HEIC",
  "original_file_name": "IMG_1234.HEIC",
  "media_kind": "image",
  "content_type": "image/heic",
  "file_size": 4281930,
  "status": "COMPLETE",
  "s3_bucket": "wedding-gallery-uploads-prod",
  "s3_key": "guest-uploads/2026/03/19/guest-12/4d5a36f8-2df3-4d1d-a115-0e9821917137-IMG_1234.HEIC",
  "created_at": "2026-03-19T10:15:22.000Z",
  "completed_at": "2026-03-19T10:15:31.000Z",
  "updated_at": "2026-03-19T10:15:31.000Z",
  "delete_at_epoch": 1780239599
}
```

## 3. Gallery Lambda を作成する

ランタイム:
- Node.js 20

関数名の例:
- `weddingGuestGalleryUpload`

ハンドラー:
- `index.handler`

アップロード方法:
- まずは GitHub Actions を使わず、AWS Console か CLI で 1 回作成してよい
- 作成後は workflow に切り替える

### Lambda 環境変数

最低限これを設定する。

```text
GUESTS_TABLE_NAME=WeddingGuests
UPLOADS_TABLE_NAME=WeddingGuestUploads
UPLOADS_BUCKET_NAME=wedding-gallery-uploads-prod
SIGNED_UPLOAD_EXPIRES_SECONDS=900
SIGNED_VIEW_EXPIRES_SECONDS=3600
MAX_IMAGE_BYTES=20971520
MAX_VIDEO_BYTES=157286400
```

補足:
- `MAX_IMAGE_BYTES=20971520` は 20MB
- `MAX_VIDEO_BYTES=157286400` は 150MB

## 4. Lambda IAM 権限を付与する

この Lambda 実行ロールに以下の権限が必要。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadGuestsTable",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem"
      ],
      "Resource": "arn:aws:dynamodb:ap-northeast-1:YOUR_ACCOUNT_ID:table/WeddingGuests"
    },
    {
      "Sid": "ManageUploadsTable",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:ap-northeast-1:YOUR_ACCOUNT_ID:table/WeddingGuestUploads"
    },
    {
      "Sid": "AccessUploadsBucket",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:HeadObject"
      ],
      "Resource": "arn:aws:s3:::wedding-gallery-uploads-prod/*"
    }
  ]
}
```

置き換える値:
- `YOUR_ACCOUNT_ID`
- リージョン
- バケット名

## 5. API Gateway にエンドポイントを追加する

追加する API:
- `POST /prod/gallery`
- `OPTIONS /prod/gallery`

やること:
1. 既存 eventsite 用 API Gateway を開く
2. `/gallery` リソースを追加
3. `POST` メソッドを追加して Gallery Lambda に統合
4. `OPTIONS` を追加して CORS を有効にする
5. API を `prod` に再デプロイ

### 期待するリクエスト

Gallery API は body の `action` で分岐する。

#### 一覧取得

```json
{
  "action": "listUploads",
  "guestId": 1,
  "email": "guest@example.com",
  "limit": 24
}
```

#### アップロード初期化

```json
{
  "action": "initUpload",
  "guestId": 1,
  "email": "guest@example.com",
  "fileName": "movie.mov",
  "contentType": "video/quicktime",
  "fileSize": 12345678
}
```

#### アップロード完了

```json
{
  "action": "completeUpload",
  "guestId": 1,
  "email": "guest@example.com",
  "uploadId": "UUID"
}
```

## 6. GitHub Secrets を追加する

GitHub Repository Secrets に以下を追加する。

```text
EVENTSITE_GALLERY_LAMBDA_NAME=weddingGuestGalleryUpload
```

この値は [.github/workflows/deploy-eventsite-gallery.yml](.github/workflows/deploy-eventsite-gallery.yml) で使う。

## 7. フロントの環境変数を設定する

ローカル開発では [README.md](README.md) の設定に加えて、`eventsite/guest-site/.env.local` に以下を入れる。

```text
VITE_GALLERY_API_ENDPOINT=https://YOUR_API_ID.execute-api.ap-northeast-1.amazonaws.com/prod/gallery
VITE_GALLERY_MAX_IMAGE_MB=20
VITE_GALLERY_MAX_VIDEO_MB=150
VITE_GALLERY_MAX_VIDEO_DURATION_SECONDS=60
```

任意:

```text
VITE_GALLERY_VIEW_URL=https://YOUR_ALBUM_OR_ADMIN_PAGE
```

補足:
- `VITE_GALLERY_VIEW_URL` は必須ではない
- 未設定でもアップロード機能自体は動く

## 8. 初回デプロイを実行する

ローカルで zip デプロイする場合の例:

```bash
cd eventsite/api/gallery
npm ci --omit=dev
zip -r ../gallery-lambda.zip . -x "*.test.*" "*.spec.*" "__tests__/*"
aws lambda update-function-code \
  --function-name weddingGuestGalleryUpload \
  --zip-file fileb://../gallery-lambda.zip
```

今後は main への push で workflow デプロイしてよい。

## 9. 疎通確認をする

### API 一覧取得確認

```bash
curl -X POST "https://YOUR_API_ID.execute-api.ap-northeast-1.amazonaws.com/prod/gallery" \
  -H "Content-Type: application/json" \
  -d '{
    "action":"listUploads",
    "guestId":1,
    "email":"guest@example.com",
    "limit":5
  }'
```

期待値:
- `200 OK`
- `ok: true`
- `uploads: []` または既存アップロード一覧

### フロント確認

```bash
cd eventsite/guest-site
npm run dev
```

確認ポイント:
1. Gallery で「写真・動画を選ぶ」が表示される
2. 画像がアップロードできる
3. 60 秒超の動画はブラウザ側で弾かれる
4. 成功後に Your Uploads に反映される

## 10. 本番前に確認すること

必須確認:
1. iPhone Safari で画像アップロード
2. iPhone Safari で 1 分未満動画アップロード
3. Android Chrome で画像アップロード
4. Android Chrome で動画アップロード
5. 同一ゲストで再ログイン後も履歴が見える
6. 他ゲストでは他人の履歴が見えない

## 推奨する進め方

最短順序:
1. S3 バケット作成
2. DynamoDB テーブル作成
3. Lambda 作成と環境変数設定
4. IAM 権限付与
5. API Gateway 接続
6. `.env.local` 設定
7. curl 疎通確認
8. フロント実機確認

## あなたが今すぐやるとよい最初の 1 手

最初は `1. S3 バケット作成` から始めるのがよいです。

完了したら次の 3 点だけ分かれば、こちらで次の手順をさらに具体化できます。

```text
1. バケット名
2. AWS リージョン
3. eventsite の本番ドメイン
```