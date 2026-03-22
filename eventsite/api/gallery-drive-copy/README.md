# Gallery Drive Copy

S3 に保存されたギャラリー画像・動画を Google Drive フォルダへコピーするための実装です。

## 役割

- `index.js`: S3 `ObjectCreated` イベントから起動される自動コピー Lambda
- `backfill.js`: 既存の `WeddingGuestUploads` レコードを対象に手動コピーするバッチ
- `drive-copy.js`: 共通ロジック

## 前提

1. コピー先フォルダを Google Drive 上に作成する
2. そのフォルダをサービスアカウントへ共有する
3. サービスアカウントキーを Lambda 環境変数に設定する

個人 Google Drive を使う場合にサービスアカウントのストレージクォータ制約へ当たる場合は、OAuth リフレッシュトークン方式を使う。

## 必要な環境変数

```text
UPLOADS_TABLE_NAME=WeddingGuestUploads
GOOGLE_DRIVE_FOLDER_ID=<folder id>
GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL=<service account email>
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=<private key with newline escaped>
```

または、個人 Drive 向けに OAuth で設定する。

```text
UPLOADS_TABLE_NAME=WeddingGuestUploads
GOOGLE_DRIVE_FOLDER_ID=<folder id>
GOOGLE_OAUTH_CLIENT_ID=<oauth client id>
GOOGLE_OAUTH_CLIENT_SECRET=<oauth client secret>
GOOGLE_OAUTH_REFRESH_TOKEN=<oauth refresh token>
```

OAuth が設定されていれば、実装はそちらを優先して使う。

## ファイル名ルール

Google Drive 側では、元ファイル名の末尾に送信者名を付けて保存します。

例:

```text
IMG_1234_山田花子.JPG
movie_末永晃理.mov
```

## バックフィル実行例

```bash
cd eventsite/api/gallery-drive-copy
npm ci
node backfill.js --dry-run
node backfill.js --limit 10
node backfill.js
```

## DDB 更新項目

コピー処理では以下の属性を `WeddingGuestUploads` に保存します。

- `drive_copy_status`
- `drive_copy_attempts`
- `drive_file_id`
- `drive_file_name`
- `drive_file_link`
- `drive_folder_id`
- `drive_copied_at`
- `drive_copy_error`