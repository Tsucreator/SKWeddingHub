import { useState } from 'react';
import { Utensils, Wine } from 'lucide-react';
import styles from './Menu.module.css';

const KIDS_GUEST_ID = 14;

const Menu = () => {
  const [activeTab, setActiveTab] = useState('drink');

  // localStorage からゲスト情報を取得し kids 判定
  const guest = JSON.parse(localStorage.getItem('guest') || '{}');
  const isKids = Number(guest.guest_id) === KIDS_GUEST_ID;

  const drinkMenu = [
    { category: 'ビール', items: ['アサヒ スーパードライ', 'ノンアルコールビール'] },
    { category: 'ワイン', items: ['赤', '白'] },
    { category: 'ウィスキー', items: ['ロック', '水割り', 'ソーダ割り'] },
    { category: 'カクテル', items: ['ジン', 'カシス', 'カンパリ', 'ライチ', 'ノンアルコール'] },
    { category: '日本酒', items: ['燗', '冷'] },
    { category: '焼酎', items: ['麦', '芋'] },
    { category: 'サワー', items: ['レモン', 'グレープフルーツ'] },
    { category: '梅酒', items: ['ロック', '水割り', 'ソーダ割り'] },
    { category: 'ソフトドリンク', items: ['オレンジ', 'グレープフルーツ', 'ウーロン茶', 'コーラ', 'ジンジャーエール'] },
  ];

  const kidsDrinkMenu = [
    { category: 'ソフトドリンク', items: ['オレンジ', 'グレープフルーツ', 'ウーロン茶', 'コーラ', 'ジンジャーエール'] },
  ];

  const foodMenu = [
    { category: 'Hors d\'oeuvres', title: '前菜', description: '国産アトランティックサーモン・ビーツ・海塩サブレのコンポジション\nキャビア添え3種のコンフィチュール' },
    { category: 'Hors d\'oeuvres', title: '', description: '千葉県産恋する豚のフリール\nエーグルドゥースソース マッシュルーの香り' },
    { category: 'Soupe', title: 'スープ', description: '千葉県産しあわせ絆牛のポトフ\nレフォールクリーム' },
    { category: 'Poisson', title: '魚料理', description: '蝮夷鮑のパイ包み焼き\n車海老のエッセンス ヴァンブランソース' },
    { category: 'Viande', title: '肉料理', description: '国産牛フィレ肉 フォアグラ添え ロッシーニ風\nマデラ酒とトリュフのソース' },
    { category: 'Dessert', title: 'デザート', description: 'フロマージュムース\nパッションフルーツジュレ レモンのメレンゲ 苺ソース' },
    { category: 'Pain / Café', title: 'パン・コーヒー', description: '焼き立てパンと食後の香ばしい珈琲' },
  ];

  const kidsFoodMenu = [
    { title: '冷製料理 3種盛り', description: '鮎のヴァプールと野菜のマリネ\n鴨のスモークとかぼちゃのサラダ\nライスヌードルのトマトソース添え' },
    { title: '温製料理 3種盛り', description: '牛フィレ肉のステーキ\n白身魚と帆立貝の蒸し焼き 甘酢あんかけ\n鶏肉の米粉から揚げとソーセージ' },
    { title: 'メインと小鉢料理', description: 'フライドポテト\n野菜のブイヨンスープ\n鮭チャーハン\n米粉パン' },
    { title: 'デザート', description: 'フルーツゼリー' },
  ];

  const activeFoodMenu = isKids ? kidsFoodMenu : foodMenu;
  const activeDrinkMenu = isKids ? kidsDrinkMenu : drinkMenu;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>{isKids ? 'KIDS MENU' : 'MENU'}</h2>
      </div>

      {/* タブ切り替え */}
      <div className={styles.tabs}>
        <button
          onClick={() => setActiveTab('drink')}
          className={activeTab === 'drink' ? styles.tabActive : styles.tab}
        >
          <Wine size={18} /> お飲み物
        </button>
        <button
          onClick={() => setActiveTab('food')}
          className={activeTab === 'food' ? styles.tabActive : styles.tab}
        >
          <Utensils size={18} /> お料理
        </button>
      </div>

      {/* コンテンツ */}
      <div className={styles.content}>
        {activeTab === 'food' ? (
          <div>
            {activeFoodMenu.map((item, index) => (
              <div key={index} className={styles.foodItem}>
                <h3 className={styles.foodTitle}>{item.title}</h3>
                <p className={styles.foodDescription}>{item.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {activeDrinkMenu.map((group, index) => (
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