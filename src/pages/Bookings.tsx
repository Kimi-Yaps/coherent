import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import SidebarLayout from '../components/SidebarLayout';
import { useNotifications } from '../context/useNotifications';
import { useAuth } from '../context/useAuth';
import {
  createBooking,
  rescheduleBooking,
  getPatientBookings,
  parseBookingDate,
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
  isoDate: string;
}

const listeners: ListenerOption[] = [
  { id: 'sarah', name: 'Dr. Sarah Jenkins', role: 'Lead Addiction Psychiatrist', initials: 'SJ', avatarBg: '#2b5a45' },
  { id: 'michael', name: 'Dr. Michael Vance', role: 'Senior Clinical Psychologist', initials: 'MV', avatarBg: '#1e3a8a' },
  { id: 'amelia', name: 'Dr. Amelia Chen', role: 'Clinical Care Specialist', initials: 'AC', avatarBg: '#701a75' },
  { id: 'rafael', name: 'Rafael Ortiz', role: 'Licensed Counselor', initials: 'RO', avatarBg: '#4e6e48' },
  { id: 'nadia', name: 'Nadia Rahman', role: 'Peer Specialist', initials: 'NR', avatarBg: '#3e5c5a' }
];

const AVAILABLE_TIME_SLOTS = [
  '08:30 AM', '09:30 AM', '10:30 AM', '11:30 AM',
  '01:00 PM', '02:30 PM', '03:45 PM', '04:30 PM',
  '05:30 PM', '06:45 PM', '07:30 PM', '08:15 PM'
];

const Bookings = ({ defaultTab }: BookingsProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'booking' | 'calendar' | 'reschedule') || defaultTab || 'booking';
  const [activeTab, setActiveTab] = useState<'booking' | 'calendar' | 'reschedule'>(initialTab);
  const { addNotification } = useNotifications();
  const { user, profile } = useAuth();

  const userId = user?.uid || profile?.uid || 'guest_user';
  const storageKey = `coherent_user_bookings_${userId}`;

  // Generate dynamic upcoming days
  const upcomingDays: DayOption[] = useMemo(() => {
    const result: DayOption[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const base = new Date();

    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const dayName = dayNames[d.getDay()];
      const dateNum = String(d.getDate()).padStart(2, '0');
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const isoDate = `${yyyy}-${mm}-${dateNum}`;
      result.push({
        dayName,
        dateNum,
        fullDate: `${dayName} ${dateNum}`,
        isoDate,
      });
    }
    return result;
  }, []);

  // Generate dynamic reschedule time slot options
  const rescheduleOptions = useMemo(() => {
    const slots: string[] = [];
    const base = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const times = ['10:30', '14:00', '16:00', '18:30'];

    for (let i = 1; i <= 4; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const dayName = dayNames[d.getDay()];
      const dateNum = String(d.getDate()).padStart(2, '0');
      const time = times[i - 1];
      slots.push(`${dayName} ${dateNum} · ${time}`);
    }
    return slots;
  }, []);

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
  const [selectedListener, setSelectedListener] = useState(listeners[0].name);
  const [selectedDayObj, setSelectedDayObj] = useState<DayOption>(upcomingDays[0] || {
    dayName: 'Today',
    dateNum: '01',
    fullDate: 'Today 01',
    isoDate: new Date().toISOString().slice(0, 10),
  });
  const [selectedTime, setSelectedTime] = useState('10:30');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // Reschedule state
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [rescheduleTime, setRescheduleTime] = useState(rescheduleOptions[0] || '11:00');
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
      description: `Your session with ${target.counselorName} was moved to ${rescheduleTime}.`,
      link: '/bookings?tab=calendar',
      category: 'booking',
    });
    setTimeout(() => setRescheduleNotice(''), 4000);
  };

  const handleConfirmBooking = async () => {
    const listenerObj = listeners.find(l => l.name === selectedListener);
    const counselorRole = listenerObj?.role || 'Clinical Counselor';

    let newId = `booking_${Date.now()}`;
    const patientName = user?.displayName || user?.email?.split('@')[0] || 'Member';
    const targetDateStr = selectedDayObj.isoDate || selectedDayObj.fullDate;

    try {
      newId = await createBooking(userId, selectedListener, counselorRole, targetDateStr, selectedTime, patientName);
    } catch (err) {
      console.warn('Booking save error, saving locally:', err);
    }

    const newBooking: DbBooking = {
      id: newId,
      patientId: userId,
      patientName,
      counselorName: selectedListener,
      counselorRole,
      dateStr: targetDateStr,
      timeSlot: selectedTime,
      status: 'Confirmed',
    };

    setUserBookings(prev => [newBooking, ...prev]);
    setSelectedBookingId(newId);
    setBookingConfirmed(true);

    addNotification({
      icon: '🗓️',
      title: 'Booking Confirmed',
      description: `Session with ${selectedListener} confirmed for ${selectedDayObj.fullDate} at ${selectedTime}.`,
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
                    const parsed = parseBookingDate(session.dateStr);
                    const displayDate = parsed 
                      ? new Date(parsed.year, parsed.month, parsed.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })
                      : session.dateStr;
                    return (
                      <button
                        key={session.id}
                        className={`session-bar-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedBookingId(session.id)}
                      >
                        <div className="session-bar-left">
                          <span className="session-bar-date">{displayDate}</span>
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
                  {rescheduleOptions.map((timeOption) => (
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
                ✓ Session successfully booked with {selectedListener} on {selectedDayObj.fullDate} at {selectedTime}!
              </div>
            )}
            
            {/* CHOOSE A LISTENER */}
            <div className="booking-card">
              <h3 className="section-title">CHOOSE A LISTENER / CLINICIAN</h3>
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

            {/* SESSION FORMAT */}
            <div className="booking-card">
              <h3 className="section-title">SESSION FORMAT</h3>
              <div className="time-pills-grid">
                {[
                  '50-Min 1-on-1 Video Session',
                  '30-Min Audio Wellness Check-in',
                  '15-Min Rapid Crisis Triage',
                ].map((format) => (
                  <button
                    key={format}
                    type="button"
                    className={`time-pill-btn ${selectedTime.includes(format.slice(0, 6)) || format.startsWith('50-Min') ? 'selected' : ''}`}
                    onClick={() => {}}
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>
            
            {/* PICK A DAY & TIME */}
            <div className="booking-card">
              <h3 className="section-title">PICK A DAY</h3>
              <div className="day-carousel-row">
                {upcomingDays.map((day) => {
                  const isSelected = selectedDayObj.isoDate === day.isoDate;
                  return (
                    <button 
                      key={day.isoDate}
                      className={`day-chip-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedDayObj(day)}
                    >
                      <span className="day-chip-name">{day.dayName}</span>
                      <span className="day-chip-num">{day.dateNum}</span>
                    </button>
                  );
                })}
              </div>
              
              <h3 className="section-title mt-4">AVAILABLE TIME SLOTS</h3>
              <div className="time-slots-grid">
                {AVAILABLE_TIME_SLOTS.map((time) => {
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
                  <span className="confirmation-datetime">{selectedDayObj.fullDate} · {selectedTime}</span>
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
                    const parsed = parseBookingDate(session.dateStr);
                    const dayLabel = parsed 
                      ? new Date(parsed.year, parsed.month, parsed.day).toLocaleDateString('en-US', { weekday: 'short' })
                      : (session.dateStr || 'Day').split(' ')[0] || 'Day';
                    const numLabel = parsed
                      ? String(parsed.day)
                      : (session.dateStr || '1').split(' ')[1] || '1';
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
