import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SidebarLayout from '../components/SidebarLayout';
import {
  ClinicalBreakdown,
  ConversationTranscript,
  InterventionsPanel,
  type PatientSessionEvent,
} from '../components/PatientDetailSections';
import { buildPatientSummary } from '../components/patientDetailUtils';
import './PatientDetail.css';

const PatientDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const event = location.state?.event as PatientSessionEvent | undefined;

  const [activeTab, setActiveTab] = useState<'symptoms' | 'conversation' | 'actions'>('symptoms');
  const [clinicianNote, setClinicianNote] = useState('');
  const [noteSavedMessage, setNoteSavedMessage] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  const handleTriggerAction = (actionName: string) => {
    setActionNotice(`Action initiated: ${actionName}`);
    setTimeout(() => setActionNotice(''), 4000);
  };

  const handleSaveNote = () => {
    if (!clinicianNote.trim()) return;
    setNoteSavedMessage('Clinical note logged successfully into medical record.');
    setTimeout(() => setNoteSavedMessage(''), 3500);
  };

  const sidebarContent = (
    <div className="bookings-sidebar">
      <div
        className="claude-sidebar-section-title"
        style={{ fontSize: '0.74rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '0.2rem 0.65rem 0.4rem' }}
      >
        Patient Record
      </div>
      <button className="sidebar-nav-btn active">
        <span className="sidebar-nav-bullet" />
        Session Detail
      </button>
      <button className="sidebar-nav-btn" onClick={() => navigate('/admin')}>
        <span className="sidebar-nav-bullet" />
        Patient Timeline
      </button>
      <button className="sidebar-nav-btn" onClick={() => navigate('/admin', { state: { activeTab: 'watchlist' } })}>
        <span className="sidebar-nav-bullet" />
        AI Watchlist
      </button>
      <button className="sidebar-nav-btn" onClick={() => navigate('/clinical-calendar')}>
        <span className="sidebar-nav-bullet" />
        Calendar View
      </button>
    </div>
  );

  if (!event) {
    return (
      <SidebarLayout sidebarContent={sidebarContent}>
        <div className="patient-detail-page">
          <div className="pd-not-found">
            <h2>No patient session selected.</h2>
            <button className="pd-back-btn" onClick={() => navigate('/admin')}>
              ← Back to Admin
            </button>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout sidebarContent={sidebarContent}>
      <div className="patient-detail-page">

        {/* Breadcrumb nav */}
        <div className="pd-page-header">
          <button className="pd-back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <div className="pd-breadcrumb">
            <span className="pd-breadcrumb-link" onClick={() => navigate('/admin')}>Admin</span>
            <span className="pd-breadcrumb-sep">›</span>
            <span className="pd-breadcrumb-link" onClick={() => navigate('/admin')}>Patient Timeline</span>
            <span className="pd-breadcrumb-sep">›</span>
            <span className="pd-breadcrumb-current">{event.patientName}</span>
          </div>
        </div>

        {/* Main card */}
        <div className="pd-main-card">

          {/* Header */}
          <div className="pd-card-header">
            <div className="pd-name-badge-row">
              <h1 className="pd-patient-name">{event.patientName}</h1>
              <span className={`pd-risk-badge ${event.relapseSymptoms.riskLevel}`}>
                <span className="pd-risk-dot" />
                {event.relapseSymptoms.riskScore}% Relapse Risk
              </span>
            </div>
            <div className="pd-meta-chips">
              <span className="pd-meta-chip">ID {event.patientId}</span>
              <span className="pd-meta-chip">{event.age} yrs</span>
              <span className="pd-meta-chip">Day {event.recoveryDays} Sobriety</span>
              <span className="pd-meta-chip">{event.assignedClinician}</span>
              <span className="pd-meta-chip">{event.dateStr} · {event.time}</span>
            </div>
          </div>

          {/* Insight callout */}
          <div className="pd-insight-card">
            <div className="pd-insight-top">
              <div className="pd-insight-tag">
                <span className="pd-risk-dot" />
                <span>{event.relapseSymptoms.currentStage}</span>
              </div>
              <span className="pd-insight-urgency">Priority Clinical Triage</span>
            </div>
            <p className="pd-insight-desc">
              AI and clinical markers indicate active relapse vulnerability. Immediate support review is active.
            </p>
          </div>

          {/* AI-generated overview from the patient's clinical session signals */}
          <div className="pd-ai-summary-card">
            <div className="pd-ai-summary-icon" aria-hidden="true">✣</div>
            <div className="pd-ai-summary-content">
              <div className="pd-ai-summary-heading-row">
                <h2>AI Clinical Summary</h2>
                <span>Generated from session signals</span>
              </div>
              <p>{buildPatientSummary(event)}</p>
              <small>Review alongside the full clinical record. This summary supports, but does not replace, clinician judgment.</small>
            </div>
          </div>

          {/* Tabs */}
          <div className="pd-tabs-nav">
            <button
              className={`pd-tab-btn ${activeTab === 'symptoms' ? 'active' : ''}`}
              onClick={() => setActiveTab('symptoms')}
            >
              Clinical Breakdown
            </button>
            <button
              className={`pd-tab-btn ${activeTab === 'conversation' ? 'active' : ''}`}
              onClick={() => setActiveTab('conversation')}
            >
              Conversation Transcript ({event.conversation.length})
            </button>
            <button
              className={`pd-tab-btn ${activeTab === 'actions' ? 'active' : ''}`}
              onClick={() => setActiveTab('actions')}
            >
              Interventions &amp; Notes
            </button>
          </div>

          {/* Tab body */}
          <div className="pd-tab-body">
            {activeTab === 'symptoms' && (
              <ClinicalBreakdown event={event} />
            )}

            {activeTab === 'conversation' && (
              <ConversationTranscript event={event} />
            )}

            {activeTab === 'actions' && (
              <InterventionsPanel
                event={event}
                clinicianNote={clinicianNote}
                noteSavedMessage={noteSavedMessage}
                actionNotice={actionNotice}
                onNoteChange={setClinicianNote}
                onSaveNote={handleSaveNote}
                onTriggerAction={handleTriggerAction}
              />
            )}

          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default PatientDetail;
