import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SidebarLayout from '../components/SidebarLayout';
import './PatientDetail.css';

interface PatientConversationMessage {
  id: number;
  sender: 'patient' | 'care';
  senderName: string;
  text: string;
  time: string;
  flag?: string;
  severity?: 'critical' | 'warning' | 'info';
}

interface RelapseSymptoms {
  riskScore: number;
  riskLevel: 'high' | 'moderate' | 'stable';
  currentStage: string;
  identifiedTriggers: string[];
  emotionalSymptoms: string[];
  cognitiveSymptoms: string[];
  behavioralSymptoms: string[];
  physicalSymptoms: string[];
}

interface PatientSessionEvent {
  id: string;
  day: number;
  dateStr: string;
  time: string;
  patientName: string;
  patientId: string;
  age: number;
  primaryCondition: string;
  recoveryDays: number;
  assignedClinician: string;
  relapseSymptoms: RelapseSymptoms;
  conversation: PatientConversationMessage[];
}

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

            {/* ── Clinical Breakdown ── */}
            {activeTab === 'symptoms' && (
              <>
                <div className="pd-gauge-card">
                  <div className="pd-gauge-top-row">
                    <div>
                      <span className="pd-section-kicker">ASSESSMENT GAUGE</span>
                      <h3 className="pd-gauge-heading">Relapse Progression Risk</h3>
                    </div>
                    <div className="pd-gauge-score-wrap">
                      <span className="pd-gauge-big-num">{event.relapseSymptoms.riskScore}%</span>
                      <span className="pd-gauge-big-label">Vulnerability Probability</span>
                    </div>
                  </div>
                  <div className="pd-progress-track">
                    <div
                      className={`pd-progress-fill ${event.relapseSymptoms.riskLevel}`}
                      style={{ width: `${event.relapseSymptoms.riskScore}%` }}
                    />
                  </div>
                  <div className="pd-legend-row">
                    <span className="pd-legend-step">Phase 1: Emotional</span>
                    <span className="pd-legend-step current-step">Phase 2: Mental (Current)</span>
                    <span className="pd-legend-step">Phase 3: Physical</span>
                  </div>
                </div>

                <div className="pd-section-block">
                  <div className="pd-section-header">
                    <span className="pd-section-kicker">IDENTIFIED ROOT TRIGGERS</span>
                    <span className="pd-count-pill">{event.relapseSymptoms.identifiedTriggers.length} Triggers</span>
                  </div>
                  <div className="pd-triggers-grid">
                    {event.relapseSymptoms.identifiedTriggers.map((trig, i) => (
                      <div key={i} className="pd-trigger-item">
                        <span className="pd-trigger-index">0{i + 1}</span>
                        <span className="pd-trigger-text">{trig}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pd-section-block">
                  <div className="pd-section-header">
                    <span className="pd-section-kicker">FOUR-DIMENSIONAL SYMPTOM ANALYSIS</span>
                  </div>
                  <div className="pd-matrix-grid">
                    {[
                      { label: 'Emotional', symptoms: event.relapseSymptoms.emotionalSymptoms, dotClass: 'moderate' },
                      { label: 'Cognitive & Mental', symptoms: event.relapseSymptoms.cognitiveSymptoms, dotClass: 'high' },
                      { label: 'Behavioral', symptoms: event.relapseSymptoms.behavioralSymptoms, dotClass: 'high' },
                      { label: 'Physical', symptoms: event.relapseSymptoms.physicalSymptoms, dotClass: 'moderate' },
                    ].map(({ label, symptoms, dotClass }) => (
                      <div key={label} className="pd-matrix-col">
                        <div className="pd-col-header">
                          <span>{label}</span>
                          <span className="pd-col-count">{symptoms.length}</span>
                        </div>
                        <div className="pd-col-items">
                          {symptoms.map((sym, i) => (
                            <div key={i} className="pd-symptom-card">
                              <span className={`pd-risk-dot ${dotClass}`} />
                              <span>{sym}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── Conversation Transcript ── */}
            {activeTab === 'conversation' && (
              <div className="pd-transcript-container">
                <div className="pd-transcript-meta">
                  Transcript recorded during {event.dateStr} session at {event.time}. AI flagged markers indicate relapse indicators extracted in real-time.
                </div>
                {event.conversation.map((msg) => (
                  <div
                    key={msg.id}
                    className={`pd-message-item ${msg.sender === 'patient' ? 'patient' : 'care'}`}
                  >
                    <div className="pd-message-meta-row">
                      <strong>{msg.senderName}</strong>
                      <span>{msg.time}</span>
                    </div>
                    <div className="pd-message-bubble">{msg.text}</div>
                    {msg.flag && (
                      <div className={`pd-flag-badge ${msg.severity || ''}`}>
                        <span className="pd-risk-dot" />
                        <span>{msg.flag}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── Interventions & Notes ── */}
            {activeTab === 'actions' && (
              <div className="pd-actions-container">
                <div className="pd-actions-title">Direct Clinician Escalation Protocols</div>

                {actionNotice && (
                  <div className="pd-action-notice">{actionNotice}</div>
                )}

                <div className="pd-action-buttons-row">
                  <button
                    className="pd-btn-escalate"
                    onClick={() => handleTriggerAction('Crisis Intervention Team Dispatched')}
                  >
                    Dispatch Rapid Crisis Outreach
                  </button>
                  <button
                    className="pd-btn-urgent"
                    onClick={() => handleTriggerAction(`Emergency Session booked for ${event.patientName} with ${event.assignedClinician}`)}
                  >
                    Schedule Same-Day Clinical Triage
                  </button>
                  <button
                    className="pd-btn-care"
                    onClick={() => handleTriggerAction('Alert broadcasted to Patient Primary Sponsor & Care Contact')}
                  >
                    Notify Primary Sponsor &amp; Care Circle
                  </button>
                </div>

                <div className="pd-notes-section">
                  <label className="pd-notes-label">
                    Provider Observation Log &amp; Clinical Notes:
                  </label>
                  <textarea
                    className="pd-notes-textarea"
                    placeholder={`Document therapeutic notes, risk mitigation strategies, or medication instructions for ${event.patientName}...`}
                    value={clinicianNote}
                    onChange={(e) => setClinicianNote(e.target.value)}
                  />
                  <div className="pd-notes-footer">
                    <span className="pd-save-confirm">{noteSavedMessage}</span>
                    <button className="pd-btn-save" onClick={handleSaveNote}>
                      Save Observation Note
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default PatientDetail;
