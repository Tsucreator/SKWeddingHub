"""
フロントエンド側のRSVPフォーム送信処理
"""
import json
import requests
from datetime import datetime

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
            'gender': str,     # 男性 / 女性 / 回答しない
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
    # Lambda関数のエンドポイントURL
    # ※実際のURLに書き換えてください
    LAMBDA_URL = "https://xxxxx.execute-api.ap-northeast-1.amazonaws.com/submit"
    
    try:
        # POSTリクエストを送信
        response = requests.post(
            LAMBDA_URL,
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
        'gender': '男性',                 # 追加項目
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