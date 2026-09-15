import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import './App.css';

// Lazy loading the page components
const Home = lazy(() => import('./pages/Home'));
const AISupport = lazy(() => import('./pages/AISupport'));
const Chats = lazy(() => import('./pages/Chats'));
const Bookings = lazy(() => import('./pages/Bookings'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Profile = lazy(() => import('./pages/Profile'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div style={{ padding: '2rem' }}>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="ai-support" element={<AISupport />} />
            <Route path="chats" element={<Chats />} />
            <Route path="bookings" element={<Bookings defaultTab="booking" />} />
            <Route path="reschedule" element={<Bookings defaultTab="reschedule" />} />
            <Route path="calendar" element={<Bookings defaultTab="calendar" />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
