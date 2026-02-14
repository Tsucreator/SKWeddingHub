import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Utensils, MapPin, Camera, Info} from 'lucide-react';

const Layout = () => {
  const location = useLocation();

  // アクティブなメニューの色を変えるための判定
  const isActive = (path) => location.pathname === path ? '#D4AF37' : '#888';

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* ここに各ページの中身が表示される */}
      <main>
        <Outlet />
      </main>

      {/* 下部固定ナビゲーション */}
      <nav style={{
        position: 'fixed', bottom: 0, width: '100%', maxWidth: '500px', // スマホ幅を想定
        left: '50%', transform: 'translateX(-50%)',
        backgroundColor: '#1A1A1A', display: 'flex', justifyContent: 'space-around',
        padding: '12px 0', borderTop: '1px solid #333', zIndex: 1000
      }}>
        <NavItem to="/" icon={<Home size={20} />} label="Top" color={isActive('/')} />
        <NavItem to="/map" icon={<MapPin size={20} />} label="お席" color={isActive('/map')} />
        <NavItem to="/schedule" icon={<Calendar size={20} />} label="進行" color={isActive('/schedule')} />
        <NavItem to="/menu" icon={<Utensils size={20} />} label="料理" color={isActive('/menu')} />
        <NavItem to="/gallery" icon={<Camera size={20} />} label="ギャラリー" color={isActive('/gallery')} />
        <NavItem to="/info" icon={<Info size={20} />} label="Info" color={isActive('/info')} />
      </nav>
    </div>
  );
};

// リンクパーツ
const NavItem = ({ to, icon, label, color }) => (
  <Link to={to} style={{ 
    textDecoration: 'none', color: color, display: 'flex', 
    flexDirection: 'column', alignItems: 'center', fontSize: '10px' 
  }}>
    {icon}
    <span style={{ marginTop: '4px' }}>{label}</span>
  </Link>
);

export default Layout;