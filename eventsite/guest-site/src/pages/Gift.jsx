import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './Gift.module.css';

const GIFT_DELIVERY_TYPE_CATALOG = 'catalog';
const GIFT_DELIVERY_TYPE_DIRECT_HAND = 'direct_hand';
const AUTO_REDIRECT_DELAY_MS = 1800;

const resolveGiftAccess = (source) => {
  if (!source) {
    return null;
  }

  const resolvedGiftUrl = typeof source.gift_url === 'string' ? source.gift_url.trim() : '';
  const deliveryType =
    source.gift_delivery_type ||
    (resolvedGiftUrl ? GIFT_DELIVERY_TYPE_CATALOG : GIFT_DELIVERY_TYPE_DIRECT_HAND);

  return {
    deliveryType,
    giftUrl: resolvedGiftUrl,
    message: source.gift_message || '',
  };
};

const Gift = () => {
  const [guest, setGuest] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [giftAccess, setGiftAccess] = useState(null);

  const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'https://qlydtknsq4.execute-api.ap-northeast-1.amazonaws.com/prod/login';
  const guestName = guest?.name || '';
  const shouldAutoRedirect = isVerified && giftAccess?.deliveryType === GIFT_DELIVERY_TYPE_CATALOG && Boolean(giftAccess?.giftUrl);
  const directHandMessage = giftAccess?.message || `${guestName}様の引出物は別途ご用意しております。当日、ホストの2人より直接お渡しいたします。`;

  useEffect(() => {
    try {
      const savedGuest = JSON.parse(localStorage.getItem('guest') || 'null');
      if (savedGuest) {
        setGuest(savedGuest);
        const savedGiftAccess = resolveGiftAccess(savedGuest);

        if (savedGiftAccess?.deliveryType === GIFT_DELIVERY_TYPE_DIRECT_HAND) {
          setGiftAccess(savedGiftAccess);
          setIsVerified(true);
        }
      }
    } catch {
      setGuest(null);
    }
  }, []);

  useEffect(() => {
    if (!shouldAutoRedirect) {
      return undefined;
    }

    const redirectTimer = window.setTimeout(() => {
      window.location.assign(giftAccess.giftUrl);
    }, AUTO_REDIRECT_DELAY_MS);

    return () => {
      window.clearTimeout(redirectTimer);
    };
  }, [giftAccess, shouldAutoRedirect]);

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
    setGiftAccess(null);

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
        setGiftAccess(resolveGiftAccess(result));
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
            {isVerified && giftAccess?.deliveryType === GIFT_DELIVERY_TYPE_DIRECT_HAND
              ? 'ご案内をご確認ください'
              : '下記よりお好みのギフトをお選びいただけます'}
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

          {isVerified && giftAccess?.deliveryType === GIFT_DELIVERY_TYPE_CATALOG && giftAccess?.giftUrl && (
            <>
              <p className={styles.verifiedMessage}>
                認証が完了しました。まもなくギフト選択ページへ移動します。
              </p>
              <a
                href={giftAccess.giftUrl}
                className={styles.giftLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                ギフトを選ぶ
              </a>
            </>
          )}

          {isVerified && giftAccess?.deliveryType === GIFT_DELIVERY_TYPE_DIRECT_HAND && (
            <div className={styles.statusPanel}>
              <p className={styles.directMessage}>{directHandMessage}</p>
            </div>
          )}

          <p className={styles.linkNote}>
            {giftAccess?.deliveryType === GIFT_DELIVERY_TYPE_DIRECT_HAND
              ? '※ご不明点がございましたら当日お近くのスタッフへお声がけください'
              : '※リンクの有効期限がございます'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Gift;
