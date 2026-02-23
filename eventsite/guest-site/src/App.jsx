import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PageTransition from './components/PageTransition';

// 各ページを lazy ロード — 初回表示時にチャンクを取得してからフェードインする
const Login    = lazy(() => import('./pages/Login'));
const Home     = lazy(() => import('./pages/Home'));
const AboutUs  = lazy(() => import('./pages/AboutUs'));
const Menu     = lazy(() => import('./pages/Menu'));
const SeatMap  = lazy(() => import('./pages/SeatMap'));
const Gift     = lazy(() => import('./pages/Gift'));

const hasValidGuest = () => {
  try {
    const raw = localStorage.getItem('guest');
    if (!raw) return false;
    const guest = JSON.parse(raw);
    return !!guest?.email;
  } catch {
    return false;
  }
};

const RequireAuth = ({ children }) => {
  return hasValidGuest() ? children : <Navigate to="/login" replace />;
};

const GuestOnly = ({ children }) => {
  return hasValidGuest() ? <Navigate to="/" replace /> : children;
};

function App() {
  return (
    <BrowserRouter basename="/eventsite">
      <Suspense fallback={null}>
        <Routes>
          {/* ログイン画面（ナビなし）— PageTransition で囲んでフェードイン */}
          <Route
            path="/login"
            element={
              <GuestOnly>
                <PageTransition key="login">
                  <Login />
                </PageTransition>
              </GuestOnly>
            }
          />

          {/* 認証が必要なページ */}
          <Route
            path="/"
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<Home />} />
            <Route path="about" element={<AboutUs />} />
            <Route path="menu" element={<Menu />} />
            <Route path="map" element={<SeatMap />} />
            <Route path="gift" element={<Gift />} />
          </Route>

          {/* /index.html や未知のパスは全てトップへリダイレクト */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;