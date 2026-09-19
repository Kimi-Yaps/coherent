import { useNavigate, useLocation } from 'react-router-dom';

interface AdminSidebarProps {
  /** When on the Admin page, pass setActiveTab to switch tabs in-place */
  activeTab?: 'timeline' | 'watchlist' | 'patient-status';
  setActiveTab?: (tab: 'timeline' | 'watchlist' | 'patient-status') => void;
}

const AdminSidebar = ({ activeTab, setActiveTab }: AdminSidebarProps) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isAdminPage   = pathname === '/admin';
  const isCalendar    = pathname.startsWith('/clinical-calendar');
  const isPatientDetail = pathname.startsWith('/patient-detail');

  // Navigate to Admin with a given tab, or switch in-place if already on Admin
  const goTo = (tab: 'timeline' | 'watchlist' | 'patient-status') => {
    if (isAdminPage && setActiveTab) {
      setActiveTab(tab);
    } else {
      navigate('/admin', { state: { activeTab: tab } });
    }
  };

  const sectionLabel = isPatientDetail ? 'Patient Record' : 'Clinical Administration';

  return (
    <div className="bookings-sidebar">
      <div
        className="claude-sidebar-section-title"
        style={{
          fontSize: '0.74rem',
          fontWeight: 600,
          color: '#9ca3af',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          padding: '0.2rem 0.65rem 0.4rem',
        }}
      >
        {sectionLabel}
      </div>

      {/* Session Detail — contextual, only on patient-detail page */}
      {isPatientDetail && (
        <button className="sidebar-nav-btn active">
          <span className="sidebar-nav-bullet" />
          Session Detail
        </button>
      )}

      {/* Patient Timeline */}
      <button
        className={`sidebar-nav-btn ${
          isAdminPage && activeTab === 'timeline' ? 'active' : ''
        }`}
        onClick={() => goTo('timeline')}
      >
        <span className="sidebar-nav-bullet" />
        Patient Timeline
      </button>

      {/* Calendar View */}
      <button
        className={`sidebar-nav-btn ${isCalendar ? 'active' : ''}`}
        onClick={() => navigate('/clinical-calendar')}
      >
        <span className="sidebar-nav-bullet" />
        Calendar View
      </button>

      {/* AI Watchlist */}
      <button
        className={`sidebar-nav-btn ${
          isAdminPage && activeTab === 'watchlist' ? 'active' : ''
        }`}
        onClick={() => goTo('watchlist')}
      >
        <span className="sidebar-nav-bullet" />
        AI Watchlist
      </button>
    </div>
  );
};

export default AdminSidebar;
