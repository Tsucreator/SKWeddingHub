import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Login.module.css';

const GUEST_KEY = 'guest';
const GUEST_EXPIRES_AT_KEY = 'guest_expires_at';
const SESSION_TTL_MS = 48 * 60 * 60 * 1000;

const Login = () => {
  const [email, setEmail] = useState('');
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
    if (!email) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(API_ENDPOINT, { email });

      const guestData =
        typeof response.data === 'string'
          ? JSON.parse(response.data)
          : response.data;

      if (!guestData || !guestData.email) {
        throw new Error('Invalid login response');
      }

      localStorage.setItem(GUEST_KEY, JSON.stringify(guestData));
      localStorage.setItem(GUEST_EXPIRES_AT_KEY, String(Date.now() + SESSION_TTL_MS));
      navigate('/', { replace: true });

    } catch (err) {
      console.error(err);
      setError('招待状にお送りしたメールアドレスをご確認ください。');
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