import { useState } from 'react';
import { Utensils, Wine } from 'lucide-react';

const Menu = () => {
  const [activeTab, setActiveTab] = useState('food'); // 'food' or 'drink'

  // お料理のデータ
  const foodMenu = [
    { category: 'Amuse', title: '始まりの一皿', description: '季節の厳選素材を使用したアミューズ' },
    { category: 'Premier', title: '彩り豊かなオードブル', description: '真鯛のマリネと有機野菜のプレス 庭園仕立て' },
    { category: 'Soupe', title: '季節のスープ', description: 'コンソメドゥーブル 芳醇な香りのパイ包み焼き' },
    { category: 'Poisson', title: '海の幸', description: '真鯛のポワレ 焦がしバターとバルサミコのソース' },
    { category: 'Viande', title: '肉料理', description: '特選牛フィレ肉のロースト 芳醇な赤ワインソース' },
    { category: 'Dessert', title: 'デザート', description: 'パティシエ特製 ショコラとベリーのシンフォニー' },
    { category: 'Pain / Café', title: 'パン・コーヒー', description: '焼き立てパンと、食後の香ばしい珈琲' },
  ];

  // お飲み物のデータ
  const drinkMenu = [
    { category: 'Beer', items: ['アサヒ スーパードライ', 'ノンアルコールビール'] },
    { category: 'Wine', items: ['シャンパン', '赤ワイン（ボルドー）', '白ワイン（シャルドネ）'] },
    { category: 'Whisky', items: ['ハイボール', 'ロック / 水割り'] },
    { category: 'Cocktail', items: ['カシスオレンジ', 'ジンライム', 'カンパリソーダ'] },
    { category: 'Soft Drink', items: ['オレンジジュース', 'ウーロン茶', 'ジンジャーエール', 'アップルジュース'] },
  ];

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', padding: '30px 20px' }}>
      {/* タイトル */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ fontFamily: 'serif', color: '#B89130', letterSpacing: '0.1em', fontSize: '1.8rem' }}>MENU</h2>
      </div>

      {/* タブ切り替えボタン */}
      <div style={{ 
        display: 'flex', justifyContent: 'center', marginBottom: '40px', 
        borderBottom: '1px solid #EEE' 
      }}>
        <button 
          onClick={() => setActiveTab('food')}
          style={{
            padding: '10px 30px', border: 'none', backgroundColor: 'transparent',
            color: activeTab === 'food' ? '#B89130' : '#999',
            borderBottom: activeTab === 'food' ? '2px solid #B89130' : 'none',
            fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Utensils size={18} /> お料理
        </button>
        <button 
          onClick={() => setActiveTab('drink')}
          style={{
            padding: '10px 30px', border: 'none', backgroundColor: 'transparent',
            color: activeTab === 'drink' ? '#B89130' : '#999',
            borderBottom: activeTab === 'drink' ? '2px solid #B89130' : 'none',
            fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Wine size={18} /> お飲み物
        </button>
      </div>

      {/* コンテンツ表示 */}
      <div style={{ maxWidth: '450px', margin: '0 auto' }}>
        {activeTab === 'food' ? (
          /* お料理リスト */
          <div>
            {foodMenu.map((item, index) => (
              <div key={index} style={{ textAlign: 'center', marginBottom: '35px' }}>
                <span style={{ 
                  fontSize: '10px', color: '#B89130', letterSpacing: '0.2em', 
                  textTransform: 'uppercase', display: 'block', marginBottom: '4px' 
                }}>
                  — {item.category} —
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 'normal', margin: '0 0 8px 0', color: '#1A1A1A' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '12px', color: '#777', lineHeight: '1.6' }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        ) : (
          /* お飲み物リスト */
          <div>
            {drinkMenu.map((group, index) => (
              <div key={index} style={{ marginBottom: '30px' }}>
                <h3 style={{ 
                  fontSize: '14px', color: '#B89130', borderBottom: '1px dotted #D4AF37',
                  paddingBottom: '5px', marginBottom: '12px', fontFamily: 'serif'
                }}>
                  {group.category}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {group.items.map((item, i) => (
                    <span key={i} style={{ fontSize: '13px', color: '#444' }}>{item}</span>
                  ))}
                </div>
              </div>
            ))}
            <p style={{ fontSize: '11px', color: '#999', marginTop: '20px', textAlign: 'center' }}>
              ※リストにないお飲み物はスタッフまでお申し付けください
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Menu;