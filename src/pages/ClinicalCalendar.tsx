import { useState } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import AdminSidebar from '../components/AdminSidebar';
import './ClinicalCalendar.css';

const ClinicalCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(8); // 8 = September (0-indexed)
  const [currentYear, setCurrentYear] = useState(2024);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  // Adjust so Monday is first day of week, or keep Sunday first. Standard calendar is Sunday first.
  const leadingBlanks = firstDayOfMonth === 0 ? 0 : firstDayOfMonth; // 0 = Sunday

  // Mock events for September 2024
  const mockEvents = [
    { day: 6, patientName: "Marcus Vance", type: "high" },
    { day: 12, patientName: "Elena Rostova", type: "moderate" },
    { day: 18, patientName: "Amelia Chen", type: "stable" },
    { day: 22, patientName: "Rafael Ortiz", type: "moderate" },
    { day: 27, patientName: "Marcus Vance", type: "high" }
  ];

  return (
    <SidebarLayout sidebarContent={<AdminSidebar />}>
      <div className="calendar-page-container">
        <div className="calendar-header-row">
          <h1 className="display-header">CLINICAL CALENDAR</h1>
          <p className="calendar-subtitle">Monthly overview of patient risk events and AI care interventions</p>
        </div>

        <div className="calendar-card">
          <div className="calendar-nav-header">
            <button className="btn-month-nav" onClick={handlePrevMonth}>&lt;</button>
            <h2 className="calendar-month-title">{monthNames[currentMonth]} {currentYear}</h2>
            <button className="btn-month-nav" onClick={handleNextMonth}>&gt;</button>
          </div>

          <div className="calendar-grid">
            <div className="calendar-weekday-row">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="calendar-weekday-cell">{day}</div>
              ))}
            </div>

            <div className="calendar-days-grid">
              {Array.from({ length: leadingBlanks }).map((_, i) => (
                <div key={`blank-${i}`} className="calendar-day-cell empty"></div>
              ))}
              
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday = currentYear === 2024 && currentMonth === 8 && day === 19;
                
                const dayEvents = currentYear === 2024 && currentMonth === 8 
                  ? mockEvents.filter(e => e.day === day)
                  : [];

                return (
                  <div key={`day-${day}`} className={`calendar-day-cell ${isToday ? 'today' : ''}`}>
                    <div className="calendar-day-num">{day}</div>
                    
                    <div className="calendar-events-container">
                      {dayEvents.map((ev, idx) => (
                        <div key={idx} className={`calendar-event-badge ${ev.type}`}>
                          {ev.patientName}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default ClinicalCalendar;
