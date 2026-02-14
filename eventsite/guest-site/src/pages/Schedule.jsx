import { Clock } from 'lucide-react';
import styles from './Schedule.module.css';

const Schedule = () => {
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

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>SCHEDULE</h2>
        <p className={styles.note}>当日の進行状況により前後する場合がございます</p>
      </div>

      <div className={styles.timeline}>
        <div className={styles.timelineLine} />

        {scheduleData.map((item, index) => (
          <div key={index} className={styles.timelineItem}>
            <div className={styles.dot} />
            <div>
              <div className={styles.timeRow}>
                <span className={styles.time}>{item.time}</span>
                <Clock size={12} color="var(--color-gold-dark)" />
              </div>
              <h3 className={styles.itemTitle}>{item.title}</h3>
              <p className={styles.itemDescription}>{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <p>※お帰りのタクシー・送迎バスのご案内は<br />「会場案内」をご確認ください</p>
      </div>
    </div>
  );
};

export default Schedule;