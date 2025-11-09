# gspread 用 Lambda レイヤー

このフォルダには、Python 向けの AWS Lambda レイヤー（事前パッケージ済み）が含まれています。収録パッケージ:
- gspread
- oauth2client
- google-auth
- requests（および依存関係）

作成済みの ZIP アーカイブは `gspread-layer.zip` です。Lambda の要件どおり、ZIP のトップに `python/` ディレクトリを含んでいます。

## レイヤーを公開する手順（AWS コンソール）

1. AWS コンソール → Lambda → Layers → Create layer
2. Name: `gspread-layer`
3. Upload: `gspread-layer.zip` をアップロード
4. Compatible runtimes: Python 3.11
5. Architecture: x86_64（必要に応じて arm64）
6. Create を実行

作成後、表示される Layer Version ARN を控えておきます。

## 関数へレイヤーをアタッチする

1. AWS コンソール → Lambda → Functions → `writeGoogleSpreadSheet`
2. Configuration → Layers → Edit
3. Add a layer → Specify an ARN → 先ほど控えた Layer Version ARN を貼り付け
4. Save

`invitation-pages/api/lambda/lambda_function.py` にコード変更は不要です。レイヤーがアタッチされていれば `gspread` を自動的に import し、未アタッチの場合はスプレッドシート書き込みを安全にスキップします。

## 補足
- 同梱パッケージは純 Python です。Amazon Linux のバリエーション間でも動作します。
- パッケージ更新時は ZIP を再作成し、新しいレイヤーバージョンを公開してから、関数が最新バージョンを参照するよう更新してください。
- リージョンは関数と同じ（例: ap-northeast-1）にしてください。
