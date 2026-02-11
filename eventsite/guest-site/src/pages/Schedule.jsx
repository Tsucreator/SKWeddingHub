import { Clock } from 'lucide-react';

const Schedule = () => {
  // 進行データ（時間はご自身の予定に合わせて書き換えてください）
  const scheduleData = [
    { time: '12:00', title: '受付開始', description: 'Welcome' },
    { time: '12:30', title: '披露宴 開宴', description: 'Opening' },
    { time: '12:45', title: '新郎新婦 入場', description: 'Entrance' },
    { time: '13:00', title: 'ウェルカムスピーチ / 乾杯', description: 'Toast' },
    { time: '13:15', title: 'ケーキ入刀', description: 'Cake Cutting' },
    { time: '13:45', title: 'お色直し退場', description: 'Retiring' },
    { time: '14:15', title: '再入場', description: 'Re-Entrance' },
    { time: '14:45', title: '余興 / 歓談', description: 'Performance & Talk' },
    { time: '15:15', title: '感謝の手紙 / 花束贈呈', description: 'Letters & Flowers' },
    { time: '15:30', title: 'おひらき（結び）', description: 'Closing' },
  ];

  // 現在時刻を取得して、どの進行中か判定するロジック（オプション）
  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ padding: '40px 20px', backgroundColor: '#fff' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ fontFamily: 'serif', color: '#B89130', letterSpacing: '0.1em' }}>SCHEDULE</h2>
        <p style={{ fontSize: '12px', color: '#999' }}>当日の進行状況により前後する場合がございます</p>
      </div>

      <div style={{ position: 'relative', maxWidth: '400px', margin: '0 auto' }}>
        {/* 中央の線 */}
        <div style={{
          position: 'absolute', left: '20px', top: 0, bottom: 0,
          width: '1px', backgroundColor: '#D4AF37', opacity: 0.3
        }}></div>

        {/* タイムライン項目 */}
        {scheduleData.map((item, index) => (
          <div key={index} style={{
            display: 'flex', marginBottom: '30px', position: 'relative', alignItems: 'flex-start'
          }}>
            {/* 左側のドット */}
            <div style={{
              width: '10px', height: '10px', borderRadius: '50%',
              backgroundColor: '#D4AF37', border: '3px solid #fff',
              zIndex: 2, marginRight: '30px', marginTop: '6px',
              boxShadow: '0 0 5px rgba(212, 175, 55, 0.5)'
            }}></div>

            {/* 右側のテキスト */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                    fontFamily: 'serif', fontSize: '14px', fontWeight: 'bold', color: '#333' 
                }}>
                  {item.time}
                </span>
                <Clock size={12} color="#B89130" />
              </div>
              <h3 style={{ fontSize: '16px', margin: '4px 0', color: '#1A1A1A' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ 
        marginTop: '40px', padding: '20px', border: '1px solid #F0F0F0', 
        borderRadius: '8px', textAlign: 'center', fontSize: '13px', color: '#666'
      }}>
        <p>※お帰りのタクシー・送迎バスのご案内は<br />「会場案内」をご確認ください</p>
      </div>
    </div>
  );
};

export default Schedule;