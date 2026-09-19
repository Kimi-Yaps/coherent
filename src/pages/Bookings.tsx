import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SidebarLayout from '../components/SidebarLayout';
import { useNotifications } from '../context/useNotifications';
import './Bookings.css';

interface BookingsProps {
  defaultTab?: 'booking' | 'calendar' | 'reschedule';
}

interface ListenerOption {
  id: string;
  name: string;
  role: string;
  initials: string;
  avatarBg: string;
}

interface DayOption {
  dayName: string;
  dateNum: string;
  fullDate: string;
}

const listeners: ListenerOption[] = [
  { id: 'amelia', name: 'Amelia Chen', role: 'Psychologist', initials: 'AC', avatarBg: '#3b6e58' },
  { id: 'rafael', name: 'Rafael Ortiz', role: 'Licensed Counselor', initials: 'RO', avatarBg: '#4e6e48' },
  { id: 'nadia', name: 'Nadia Rahman', role: 'Peer Specialist', initials: 'NR', avatarBg: '#3e5c5a' }
];

const days: DayOption[] = [
  { dayName: 'Mon', dateNum: '14', fullDate: 'Mon 14' },
  { dayName: 'Tue', dateNum: '15', fullDate: 'Tue 15' },
  { dayName: 'Wed', dateNum: '16', fullDate: 'Wed 16' },
  { dayName: 'Thu', dateNum: '17', fullDate: 'Thu 17' },
  { dayName: 'Fri', dateNum: '18', fullDate: 'Fri 18' }
];

const timeSlots = ['09:00', '10:30', '13:00', '15:30', '17:00', '19:30'];

const rescheduleSessions = [
  { id: 's1', date: '14 Sep', time: '10:30', counselor: 'Amelia Chen', status: 'Confirmed' },
  { id: 's2', date: '18 Sep', time: '17:00', counselor: 'Rafael Ortiz', status: 'Scheduled' },
  { id: 's3', date: '25 Sep', time: '09:00', counselor: 'Nadia Rahman', status: 'Scheduled' }
];


const Bookings = ({ defaultTab }: BookingsProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'booking' | 'calendar' | 'reschedule') || defaultTab || 'booking';
  const [activeTab, setActiveTab] = useState<'booking' | 'calendar' | 'reschedule'>(initialTab);
  const { addNotification } = useNotifications();

  // Booking state
  const [selectedListener, setSelectedListener] = useState('Amelia Chen');
  const [selectedDay, setSelectedDay] = useState('Mon 14');
  const [selectedTime, setSelectedTime] = useState('10:30');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // Reschedule state
  const [rescheduleSession, setRescheduleSession] = useState('14 Sep · 10:30 · Amelia Chen');
  const [rescheduleTime, setRescheduleTime] = useState('Mon 21 · 11:00');
  const [rescheduleNotice, setRescheduleNotice] = useState('');

  const handleTabChange = (tab: 'booking' | 'calendar' | 'reschedule') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleMoveSession = () => {
    setRescheduleNotice(`Session successfully moved to ${rescheduleTime}!`);
    addNotification({
      icon: '🔄',
      title: 'Session Rescheduled',
      description: `Your session was moved to ${rescheduleTime}.`,
      link: '/bookings?tab=calendar',
      category: 'booking',
    });
    setTimeout(() => setRescheduleNotice(''), 4000);
  };

  const handleConfirmBooking = () => {
    setBookingConfirmed(true);
    addNotification({
      icon: '🗓️',
      title: 'Booking Confirmed',
      description: `Session with ${selectedListener} confirmed for ${selectedDay} at ${selectedTime}.`,
      link: '/bookings?tab=calendar',
      category: 'booking',
    });
    setTimeout(() => setBookingConfirmed(false), 4000);
  };

  const sidebarContent = (
    <div className="bookings-sidebar">
      <div className="claude-sidebar-section-title" style={{ fontSize: '0.74rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '0.2rem 0.65rem 0.4rem' }}>
        Sessions & Schedule
      </div>
      <button 
        className={`sidebar-nav-btn ${activeTab === 'booking' ? 'active' : ''}`}
        onClick={() => handleTabChange('booking')}
      >
        <span className="sidebar-nav-bullet" />
        Booking
      </button>
      <button 
        className={`sidebar-nav-btn ${activeTab === 'calendar' ? 'active' : ''}`}
        onClick={() => handleTabChange('calendar')}
      >
        <span className="sidebar-nav-bullet" />
        Calendar
      </button>
      <button 
        className={`sidebar-nav-btn ${activeTab === 'reschedule' ? 'active' : ''}`}
        onClick={() => handleTabChange('reschedule')}
      >
        <span className="sidebar-nav-bullet" />
        Reschedule
      </button>
    </div>
  );

  return (
    <SidebarLayout sidebarContent={sidebarContent}>
      <div className="bookings-container">
        {/* RESCHEDULE TAB */}
        {activeTab === 'reschedule' && (
          <>
            <div className="bookings-page-header-row">
              <h1 className="display-header page-header">RESCHEDULE</h1>
              <span className="bookings-header-badge">Manage Sessions</span>
            </div>
            
            {rescheduleNotice && (
              <div className="notification-banner success">
                {rescheduleNotice}
              </div>
            )}

            {/* WHICH SESSION? Card */}
            <div className="booking-card">
              <h3 className="section-title">WHICH SESSION?</h3>
              <div className="sessions-vertical-list">
                {rescheduleSessions.map((session) => {
                  const sessionLabel = `${session.date} · ${session.time} · ${session.counselor}`;
                  const isSelected = rescheduleSession.includes(session.counselor);
                  return (
                    <button
                      key={session.id}
                      className={`session-bar-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => setRescheduleSession(sessionLabel)}
                    >
                      <div className="session-bar-left">
                        <span className="session-bar-date">{session.date}</span>
                        <span className="session-bar-time">{session.time}</span>
                      </div>
                      <div className="session-bar-details">
                        <span className="session-bar-name">{session.counselor}</span>
                        <span className="session-bar-status">{session.status}</span>
                      </div>
                      <span className="session-bar-radio" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* NEW TIME Card */}
            <div className="booking-card">
              <h3 className="section-title">PICK A NEW TIME</h3>
              <div className="time-pills-grid">
                {[
                  'Mon 21 · 11:00',
                  'Tue 22 · 14:00',
                  'Wed 23 · 18:30',
                  'Fri 25 · 09:30'
                ].map((timeOption) => (
                  <button
                    key={timeOption}
                    className={`time-pill-btn ${rescheduleTime === timeOption ? 'selected' : ''}`}
                    onClick={() => setRescheduleTime(timeOption)}
                  >
                    {timeOption}
                  </button>
                ))}
              </div>

              <button 
                className="btn-full-green"
                onClick={handleMoveSession}
              >
                Confirm New Session Time
              </button>
            </div>
          </>
        )}

        {/* BOOK A SESSION TAB */}
        {activeTab === 'booking' && (
          <>
            <div className="bookings-page-header-row">
              <h1 className="display-header page-header">BOOK A SESSION</h1>
              <span className="bookings-header-badge">Confidential & 1-on-1</span>
            </div>

            {bookingConfirmed && (
              <div className="notification-banner success">
                ✓ Session successfully booked with {selectedListener} on {selectedDay} at {selectedTime}!
              </div>
            )}
            
            {/* CHOOSE A LISTENER */}
            <div className="booking-card">
              <h3 className="section-title">CHOOSE A LISTENER</h3>
              <div className="listeners-cards-grid">
                {listeners.map((listener) => {
                  const isSelected = selectedListener === listener.name;
                  return (
                    <button 
                      key={listener.id}
                      className={`listener-card-select ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedListener(listener.name)}
                    >
                      <div 
                        className="listener-avatar-badge"
                        style={{ backgroundColor: listener.avatarBg }}
                      >
                        {listener.initials}
                      </div>
                      <div className="listener-card-info">
                        <span className="listener-card-name">{listener.name}</span>
                        <span className="listener-card-role">{listener.role}</span>
                      </div>
                      {isSelected && <span className="selection-check">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* PICK A DAY & TIME */}
            <div className="booking-card">
              <h3 className="section-title">PICK A DAY</h3>
              <div className="day-carousel-row">
                {days.map((day) => {
                  const isSelected = selectedDay === day.fullDate;
                  return (
                    <button 
                      key={day.fullDate}
                      className={`day-chip-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedDay(day.fullDate)}
                    >
                      <span className="day-chip-name">{day.dayName}</span>
                      <span className="day-chip-num">{day.dateNum}</span>
                    </button>
                  );
                })}
              </div>
              
              <h3 className="section-title mt-4">PICK A TIME</h3>
              <div className="time-slots-grid">
                {timeSlots.map((time) => {
                  const isSelected = selectedTime === time;
                  return (
                    <button 
                      key={time}
                      className={`time-slot-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* CONFIRMATION SUMMARY BAR */}
            <div className="booking-confirmation">
              <div className="confirmation-summary-info">
                <div className="confirmation-badge-icon">🗓️</div>
                <div className="confirmation-details">
                  <span className="confirmation-listener">{selectedListener}</span>
                  <span className="confirmation-datetime">{selectedDay} · {selectedTime}</span>
                </div>
              </div>
              <div className="confirmation-actions">
                <button 
                  className="btn-outline"
                  onClick={() => handleTabChange('reschedule')}
                >
                  Reschedule
                </button>
                <button 
                  className="btn-green"
                  onClick={handleConfirmBooking}
                >
                  Confirm booking
                </button>
              </div>
            </div>
          </>
        )}

        {/* CALENDAR TAB */}
        {activeTab === 'calendar' && (
          <>
            <div className="bookings-page-header-row">
              <h1 className="display-header page-header">CALENDAR</h1>
              <span className="bookings-header-badge">Your Appointments</span>
            </div>
            
            <div className="booking-card">
              <h3 className="section-title">UPCOMING SESSIONS</h3>
              <div className="calendar-sessions-list">
                {rescheduleSessions.map((session) => (
                  <div key={session.id} className="calendar-session-card">
                    <div className="calendar-session-date-box">
                      <span className="cal-day">{session.date.split(' ')[0]}</span>
                      <span className="cal-month">{session.date.split(' ')[1]}</span>
                    </div>
                    <div className="calendar-session-info">
                      <div className="calendar-session-header-line">
                        <span className="calendar-counselor-name">{session.counselor}</span>
                        <span className={`calendar-status-badge ${session.status.toLowerCase()}`}>
                          {session.status}
                        </span>
                      </div>
                      <span className="calendar-time-line">🕒 {session.time} · 50 min session</span>
                    </div>
                    <button 
                      className="calendar-reschedule-btn"
                      onClick={() => {
                        setRescheduleSession(`${session.date} · ${session.time} · ${session.counselor}`);
                        handleTabChange('reschedule');
                      }}
                    >
                      Reschedule
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </SidebarLayout>
  );
};

export default Bookings;
