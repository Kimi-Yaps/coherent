export interface PatientConversationMessage {
  id: number;
  sender: 'patient' | 'care';
  senderName: string;
  text: string;
  time: string;
  flag?: string;
  severity?: 'critical' | 'warning' | 'info';
}

export interface RelapseSymptoms {
  riskScore: number;
  riskLevel: 'high' | 'moderate' | 'stable';
  currentStage: string;
  identifiedTriggers: string[];
  emotionalSymptoms: string[];
  cognitiveSymptoms: string[];
  behavioralSymptoms: string[];
  physicalSymptoms: string[];
}

export interface PatientSessionEvent {
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

export const ClinicalBreakdown = ({ event }: { event: PatientSessionEvent }) => (
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
        {event.relapseSymptoms.identifiedTriggers.map((trigger, index) => (
          <div key={index} className="pd-trigger-item">
            <span className="pd-trigger-index">0{index + 1}</span>
            <span className="pd-trigger-text">{trigger}</span>
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
              {symptoms.map((symptom, index) => (
                <div key={index} className="pd-symptom-card">
                  <span className={`pd-risk-dot ${dotClass}`} />
                  <span>{symptom}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </>
);

export const ConversationTranscript = ({ event }: { event: PatientSessionEvent }) => (
  <div className="pd-transcript-container">
    <div className="pd-transcript-meta">
      Transcript recorded during {event.dateStr} session at {event.time}. AI flagged markers indicate relapse indicators extracted in real-time.
    </div>
    {event.conversation.map((message) => (
      <div
        key={message.id}
        className={`pd-message-item ${message.sender === 'patient' ? 'patient' : 'care'}`}
      >
        <div className="pd-message-meta-row">
          <strong>{message.senderName}</strong>
          <span>{message.time}</span>
        </div>
        <div className="pd-message-bubble">{message.text}</div>
        {message.flag && (
          <div className={`pd-flag-badge ${message.severity || ''}`}>
            <span className="pd-risk-dot" />
            <span>{message.flag}</span>
          </div>
        )}
      </div>
    ))}
  </div>
);

interface InterventionsPanelProps {
  event: PatientSessionEvent;
  clinicianNote: string;
  noteSavedMessage: string;
  actionNotice: string;
  onNoteChange: (note: string) => void;
  onSaveNote: () => void;
  onTriggerAction: (actionName: string) => void;
}

export const InterventionsPanel = ({
  event,
  clinicianNote,
  noteSavedMessage,
  actionNotice,
  onNoteChange,
  onSaveNote,
  onTriggerAction,
}: InterventionsPanelProps) => (
  <div className="pd-actions-container">
    <div className="pd-actions-title">Direct Clinician Escalation Protocols</div>

    {actionNotice && <div className="pd-action-notice">{actionNotice}</div>}

    <div className="pd-action-buttons-row">
      <button
        className="pd-btn-escalate"
        onClick={() => onTriggerAction('Crisis Intervention Team Dispatched')}
      >
        Dispatch Rapid Crisis Outreach
      </button>
      <button
        className="pd-btn-urgent"
        onClick={() => onTriggerAction(`Emergency Session booked for ${event.patientName} with ${event.assignedClinician}`)}
      >
        Schedule Same-Day Clinical Triage
      </button>
      <button
        className="pd-btn-care"
        onClick={() => onTriggerAction('Alert broadcasted to Patient Primary Sponsor & Care Contact')}
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
        onChange={(changeEvent) => onNoteChange(changeEvent.target.value)}
      />
      <div className="pd-notes-footer">
        <span className="pd-save-confirm">{noteSavedMessage}</span>
        <button className="pd-btn-save" onClick={onSaveNote}>
          Save Observation Note
        </button>
      </div>
    </div>
  </div>
);
