import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import Schedule from './pages/Schedule';
import Menu from './pages/Menu';
import SeatMap from './pages/SeatMap';

function App() {
  const isAuthenticated = () => !!localStorage.getItem('guest');

  return (
    <BrowserRouter basename="/eventsite">
      <Routes>
        {/* ログイン画面（ナビなし） */}
        <Route path="/login" element={<Login />} />

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
    </BrowserRouter>
  );
}

export default App;