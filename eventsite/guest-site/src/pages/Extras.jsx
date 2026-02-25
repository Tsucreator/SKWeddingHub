import { useEffect, useMemo, useState } from 'react';
import styles from './Extras.module.css';

const FAVORITE_SPOTS = [
  {
    id: 1,
    category: '焼肉',
    name: '叙々苑',
    description: '特別な日に行きたくなる 二人のお気に入りの焼肉店です',
    url: 'https://www.jojoen.co.jp/',
  },
  {
    id: 2,
    category: 'ピザ',
    name: 'PIZZA SLICE',
    description: 'カジュアルに立ち寄れる ボリューム感あるピザが好みです',
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
  { id: 1, scene: '歓談', name: '115万キロのフィルム', artists: 'Official髭男dism', spotifyLink: '' },
  { id: 2, scene: '歓談', name: 'Beautiful', artists: 'Superfly', spotifyLink: '' },
  { id: 3, scene: '入場', name: 'Marry You', artists: 'Bruno Mars', spotifyLink: '' },
  { id: 4, scene: '歓談', name: 'Can\'t Help Falling in Love', artists: 'Elvis Presley', spotifyLink: '' },
  { id: 5, scene: '歓談', name: '恋', artists: '星野 源', spotifyLink: '' },
  { id: 6, scene: '歓談', name: 'Stand by Me', artists: 'Ben E. King', spotifyLink: '' },
];

const GITHUB_REPOSITORY_URL = 'https://github.com/Tsucreator/wedding-invitation-landing-page';
const MUSICLIST_URL = import.meta.env.VITE_MUSICLIST_URL || 'musiclist.csv';

const TABS = [
  { id: 'spots', label: 'お店MAP' },
  { id: 'songs', label: 'BGMリスト' },
  { id: 'movies', label: '今日の動画' },
  { id: 'github', label: 'GitHub' },
];

const parseCsvLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

const parseMusicCsv = (csvText) => {
  const lines = csvText
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);

  return lines
    .slice(1)
    .map((line) => {
      const cols = parseCsvLine(line);
      const row = Object.fromEntries(headers.map((header, idx) => [header, cols[idx] ?? '']));

      return {
        id: row['#']?.trim() || `${row['Scene']}-${row['Name']}-${row['Artists']}`,
        scene: row['Scene']?.trim() || '',
        name: row['Name']?.trim() || '',
        artists: row['Artists']?.trim() || '',
        spotifyLink: row['Link(Spotify)']?.trim() || '',
      };
    })
    .filter((song) => song.name);
};

const Extras = () => {
  const [activeTab, setActiveTab] = useState('spots');
  const [songs, setSongs] = useState(SONG_PLAYLIST);
  const [isSongsLoading, setIsSongsLoading] = useState(true);
  const [songsError, setSongsError] = useState('');

  useEffect(() => {
    const loadMusicList = async () => {
      try {
        const response = await fetch(MUSICLIST_URL, {
          headers: {
            Accept: 'text/csv',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch music list: ${response.status}`);
        }

        const csvText = await response.text();
        const parsedSongs = parseMusicCsv(csvText);

        if (parsedSongs.length > 0) {
          setSongs(parsedSongs);
          setSongsError('');
        } else {
          setSongsError('BGMリストの読み込みに失敗したため 初期リストを表示しています');
        }
      } catch (error) {
        console.error('musiclist.csv load error', error);
        setSongsError('BGMリストの読み込みに失敗したため 初期リストを表示しています');
      } finally {
        setIsSongsLoading(false);
      }
    };

    loadMusicList();
  }, []);

  const songCountLabel = useMemo(() => `全 ${songs.length} 曲`, [songs.length]);
  const songsByScene = useMemo(() => {
    return songs.reduce((groups, song) => {
      const sceneKey = song.scene || 'その他';
      if (!groups[sceneKey]) {
        groups[sceneKey] = [];
      }
      groups[sceneKey].push(song);
      return groups;
    }, {});
  }, [songs]);

  const renderTabContent = () => {
    if (activeTab === 'spots') {
      return (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>好きなお店のリスト</h3>
          <p className={styles.sectionDescription}>
            二人がの好きなお店をランキングにしました！ぜひご覧ください
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
          <p className={styles.sectionDescription}>当日の映像演出で使用した楽曲をまとめています</p>

          {isSongsLoading && <p className={styles.songStatus}>BGMリストを読み込み中です...</p>}
          {!isSongsLoading && songsError && <p className={styles.songStatus}>{songsError}</p>}
          {!isSongsLoading && <p className={styles.songCount}>{songCountLabel}</p>}

          <div className={styles.songSceneList}>
            {Object.entries(songsByScene).map(([scene, sceneSongs]) => (
              <section key={scene} className={styles.songGroup}>
                <h4 className={styles.songCategory}>{scene}</h4>
                <ul className={styles.songList}>
                  {sceneSongs.map((song) => (
                    <li key={song.id} className={styles.songItem}>
                      <div className={styles.songMain}>
                        <p className={styles.songTitle}>{song.name}</p>
                        <p className={styles.songMeta}>{song.artists}</p>
                      </div>

                      {song.spotifyLink && (
                        <a
                          href={song.spotifyLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.songLink}
                        >
                          Spotify
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </section>
      );
    }

    if (activeTab === 'movies') {
      return (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>上映した動画のアーカイブ</h3>
          <p className={styles.sectionDescription}>
            当日上映した動画をこちらにまとめています
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
          本webサイト/招待状のソースコードを公開しているリポジトリです
          <br />
          ご興味がある方はぜひご覧ください
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