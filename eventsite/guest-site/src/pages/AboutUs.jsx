import styles from './AboutUs.module.css';

const FAVORITE_SPOTS = [
  {
    id: 1,
    category: '焼肉',
    name: '叙々苑',
    description: '特別な日に行きたくなる、二人のお気に入りの焼肉店です。',
    url: 'https://www.jojoen.co.jp/',
  },
  {
    id: 2,
    category: 'ピザ',
    name: 'PIZZA SLICE',
    description: 'カジュアルに立ち寄れる、ボリューム感あるピザが好みです。',
    url: 'https://pizzaslice.jp/',
  },
];

const MOVIE_ARCHIVE = [
  {
    id: 1,
    title: 'Opening Movie',
    youtubeId: 'dQw4w9WgXcQ',
  },
  {
    id: 2,
    title: 'Our Story Movie',
    youtubeId: 'ScMzIvxBSi4',
  },
];

const GITHUB_REPOSITORY_URL = 'https://github.com/';

const AboutUs = () => {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.title}>おまけ</h2>
        <p className={styles.subtitle}>参考リンクとアーカイブ</p>
      </header>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>好きなお店（焼肉・ピザ）</h3>
        <p className={styles.sectionDescription}>
          二人がよく話題にしているお店です。気になる方はぜひご覧ください。
        </p>
        <div className={styles.spotList}>
          {FAVORITE_SPOTS.map((spot) => (
            <article key={spot.id} className={styles.spotCard}>
              <p className={styles.spotCategory}>{spot.category}</p>
              <h4 className={styles.spotName}>{spot.name}</h4>
              <p className={styles.spotDescription}>{spot.description}</p>
              <a href={spot.url} target="_blank" rel="noopener noreferrer" className={styles.linkButton}>
                公式サイトを見る
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>上映動画アーカイブ</h3>
        <p className={styles.sectionDescription}>
          当日上映したムービーを、アーカイブとしてこちらにまとめています。
        </p>
        <div className={styles.movieList}>
          {MOVIE_ARCHIVE.map((movie) => (
            <article key={movie.id} className={styles.movieCard}>
              <h4 className={styles.movieTitle}>{movie.title}</h4>
              <div className={styles.movieFrameWrap}>
                <iframe
                  className={styles.movieFrame}
                  src={`https://www.youtube.com/embed/${movie.youtubeId}`}
                  title={movie.title}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>GitHub</h3>
        <p className={styles.sectionDescription}>
          このサイトのソースコードを公開しているリポジトリです。
        </p>
        <a
          href={GITHUB_REPOSITORY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.primaryLink}
        >
          ソースコードを見る
        </a>
      </section>
    </div>
  );
};

export default AboutUs;