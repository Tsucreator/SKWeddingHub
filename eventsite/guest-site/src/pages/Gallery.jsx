import { useState } from 'react';
import { Camera, Upload, PlayCircle } from 'lucide-react';
import styles from './Gallery.module.css';
import heroImage from '../assets/hero.webp';
const heroImageAlt = heroImage;

const DRIVE_UPLOAD_URL = import.meta.env.VITE_GALLERY_UPLOAD_URL || 'https://drive.google.com/';
const DRIVE_VIEW_URL = import.meta.env.VITE_GALLERY_VIEW_URL || 'https://drive.google.com/';

const PHOTO_ITEMS = [
  { id: 1, title: 'Pre Photo', image: heroImage, alt: '前撮り写真 1' },
  { id: 2, title: 'Memory', image: heroImageAlt, alt: '思い出写真 1' },
  { id: 3, title: 'Pre Photo', image: heroImageAlt, alt: '前撮り写真 2' },
  { id: 4, title: 'Memory', image: heroImage, alt: '思い出写真 2' },
];

const MOVIE_ITEMS = [
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

const Gallery = () => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.title}>GALLERY</h2>
        <p className={styles.subtitle}>思い出の写真とムービー</p>
      </header>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <Camera size={18} /> Official Photos
        </h3>
        <p className={styles.sectionDescription}>
          前撮りやこれまでの思い出を掲載しています。
        </p>

        <div className={styles.photoGrid}>
          {PHOTO_ITEMS.map((photo) => (
            <button
              key={photo.id}
              type="button"
              className={styles.photoCard}
              onClick={() => setSelectedPhoto(photo)}
              aria-label={`${photo.title} を拡大表示`}
            >
              <img
                src={photo.image}
                srcSet={`${photo.image} 1x, ${photo.image} 2x`}
                alt={photo.alt}
                loading="lazy"
                className={styles.photoImage}
              />
              <span className={styles.photoLabel}>{photo.title}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <Upload size={18} /> Guest Upload
        </h3>
        <p className={styles.sectionDescription}>
          ゲストの皆さまの写真投稿用リンクです。1枚あたり10MB以内を目安にご投稿ください。
        </p>

        <div className={styles.actionRow}>
          <a href={DRIVE_UPLOAD_URL} target="_blank" rel="noopener noreferrer" className={styles.actionButton}>
            写真をアップロード
          </a>
          <a href={DRIVE_VIEW_URL} target="_blank" rel="noopener noreferrer" className={styles.actionButtonSub}>
            投稿写真を見る
          </a>
        </div>

        <p className={styles.note}>
          通信量節約のため、Wi-Fi環境でのアップロードを推奨しています。
        </p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <PlayCircle size={18} /> Movie Archive
        </h3>
        <p className={styles.sectionDescription}>
          当日のオープニング・生い立ちムービーをアーカイブでご覧いただけます。
        </p>

        <div className={styles.movieList}>
          {MOVIE_ITEMS.map((movie) => (
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

      {selectedPhoto && (
        <button
          type="button"
          className={styles.modal}
          onClick={() => setSelectedPhoto(null)}
          aria-label="拡大画像を閉じる"
        >
          <img
            src={selectedPhoto.image}
            srcSet={`${selectedPhoto.image} 1x, ${selectedPhoto.image} 2x`}
            alt={selectedPhoto.alt}
            className={styles.modalImage}
          />
        </button>
      )}
    </div>
  );
};

export default Gallery;