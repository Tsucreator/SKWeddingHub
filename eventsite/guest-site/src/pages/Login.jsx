import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // API URLはご自身のものに差し替えてください
      const response = await axios.post('https://qlydtknsq4.execute-api.ap-northeast-1.amazonaws.com/prod/login', { email });
      localStorage.setItem('guest', JSON.stringify(response.data));
      navigate('/'); // ホームへ移動
    } catch (error) {
      alert('招待状のメールアドレスをご確認ください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      backgroundColor: '#FAFAFA', padding: '20px', textAlign: 'center'
    }}>
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontFamily: 'serif', color: '#B89130', letterSpacing: '0.2em' }}>
          WELCOME
        </h2>
        <p style={{ fontSize: '14px', color: '#666' }}>2025.07.07<br />Taro & Hanako</p>
      </div>

      <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: '300px' }}>
        <input
          type="email"
          placeholder="メールアドレスを入力"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: '100%', padding: '12px', marginBottom: '20px',
            border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px'
          }}
        />
        <button
          disabled={loading}
          style={{
            width: '100%', padding: '12px', backgroundColor: '#1A1A1A',
            color: '#D4AF37', border: 'none', borderRadius: '4px',
            cursor: 'pointer', fontWeight: 'bold', fontSize: '14px'
          }}
        >
          {loading ? '確認中...' : 'LOGIN'}
        </button>
      </form>
    </div>
  );
};

export default Login;