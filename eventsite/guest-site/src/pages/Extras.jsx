import { useState } from 'react';
import styles from './Extras.module.css';

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

const SONG_PLAYLIST = [
  { id: 1, title: '115万キロのフィルム', artist: 'Official髭男dism' },
  { id: 2, title: 'Beautiful', artist: 'Superfly' },
  { id: 3, title: 'Marry You', artist: 'Bruno Mars' },
  { id: 4, title: 'Can\'t Help Falling in Love', artist: 'Elvis Presley' },
  { id: 5, title: '恋', artist: '星野 源' },
  { id: 6, title: 'Stand by Me', artist: 'Ben E. King' },
];

const GITHUB_REPOSITORY_URL = 'https://github.com/Tsucreator/wedding-invitation-landing-page';

const TABS = [
  { id: 'spots', label: 'お店MAP' },
  { id: 'songs', label: 'BGMリスト' },
  { id: 'movies', label: '今日の動画' },
  { id: 'github', label: 'GitHub' },
];

const Extras = () => {
  const [activeTab, setActiveTab] = useState('spots');

  const renderTabContent = () => {
    if (activeTab === 'spots') {
      return (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>好きなお店のリスト</h3>
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
      );
    }

    if (activeTab === 'songs') {
      return (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>当日上映した曲リスト</h3>
          <p className={styles.sectionDescription}>当日の映像演出で使用した楽曲をまとめています。</p>
          <ul className={styles.songList}>
            {SONG_PLAYLIST.map((song) => (
              <li key={song.id} className={styles.songItem}>
                <p className={styles.songTitle}>{song.title}</p>
                <p className={styles.songArtist}>{song.artist}</p>
              </li>
            ))}
          </ul>
        </section>
      );
    }

    if (activeTab === 'movies') {
      return (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>上映した動画のアーカイブ</h3>
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
      );
    }

    return (
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>githubのソース</h3>
        <p className={styles.sectionDescription}>
          本webサイト/招待状のソースコードを公開しているリポジトリです。
          <br />
          ご興味がある方はぜひご覧ください。
          <br />
          実装のご相談も歓迎します。
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
    );
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.title}>おまけ</h2>
        <p className={styles.subtitle}>参考リンクとアーカイブ</p>
      </header>

      <div className={styles.tabs} role="tablist" aria-label="おまけコンテンツの切り替えタブ">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`extras-panel-${tab.id}`}
            id={`extras-tab-${tab.id}`}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`extras-panel-${activeTab}`}
        aria-labelledby={`extras-tab-${activeTab}`}
        className={styles.tabPanel}
      >
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Extras;