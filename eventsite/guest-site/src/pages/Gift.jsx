import { useState, useEffect } from 'react';
import styles from './Gift.module.css';

const Gift = () => {
  const [guestName, setGuestName] = useState('');

  useEffect(() => {
    const guest = JSON.parse(localStorage.getItem('guest'));
    if (guest && guest.name) {
      setGuestName(guest.name);
    }
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>GIFT</h2>
        <p className={styles.subtitle}>引出物のご案内</p>
      </div>

      <div className={styles.content}>
        <p className={styles.greeting}>
          {guestName} 様
        </p>

        <p className={styles.description}>
          ささやかではございますが<br />
          感謝の気持ちを込めて<br />
          引出物をご用意いたしました
        </p>

        <div className={styles.linkCard}>
          <p className={styles.linkLabel}>
            下記よりお好みのギフトを<br />お選びいただけます
          </p>
          <a
            href="#"
            className={styles.giftLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            ギフトを選ぶ
          </a>
          <p className={styles.linkNote}>
            ※リンクの有効期限がございます
          </p>
        </div>
      </div>
    </div>
  );
};

export default Gift;
