import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Heart, Utensils, MapPin, Camera, Gift, LogOut } from 'lucide-react';
import PageTransition from './PageTransition';
import styles from './Layout.module.css';

const GUEST_KEY = 'guest';
const GUEST_EXPIRES_AT_KEY = 'guest_expires_at';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { to: '/',         icon: Home,     label: 'Top' },
    { to: '/map',      icon: MapPin,   label: '座席表' },
    { to: '/menu',     icon: Utensils, label: 'お料理' },
    { to: '/about',    icon: Heart,    label: 'プロフ' },
    { to: '/gallery',  icon: Camera,   label: 'ギャラリー' },
    { to: '/gift',     icon: Gift,     label: '引出物' },
  ];

  const handleLogout = () => {
    localStorage.removeItem(GUEST_KEY);
    localStorage.removeItem(GUEST_EXPIRES_AT_KEY);
    navigate('/login', { replace: true });
  };

  return (
    <div className={styles.shell}>
      <main>
        {/* key に location.key を渡すことで、
            ルート変更のたびに PageTransition が再マウントされ、
            フェードインアニメーションが毎回発火する */}
        <PageTransition key={location.key}>
          <Outlet />
        </PageTransition>
      </main>

      <nav className={styles.nav}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`${styles.navItem} ${location.pathname === to ? styles.active : ''}`}
          >
            <Icon size={20} />
            <span className={styles.navLabel}>{label}</span>
          </Link>
        ))}

        <button
          type="button"
          onClick={handleLogout}
          className={`${styles.navItem} ${styles.navButton}`}
          aria-label="ログアウト"
        >
          <LogOut size={20} />
          <span className={styles.navLabel}>ログアウト</span>
        </button>
      </nav>
    </div>
  );
};

export default Layout;