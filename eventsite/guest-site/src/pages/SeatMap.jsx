import { useCallback, useRef, useEffect, useState } from "react";
import QuickPinchZoom, { make3dTransformValue } from "react-quick-pinch-zoom";
import styles from './SeatMap.module.css';

const SeatMap = () => {
  const imgRef = useRef();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('guest'));
    setUserData(data);
  }, []);

  const onUpdate = useCallback(({ x, y, scale }) => {
    const { current: img } = imgRef;
    if (img) {
      const value = make3dTransformValue({ x, y, scale });
      img.style.setProperty("transform", value);
    }
  }, []);

  const tables = [
    { id: 'A', x: 100, y: 100, name: 'Table A' },
    { id: 'B', x: 300, y: 100, name: 'Table B' },
    { id: 'C', x: 100, y: 300, name: 'Table C' },
    { id: 'D', x: 300, y: 300, name: 'Table D' },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>SEAT MAP</h2>
        <p className={styles.subtitle}>ピンチ操作で拡大・縮小できます</p>
        {userData && (
          <div className={styles.userBanner}>
            <span className={styles.userName}>{userData.name} 様のテーブルは</span>
            <br />
            <span className={styles.tableId}>【 {userData.table_id} 】</span> です
          </div>
        )}
      </div>

      <div className={styles.zoomArea}>
        <QuickPinchZoom onUpdate={onUpdate} wheelScaleFactor={500}>
          <div ref={imgRef} className={styles.mapInner}>
            <svg width="400" height="500" viewBox="0 0 400 500">
              {/* 高砂（メインテーブル） */}
              <rect x="100" y="20" width="200" height="40" fill="var(--color-black)" rx="4" />
              <text x="200" y="45" textAnchor="middle" fill="var(--color-gold)" fontSize="12">Main Table</text>

              {tables.map((t) => {
                const isMyTable = userData?.table_id === t.id;
                return (
                  <g key={t.id}>
                    <circle
                      cx={t.x} cy={t.y} r="40"
                      fill={isMyTable ? "var(--color-gold)" : "#fff"}
                      stroke={isMyTable ? "var(--color-gold-dark)" : "#ccc"}
                      strokeWidth={isMyTable ? "4" : "1"}
                      style={{ transition: 'all 0.3s' }}
                    />
                    <text
                      x={t.x} y={t.y + 5}
                      textAnchor="middle"
                      fill={isMyTable ? "#fff" : "#333"}
                      fontWeight="bold"
                      fontSize="16"
                    >
                      {t.id}
                    </text>
                    {isMyTable && (
                      <text x={t.x} y={t.y + 60} textAnchor="middle" fill="var(--color-gold-dark)" fontSize="12" fontWeight="bold">
                        Your Seat
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </QuickPinchZoom>
      </div>
    </div>
  );
};

export default SeatMap;