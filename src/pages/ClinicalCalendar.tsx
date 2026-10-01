import { useState, useEffect, useCallback, useMemo } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import AdminSidebar from '../components/AdminSidebar';
import {
  getAllBookingsForAdmin,
  getCounselorsFromDb,
  parseBookingDate,
  type DbBooking,
  type CounselorProfile,
} from '../services/bookingDbService';
import './ClinicalCalendar.css';

const ClinicalCalendar = () => {
  const now = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('All');
  const [selectedBooking, setSelectedBooking] = useState<DbBooking | null>(null);

  const [bookings, setBookings] = useState<DbBooking[]>([]);
  const [counselors, setCounselors] = useState<CounselorProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [bookingsData, counselorsData] = await Promise.all([
        getAllBookingsForAdmin(),
        getCounselorsFromDb(),
      ]);
      setBookings(bookingsData);
      setCounselors(counselorsData);
    } catch (err) {
      console.error('Error loading clinical calendar data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const leadingBlanks = firstDayOfMonth === 0 ? 0 : firstDayOfMonth; // 0 = Sunday

  // Filter bookings by month and selected doctor
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (selectedDoctorFilter !== 'All' && b.counselorName !== selectedDoctorFilter) {
        return false;
      }
      return true;
    });
  }, [bookings, selectedDoctorFilter]);

  // Map bookings to day numbers in current month
  const dayBookingsMap = useMemo(() => {
    const map: Record<number, DbBooking[]> = {};
    filteredBookings.forEach((b) => {
      const d = parseBookingDate(b.dateStr);
      if (d && d.year === currentYear && d.month === currentMonth) {
        if (!map[d.day]) map[d.day] = [];
        map[d.day].push(b);
      }
    });
    return map;
  }, [filteredBookings, currentYear, currentMonth]);

  const PRIMARY_CLINICIANS = useMemo(
    () => [
      {
        id: 'clinician-jenkins',
        name: 'Dr. Sarah Jenkins',
        role: 'Lead Addiction Psychiatrist',
        specialty: 'Dual-Diagnosis & Pharmacotherapy',
        initials: 'SJ',
        avatarColor: '#2b5a45',
      },
      {
        id: 'clinician-vance',
        name: 'Dr. Michael Vance',
        role: 'Senior Clinical Psychologist',
        specialty: 'CBT & Relapse Prevention',
        initials: 'MV',
        avatarColor: '#1e3a8a',
      },
      {
        id: 'clinician-chen',
        name: 'Dr. Amelia Chen',
        role: 'Clinical Care Specialist',
        specialty: 'Trauma & Crisis Triage',
        initials: 'AC',
        avatarColor: '#701a75',
      },
    ],
    []
  );

  // Compute live booking schedules for the 3 primary clinicians
  const clinicianRosterData = useMemo(() => {
    return PRIMARY_CLINICIANS.map((clinician) => {
      const nameKey = clinician.name.toLowerCase();
      const lastName = clinician.name.split(' ').pop()?.toLowerCase() || '';

      const matchedBookings = bookings.filter((b) => {
        const cName = (b.counselorName || '').toLowerCase();
        return cName.includes(lastName) || cName.includes(nameKey);
      });

      const busyDays: number[] = [];
      const patientNames = new Set<string>();

      matchedBookings.forEach((b) => {
        if (b.patientName) patientNames.add(b.patientName);
        const d = parseBookingDate(b.dateStr);
        if (d && d.year === currentYear && d.month === currentMonth) {
          if (!busyDays.includes(d.day)) {
            busyDays.push(d.day);
          }
        }
      });

      const isBusyThisMonth = busyDays.length > 0;

      return {
        ...clinician,
        totalBookings: matchedBookings.length,
        busyDays: busyDays.sort((a, b) => a - b),
        isBusyThisMonth,
        recentPatientNames: Array.from(patientNames).slice(0, 3),
      };
    });
  }, [PRIMARY_CLINICIANS, bookings, currentYear, currentMonth]);

  const uniqueDoctors = useMemo(() => {
    return PRIMARY_CLINICIANS.map((c) => c.name);
  }, [PRIMARY_CLINICIANS]);

  return (
    <SidebarLayout sidebarContent={<AdminSidebar />}>
      <div className="calendar-page-container">
        {/* Page Header */}
        <div className="calendar-header-row">
          <h1 className="display-header">CLINICAL CALENDAR & DOCTOR ROSTER</h1>
          <button className="btn-month-nav" onClick={loadData}>
            Refresh Bookings
          </button>
        </div>

        {/* Doctor Availability & Workload Summary Table with Top Slider */}
        <div className="doctor-roster-summary-bar">
          <div className="roster-header">
            <div>
              <span className="roster-title">CLINICIAN AVAILABILITY STATUS</span>
            </div>
            <span className="roster-legend">
              <span className="status-dot busy" /> Booked / Not Free &nbsp;&nbsp;
              <span className="status-dot available" /> Available For Consultations
            </span>
          </div>

          <div className="admin-table-top-slider-wrapper">
            <table className="watchlist-table clinician-roster-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '220px' }}>Clinician &amp; Specialty</th>
                  <th style={{ minWidth: '150px' }}>Role / Department</th>
                  <th style={{ minWidth: '140px' }}>Availability</th>
                  <th style={{ minWidth: '160px' }}>Active Bookings</th>
                  <th style={{ minWidth: '190px' }}>Monthly Schedule</th>
                  <th style={{ minWidth: '120px', textAlign: 'center' }}>Filter</th>
                </tr>
              </thead>
              <tbody>
                {clinicianRosterData.map((clinician) => {
                  const isSelected = selectedDoctorFilter === clinician.name;
                  return (
                    <tr
                      key={clinician.id}
                      className={isSelected ? 'selected-row' : ''}
                      style={{ backgroundColor: isSelected ? '#f0f9ff' : undefined }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            className="doctor-avatar-circle"
                            style={{ backgroundColor: clinician.avatarColor }}
                          >
                            {clinician.initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                              {clinician.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {clinician.specialty}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                          {clinician.role}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`doctor-status-badge ${clinician.isBusyThisMonth ? 'busy' : 'available'}`}
                        >
                          <span
                            className="status-dot"
                            style={{
                              backgroundColor: clinician.isBusyThisMonth ? '#ef4444' : '#10b981',
                              marginRight: '4px',
                            }}
                          />
                          {clinician.isBusyThisMonth ? 'Busy / Not Free' : 'Available'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
                            {clinician.totalBookings} Active Booking{clinician.totalBookings === 1 ? '' : 's'}
                          </span>
                          {clinician.recentPatientNames.length > 0 && (
                            <span style={{ fontSize: '0.73rem', color: '#64748b' }}>
                              Patients: {clinician.recentPatientNames.join(', ')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', color: '#334155' }}>
                          {clinician.isBusyThisMonth
                            ? `${clinician.busyDays.length} Booked Day${clinician.busyDays.length === 1 ? '' : 's'} in ${monthNames[currentMonth].slice(0, 3)}`
                            : 'Open for Consultations'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className={`btn-filter-doctor ${isSelected ? 'active' : ''}`}
                          onClick={() => setSelectedDoctorFilter(isSelected ? 'All' : clinician.name)}
                        >
                          {isSelected ? '✓ Selected' : 'Filter'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="calendar-filter-toolbar">
          <div className="filter-item">
            <label>Filter by Doctor:</label>
            <select
              value={selectedDoctorFilter}
              onChange={(e) => setSelectedDoctorFilter(e.target.value)}
              className="doctor-filter-select"
            >
              <option value="All">All Clinicians & Doctors ({bookings.length} Total Bookings)</option>
              {uniqueDoctors.map((docName) => {
                const cData = clinicianRosterData.find(c => c.name === docName);
                return (
                  <option key={docName} value={docName}>
                    {docName} ({cData?.totalBookings || 0} Booked)
                  </option>
                );
              })}
            </select>
          </div>
          {selectedDoctorFilter !== 'All' && (
            <button className="btn-clear-filter" onClick={() => setSelectedDoctorFilter('All')}>
              ✕ Clear Filter
            </button>
          )}
        </div>

        {/* Main Calendar Card */}
        <div className="calendar-card">
          <div className="calendar-nav-header">
            <button className="btn-month-nav" onClick={handlePrevMonth} aria-label="Previous Month">
              &lt;
            </button>
            <h2 className="calendar-month-title">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <button className="btn-month-nav" onClick={handleNextMonth} aria-label="Next Month">
              &gt;
            </button>
          </div>

          <div className="calendar-grid">
            <div className="calendar-weekday-row">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="calendar-weekday-cell">
                  {day}
                </div>
              ))}
            </div>

            <div className="calendar-days-grid">
              {Array.from({ length: leadingBlanks }).map((_, i) => (
                <div key={`blank-${i}`} className="calendar-day-cell empty" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday =
                  currentYear === now.getFullYear() &&
                  currentMonth === now.getMonth() &&
                  day === now.getDate();

                const dayBookings = dayBookingsMap[day] || [];

                return (
                  <div key={`day-${day}`} className={`calendar-day-cell ${isToday ? 'today' : ''}`}>
                    <div className="calendar-day-num">{day < 10 ? `0${day}` : day}</div>

                    <div className="calendar-events-container">
                      {isLoading ? (
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Loading...</span>
                      ) : dayBookings.length === 0 ? null : (
                        dayBookings.map((b) => (
                          <div
                            key={b.id}
                            className={`calendar-booking-badge ${b.status.toLowerCase()}`}
                            onClick={() => setSelectedBooking(b)}
                            title={`Booked with ${b.counselorName} for ${b.patientName} at ${b.timeSlot}`}
                          >
                            <span className="booking-badge-time">{b.timeSlot}</span>
                            <span className="booking-badge-doc">🚫 {b.counselorName}</span>
                            <span className="booking-badge-patient">({b.patientName || 'Patient'})</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Booking Modal Details */}
        {selectedBooking && (
          <div className="booking-modal-overlay" onClick={() => setSelectedBooking(null)}>
            <div className="booking-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="booking-modal-header">
                <div>
                  <span className="booking-modal-kicker">APPOINTMENT DETAIL</span>
                  <h3 className="booking-modal-title">Consultation Session</h3>
                </div>
                <button className="modal-close-btn" onClick={() => setSelectedBooking(null)}>
                  &times;
                </button>
              </div>

              <div className="booking-modal-body">
                <div className="booking-info-row">
                  <span className="label">Clinician (Not Free):</span>
                  <span className="val bold">{selectedBooking.counselorName} ({selectedBooking.counselorRole})</span>
                </div>
                <div className="booking-info-row">
                  <span className="label">Patient Name:</span>
                  <span className="val bold">{selectedBooking.patientName || 'Registered Patient'}</span>
                </div>
                <div className="booking-info-row">
                  <span className="label">Patient ID:</span>
                  <span className="val">{selectedBooking.patientId}</span>
                </div>
                <div className="booking-info-row">
                  <span className="label">Date & Time:</span>
                  <span className="val bold">{selectedBooking.dateStr} at {selectedBooking.timeSlot}</span>
                </div>
                <div className="booking-info-row">
                  <span className="label">Booking Status:</span>
                  <span className={`status-pill ${selectedBooking.status.toLowerCase()}`}>
                    {selectedBooking.status}
                  </span>
                </div>
              </div>

              <div className="booking-modal-footer">
                <button className="btn-secondary" onClick={() => setSelectedBooking(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};

export default ClinicalCalendar;
