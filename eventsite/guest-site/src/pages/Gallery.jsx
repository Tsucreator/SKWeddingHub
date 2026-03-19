import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Camera, Film, LoaderCircle, Upload } from 'lucide-react';
import styles from './Gallery.module.css';
import heroImage from '../assets/hero.webp';
const heroImageAlt = heroImage;

const GALLERY_API_ENDPOINT = import.meta.env.VITE_GALLERY_API_ENDPOINT || '';
const GALLERY_VIEW_URL = import.meta.env.VITE_GALLERY_VIEW_URL || '';
const MAX_IMAGE_MB = Number(import.meta.env.VITE_GALLERY_MAX_IMAGE_MB || 20);
const MAX_VIDEO_MB = Number(import.meta.env.VITE_GALLERY_MAX_VIDEO_MB || 150);
const MAX_VIDEO_DURATION_SECONDS = Number(import.meta.env.VITE_GALLERY_MAX_VIDEO_DURATION_SECONDS || 60);

const PHOTO_ITEMS = [
  { id: 1, title: 'Pre Photo', image: heroImage, alt: '前撮り写真 1' },
  { id: 2, title: 'Memory', image: heroImageAlt, alt: '思い出写真 1' },
  { id: 3, title: 'Pre Photo', image: heroImageAlt, alt: '前撮り写真 2' },
  { id: 4, title: 'Memory', image: heroImage, alt: '思い出写真 2' },
];

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 MB';
  }

  const megabytes = bytes / (1024 * 1024);
  return `${megabytes.toFixed(megabytes >= 100 ? 0 : 1)} MB`;
};

const isVideoFile = (file) => file.type.startsWith('video/');
const isImageFile = (file) => file.type.startsWith('image/');

const loadVideoDurationSeconds = (file) => new Promise((resolve, reject) => {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'metadata';

  const cleanup = () => {
    URL.revokeObjectURL(objectUrl);
    video.removeAttribute('src');
    video.load();
  };

  video.onloadedmetadata = () => {
    const duration = Number(video.duration);
    cleanup();
    resolve(Number.isFinite(duration) ? duration : 0);
  };

  video.onerror = () => {
    cleanup();
    reject(new Error('動画の長さを確認できませんでした'));
  };

  video.src = objectUrl;
});

const readGuest = () => {
  try {
    return JSON.parse(localStorage.getItem('guest') || 'null');
  } catch {
    return null;
  }
};

const Gallery = () => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [guest, setGuest] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [isLoadingUploads, setIsLoadingUploads] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadName, setCurrentUploadName] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    setGuest(readGuest());
  }, []);

  useEffect(() => {
    const loadUploads = async () => {
      if (!guest?.guest_id || !guest?.email || !GALLERY_API_ENDPOINT) {
        return;
      }

      setIsLoadingUploads(true);
      try {
        const response = await axios.post(GALLERY_API_ENDPOINT, {
          action: 'listUploads',
          guestId: guest.guest_id,
          email: guest.email,
          limit: 24,
        });

        const result = typeof response.data === 'string'
          ? JSON.parse(response.data)
          : response.data;

        setUploads(Array.isArray(result?.uploads) ? result.uploads : []);
      } catch (error) {
        console.error('Failed to fetch uploads:', error);
        setErrorMessage('アップロード履歴の取得に失敗しました');
      } finally {
        setIsLoadingUploads(false);
      }
    };

    loadUploads();
  }, [guest]);

  const refreshUploads = async () => {
    if (!guest?.guest_id || !guest?.email || !GALLERY_API_ENDPOINT) {
      return;
    }

    const response = await axios.post(GALLERY_API_ENDPOINT, {
      action: 'listUploads',
      guestId: guest.guest_id,
      email: guest.email,
      limit: 24,
    });

    const result = typeof response.data === 'string'
      ? JSON.parse(response.data)
      : response.data;

    setUploads(Array.isArray(result?.uploads) ? result.uploads : []);
  };

  const validateFile = async (file) => {
    if (!isImageFile(file) && !isVideoFile(file)) {
      throw new Error(`${file.name}: 画像または動画のみアップロードできます`);
    }

    if (isImageFile(file) && file.size > MAX_IMAGE_MB * 1024 * 1024) {
      throw new Error(`${file.name}: 画像は ${MAX_IMAGE_MB}MB 以内にしてください`);
    }

    if (isVideoFile(file)) {
      if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
        throw new Error(`${file.name}: 動画は ${MAX_VIDEO_MB}MB 以内にしてください`);
      }

      const durationSeconds = await loadVideoDurationSeconds(file);
      if (durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
        throw new Error(`${file.name}: 動画は ${MAX_VIDEO_DURATION_SECONDS} 秒以内にしてください`);
      }
    }
  };

  const uploadSingleFile = async (file, index, totalCount) => {
    setCurrentUploadName(file.name);
    setStatusMessage(`${index + 1}/${totalCount} 件目をアップロードしています`);
    setUploadProgress(0);

    const initResponse = await axios.post(GALLERY_API_ENDPOINT, {
      action: 'initUpload',
      guestId: guest.guest_id,
      email: guest.email,
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
    });

    const initResult = typeof initResponse.data === 'string'
      ? JSON.parse(initResponse.data)
      : initResponse.data;

    if (!initResult?.ok || !initResult.uploadUrl || !initResult.uploadId) {
      throw new Error('アップロードの初期化に失敗しました');
    }

    await axios.put(initResult.uploadUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
      onUploadProgress: (progressEvent) => {
        if (!progressEvent.total) {
          return;
        }

        setUploadProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
      },
    });

    const completeResponse = await axios.post(GALLERY_API_ENDPOINT, {
      action: 'completeUpload',
      guestId: guest.guest_id,
      email: guest.email,
      uploadId: initResult.uploadId,
    });

    const completeResult = typeof completeResponse.data === 'string'
      ? JSON.parse(completeResponse.data)
      : completeResponse.data;

    if (!completeResult?.ok) {
      throw new Error('アップロード完了処理に失敗しました');
    }
  };

  const handleFileSelection = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }

    if (!guest?.guest_id || !guest?.email) {
      setErrorMessage('ログイン情報が見つかりません。再ログインしてください');
      return;
    }

    if (!GALLERY_API_ENDPOINT) {
      setErrorMessage('アップロード API が未設定です');
      return;
    }

    setErrorMessage('');
    setStatusMessage('');
    setIsUploading(true);

    try {
      for (const file of files) {
        await validateFile(file);
      }

      for (let index = 0; index < files.length; index += 1) {
        await uploadSingleFile(files[index], index, files.length);
      }

      await refreshUploads();
      setStatusMessage(`${files.length} 件のアップロードが完了しました`);
    } catch (error) {
      console.error('Upload failed:', error);
      setErrorMessage(error.message || 'アップロードに失敗しました');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentUploadName('');
      event.target.value = '';
    }
  };

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
          ゲストの皆さまの写真・動画投稿エリアです。スマートフォンからそのままアップロードできます。
        </p>

        <div className={styles.uploadPanel}>
          <div className={styles.guestBadge}>
            {guest?.name ? `${guest.name} 様としてログイン中` : 'ログイン情報を確認中'}
          </div>

          <div className={styles.guidelineList}>
            <p>画像は {MAX_IMAGE_MB}MB まで、動画は {MAX_VIDEO_MB}MB まで対応します。</p>
            <p>動画は {MAX_VIDEO_DURATION_SECONDS} 秒以内を目安にしてください。</p>
            <p>iPhone の Live Photos や Android の動画も、そのまま選択できます。</p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className={styles.fileInput}
            onChange={handleFileSelection}
          />

          <div className={styles.actionRow}>
            <button
              type="button"
              className={styles.actionButton}
              onClick={() => inputRef.current?.click()}
              disabled={isUploading || !guest?.guest_id}
            >
              {isUploading ? 'アップロード中...' : '写真・動画を選ぶ'}
            </button>
            {GALLERY_VIEW_URL && (
              <a href={GALLERY_VIEW_URL} target="_blank" rel="noopener noreferrer" className={styles.actionButtonSub}>
                共有アルバムを見る
              </a>
            )}
          </div>

          {isUploading && (
            <div className={styles.progressCard}>
              <div className={styles.progressHeader}>
                <LoaderCircle size={18} className={styles.spinner} />
                <span>{currentUploadName}</span>
              </div>
              <div className={styles.progressBar}>
                <span className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
              </div>
              <p className={styles.progressLabel}>{uploadProgress}%</p>
            </div>
          )}

          {statusMessage && <p className={styles.successMessage}>{statusMessage}</p>}
          {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <Film size={18} /> Your Uploads
        </h3>
        <p className={styles.sectionDescription}>
          ログイン中のメールアドレスに紐づくアップロード履歴です。アップロード済みかどうかをここで確認できます。
        </p>

        {isLoadingUploads ? (
          <p className={styles.note}>アップロード履歴を読み込んでいます...</p>
        ) : uploads.length === 0 ? (
          <p className={styles.note}>まだアップロードはありません。</p>
        ) : (
          <div className={styles.uploadGrid}>
            {uploads.map((item) => (
              <article key={item.uploadId} className={styles.uploadCard}>
                <div className={styles.uploadMeta}>
                  <span className={styles.uploadType}>{item.mediaKind === 'video' ? 'Video' : 'Photo'}</span>
                  <span className={styles.uploadStatus}>{item.status === 'COMPLETE' ? 'アップロード済み' : '処理中'}</span>
                </div>

                {item.previewUrl && item.mediaKind === 'image' && (
                  <img
                    src={item.previewUrl}
                    alt={item.fileName}
                    className={styles.uploadPreviewImage}
                    loading="lazy"
                  />
                )}

                {item.previewUrl && item.mediaKind === 'video' && (
                  <video
                    src={item.previewUrl}
                    className={styles.uploadPreviewVideo}
                    controls
                    playsInline
                    preload="metadata"
                  />
                )}

                <p className={styles.uploadFileName}>{item.fileName}</p>
                <p className={styles.uploadDetail}>{formatBytes(item.fileSize)}</p>
                <p className={styles.uploadDetail}>{new Date(item.createdAt).toLocaleString('ja-JP')}</p>
              </article>
            ))}
          </div>
        )}
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