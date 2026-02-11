import { useState, useEffect } from 'react';

const Home = () => {
  const [guestName, setGuestName] = useState('');

  useEffect(() => {
    // ログイン時に保存したユーザー情報を取得
    const guest = JSON.parse(localStorage.getItem('guest'));
    if (guest && guest.name) {
      setGuestName(guest.name);
    }
  }, []);

  return (
    <div style={{ color: '#333', paddingBottom: '40px' }}>
      {/* ヒーローセクション：メインビジュアル */}
      <div style={{
        height: '60vh',
        backgroundColor: '#E5E5E5', // ここを前撮り写真のURLに変えると最高です
        backgroundImage: 'url("https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070")', 
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#fff',
        textShadow: '1px 1px 10px rgba(0,0,0,0.5)'
      }}>
        <h1 style={{ fontFamily: 'serif', fontSize: '2.5rem', marginBottom: '10px', letterSpacing: '0.1em' }}>
          Welcome
        </h1>
        <p style={{ fontSize: '1rem', letterSpacing: '0.2em' }}>2025.07.07</p>
      </div>

      {/* メッセージセクション */}
      <div style={{ padding: '40px 20px', textAlign: 'center', lineHeight: '2' }}>
        <p style={{ fontSize: '1.2rem', marginBottom: '20px', fontFamily: 'serif' }}>
          {guestName} 様
        </p>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>
          本日はご多用の中 ご列席いただき<br />
          誠にありがとうございます<br />
          <br />
          ささやかな小宴ではございますが<br />
          楽しいひとときをお過ごしいただければ幸いです
        </p>
        
        <div style={{ marginTop: '30px', borderTop: '1px solid #EEE', paddingTop: '30px' }}>
            <p style={{ fontSize: '0.8rem', color: '#B89130' }}>
              # 進行やメニューは下のアイコンからご確認いただけます
            </p>
        </div>
      </div>
    </div>
  );
};

export default Home;