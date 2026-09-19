import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import './App.css';

// Lazy loading the page components
const Home = lazy(() => import('./pages/Home'));
const AISupport = lazy(() => import('./pages/AISupport'));
const Bookings = lazy(() => import('./pages/Bookings'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Profile = lazy(() => import('./pages/Profile'));
const Admin = lazy(() => import('./pages/Admin'));
const Auth = lazy(() => import('./pages/Auth'));
const AdminPortal = lazy(() => import('./pages/AdminPortal'));
const ClinicalCalendar = lazy(() => import('./pages/ClinicalCalendar'));
const PatientDetail = lazy(() => import('./pages/PatientDetail'));
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthProvider';
import { NotificationProvider } from './context/NotificationProvider';
import { ChatQuotaProvider } from './context/ChatQuotaProvider';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <ChatQuotaProvider>
            <Suspense fallback={<div style={{ padding: '2rem' }}>Loading...</div>}>
              <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route 
                path="ai-support" 
                element={
                  <ProtectedRoute>
                    <AISupport />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="bookings" 
                element={
                  <ProtectedRoute>
                    <Bookings defaultTab="booking" />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="reschedule" 
                element={
                  <ProtectedRoute>
                    <Bookings defaultTab="reschedule" />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="calendar" 
                element={
                  <ProtectedRoute>
                    <Bookings defaultTab="calendar" />
                  </ProtectedRoute>
                } 
              />
              <Route path="faq" element={<FAQ />} />
              <Route 
                path="profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
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
              <Route
                path="clinical-calendar"
                element={
                  <ProtectedRoute allowedRoles={['clinician_admin']}>
                    <ClinicalCalendar />
                  </ProtectedRoute>
                }
              />
              <Route
                path="patient-detail"
                element={
                  <ProtectedRoute allowedRoles={['clinician_admin']}>
                    <PatientDetail />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </ChatQuotaProvider>
    </NotificationProvider>
  </AuthProvider>
</BrowserRouter>
  );
}

export default App;
