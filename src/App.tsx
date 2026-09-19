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
const Admin = lazy(() => import('./pages/Admin'));
const Auth = lazy(() => import('./pages/Auth'));
const AdminPortal = lazy(() => import('./pages/AdminPortal'));
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
              <Route path="auth" element={<Auth />} />
              <Route path="admin-portal" element={<AdminPortal />} />
              <Route 
                path="admin" 
                element={
                  <ProtectedRoute allowedRoles={['clinician_admin']}>
                    <Admin />
                  </ProtectedRoute>
                } 
              />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
