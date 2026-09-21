import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import SidebarLayout from '../components/SidebarLayout';
import { useNotifications } from '../context/useNotifications';
import { useAuth } from '../context/useAuth';
import {
  createBooking,
  rescheduleBooking,
  getPatientBookings,
  type DbBooking,
} from '../services/bookingDbService';
import { isFirebaseConfigured } from '../firebase';
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

const Bookings = ({ defaultTab }: BookingsProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'booking' | 'calendar' | 'reschedule') || defaultTab || 'booking';
  const [activeTab, setActiveTab] = useState<'booking' | 'calendar' | 'reschedule'>(initialTab);
  const { addNotification } = useNotifications();
  const { user, profile } = useAuth();

  const userId = user?.uid || profile?.uid || 'guest_user';
  const storageKey = `coherent_user_bookings_${userId}`;

  // Per-user Bookings State
  const [userBookings, setUserBookings] = useState<DbBooking[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore storage parse error
    }
    return [];
  });

  // Load bookings for this user from Firestore if configured
  const loadUserBookings = useCallback(async () => {
    if (isFirebaseConfigured && userId) {
      try {
        const dbBookings = await getPatientBookings(userId);
        if (dbBookings.length > 0) {
          setUserBookings(dbBookings);
          localStorage.setItem(storageKey, JSON.stringify(dbBookings));
          return;
        }
      } catch (err) {
        console.error('Failed to load user bookings from Firestore:', err);
      }
    }
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setUserBookings(JSON.parse(saved));
      } else {
        setUserBookings([]);
      }
    } catch {
      setUserBookings([]);
    }
  }, [userId, storageKey]);

  useEffect(() => {
    loadUserBookings();
  }, [loadUserBookings]);

  // Save to local storage whenever userBookings changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(userBookings));
    } catch {
      // ignore error
    }
  }, [userBookings, storageKey]);

  // Booking form state
  const [selectedListener, setSelectedListener] = useState('Amelia Chen');
  const [selectedDay, setSelectedDay] = useState('Mon 14');
  const [selectedTime, setSelectedTime] = useState('10:30');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // Reschedule state
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [rescheduleTime, setRescheduleTime] = useState('Mon 21 · 11:00');
  const [rescheduleNotice, setRescheduleNotice] = useState('');

  // Set default selected booking for reschedule when bookings load
  useEffect(() => {
    if (userBookings.length > 0 && !selectedBookingId) {
      setSelectedBookingId(userBookings[0].id);
    }
  }, [userBookings, selectedBookingId]);

  const handleTabChange = (tab: 'booking' | 'calendar' | 'reschedule') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleMoveSession = async () => {
    const target = userBookings.find(b => b.id === selectedBookingId) || userBookings[0];
    if (!target) return;

    const [newDate, newSlot] = rescheduleTime.includes('·')
      ? rescheduleTime.split('·').map(s => s.trim())
      : [rescheduleTime, target.timeSlot];

    try {
      await rescheduleBooking(target.id, newDate, newSlot || target.timeSlot);
    } catch (err) {
      console.warn('Reschedule sync failed, updating local state:', err);
    }

    const updated = userBookings.map(b => 
      b.id === target.id 
        ? { ...b, dateStr: newDate, timeSlot: newSlot || b.timeSlot, status: 'Rescheduled' as const }
        : b
    );
    setUserBookings(updated);

    setRescheduleNotice(`Session with ${target.counselorName} moved to ${rescheduleTime}!`);
    addNotification({
      icon: '🔄',
      title: 'Session Rescheduled',
      description: `Your session was moved to ${rescheduleTime}.`,
      link: '/bookings?tab=calendar',
      category: 'booking',
    });
    setTimeout(() => setRescheduleNotice(''), 4000);
  };

  const handleConfirmBooking = async () => {
    const listenerObj = listeners.find(l => l.name === selectedListener);
    const counselorRole = listenerObj?.role || 'Counselor';

    let newId = `booking_${Date.now()}`;
    try {
      newId = await createBooking(userId, selectedListener, counselorRole, selectedDay, selectedTime);
    } catch (err) {
      console.warn('Booking save error, saving locally:', err);
    }

    const newBooking: DbBooking = {
      id: newId,
      patientId: userId,
      counselorName: selectedListener,
      counselorRole,
      dateStr: selectedDay,
      timeSlot: selectedTime,
      status: 'Confirmed',
    };

    setUserBookings(prev => [newBooking, ...prev]);
    setSelectedBookingId(newId);
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
              <div>
                <h1 className="display-header page-header">RESCHEDULE</h1>
                <p className="admin-subtitle" style={{ fontSize: '0.84rem', color: '#6b7280', margin: '0.25rem 0 0' }}>
                  Move your scheduled care appointments to a new available date and time
                </p>
              </div>
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
              {userBookings.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                  <p>You have no scheduled appointments to reschedule.</p>
                  <button 
                    className="btn-outline" 
                    style={{ marginTop: '0.75rem' }} 
                    onClick={() => handleTabChange('booking')}
                  >
                    Book a New Session
                  </button>
                </div>
              ) : (
                <div className="sessions-vertical-list">
                  {userBookings.map((session) => {
                    const isSelected = selectedBookingId === session.id;
                    return (
                      <button
                        key={session.id}
                        className={`session-bar-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedBookingId(session.id)}
                      >
                        <div className="session-bar-left">
                          <span className="session-bar-date">{session.dateStr}</span>
                          <span className="session-bar-time">{session.timeSlot}</span>
                        </div>
                        <div className="session-bar-details">
                          <span className="session-bar-name">{session.counselorName}</span>
                          <span className="session-bar-status">{session.status}</span>
                        </div>
                        <span className="session-bar-radio" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* NEW TIME Card */}
            {userBookings.length > 0 && (
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
            )}
          </>
        )}

        {/* BOOK A SESSION TAB */}
        {activeTab === 'booking' && (
          <>
            <div className="bookings-page-header-row">
              <div>
                <h1 className="display-header page-header">BOOK A SESSION</h1>
                <p className="admin-subtitle" style={{ fontSize: '0.84rem', color: '#6b7280', margin: '0.25rem 0 0' }}>
                  Confidential 1-on-1 sessions with licensed recovery specialists and psychologists
                </p>
              </div>
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
              <div>
                <h1 className="display-header page-header">CALENDAR</h1>
                <p className="admin-subtitle" style={{ fontSize: '0.84rem', color: '#6b7280', margin: '0.25rem 0 0' }}>
                  View upcoming confirmed and scheduled appointments with your care team
                </p>
              </div>
              <span className="bookings-header-badge">Your Appointments</span>
            </div>
            
            <div className="booking-card">
              <h3 className="section-title">UPCOMING SESSIONS</h3>
              {userBookings.length === 0 ? (
                <div style={{ padding: '2rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
                  <p style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>No upcoming sessions booked yet.</p>
                  <button 
                    className="btn-green" 
                    onClick={() => handleTabChange('booking')}
                  >
                    Book Your First Session
                  </button>
                </div>
              ) : (
                <div className="calendar-sessions-list">
                  {userBookings.map((session) => {
                    const dateParts = (session.dateStr || 'Today').split(' ');
                    const dayLabel = dateParts[0] || 'Day';
                    const numLabel = dateParts[1] || '';
                    return (
                      <div key={session.id} className="calendar-session-card">
                        <div className="calendar-session-date-box">
                          <span className="cal-day">{dayLabel}</span>
                          <span className="cal-month">{numLabel}</span>
                        </div>
                        <div className="calendar-session-info">
                          <div className="calendar-session-header-line">
                            <span className="calendar-counselor-name">{session.counselorName}</span>
                            <span className={`calendar-status-badge ${(session.status || 'confirmed').toLowerCase()}`}>
                              {session.status}
                            </span>
                          </div>
                          <span className="calendar-time-line">🕒 {session.timeSlot} · 50 min session</span>
                        </div>
                        <button 
                          className="calendar-reschedule-btn"
                          onClick={() => {
                            setSelectedBookingId(session.id);
                            handleTabChange('reschedule');
                          }}
                        >
                          Reschedule
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </SidebarLayout>
  );
};

export default Bookings;
