import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Login.module.css';

const GUEST_KEY = 'guest';
const GUEST_EXPIRES_AT_KEY = 'guest_expires_at';
const SESSION_TTL_MS = 48 * 60 * 60 * 1000;
const LOGIN_TYPE_EMAIL = 'email';
const LOGIN_TYPE_KANA = 'kana';

const Login = () => {
  const [loginType, setLoginType] = useState(LOGIN_TYPE_EMAIL);
  const [email, setEmail] = useState('');
  const [kanaSei, setKanaSei] = useState('');
  const [kanaMei, setKanaMei] = useState('');
  const [side, setSide] = useState('新郎側');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(GUEST_KEY);
      const rawExpiresAt = localStorage.getItem(GUEST_EXPIRES_AT_KEY);
      if (!raw) return;

      const expiresAt = Number(rawExpiresAt);
      if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
        localStorage.removeItem(GUEST_KEY);
        localStorage.removeItem(GUEST_EXPIRES_AT_KEY);
        return;
      }

      const guest = JSON.parse(raw);
      if (guest?.email) {
        navigate('/', { replace: true });
      }
    } catch {
      localStorage.removeItem(GUEST_KEY);
      localStorage.removeItem(GUEST_EXPIRES_AT_KEY);
    }
  }, [navigate]);

  const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'https://qlydtknsq4.execute-api.ap-northeast-1.amazonaws.com/prod/login';

  const handleLogin = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedKanaSei = kanaSei.trim();
    const trimmedKanaMei = kanaMei.trim();

    if (loginType === LOGIN_TYPE_EMAIL && !trimmedEmail) return;
    if (loginType === LOGIN_TYPE_KANA && (!trimmedKanaSei || !trimmedKanaMei || !side)) return;
    
    setLoading(true);
    setError('');
    try {
      const payload =
        loginType === LOGIN_TYPE_EMAIL
          ? {
              loginType: LOGIN_TYPE_EMAIL,
              email: trimmedEmail,
            }
          : {
              loginType: LOGIN_TYPE_KANA,
              kanaSei: trimmedKanaSei,
              kanaMei: trimmedKanaMei,
              side,
            };

      const response = await axios.post(API_ENDPOINT, payload);

      const guestData =
        typeof response.data === 'string'
          ? JSON.parse(response.data)
          : response.data;

      if (!guestData || !guestData.guest_id) {
        throw new Error('Invalid login response');
      }

      localStorage.setItem(GUEST_KEY, JSON.stringify(guestData));
      localStorage.setItem(GUEST_EXPIRES_AT_KEY, String(Date.now() + SESSION_TTL_MS));
      navigate('/', { replace: true });

    } catch (err) {
      console.error(err);
      setError(
        loginType === LOGIN_TYPE_EMAIL
          ? '招待状にお送りしたメールアドレスをご確認ください。'
          : 'ふりがな（せい・めい）と新郎側/新婦側をご確認ください。'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.contentInner} ${styles.fadeIn}`}>
        <div style={{ width: '100%' }}>
          <h2 className={styles.title}>WELCOME</h2>
          <p className={styles.subtitle}>
            2026.03.20<br />
            Shinnosuke & Kaho<br />
            Wedding Reception
          </p>
        </div>

        <form className={styles.formWrapper} onSubmit={handleLogin}>
          <div className={styles.loginTypeTabs}>
            <button
              type="button"
              className={loginType === LOGIN_TYPE_EMAIL ? styles.loginTypeTabActive : styles.loginTypeTab}
              onClick={() => {
                setLoginType(LOGIN_TYPE_EMAIL);
                setError('');
              }}
            >
              メールアドレス
            </button>
            <button
              type="button"
              className={loginType === LOGIN_TYPE_KANA ? styles.loginTypeTabActive : styles.loginTypeTab}
              onClick={() => {
                setLoginType(LOGIN_TYPE_KANA);
                setError('');
              }}
            >
              メールを忘れた方
            </button>
          </div>

          {loginType === LOGIN_TYPE_EMAIL ? (
            <input
              type="email"
              placeholder="招待状のアドレスを入力"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.inputField}
              inputMode="email"
              autoComplete="email"
            />
          ) : (
            <div className={styles.fallbackFields}>
              <div className={styles.kanaSplitFields}>
                <input
                  type="text"
                  placeholder="せい（ひらがな）"
                  value={kanaSei}
                  onChange={(e) => setKanaSei(e.target.value)}
                  required
                  className={styles.inputField}
                  autoComplete="off"
                />
                <input
                  type="text"
                  placeholder="めい（ひらがな）"
                  value={kanaMei}
                  onChange={(e) => setKanaMei(e.target.value)}
                  required
                  className={styles.inputField}
                  autoComplete="off"
                />
              </div>
              <select
                value={side}
                onChange={(e) => setSide(e.target.value)}
                className={styles.inputField}
              >
                <option value="新郎側">新郎</option>
                <option value="新婦側">新婦</option>
              </select>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className={styles.loginButton}
          >
            {loading ? '確認中...' : 'ログイン'}
          </button>

          {error && (
            <p className={styles.errorMessage}>{error}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;