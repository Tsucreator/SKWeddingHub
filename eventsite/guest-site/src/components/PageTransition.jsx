import { useEffect, useRef } from 'react';
import styles from './PageTransition.module.css';

/**
 * マウント時にフェードインするラッパー。
 * key が変わるたびに再マウント → 毎回フェードインが発動する。
 */
const PageTransition = ({ children }) => {
  const ref = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div ref={ref} className={styles.fadeIn}>
      {children}
    </div>
  );
};

export default PageTransition;
