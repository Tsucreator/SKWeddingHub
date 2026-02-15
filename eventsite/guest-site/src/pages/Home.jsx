import { useState, useEffect } from 'react';
import styles from './Home.module.css';

const Home = () => {
  const [guestName, setGuestName] = useState('');
  const [guestNameRoma, setGuestNameRoma] = useState('');

  useEffect(() => {
    const guest = JSON.parse(localStorage.getItem('guest'));
    if (guest && guest.name) {
      setGuestName(guest.name);
      setGuestNameRoma(guest.roma);
    }
  }, []);

  return (
    <div className={styles.page}>
      {/* ヒーローセクション */}
      <div className={styles.hero}>
        <h3 className={styles.heroSubtitle}>{guestNameRoma}</h3>
        <h3 className={styles.heroTitle}>Welcome to Our Party</h3>
        <p className={styles.heroDate}>2026.03.20</p>
      </div>

      {/* メッセージセクション */}
      <div className={styles.message}>
        <p className={styles.guestName}>{guestName} 様</p>
        <p className={styles.greeting}>
          本日はご多用の中 ご列席いただき<br />
          誠にありがとうございます<br />
          <br />
          ささやかな小宴ではございますが<br />
          楽しいひとときをお過ごしいただければ幸いです
        </p>

        <div className={styles.divider}>
          <p className={styles.hint}>
            進行やメニューは下のアイコンからご確認いただけます
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;