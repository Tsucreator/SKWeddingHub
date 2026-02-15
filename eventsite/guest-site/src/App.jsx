import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PageTransition from './components/PageTransition';

// 各ページを lazy ロード — 初回表示時にチャンクを取得してからフェードインする
const Login    = lazy(() => import('./pages/Login'));
const Home     = lazy(() => import('./pages/Home'));
const Schedule = lazy(() => import('./pages/Schedule'));
const Menu     = lazy(() => import('./pages/Menu'));
const SeatMap  = lazy(() => import('./pages/SeatMap'));

function App() {
  const isAuthenticated = () => !!localStorage.getItem('guest');

  return (
    <BrowserRouter basename="/eventsite">
      <Suspense fallback={null}>
        <Routes>
          {/* ログイン画面（ナビなし）— PageTransition で囲んでフェードイン */}
          <Route
            path="/login"
            element={
              <PageTransition key="login">
                <Login />
              </PageTransition>
            }
          />

          {/* 認証が必要なページ */}
          <Route
            path="/"
            element={isAuthenticated() ? <Layout /> : <Navigate to="/login" />}
          >
            <Route index element={<Home />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="menu" element={<Menu />} />
            <Route path="map" element={<SeatMap />} />
          </Route>

          {/* /index.html や未知のパスは全てトップへリダイレクト */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;