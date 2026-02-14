import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Utensils, MapPin, Camera, Info } from 'lucide-react';
import PropTypes from 'prop-types';
import styles from './Layout.module.css';

const Layout = () => {
  const location = useLocation();

  const navItems = [
    { to: '/',         icon: Home,     label: 'Top' },
    { to: '/map',      icon: MapPin,   label: 'お席' },
    { to: '/schedule', icon: Calendar, label: '進行' },
    { to: '/menu',     icon: Utensils, label: '料理' },
    { to: '/gallery',  icon: Camera,   label: 'ギャラリー' },
    { to: '/info',     icon: Info,     label: 'Info' },
  ];

  return (
    <div className={styles.shell}>
      <main>
        <Outlet />
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
      </nav>
    </div>
  );
};

export default Layout;