import React, { useCallback, useRef, useEffect, useState } from "react";
import QuickPinchZoom, { make3dTransformValue } from "react-quick-pinch-zoom";

const SeatMap = () => {
  const imgRef = useRef();
  const [userData, setUserData] = useState(null);

  // ログイン情報を取得
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

  // 各テーブルの配置データ（実際の会場に合わせて調整）
  const tables = [
    { id: 'A', x: 100, y: 100, name: 'Table A' },
    { id: 'B', x: 300, y: 100, name: 'Table B' },
    { id: 'C', x: 100, y: 300, name: 'Table C' },
    { id: 'D', x: 300, y: 300, name: 'Table D' },
    // 必要に応じて追加
  ];

  return (
    <div style={{ padding: '20px', backgroundColor: '#fff', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'serif', color: '#B89130' }}>SEAT MAP</h2>
        <p style={{ fontSize: '12px', color: '#666' }}>ピンチ操作で拡大・縮小できます</p>
        {userData && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#F9F3E5', border: '1px solid #D4AF37', borderRadius: '8px' }}>
            <span style={{ fontWeight: 'bold' }}>{userData.name} 様のテーブルは</span>
            <br />
            <span style={{ fontSize: '24px', color: '#D4AF37', fontWeight: 'bold' }}>【 {userData.table_id} 】</span> です
          </div>
        )}
      </div>

      {/* ズーム可能エリア */}
      <div style={{ border: '1px solid #eee', overflow: 'hidden', backgroundColor: '#fafafa', borderRadius: '12px' }}>
        <QuickPinchZoom onUpdate={onUpdate} wheelScaleFactor={500}>
          <div ref={imgRef} style={{ width: '400px', height: '500px' }}>
            <svg width="400" height="500" viewBox="0 0 400 500">
              {/* 高砂（メインテーブル） */}
              <rect x="100" y="20" width="200" height="40" fill="#1A1A1A" rx="4" />
              <text x="200" y="45" textAnchor="middle" fill="#D4AF37" fontSize="12">Main Table</text>

              {/* 各テーブルの描画 */}
              {tables.map((t) => {
                const isMyTable = userData?.table_id === t.id;
                return (
                  <g key={t.id}>
                    {/* テーブルの円 */}
                    <circle 
                      cx={t.x} cy={t.y} r="40" 
                      fill={isMyTable ? "#D4AF37" : "#fff"} 
                      stroke={isMyTable ? "#B89130" : "#ccc"} 
                      strokeWidth={isMyTable ? "4" : "1"}
                      style={{ transition: 'all 0.3s' }}
                    />
                    {/* テーブル名 */}
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
                      <text x={t.x} y={t.y + 60} textAnchor="middle" fill="#B89130" fontSize="12" fontWeight="bold">
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