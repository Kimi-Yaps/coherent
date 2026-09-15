import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SidebarLayout from '../components/SidebarLayout';
import './Bookings.css';

interface BookingsProps {
  defaultTab?: 'booking' | 'calendar' | 'reschedule';
}

const Bookings = ({ defaultTab }: BookingsProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'booking' | 'calendar' | 'reschedule') || defaultTab || 'booking';
  const [activeTab, setActiveTab] = useState<'booking' | 'calendar' | 'reschedule'>(initialTab);

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
    setTimeout(() => setRescheduleNotice(''), 4000);
  };

  const handleConfirmBooking = () => {
    setBookingConfirmed(true);
    setTimeout(() => setBookingConfirmed(false), 4000);
  };

  const sidebarContent = (
    <div className="bookings-sidebar">
      <button 
        className={`sidebar-nav-btn ${activeTab === 'booking' ? 'active' : ''}`}
        onClick={() => handleTabChange('booking')}
      >
        Booking
      </button>
      <button 
        className={`sidebar-nav-btn ${activeTab === 'calendar' ? 'active' : ''}`}
        onClick={() => handleTabChange('calendar')}
      >
        Callendar
      </button>
      <button 
        className={`sidebar-nav-btn ${activeTab === 'reschedule' ? 'active' : ''}`}
        onClick={() => handleTabChange('reschedule')}
      >
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
            <h1 className="display-header page-header">RESCHEDULE</h1>
            
            {rescheduleNotice && (
              <div className="notification-banner success">
                {rescheduleNotice}
              </div>
            )}

            {/* WHICH SESSION? Card */}
            <div className="booking-card">
              <h3 className="section-title">WHICH SESSION?</h3>
              <div className="sessions-vertical-list">
                {[
                  '14 Sep · 10:30 · Amelia Chen',
                  '18 Sep · 17:00 · Rafael Ortiz',
                  '25 Sep · 09:00 · Nadia Rahman'
                ].map((session) => (
                  <button
                    key={session}
                    className={`session-bar-btn ${rescheduleSession === session ? 'selected' : ''}`}
                    onClick={() => setRescheduleSession(session)}
                  >
                    {session}
                  </button>
                ))}
              </div>
            </div>

            {/* NEW TIME Card */}
            <div className="booking-card">
              <h3 className="section-title">NEW TIME</h3>
              <div className="time-pills-row">
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
                Move session
              </button>
            </div>
          </>
        )}

        {/* BOOK A SESSION TAB */}
        {activeTab === 'booking' && (
          <>
            <h1 className="display-header page-header">BOOK A SESSION</h1>

            {bookingConfirmed && (
              <div className="notification-banner success">
                Session booked with {selectedListener} on {selectedDay} at {selectedTime}!
              </div>
            )}
            
            <div className="booking-card">
              <h3 className="section-title">CHOOSE A LISTENER</h3>
              <div className="options-group">
                {['Amelia Chen', 'Rafael Ortiz', 'Nadia Rahman'].map((name) => (
                  <button 
                    key={name}
                    className={`pill-btn ${selectedListener === name ? 'selected' : ''}`}
                    onClick={() => setSelectedListener(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="booking-card">
              <h3 className="section-title">PICK A DAY</h3>
              <div className="options-group">
                {['Mon 14', 'Tue 15', 'Wed 16', 'Thu 17', 'Fri 18'].map((day) => (
                  <button 
                    key={day}
                    className={`pill-btn ${selectedDay === day ? 'selected' : ''}`}
                    onClick={() => setSelectedDay(day)}
                  >
                    {day}
                  </button>
                ))}
              </div>
              
              <h3 className="section-title mt-4">PICK A TIME</h3>
              <div className="options-group">
                {['09:00', '10:30', '13:00', '15:30', '17:00', '19:30'].map((time) => (
                  <button 
                    key={time}
                    className={`pill-btn ${selectedTime === time ? 'selected' : ''}`}
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="booking-confirmation">
              <div className="confirmation-details">
                <strong>{selectedListener}</strong> &middot; {selectedDay} at {selectedTime}
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

        {/* CALLENDAR TAB */}
        {activeTab === 'calendar' && (
          <>
            <h1 className="display-header page-header">CALLENDAR</h1>
            
            <div className="booking-card">
              <h3 className="section-title">UPCOMING SESSIONS</h3>
              <div className="sessions-vertical-list">
                <div className="session-bar-btn selected">
                  14 Sep · 10:30 · Amelia Chen (Confirmed)
                </div>
                <div className="session-bar-btn">
                  18 Sep · 17:00 · Rafael Ortiz (Scheduled)
                </div>
                <div className="session-bar-btn">
                  25 Sep · 09:00 · Nadia Rahman (Scheduled)
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </SidebarLayout>
  );
};

export default Bookings;
