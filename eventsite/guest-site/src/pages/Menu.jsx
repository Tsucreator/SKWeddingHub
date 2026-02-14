import { useState } from 'react';
import { Utensils, Wine } from 'lucide-react';
import styles from './Menu.module.css';

const Menu = () => {
  const [activeTab, setActiveTab] = useState('food');

  const foodMenu = [
    { category: 'Amuse', title: '始まりの一皿', description: '季節の厳選素材を使用したアミューズ' },
    { category: 'Premier', title: '彩り豊かなオードブル', description: '真鯛のマリネと有機野菜のプレス 庭園仕立て' },
    { category: 'Soupe', title: '季節のスープ', description: 'コンソメドゥーブル 芳醇な香りのパイ包み焼き' },
    { category: 'Poisson', title: '海の幸', description: '真鯛のポワレ 焦がしバターとバルサミコのソース' },
    { category: 'Viande', title: '肉料理', description: '特選牛フィレ肉のロースト 芳醇な赤ワインソース' },
    { category: 'Dessert', title: 'デザート', description: 'パティシエ特製 ショコラとベリーのシンフォニー' },
    { category: 'Pain / Café', title: 'パン・コーヒー', description: '焼き立てパンと、食後の香ばしい珈琲' },
  ];

  const drinkMenu = [
    { category: 'Beer', items: ['アサヒ スーパードライ', 'ノンアルコールビール'] },
    { category: 'Wine', items: ['シャンパン', '赤ワイン（ボルドー）', '白ワイン（シャルドネ）'] },
    { category: 'Whisky', items: ['ハイボール', 'ロック / 水割り'] },
    { category: 'Cocktail', items: ['カシスオレンジ', 'ジンライム', 'カンパリソーダ'] },
    { category: 'Soft Drink', items: ['オレンジジュース', 'ウーロン茶', 'ジンジャーエール', 'アップルジュース'] },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>MENU</h2>
      </div>

      {/* タブ切り替え */}
      <div className={styles.tabs}>
        <button
          onClick={() => setActiveTab('food')}
          className={activeTab === 'food' ? styles.tabActive : styles.tab}
        >
          <Utensils size={18} /> お料理
        </button>
        <button
          onClick={() => setActiveTab('drink')}
          className={activeTab === 'drink' ? styles.tabActive : styles.tab}
        >
          <Wine size={18} /> お飲み物
        </button>
      </div>

      {/* コンテンツ */}
      <div className={styles.content}>
        {activeTab === 'food' ? (
          <div>
            {foodMenu.map((item, index) => (
              <div key={index} className={styles.foodItem}>
                <span className={styles.foodCategory}>— {item.category} —</span>
                <h3 className={styles.foodTitle}>{item.title}</h3>
                <p className={styles.foodDescription}>{item.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {drinkMenu.map((group, index) => (
              <div key={index} className={styles.drinkGroup}>
                <h3 className={styles.drinkCategory}>{group.category}</h3>
                <div className={styles.drinkGrid}>
                  {group.items.map((item, i) => (
                    <span key={i} className={styles.drinkItem}>{item}</span>
                  ))}
                </div>
              </div>
            ))}
            <p className={styles.drinkFooter}>
              ※リストにないお飲み物はスタッフまでお申し付けください
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Menu;