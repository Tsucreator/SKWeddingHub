import { useEffect, useMemo, useState } from 'react';
import styles from './Extras.module.css';

const FAVORITE_SPOTS = [
  {
    id: 1,
    category: '焼肉',
    prefecture: '東京都',
    city: '台東区',
    area: '湯島',
    name: 'たん清',
    url: 'https://tabelog.com/tokyo/A1311/A131101/13282209/',
  },
  {
    id: 2,
    category: '焼肉',
    prefecture: '東京都',
    city: '台東区',
    area: '上野',
    name: 'TOKYO焼肉ごぉ 3号店',
    url: 'https://tabelog.com/tokyo/A1311/A131101/13265088/',
  },
  {
    id: 3,
    category: '焼肉',
    prefecture: '東京都',
    city: '港区',
    area: '虎ノ門',
    name: '焼肉ホルモン 山水縁 虎ノ門本店',
    url: 'https://tabelog.com/tokyo/A1308/A130802/13225975/',
  },
  {
    id: 4,
    category: '焼肉',
    prefecture: '千葉県',
    city: '柏市',
    area: '柏',
    name: 'ホルモン焼肉 肉の大山',
    url: 'https://tabelog.com/chiba/A1203/A120301/12025599/',
  },
  {
    id: 5,
    category: '焼肉',
    prefecture: '岐阜県',
    city: '岐阜市',
    area: '岐阜',
    name: '飛騨牛一頭家 馬喰一代 岐阜神田',
    url: 'https://tabelog.com/gifu/A2101/A210101/21000284/',
    featured: true,
  },
];

const MOVIE_ARCHIVE = [
  {
    id: 1,
    title: 'Opening Movie',
    youtubeId: '37sIaffRwfs',
  },
  {
    id: 2,
    title: 'Our Story Movie',
    youtubeId: 'PWMBaeOn3Sg',
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
const EXTRAS_RELEASE_SCHEDULE_URL = import.meta.env.VITE_EXTRAS_RELEASE_SCHEDULE_URL || 'extras-release-schedule.json';

const TABS = [
  { id: 'spots', label: 'かほログ' },
  { id: 'songs', label: 'BGMリスト' },
  { id: 'movies', label: '今日の動画' },
  { id: 'github', label: 'GitHub' },
];

const SONG_SCENE_DISPLAY_ORDER = [
  'ゲスト入場',
  'オープニングムービー',
  '新郎新婦入場',
  '新郎新婦紹介',
  '乾杯',
  '前半歓談',
  'お色直し中座',
  'プロフィールムービー',
  '中座中の歓談',
  'お色直し入場',
  'テーブルラウンド',
  'テーブルインタビュー',
  '後半歓談',
  'お手紙・メッセージ',
  '贈呈',
  '退場',
  'エンドロールムービー',
  '送賓',
];

const DEFAULT_RELEASE_SCHEDULE = {
  songs: {
    defaultVisibleCount: 0,
    defaultVisibleScenes: [],
    schedule: [],
  },
  movies: {
    defaultVisibleCount: 0,
    defaultVisibleScenes: [],
    schedule: [],
  },
};

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

const normalizeReleaseConfig = (rawConfig) => {
  if (!rawConfig || typeof rawConfig !== 'object') {
    return { defaultVisibleCount: 0, defaultVisibleScenes: [], schedule: [] };
  }

  const defaultVisibleCount = Number.isFinite(Number(rawConfig.defaultVisibleCount))
    ? Number(rawConfig.defaultVisibleCount)
    : 0;
  const defaultVisibleScenes = Array.isArray(rawConfig.defaultVisibleScenes)
    ? rawConfig.defaultVisibleScenes
      .filter((scene) => typeof scene === 'string')
      .map((scene) => scene.trim())
      .filter(Boolean)
    : [];

  const schedule = Array.isArray(rawConfig.schedule)
    ? rawConfig.schedule
      .map((step) => {
        const visibleCount = Number(step?.visibleCount);
        const at = typeof step?.at === 'string' ? step.at : '';
        const hasVisibleCount = Number.isFinite(visibleCount);
        const hasVisibleScenes = Array.isArray(step?.visibleScenes);
        const visibleScenes = hasVisibleScenes
          ? step.visibleScenes
            .filter((scene) => typeof scene === 'string')
            .map((scene) => scene.trim())
            .filter(Boolean)
          : undefined;

        if ((!hasVisibleCount && !hasVisibleScenes) || !Number.isFinite(Date.parse(at))) {
          return null;
        }

        const normalizedStep = { at };

        if (hasVisibleCount) {
          normalizedStep.visibleCount = visibleCount;
        }

        if (hasVisibleScenes) {
          normalizedStep.visibleScenes = visibleScenes;
        }

        return normalizedStep;
      })
      .filter(Boolean)
      .sort((left, right) => Date.parse(left.at) - Date.parse(right.at))
    : [];

  return {
    defaultVisibleCount,
    defaultVisibleScenes,
    schedule,
  };
};

const getVisibleCount = (config, totalCount, currentTime) => {
  const safeTotal = Math.max(totalCount, 0);
  let visibleCount = config.defaultVisibleCount;

  config.schedule.forEach((step) => {
    if (currentTime >= Date.parse(step.at)) {
      visibleCount = step.visibleCount;
    }
  });

  return Math.min(Math.max(visibleCount, 0), safeTotal);
};

const hasVisibleSceneRules = (config) => {
  return config.defaultVisibleScenes.length > 0 || config.schedule.some((step) => 'visibleScenes' in step);
};

const normalizeSceneNames = (sceneNames, allSceneNames) => {
  const availableScenes = new Set(allSceneNames);
  const uniqueScenes = [];

  sceneNames.forEach((sceneName) => {
    if (!availableScenes.has(sceneName) || uniqueScenes.includes(sceneName)) {
      return;
    }

    uniqueScenes.push(sceneName);
  });

  return uniqueScenes;
};

const getVisibleSceneNames = (config, allSceneNames, currentTime) => {
  let visibleScenes = normalizeSceneNames(config.defaultVisibleScenes, allSceneNames);

  config.schedule.forEach((step) => {
    if (currentTime >= Date.parse(step.at) && 'visibleScenes' in step) {
      visibleScenes = normalizeSceneNames(step.visibleScenes, allSceneNames);
    }
  });

  return visibleScenes;
};

const Extras = () => {
  const [activeTab, setActiveTab] = useState('spots');
  const [songs, setSongs] = useState(SONG_PLAYLIST);
  const [isSongsLoading, setIsSongsLoading] = useState(true);
  const [songsError, setSongsError] = useState('');
  const [releaseSchedule, setReleaseSchedule] = useState(DEFAULT_RELEASE_SCHEDULE);
  const [isReleaseScheduleLoading, setIsReleaseScheduleLoading] = useState(true);
  const [releaseScheduleError, setReleaseScheduleError] = useState('');
  const [currentTime, setCurrentTime] = useState(() => Date.now());

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

  useEffect(() => {
    const loadReleaseSchedule = async () => {
      try {
        const response = await fetch(EXTRAS_RELEASE_SCHEDULE_URL, {
          headers: {
            Accept: 'application/json',
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch extras release schedule: ${response.status}`);
        }

        const rawSchedule = await response.json();
        setReleaseSchedule({
          songs: normalizeReleaseConfig(rawSchedule.songs),
          movies: normalizeReleaseConfig(rawSchedule.movies),
        });
        setReleaseScheduleError('');
      } catch (error) {
        console.error('extras-release-schedule load error', error);
        setReleaseSchedule(DEFAULT_RELEASE_SCHEDULE);
        setReleaseScheduleError('公開設定の読み込みに失敗したため、一部コンテンツを非表示にしています');
      } finally {
        setIsReleaseScheduleLoading(false);
      }
    };

    loadReleaseSchedule();
  }, []);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  const visibleSongCount = useMemo(() => {
    return getVisibleCount(releaseSchedule.songs, songs.length, currentTime);
  }, [releaseSchedule.songs, songs.length, currentTime]);
  const orderedSceneNames = useMemo(() => {
    const availableSceneNames = songs.reduce((sceneNames, song) => {
      sceneNames.add(song.scene || 'その他');
      return sceneNames;
    }, new Set());
    const orderedScenes = SONG_SCENE_DISPLAY_ORDER.filter((sceneName) => availableSceneNames.has(sceneName));
    const remainingScenes = Array.from(availableSceneNames).filter(
      (sceneName) => !SONG_SCENE_DISPLAY_ORDER.includes(sceneName),
    );

    return [...orderedScenes, ...remainingScenes];
  }, [songs]);
  const visibleSceneNames = useMemo(() => {
    if (!hasVisibleSceneRules(releaseSchedule.songs)) {
      return [];
    }

    return getVisibleSceneNames(releaseSchedule.songs, orderedSceneNames, currentTime);
  }, [releaseSchedule.songs, orderedSceneNames, currentTime]);
  const visibleSongs = useMemo(() => {
    if (!hasVisibleSceneRules(releaseSchedule.songs)) {
      return songs.slice(0, visibleSongCount);
    }

    const visibleSceneSet = new Set(visibleSceneNames);
    return songs.filter((song) => visibleSceneSet.has(song.scene || 'その他'));
  }, [songs, visibleSongCount, visibleSceneNames, releaseSchedule.songs]);
  const hiddenSongCount = songs.length - visibleSongs.length;
  const songsByScene = useMemo(() => {
    return visibleSongs.reduce((groups, song) => {
      const sceneKey = song.scene || 'その他';
      if (!groups[sceneKey]) {
        groups[sceneKey] = [];
      }
      groups[sceneKey].push(song);
      return groups;
    }, {});
  }, [visibleSongs]);

  const visibleMovieCount = useMemo(() => {
    return getVisibleCount(releaseSchedule.movies, MOVIE_ARCHIVE.length, currentTime);
  }, [releaseSchedule.movies, currentTime]);
  const visibleMovies = useMemo(() => MOVIE_ARCHIVE.slice(0, visibleMovieCount), [visibleMovieCount]);
  const hiddenMovieCount = MOVIE_ARCHIVE.length - visibleMovies.length;

  const renderTabContent = () => {
    if (activeTab === 'spots') {
      return (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>かほログ</h3>
          <p className={styles.sectionDescription}>
            お気に入りのお店 5選です
          </p>
          <div className={styles.spotList}>
            {FAVORITE_SPOTS.map((spot) => (
              <article key={spot.id} className={styles.spotCard}>
                <div className={styles.spotMetaRow}>
                  <p className={styles.spotCategory}>{spot.category}</p>
                  {spot.featured && <p className={styles.spotFeatured}>おすすめ</p>}
                </div>
                <h4 className={styles.spotName}>{spot.name}</h4>
                <p className={styles.spotDescription}>{`${spot.prefecture} ${spot.city} ${spot.area}`}</p>
                <a href={spot.url} target="_blank" rel="noopener noreferrer" className={styles.linkButton}>
                  Webサイトを見る
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
          <p className={styles.sectionDescription}>当日の映像演出で使用した楽曲を 進行に合わせて順次公開しています</p>

          {isSongsLoading && <p className={styles.songStatus}>BGMリストを読み込み中です...</p>}
          {isReleaseScheduleLoading && <p className={styles.songStatus}>公開設定を確認中です...</p>}
          {!isSongsLoading && songsError && <p className={styles.songStatus}>{songsError}</p>}
          {!isReleaseScheduleLoading && releaseScheduleError && (
            <p className={styles.songStatus}>{releaseScheduleError}</p>
          )}

          {!isSongsLoading && !isReleaseScheduleLoading && visibleSongs.length === 0 && (
            <div className={styles.lockedNotice}>
              <p>BGMは進行に合わせて順次公開していきます</p>
            </div>
          )}

          {visibleSongs.length > 0 && (
            <div className={styles.songSceneList}>
              {orderedSceneNames.filter((scene) => songsByScene[scene]).map((scene) => (
                <section key={scene} className={styles.songGroup}>
                  <h4 className={styles.songCategory}>{scene}</h4>
                  <ul className={styles.songList}>
                    {songsByScene[scene].map((song) => (
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
          )}

          {!isSongsLoading && !isReleaseScheduleLoading && hiddenSongCount > 0 && (
            <div className={styles.releaseNotice}>
              <p>BGMは進行に合わせて順次公開していきます</p>
            </div>
          )}
        </section>
      );
    }

    if (activeTab === 'movies') {
      return (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>上映した動画のアーカイブ</h3>
          <p className={styles.sectionDescription}>
            当日上映した動画を 進行に合わせて順次公開しています
          </p>

          {isReleaseScheduleLoading && <p className={styles.songStatus}>公開設定を確認中です...</p>}
          {!isReleaseScheduleLoading && releaseScheduleError && (
            <p className={styles.songStatus}>{releaseScheduleError}</p>
          )}

          {!isReleaseScheduleLoading && visibleMovies.length === 0 && (
            <div className={styles.lockedNotice}>
              <p>動画は進行に合わせて順次公開していきます</p>
            </div>
          )}

          {visibleMovies.length > 0 && (
            <div className={styles.movieList}>
              {visibleMovies.map((movie) => (
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
          )}

          {!isReleaseScheduleLoading && hiddenMovieCount > 0 && (
            <div className={styles.releaseNotice}>
              <p>動画は進行に合わせて順次公開していきます</p>
            </div>
          )}
        </section>
      );
    }

    return (
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>GitHubリポジトリ</h3>
        <p className={styles.sectionDescription}>
          本webサイト 招待状のソースコードを公開しているリポジトリです
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