import styles from './AboutUs.module.css';

const AboutUs = () => {
  return (
    <div className={styles.page}>
      {/* ヘッダー */}
      <div className={styles.header}>
        <h2 className={styles.title}>プロフィール</h2>
      </div>

      {/* 二人の紹介 */}
      <div className={styles.profiles}>
        {/* 新郎 */}
        <div className={styles.profileCard}>
          <div className={styles.photoPlaceholder}>
            <span>S</span>
          </div>
          <h3 className={styles.name}>Shinnosuke</h3>
          <p className={styles.role}>Groom</p>
          <p className={styles.bio}>
            趣味は映画鑑賞と料理。
            休日は二人でカフェ巡りを楽しんでいます。
          </p>
        </div>

        {/* & */}
        <div className={styles.ampersand}>&</div>

        {/* 新婦 */}
        <div className={styles.profileCard}>
          <div className={styles.photoPlaceholder}>
            <span>K</span>
          </div>
          <h3 className={styles.name}>Kaho</h3>
          <p className={styles.role}>Bride</p>
          <p className={styles.bio}>
            趣味は旅行と読書。
            二人の思い出の場所は鎌倉です。
          </p>
        </div>
      </div>

      {/* ストーリー */}
      <div className={styles.story}>
        <div className={styles.storyDivider} />
        <h3 className={styles.storyTitle}>出会いのきっかけ</h3>
        <p className={styles.storyText}>
          2020年の春に出会い<br />
          共に過ごす日々の中で<br />
          かけがえのない存在になりました
        </p>
        <p className={styles.storyText}>
          これからも二人で手を取り合い<br />
          笑顔あふれる家庭を築いてまいります
        </p>
        <p className={styles.storyText}>
          温かく見守っていただけますと幸いです
        </p>
      </div>
    </div>
  );
};

export default AboutUs;