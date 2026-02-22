import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Login.module.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'https://qlydtknsq4.execute-api.ap-northeast-1.amazonaws.com/prod/login';

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(API_ENDPOINT, { email });
      
      localStorage.setItem('guest', JSON.stringify(response.data));
      navigate('/', { replace: true });

    } catch (err) {
      console.error(err);
      setError('招待状にお送りしたメールアドレスをご確認ください。');
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