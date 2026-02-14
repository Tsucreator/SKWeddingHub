import { useState } from 'react';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'https://qlydtknsq4.execute-api.ap-northeast-1.amazonaws.com/prod/login';

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    try {
      const response = await axios.post(API_ENDPOINT, { email });
      
      localStorage.setItem('guest', JSON.stringify(response.data));
      window.location.href = '/eventsite/';

    } catch (error) {
      console.error(error);
      alert('招待状にお送りしたメールアドレスをご確認ください。');
      setLoading(false); // エラー時のみローディングを解除
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600&display=swap');

        :root {
          --color-gold: #D4AF37;
          --color-black: #1A1A1A;
          --color-white: #FFFFFF;
        }

        /* すべての要素でパディングを含めた幅計算を行う（必須） */
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
          width: 100%;
          background-color: var(--color-black);
          color: var(--color-white);
          font-family: 'Noto Serif JP', serif;
          overflow-x: hidden; /* 横スクロール発生を防止 */
          display: flex;
          justify-content: center; 
        }

        .login-container {
          /* 画面幅いっぱいを使う */
          width: 100%;
          max-width: 480px; 

          /* アドレスバー考慮の高さ設定 */
          min-height: 100vh;
          min-height: 100dvh;
          
          /* 上下左右中央揃え */
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          
          background: radial-gradient(circle at center, #2a2a2a 0%, #1a1a1a 100%);
          
          /* 
           * 【重要】スマホごとの個体差を吸収するレスポンシブPadding 
           *  これにより、どの端末でも画面端までの距離が適切に保たれます。
           */
          padding-top: max(20px, env(safe-area-inset-top));
          padding-bottom: max(20px, env(safe-area-inset-bottom));
          
          /* デフォルト（PC/タブレット等） */
          padding-left: 24px;
          padding-right: 24px;
        }

        /* 
         * コンテンツ幅の制御
         * 入力フォームなどが広がりすぎないように上限(400px)だけ設け、
         * それ以下（スマホ）なら幅100%で親のpaddingに従う 
         */
        .content-inner {
          width: 100%;
          max-width: 400px; 
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        /* --- スマホサイズ別の最適化 (Media Queries) --- */

        /* 1. 小さいスマホ (iPhone SE 1st, 古いAndroidなど幅320px程度) */
        @media screen and (max-width: 374px) {
          .login-container {
            /* 画面が狭いので余白を削り、入力エリアを確保する */
            padding-left: 16px;
            padding-right: 16px;
          }
          .title { font-size: 26px; }
        }

        /* 2. 標準的なスマホ (iPhone 8, SE 2/3, X, 11 Proなど幅375px程度) */
        @media screen and (min-width: 375px) and (max-width: 410px) {
          .login-container {
            /* バランスの良い標準的な余白 */
            padding-left: 24px;
            padding-right: 24px;
          }
        }

        /* 3. 大きいスマホ (iPhone Pro Max, Plus, Pixelなど幅414px~430px程度) */
        @media screen and (min-width: 411px) {
          .login-container {
            /* 画面が広いので余白を少しリッチにとる */
            padding-left: 32px;
            padding-right: 32px;
          }
        }

        /* ------------------------------------------- */

        .title {
          font-family: 'Noto Serif JP', serif;
          color: var(--color-gold);
          font-size: 32px;
          letter-spacing: 0.2em;
          margin: 0 0 10px 0;
          font-weight: 400;
          width: 100%;
          /* 長いタイトルも画面内に収まるように調整 */
          word-break: break-word; 
        }

        .subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.75);
          line-height: 2;
          letter-spacing: 0.15em;
          margin-bottom: 48px;
        }

        .form-wrapper {
          width: 100%; /* 親要素(content-inner)の幅いっぱい */
        }

        .input-field {
          /* ここで width: 100% を指定することで、余白を除いた画面幅いっぱいになる */
          width: 100%;
          padding: 16px;
          font-size: 16px; 
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.4);
          border-radius: 2px;
          color: #fff;
          outline: none;
          transition: all 0.3s ease;
          font-family: 'Noto Serif JP', serif;
          appearance: none;
        }

        .input-field:focus {
          border-color: var(--color-gold);
          background: rgba(255, 255, 255, 0.1);
          box-shadow: 0 0 15px rgba(212, 175, 55, 0.15);
        }

        .login-button {
          width: 100%; /* ボタンも幅いっぱい */
          margin-top: 24px;
          padding: 16px;
          background-color: var(--color-gold);
          color: var(--color-black);
          border: none;
          border-radius: 2px;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.2em;
          cursor: pointer;
          transition: opacity 0.3s;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .login-button:disabled {
          opacity: 0.6;
        }
        
        .fade-in {
          animation: fadeIn 1.2s ease-in-out;
          width: 100%;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="login-container">
        <div className="content-inner fade-in">
          
          <div style={{ width: '100%' }}>
            <h2 className="title">WELCOME</h2>
            <p className="subtitle">
              2026.03.20<br />
              Shinnosuke & Kaho<br />
              Wedding Reception
            </p>
          </div>

          <form className="form-wrapper" onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="招待状のアドレスを入力"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              required
              className="input-field"
              inputMode="email" 
              autoComplete="email"
            />
            
            <button
              type="submit"
              disabled={loading}
              className="login-button"
            >
              {loading ? '確認中...' : 'ログイン'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;