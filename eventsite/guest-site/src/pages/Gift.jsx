import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './Gift.module.css';

const Gift = () => {
  const [guest, setGuest] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'https://qlydtknsq4.execute-api.ap-northeast-1.amazonaws.com/prod/login';
  const giftLink = guest?.gift_url || '#';

  useEffect(() => {
    try {
      const savedGuest = JSON.parse(localStorage.getItem('guest') || 'null');
      if (savedGuest) {
        setGuest(savedGuest);
      }
    } catch {
      setGuest(null);
    }
  }, []);

  const handleVerifyEmail = async () => {
    const trimmedEmail = authEmail.trim();
    if (!trimmedEmail) {
      setErrorMessage('メールアドレスを入力してください');
      return;
    }

    if (!guest?.guest_id) {
      setErrorMessage('ログイン情報が見つかりません 再ログインしてください');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');

    try {
      const response = await axios.post(API_ENDPOINT, {
        action: 'verifyGiftAccess',
        guestId: guest.guest_id,
        email: trimmedEmail,
      });

      const result =
        typeof response.data === 'string'
          ? JSON.parse(response.data)
          : response.data;

      if (result?.ok) {
        setIsVerified(true);
      } else {
        setErrorMessage('メールアドレスをご確認ください');
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('メールアドレスをご確認ください');
      setIsVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>GIFT</h2>
        <p className={styles.subtitle}>引出物のご案内</p>
      </div>

      <div className={styles.content}>
        <p className={styles.greeting}>
          {guest?.name || ''} 様
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
          {!isVerified && (
            <>
              <input
                type="email"
                placeholder="招待状のアドレスを入力"
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                className={styles.emailInput}
                inputMode="email"
                autoComplete="email"
              />
              <button
                type="button"
                className={styles.verifyButton}
                onClick={handleVerifyEmail}
                disabled={isVerifying}
              >
                {isVerifying ? '確認中...' : 'メール認証してギフトを選ぶ'}
              </button>
              {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
            </>
          )}

          {isVerified && (
            <a
              href={giftLink}
              className={styles.giftLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              ギフトを選ぶ
            </a>
          )}
          <p className={styles.linkNote}>
            ※リンクの有効期限がございます
          </p>
        </div>
      </div>
    </div>
  );
};

export default Gift;
