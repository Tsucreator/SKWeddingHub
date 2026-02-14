import { useCallback, useRef, useEffect, useState } from "react";
import QuickPinchZoom, { make3dTransformValue } from "react-quick-pinch-zoom";
import styles from './SeatMap.module.css';

/**
 * 円形テーブル周囲に seats 個の席を配置する座標を返す。
 * 右上 (≈ 1時方向) を seat 1 とし、時計回りに番号が増える。
 */
const calcSeatPositions = (cx, cy, radius, seats) => {
  const result = [];
  const startAngle = -Math.PI / 3;
  for (let i = 0; i < seats; i++) {
    const angle = startAngle + (2 * Math.PI * i) / seats;
    result.push({
      seatId: i + 1,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }
  return result;
};

// --- テーブル定義 ---
const guestTables = [
  { id: 'A', x: 80,  y: 165, seats: 6 },
  { id: 'B', x: 200, y: 165, seats: 6 },
  { id: 'C', x: 320, y: 165, seats: 6 },
  { id: 'D', x: 440, y: 165, seats: 6 },
  { id: 'E', x: 140, y: 305, seats: 8 },
  { id: 'F', x: 260, y: 305, seats: 8 },
  { id: 'G', x: 380, y: 305, seats: 8 },
  { id: 'H', x: 140, y: 445, seats: 8 },
  { id: 'I', x: 260, y: 445, seats: 8 },
  { id: 'J', x: 380, y: 445, seats: 8 },
];

/* ========================================
   全体マップビュー（テーブル粒度）
   ======================================== */
const OverviewMap = ({ userData, onSelectTable }) => {
  const imgRef = useRef();
  const onUpdate = useCallback(({ x, y, scale }) => {
    if (imgRef.current) {
      imgRef.current.style.setProperty(
        "transform",
        make3dTransformValue({ x, y, scale })
      );
    }
  }, []);

  const userTableId = userData?.table_id;

  return (
    <div className={styles.zoomArea}>
      <QuickPinchZoom onUpdate={onUpdate} wheelScaleFactor={500}>
        <div ref={imgRef} className={styles.mapInner}>
          <svg viewBox="0 0 520 510" className={styles.mapSvg}>
            {/* 高砂 */}
            <rect x="180" y="20" width="160" height="40" fill="var(--color-black)" rx="4" />
            <text x="260" y="45" textAnchor="middle" fill="var(--color-gold)" fontSize="12" fontWeight="bold">
              メインテーブル
            </text>

            {guestTables.map((t) => {
              const myTable = userTableId === t.id;
              return (
                <g
                  key={t.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectTable(t.id)}
                >
                  <circle
                    cx={t.x} cy={t.y} r="40"
                    fill={myTable ? "var(--color-gold)" : "#fff"}
                    stroke={myTable ? "var(--color-gold-dark)" : "#ccc"}
                    strokeWidth={myTable ? "3" : "1"}
                    style={{ transition: 'all 0.3s' }}
                  />
                  <text
                    x={t.x} y={t.y + 6}
                    textAnchor="middle"
                    fill={myTable ? "#fff" : "#333"}
                    fontWeight="bold" fontSize="16"
                  >
                    {t.id}
                  </text>
                  {myTable && (
                    <text
                      x={t.x} y={t.y + 58}
                      textAnchor="middle"
                      fill="var(--color-gold-dark)"
                      fontSize="11" fontWeight="bold"
                    >
                      Your Table
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </QuickPinchZoom>
      <p className={styles.tapHint}>テーブルをタップすると座席が確認できます</p>
    </div>
  );
};

/* ========================================
   座席詳細ビュー（1テーブル拡大）
   ======================================== */
const TABLE_DETAIL_R = 70;      // テーブル円の半径
const SEAT_ORBIT = 110;         // テーブル中心→席中心
const SEAT_R = 22;              // 席の半径
const SVG_W = 320;              // SVG 幅
const TABLE_CX = SVG_W / 2;    // テーブル中心 X
const HEAD_AREA = 40;           // メインテーブルインジケータ用の上部余白
const TABLE_CY = HEAD_AREA + SEAT_ORBIT + SEAT_R + 10; // テーブル中心 Y
const SVG_H = TABLE_CY + SEAT_ORBIT + SEAT_R + 20;     // SVG 高さ

const SeatDetailView = ({ tableId, userData, onBack }) => {
  const table = guestTables.find((t) => t.id === tableId);
  if (!table) return null;

  const seats = calcSeatPositions(TABLE_CX, TABLE_CY, SEAT_ORBIT, table.seats);
  const userTableId = userData?.table_id;
  const userSeatId = userData?.seat_id;
  const isMySeat = (sId) =>
    userTableId === tableId && String(userSeatId) === String(sId);

  return (
    <div className={styles.detailArea}>
      <button className={styles.backButton} onClick={onBack}>
        ← 全体に戻る
      </button>

      <div className={styles.detailSvgWrap}>
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className={styles.detailSvg}>
          {/* メインテーブル方向インジケータ */}
          <line
            x1={TABLE_CX - 50} y1={20}
            x2={TABLE_CX + 50} y2={20}
            stroke="var(--color-gold)" strokeWidth="2"
          />
          <polygon
            points={`${TABLE_CX},6 ${TABLE_CX - 6},18 ${TABLE_CX + 6},18`}
            fill="var(--color-gold)"
          />
          <text
            x={TABLE_CX} y={34}
            textAnchor="middle" fill="var(--color-text-muted)"
            fontSize="9"
          >
            メインテーブル側
          </text>

          {/* テーブル本体 */}
          <circle
            cx={TABLE_CX} cy={TABLE_CY} r={TABLE_DETAIL_R}
            fill="#FBF5E8" stroke="var(--color-gold)" strokeWidth="2"
          />
          <text
            x={TABLE_CX} y={TABLE_CY + 6}
            textAnchor="middle" fill="var(--color-gold-dark)"
            fontWeight="bold" fontSize="28"
          >
            {tableId}
          </text>

          {/* 各席 */}
          {seats.map((s) => {
            const mine = isMySeat(s.seatId);
            return (
              <g key={s.seatId}>
                <circle
                  cx={s.x} cy={s.y} r={SEAT_R}
                  fill={mine ? "var(--color-gold)" : "#fff"}
                  stroke={mine ? "var(--color-gold-dark)" : "#ccc"}
                  strokeWidth={mine ? 3 : 1}
                  style={{ transition: 'all 0.3s' }}
                />
                <text
                  x={s.x} y={s.y + 5}
                  textAnchor="middle"
                  fill={mine ? "#fff" : "#888"}
                  fontSize="14" fontWeight={mine ? "bold" : "normal"}
                >
                  {s.seatId}
                </text>
                {mine && (
                  <text
                    x={s.x} y={s.y - SEAT_R - 6}
                    textAnchor="middle"
                    fill="var(--color-gold-dark)"
                    fontSize="11" fontWeight="bold"
                  >
                    YOU
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

/* ========================================
   メインコンポーネント
   ======================================== */
const SeatMap = () => {
  const [userData, setUserData] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('guest'));
    setUserData(data);
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>座席表</h2>
        {userData && (
          <div className={styles.userBanner}>
            <span className={styles.userName}>{userData.name} 様</span>
            <br />
            <span className={styles.tableId}>テーブル {userData.table_id}-{userData.seat_id}</span>
          </div>
        )}
      </div>

      {selectedTable ? (
        <SeatDetailView
          tableId={selectedTable}
          userData={userData}
          onBack={() => setSelectedTable(null)}
        />
      ) : (
        <OverviewMap
          userData={userData}
          onSelectTable={setSelectedTable}
        />
      )}
    </div>
  );
};

export default SeatMap;