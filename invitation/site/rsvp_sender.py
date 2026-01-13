"""
フロントエンド側のRSVPフォーム送信処理
"""
import json
import requests
import os
from datetime import datetime

def load_config():
    """
    config.jsonから設定を読み込む
    
    Returns:
    --------
    dict: 設定データ
    """
    try:
        # config.jsonのパスを取得（このスクリプトと同じディレクトリ）
        config_path = os.path.join(os.path.dirname(__file__), 'config.json')
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        raise FileNotFoundError("config.json が見つかりません")
    except json.JSONDecodeError:
        raise ValueError("config.json の形式が正しくありません")

def send_rsvp(form_data):
    """
    RSVPフォームのデータをLambda関数に送信する
    
    Parameters:
    -----------
    form_data : dict
        フォームから送信されたデータ
        {
            'attendance': str ('attend' or 'absent'),
            'guest_side': str, # 新郎ゲスト / 新婦ゲスト
            'name': str,
            'kana': str,
            'email': str,
            'allergy': str,
            'message': str,
            'submitted_at': str # ISOフォーマットの日時文字列
        }
    
    Returns:
    --------
    tuple
        (success: bool, message: str)
    """
    # config.jsonからAPIエンドポイントを読み込み
    try:
        config = load_config()
        lambda_url = config['apiEndpoint']
    except (FileNotFoundError, ValueError, KeyError) as e:
        return False, f"設定エラー: {str(e)}"
    
    try:
        # POSTリクエストを送信
        response = requests.post(
            lambda_url,
            json=form_data,
            headers={'Content-Type': 'application/json'}
        )
        
        # レスポンスの解析
        try:
            data = response.json()
        except json.JSONDecodeError:
            # LambdaがJSON以外（エラーHTMLなど）を返した場合の対策
            return False, f"サーバーエラー(Status: {response.status_code}): {response.text[:100]}"
        
        if response.status_code == 200:
            return True, data.get('message', '回答を受け付けました。')
        else:
            return False, data.get('error', '送信に失敗しました。')
            
    except requests.RequestException as e:
        return False, f"ネットワークエラー: {str(e)}"
    except Exception as e:
        return False, f"予期せぬエラー: {str(e)}"

def handle_form_submission():
    """
    フォーム送信時のハンドラー関数の例
    """
    # フォームデータの例（今回のWebフォームの仕様に合わせて全項目を網羅）
    form_data = {
        'attendance': 'attend',           # HTML側のvalueに合わせて 'attend' / 'absent'
        'guest_side': '新郎ゲスト',         # 追加項目
        'name': '山田 太郎',
        'kana': 'やまだ たろう',
        'email': 'yamada@example.com',
        'allergy': '卵アレルギー',
        'message': 'お招きありがとうございます。',
        'submitted_at': datetime.now().isoformat() # JS側と同様に送信日時を追加
    }
    
    print("--- 送信データプレビュー ---")
    print(json.dumps(form_data, indent=2, ensure_ascii=False))
    print("------------------------")
    
    # 送信処理
    success, message = send_rsvp(form_data)
    
    if success:
        print("送信成功:", message)
    else:
        print("送信失敗:", message)

if __name__ == "__main__":
    # テスト用の実行
    handle_form_submission()