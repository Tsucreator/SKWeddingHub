import { useCallback, useRef, useEffect, useState } from "react";
import QuickPinchZoom, { make3dTransformValue } from "react-quick-pinch-zoom";
import axios from "axios";
import styles from './SeatMap.module.css';

const SEATS_API_ENDPOINT = import.meta.env.VITE_SEATS_API_ENDPOINT
  || 'https://qlydtknsq4.execute-api.ap-northeast-1.amazonaws.com/prod/seats';

/**
 * 円形テーブル周囲に seats 個の席を配置する座標を返す。
 * 右上 (≈ 1時方向) を seat 1 とし、時計回りに番号が増える。
 */
const calcSeatPositions = (cx, cy, radius, seats) => {
  const result = [];
  // 左右対称かつ上辺がメインテーブルと水平になるよう配置。
  // 真上 (-π/2) を対称軸とし、半頂点分 (π/seats) 右にずらして開始。
  // seat 1 は右上に来て、時計回りに番号が増える。
  const startAngle = -Math.PI / 2 + Math.PI / seats;
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

// --- テーブル定義（seats は全体マップ用のデフォルト値、詳細ビューでは API データで上書き） ---
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
                  {/* ユーザーのテーブルにパルスリング */}
                  {myTable && (
                    <circle
                      cx={t.x} cy={t.y} r="44"
                      fill="none"
                      stroke="var(--color-gold)"
                      strokeWidth="2"
                      className={styles.pulseRing}
                    />
                  )}
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
                      あなたのテーブルはこちら ▲
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
const SEAT_ORBIT = 140;         // テーブル中心→席名テキスト中心
const SVG_W = 380;              // SVG 幅
const TABLE_CX = SVG_W / 2;    // テーブル中心 X
const HEAD_AREA = 40;           // メインテーブルインジケータ用の上部余白
const TABLE_CY = HEAD_AREA + SEAT_ORBIT + 25; // テーブル中心 Y
const SVG_H = TABLE_CY + SEAT_ORBIT + 40;     // SVG 高さ

const SeatDetailView = ({ tableId, userData, seatGuests, loadingSeats, onBack }) => {
  const table = guestTables.find((t) => t.id === tableId);
  if (!table) return null;

  // 席数を API データの seat_id 最大値から動的に決定する
  const dynamicSeatCount = seatGuests && seatGuests.length > 0
    ? Math.max(...seatGuests.map((g) => Number(g.seat_id)))
    : table.seats;  // API データ未取得時はデフォルト値にフォールバック

  const seats = calcSeatPositions(TABLE_CX, TABLE_CY, SEAT_ORBIT, dynamicSeatCount);
  const userTableId = userData?.table_id;
  const userSeatId = userData?.seat_id;
  const isMySeat = (sId) =>
    userTableId === tableId && String(userSeatId) === String(sId);

  // seatGuests から seat_id でゲスト情報を引く
  const getGuestInfo = (seatId) => {
    if (!seatGuests) return null;
    return seatGuests.find((g) => String(g.seat_id) === String(seatId));
  };

  return (
    <div className={styles.detailArea}>
      <button className={styles.backButton} onClick={onBack}>
        ← 全体に戻る
      </button>

      <div className={styles.detailSvgWrap}>
        {loadingSeats && (
          <div className={styles.loadingOverlay}>
            <span className={styles.loadingText}>読み込み中...</span>
          </div>
        )}
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className={styles.detailSvg}>
          {/* グローフィルター */}
          <defs>
            <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

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

          {/* 各席 — 円形枠なし、名前テキストのみ配置 */}
          {seats.map((s) => {
            const mine = isMySeat(s.seatId);
            const guest = getGuestInfo(s.seatId);
            // ゲスト名 (フルネーム) を表示、データ未取得時は席番号
            const displayName = guest
              ? `${guest.name}${guest.honorific ? ` ${guest.honorific}` : ''}`
              : String(s.seatId);
            const relation = guest?.relationship || '';

            return (
              <g key={s.seatId}>
                {/* ゲスト名（フルネーム） — 自席はグローで光らせる */}
                <text
                  x={s.x} y={s.y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={mine ? "var(--color-gold-dark)" : "#333"}
                  fontSize={guest ? "16" : "18"}
                  fontWeight="bold"
                  filter={mine ? "url(#goldGlow)" : undefined}
                >
                  {displayName}
                </text>

                {/* 間柄（名前の下） */}
                {relation && (
                  <text
                    x={s.x} y={s.y + 28}
                    textAnchor="middle"
                    fill={mine ? "var(--color-gold)" : "#999"}
                    fontSize="12"
                  >
                    {relation}
                  </text>
                )}

                {/* YOU ラベル（名前の上） */}
                {mine && (
                  <text
                    x={s.x} y={s.y - 20}
                    textAnchor="middle"
                    fill="var(--color-gold-dark)"
                    fontSize="11" fontWeight="bold"
                  >
                    こちら
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* テーブルメンバー一覧 (テキスト) */}
      {seatGuests && seatGuests.length > 0 && (
        <div className={styles.guestList}>
          <h4 className={styles.guestListTitle}>テーブル {tableId} のご出席者</h4>
          <ul className={styles.guestListUl}>
            {seatGuests.map((g) => {
              const isMe = String(userData?.seat_id) === String(g.seat_id)
                && userData?.table_id === tableId;
              return (
                <li
                  key={g.seat_id}
                  className={`${styles.guestListItem} ${isMe ? styles.guestListItemMe : ''}`}
                >
                  <span className={styles.guestName}>
                    {g.name}{g.honorific ? ` ${g.honorific}` : ''}
                  </span>
                  <span className={styles.guestRelation}>{g.relationship}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

/* ========================================
   メインコンポーネント
   ======================================== */
const SeatMap = () => {
  const [userData, setUserData] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [seatGuestsCache, setSeatGuestsCache] = useState({});  // { tableId: [guests] }
  const [loadingSeats, setLoadingSeats] = useState(false);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('guest'));
    setUserData(data);
  }, []);

  // テーブル選択時にゲスト情報をフェッチ（キャッシュあればスキップ）
  const handleSelectTable = useCallback(async (tableId) => {
    setSelectedTable(tableId);

    if (seatGuestsCache[tableId]) return; // キャッシュヒット

    setLoadingSeats(true);
    try {
      const res = await axios.get(SEATS_API_ENDPOINT, {
        params: { table_id: tableId },
      });
      console.log('Seats API raw response:', JSON.stringify(res.data, null, 2));

      // レスポンス形状に応じて seats 配列を取得
      const seats = res.data.seats || res.data.Items || (Array.isArray(res.data) ? res.data : []);
      console.log('Parsed seats:', seats);

      setSeatGuestsCache((prev) => ({
        ...prev,
        [tableId]: seats,
      }));
    } catch (err) {
      console.error('Failed to fetch seat data:', err);
      // エラー時は番号のみ表示にフォールバック
    } finally {
      setLoadingSeats(false);
    }
  }, [seatGuestsCache]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>座席表</h2>
        {userData && (
          <div className={styles.userBanner}>
            <span className={styles.userName}>{userData.name} 様</span>
            <br />
            <span className={styles.tableId}>
              テーブル {userData.table_id}
            </span>
          </div>
        )}
      </div>

      {selectedTable ? (
        <SeatDetailView
          tableId={selectedTable}
          userData={userData}
          seatGuests={seatGuestsCache[selectedTable] || null}
          loadingSeats={loadingSeats}
          onBack={() => setSelectedTable(null)}
        />
      ) : (
        <OverviewMap
          userData={userData}
          onSelectTable={handleSelectTable}
        />
      )}
    </div>
  );
};

export default SeatMap;