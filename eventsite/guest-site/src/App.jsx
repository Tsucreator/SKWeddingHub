import { useState } from 'react'
import axios from 'axios'

function App() {
  const [email, setEmail] = useState('');
  const [user, setUser] = useState(null);

  const handleLogin = async () => {
    try {
      // あなたのAPI GatewayのURLに書き換えてください
      const response = await axios.post('https://qlydtknsq4.execute-api.ap-northeast-1.amazonaws.com/login', {
        email: email
      });
      setUser(response.data);
      localStorage.setItem('guest', JSON.stringify(response.data));
      alert('ログイン成功！');
    } catch (error) {
      alert('メールアドレスが見つかりません');
    }
  };

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'serif' }}>
      <h1 style={{ color: '#D4AF37' }}>Welcome to Our Wedding</h1>
      
      {!user ? (
        <div>
          <p>招待状を受け取ったメールアドレスを入力してください</p>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: '10px', width: '80%', maxWidth: '300px' }}
          />
          <br /><br />
          <button onClick={handleLogin} style={{ padding: '10px 20px', backgroundColor: '#D4AF37', color: '#fff', border: 'none' }}>
            ログイン
          </button>
        </div>
      ) : (
        <div>
          <h2>ようこそ、{user.name} 様</h2>
          <p>お席は {user.table_id} テーブルです</p>
        </div>
      )}
    </div>
  )
}

export default App