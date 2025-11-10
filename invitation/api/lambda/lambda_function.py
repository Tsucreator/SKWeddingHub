import json
import os
import re
import logging
from datetime import datetime
import boto3
from botocore.exceptions import ClientError
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# スプレッドシート統合は環境変数に応じて任意化
try:
    import gspread
    GSPREAD_AVAILABLE = True
except ImportError:
    GSPREAD_AVAILABLE = False

# 構造化ログ設定
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# --- Googleスプレッドシートへの書き込み処理（任意機能） ---
def write_to_spreadsheet(data):
    """
    Secrets Managerから認証情報を取得し、スプレッドシートにデータを書き込む。
    環境変数が未設定の場合はスキップ（任意機能）。
    """
    secret_name = os.environ.get('SECRET_NAME')
    spreadsheet_key = os.environ.get('SPREADSHEET_KEY')
    worksheet_name = os.environ.get('WORKSHEET_NAME')

    # スプレッドシート設定が未指定ならスキップ
    if not all([secret_name, spreadsheet_key, worksheet_name]):
        logger.info("Spreadsheet env vars not set, skipping spreadsheet write")
        return True, "Spreadsheet integration disabled (env vars missing)"

    if not GSPREAD_AVAILABLE:
        logger.warning("gspread not installed, skipping spreadsheet write")
        return True, "Spreadsheet integration disabled (gspread not available)"

    try:
        # タイムスタンプ追加
        timestamp = datetime.utcnow().isoformat() + 'Z'
        
        # 1. Secrets Managerから認証情報を取得
        session = boto3.session.Session()
        client = session.client(service_name='secretsmanager')
        get_secret_value_response = client.get_secret_value(SecretId=secret_name)
        secret = json.loads(get_secret_value_response['SecretString'])

        # 2. 認証情報を使ってGoogleスプレッドシートに接続
        gc = gspread.service_account_from_dict(secret)
        spreadsheet = gc.open_by_key(spreadsheet_key)
        worksheet = spreadsheet.worksheet(worksheet_name)

        # 3. スプレッドシートに書き込む行データを作成（タイムスタンプ付き）
        new_row = [
            timestamp,
            data.get('name'),
            data.get('kana'),
            data.get('attendance'),
            data.get('email'),
            data.get('allergy', ''),
            data.get('message', '')
        ]

        # 4. 新しい行としてデータを末尾に追加
        worksheet.append_row(new_row)
        logger.info(f"Spreadsheet write success for {data.get('email')}")
        
        return True, "Successfully wrote to spreadsheet"
        
    except Exception as e:
        logger.error(f"Spreadsheet write error: {e}", exc_info=True)
        return False, str(e)


# --- (ここから下は元のメール送信コード) ---
def normalize_attendance(value: str) -> str:
    """フォームからの多様な値を『ご出席/ご欠席/未選択』に正規化する"""
    if not value:
        return "未選択"
    v = str(value).strip().lower()
    present_keys = {'attend', 'present', 'yes', 'true', 'ご出席', '出席', '参加'}
    absent_keys = {'absent', 'no', 'false', 'ご欠席', '欠席', '不参加'}
    if v in present_keys:
        return "ご出席"
    if v in absent_keys:
        return "ご欠席"
    # 日本語そのままが来た場合のフォールバック
    if value in ['ご出席', '出席', '参加']:
        return "ご出席"
    if value in ['ご欠席', '欠席', '不参加']:
        return "ご欠席"
    return "未選択"


def create_email_body(data):
    """メール本文を生成する"""
    attendance = normalize_attendance(data.get('attendance'))
    
    body = f"""
結婚式の出欠回答が届きました。

お名前: {data.get('name')}
ふりがな: {data.get('kana')}
出欠: {attendance}
メールアドレス: {data.get('email')}

アレルギー:
{data.get('allergy') or '記載なし'}

メッセージ:
{data.get('message') or '記載なし'}
    """
    return body.strip()

def send_email(data):
    """SESを使用してメールを送信する"""
    sender = os.environ.get('SENDER_EMAIL')
    recipient = os.environ.get('RECIPIENT_EMAIL')
    aws_region = os.environ.get('AWS_REGION', 'ap-northeast-1')
    
    if not sender or not recipient:
        logger.error("SENDER_EMAIL or RECIPIENT_EMAIL not configured")
        return False, "Email configuration missing"
    
    attendance = normalize_attendance(data.get('attendance'))

    msg = MIMEMultipart()
    msg['Subject'] = f"結婚式出欠回答: {data.get('name')}様 ({attendance})"
    msg['From'] = sender
    msg['To'] = recipient
    msg.attach(MIMEText(create_email_body(data), 'plain', 'utf-8'))

    try:
        client = boto3.client('ses', region_name=aws_region)
        response = client.send_raw_email(
            Source=sender,
            Destinations=[recipient],
            RawMessage={'Data': msg.as_string()}
        )
        logger.info(f"Email sent successfully: MessageId={response['MessageId']}")
        return True, response['MessageId']
    except ClientError as e:
        logger.error(f"SES send error: {e.response['Error']}", exc_info=True)
        return False, str(e.response['Error'])


# --- 入力サニタイゼーション ---
def sanitize_input(data):
    """入力データの基本的なサニタイゼーション"""
    sanitized = {}
    for key, value in data.items():
        if isinstance(value, str):
            # 前後の空白除去、制御文字除去
            sanitized[key] = value.strip()[:500]  # 最大500文字に制限
        else:
            sanitized[key] = value
    return sanitized


def validate_email(email):
    """簡易的なメールアドレスバリデーション"""
    if not email:
        return False
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


# --- メインハンドラー（エンハンス版） ---
def lambda_handler(event, context):
    """
    Lambda関数のメインハンドラー
    - 入力検証とサニタイゼーション
    - スプレッドシート保存（任意）
    - SESメール通知
    - 構造化ログ出力
    """
    request_id = context.aws_request_id if context else 'local'
    logger.info(f"Request started: {request_id}")
    
    try:
        # リクエストボディの解析
        body = event.get('body', '{}')
        if isinstance(body, str):
            data = json.loads(body)
        else:
            data = body
        
        # サニタイゼーション
        data = sanitize_input(data)
        
        # 必須フィールドのバリデーション
        required_fields = ['name', 'kana', 'email', 'attendance']
        missing = [field for field in required_fields if not data.get(field)]
        if missing:
            logger.warning(f"Validation failed: missing fields {missing}")
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'error': f'必須項目が不足しています: {", ".join(missing)}',
                    'missing_fields': missing
                }, ensure_ascii=False)
            }
        
        # メールアドレス形式チェック
        if not validate_email(data.get('email')):
            logger.warning(f"Invalid email format: {data.get('email')}")
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'error': 'メールアドレスの形式が正しくありません'
                }, ensure_ascii=False)
            }
        
        # attendance を正規化
        data['attendance'] = normalize_attendance(data.get('attendance'))
        logger.info(f"Processing RSVP: {data.get('name')} ({data.get('attendance')})")
        
        # 1. スプレッドシートに書き込み（任意機能）
        spreadsheet_success, spreadsheet_result = write_to_spreadsheet(data)
        
        # スプレッドシート書き込みエラーは警告扱い（メールがメイン機能）
        if not spreadsheet_success and os.environ.get('SECRET_NAME'):
            logger.warning(f"Spreadsheet write failed but continuing: {spreadsheet_result}")
        
        # 2. メールを送信（必須機能）
        email_success, email_result = send_email(data)
        
        if not email_success:
            logger.error(f"Email send failed: {email_result}")
            return {
                'statusCode': 500,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'error': 'メール送信に失敗しました。しばらく経ってから再度お試しください。'
                }, ensure_ascii=False)
            }
        
        # 成功レスポンス
        logger.info(f"Request completed successfully: {request_id}")
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': '回答を受け付けました。ありがとうございます。',
                'success': True
            }, ensure_ascii=False)
        }
    
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}")
        return {
            'statusCode': 400,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': 'リクエストの形式が正しくありません'
            }, ensure_ascii=False)
        }
    
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': '予期しないエラーが発生しました。管理者にお問い合わせください。'
            }, ensure_ascii=False)
        }