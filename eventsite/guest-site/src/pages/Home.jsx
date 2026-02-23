import { useState, useEffect } from 'react';
import styles from './Home.module.css';
import heroImage from '../assets/hero.webp';

const HOME_INTRO_PENDING_KEY = 'home_intro_pending';
const INTRO_MIN_DELAY_MS = 500;
const INTRO_MAX_WAIT_MS = 2200;

const Home = () => {
  const [needsIntro] = useState(() => {
    try {
      return sessionStorage.getItem(HOME_INTRO_PENDING_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [guestName] = useState(() => {
    try {
      const guest = JSON.parse(localStorage.getItem('guest') || '{}');
      return guest?.name || '';
    } catch {
      return '';
    }
  });
  const [guestNameRoma] = useState(() => {
    try {
      const guest = JSON.parse(localStorage.getItem('guest') || '{}');
      return guest?.roma || '';
    } catch {
      return '';
    }
  });
  const [isHeroReady, setIsHeroReady] = useState(() => {
    return !needsIntro;
  });

  useEffect(() => {
    if (!needsIntro) return;

    sessionStorage.removeItem(HOME_INTRO_PENDING_KEY);

    let minDelayDone = false;
    let imageReady = false;

    const revealIfReady = () => {
      if (minDelayDone && imageReady) {
        setIsHeroReady(true);
      }
    };

    const minDelayTimer = window.setTimeout(() => {
      minDelayDone = true;
      revealIfReady();
    }, INTRO_MIN_DELAY_MS);

    const maxWaitTimer = window.setTimeout(() => {
      imageReady = true;
      revealIfReady();
    }, INTRO_MAX_WAIT_MS);

    const image = new Image();
    image.src = heroImage;
    image.onload = () => {
      imageReady = true;
      revealIfReady();
    };
    image.onerror = () => {
      imageReady = true;
      revealIfReady();
    };

    return () => {
      window.clearTimeout(minDelayTimer);
      window.clearTimeout(maxWaitTimer);
      image.onload = null;
      image.onerror = null;
    };
  }, [needsIntro]);

  return (
    <div className={styles.page}>
      {/* ヒーローセクション */}
      <div
        className={`${styles.hero} ${isHeroReady ? styles.heroReady : styles.heroPending}`}
        style={{ backgroundImage: isHeroReady ? `url(${heroImage})` : 'none' }}
      >
        <div className={`${styles.heroTextGroup} ${isHeroReady ? styles.heroTextReady : styles.heroTextPending}`}>
          <h3 className={styles.heroSubtitle}>{guestNameRoma}</h3>
          <h3 className={styles.heroTitle}>Welcome to Our Party</h3>
          <p className={styles.heroDate}>2026.03.20</p>
        </div>
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