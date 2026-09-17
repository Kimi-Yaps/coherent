import { useState } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import './Admin.css';

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

interface WatchlistItem {
  id: string;
  name: string;
  category: 'Verbal Cues' | 'Behavioral Signs' | 'Cognitive Patterns' | 'Emotional Shifts' | 'Physical Indicators';
  severity: 'high' | 'moderate' | 'stable';
  detectionCues: string;
  aiAction: string;
  clinicalRationale?: string;
  detectionCount?: number;
  isActive: boolean;
}

const initialWatchlistItems: WatchlistItem[] = [
  {
    id: 'wl-1',
    name: 'Acute Sleep Deprivation (<4h)',
    category: 'Behavioral Signs',
    severity: 'high',
    detectionCues: 'haven\'t slept, can\'t sleep for days, awake all night, 3 hours sleep, severe insomnia',
    aiAction: 'Flag transcript & alert clinician of imminent relapse vulnerability',
    clinicalRationale: 'Prolonged sleep debt severely compromises prefrontal cortex self-regulation, multiplying physical craving vulnerability by 3.5x.',
    detectionCount: 6,
    isActive: true
  },
  {
    id: 'wl-2',
    name: 'Rationalizing Substance Intake',
    category: 'Cognitive Patterns',
    severity: 'high',
    detectionCues: 'just one drink, won\'t hurt once, one beer to sleep, deserve a drink, turning off my brain',
    aiAction: 'Flag critical relapse marker & initiate immediate de-escalation protocol',
    clinicalRationale: 'Cognitive bargaining represents transition from emotional to mental relapse phase; immediate reality-testing is essential.',
    detectionCount: 4,
    isActive: true
  },
  {
    id: 'wl-3',
    name: 'Support Group Absenteeism',
    category: 'Behavioral Signs',
    severity: 'high',
    detectionCues: 'skipped meeting, didn\'t go to group, avoiding sponsor, missed session, embarrassed to face them',
    aiAction: 'Alert care team & suggest urgent same-day recovery coordinator reach-out',
    clinicalRationale: 'Social avoidance and shame avoidance are key precursors to isolated physical substance intake.',
    detectionCount: 3,
    isActive: true
  },
  {
    id: 'wl-4',
    name: 'Emotional Anhedonia & Flat Affect',
    category: 'Emotional Shifts',
    severity: 'moderate',
    detectionCues: 'everything feels flat, grey, no point anymore, feel completely numb, why bother',
    aiAction: 'Log mood dip in behavioral summary & prompt reflective grounding dialogue',
    clinicalRationale: 'Dopamine receptor downregulation causes post-acute withdrawal anhedonia between recovery days 14-45.',
    detectionCount: 5,
    isActive: true
  },
  {
    id: 'wl-5',
    name: 'Severe Physical Craving Surge',
    category: 'Physical Indicators',
    severity: 'high',
    detectionCues: 'hands are shaking, craving is 9/10, urge is overwhelming, chest tight, physical itch',
    aiAction: 'Trigger crisis triage protocol & notify assigned medical provider',
    clinicalRationale: 'Sympathetic nervous system hyperarousal signals urgent physical vulnerability requiring distress tolerance skills.',
    detectionCount: 2,
    isActive: true
  },
  {
    id: 'wl-6',
    name: 'Minimizing Sobriety Milestone',
    category: 'Cognitive Patterns',
    severity: 'moderate',
    detectionCues: 'what difference does day 42 make, starting over doesn\'t matter, milestones are arbitrary',
    aiAction: 'Flag cognitive bargaining & prompt review of personal recovery motivations',
    clinicalRationale: 'Devaluing recovery progress indicates unconscious justification to dismantle current boundaries.',
    detectionCount: 3,
    isActive: true
  },
  {
    id: 'wl-7',
    name: 'Defensiveness with Care Support',
    category: 'Verbal Cues',
    severity: 'moderate',
    detectionCues: 'hate being checked on, stop questioning me, leave me alone, none of your business',
    aiAction: 'Log communication friction & advise clinician of emotional barrier',
    clinicalRationale: 'Hostility toward accountability partners often precedes secretive non-adherence behaviors.',
    detectionCount: 4,
    isActive: true
  }
];

const patientEventsData: Record<number, PatientSessionEvent> = {
  14: {
    id: 'ev-14',
    day: 14,
    dateStr: '14 Sep 2024',
    time: '10:30',
    patientName: 'Amelia Chen',
    patientId: 'PT-9042',
    age: 29,
    primaryCondition: 'Alcohol Use Disorder (Maintenance)',
    recoveryDays: 42,
    assignedClinician: 'Dr. Sarah Jenkins',
    relapseSymptoms: {
      riskScore: 84,
      riskLevel: 'high',
      currentStage: 'Stage 2: Mental Relapse (High Imminent Risk)',
      identifiedTriggers: [
        'Sudden corporate restructuring & job layoff announcement',
        'Severe insomnia (sleeping under 3.5 hours for 4 consecutive nights)',
        'Isolation from primary peer support circle over the weekend'
      ],
      emotionalSymptoms: [
        'Acute anxiety spikes (+55% above patient baseline)',
        'Overwhelming feelings of emotional exhaustion & irritability',
        'Feelings of guilt, shame, and perceived worthlessness'
      ],
      cognitiveSymptoms: [
        'Bargaining thoughts: "Just one beer on a Saturday won\'t erase 40 days"',
        'Romanticizing memories of past drinking episodes to relieve anxiety',
        'Minimizing consequences of breaking sobriety commitments'
      ],
      behavioralSymptoms: [
        'Skipped two mandatory weekly peer accountability group sessions',
        'Avoidance of calls from her sponsor (3 unanswered calls)',
        'Disrupted daily routine and neglect of self-care hygiene'
      ],
      physicalSymptoms: [
        'Mild bilateral hand tremors noted in morning check-in',
        'Persistent tension headaches and chronic fatigue',
        'Elevated resting heart rate (94 bpm)'
      ]
    },
    conversation: [
      {
        id: 1,
        sender: 'care',
        senderName: 'Coherent AI Care Specialist',
        text: 'Hello Amelia, thank you for checking in this morning. How has your sleep and overall state felt over the last couple of days?',
        time: '10:30'
      },
      {
        id: 2,
        sender: 'patient',
        senderName: 'Amelia Chen',
        text: 'Honestly, not great at all. I haven\'t slept more than 3 hours since Tuesday. My whole team was downsized at work, and my chest feels completely tight.',
        time: '10:31',
        flag: 'Trigger Detected: Acute Sleep Deprivation & Stress Flare',
        severity: 'warning'
      },
      {
        id: 3,
        sender: 'care',
        senderName: 'Coherent AI Care Specialist',
        text: 'I\'m so sorry you\'re navigating that heavy news, Amelia. It is completely natural that your body is feeling intense stress. Have you been able to connect with your sponsor or attend the group meeting yesterday?',
        time: '10:32'
      },
      {
        id: 4,
        sender: 'patient',
        senderName: 'Amelia Chen',
        text: 'No, I didn\'t go to the group. I felt too embarrassed and drained to face anyone. I kept thinking... what difference does day 42 make anyway? A single drink tonight would just turn my brain off so I can finally sleep.',
        time: '10:33',
        flag: 'Critical Relapse Marker: Rationalizing Substance Intake & Meeting Avoidance',
        severity: 'critical'
      },
      {
        id: 5,
        sender: 'care',
        senderName: 'Coherent AI Care Specialist',
        text: 'Amelia, thank you for trusting me with that honesty. That thought of "just turning off your brain" is the addiction voice trying to take advantage of your fatigue. Day 42 is real resilience. Please let us connect you with Dr. Jenkins and your crisis liaison right now.',
        time: '10:34'
      },
      {
        id: 6,
        sender: 'patient',
        senderName: 'Amelia Chen',
        text: 'I\'m really scared. My hands are shaking, and the cravings are hitting like a 9 out of 10. I don\'t want to throw away all my progress, but I feel so overwhelmed.',
        time: '10:35',
        flag: 'Physical Symptom: Hand Tremors & Craving Intensity 9/10',
        severity: 'critical'
      },
      {
        id: 7,
        sender: 'care',
        senderName: 'Coherent AI Care Specialist',
        text: 'You are safe, and you don\'t have to fight this craving alone. Take a deep breath right now. I have dispatched a priority alert to Dr. Jenkins\' care desk to initiate immediate support protocol.',
        time: '10:36'
      }
    ]
  },
  18: {
    id: 'ev-18',
    day: 18,
    dateStr: '18 Sep 2024',
    time: '17:00',
    patientName: 'Rafael Ortiz',
    patientId: 'PT-8819',
    age: 34,
    primaryCondition: 'Opioid Recovery & Chronic Pain Management',
    recoveryDays: 118,
    assignedClinician: 'Dr. Michael Vance',
    relapseSymptoms: {
      riskScore: 58,
      riskLevel: 'moderate',
      currentStage: 'Stage 1: Emotional Relapse (Under Monitoring)',
      identifiedTriggers: [
        'Lumbar muscle spasm flare-up from construction shift',
        'Reluctance to utilize non-opioid neuropathic analgesics',
        'Defensiveness during partner communication regarding medication tracking'
      ],
      emotionalSymptoms: [
        'Frustration and impatience with slow pain recovery',
        'Mild mood volatility and heightened defensiveness'
      ],
      cognitiveSymptoms: [
        'Reminiscing on immediate relief from prescription analgesics',
        'Questioning if long-term sobriety is compatible with manual labor'
      ],
      behavioralSymptoms: [
        'Delayed daily medication adherence verification by 8 hours',
        'Cancelled physical therapy appointment scheduled for Wednesday'
      ],
      physicalSymptoms: [
        'Localized lower back pain (reported 6/10)',
        'Restless legs during nighttime resting periods'
      ]
    },
    conversation: [
      {
        id: 1,
        sender: 'care',
        senderName: 'Coherent AI Care Specialist',
        text: 'Good afternoon Rafael, following up on your weekly pain management and recovery check-in. How is your back feeling after your shift?',
        time: '17:00'
      },
      {
        id: 2,
        sender: 'patient',
        senderName: 'Rafael Ortiz',
        text: 'My back is flaring up pretty badly after lifting supplies today. About a 6 or 7 out of 10. The non-opioid patches aren\'t cutting it as fast as I want.',
        time: '17:01',
        flag: 'Trigger: Chronic Pain Flare-up (6-7/10)',
        severity: 'warning'
      },
      {
        id: 3,
        sender: 'care',
        senderName: 'Coherent AI Care Specialist',
        text: 'We hear you, physical pain is very challenging while maintaining recovery. Have you used the ice-heat alternating protocol Dr. Vance recommended?',
        time: '17:02'
      },
      {
        id: 4,
        sender: 'patient',
        senderName: 'Rafael Ortiz',
        text: 'Doing that now. My wife was asking if I took the prescribed anti-inflammatory and I got unnecessarily angry at her. I hate being checked on, even though I know she means well.',
        time: '17:04',
        flag: 'Symptom: Defensiveness with Care Network',
        severity: 'info'
      },
      {
        id: 5,
        sender: 'care',
        senderName: 'Coherent AI Care Specialist',
        text: 'Acknowledging that irritation is a big positive step, Rafael. Pain lowers our emotional bandwidth. Remember you have 118 days clean today. We can request a physical therapy adjustment session for tomorrow.',
        time: '17:05'
      }
    ]
  },
  22: {
    id: 'ev-22',
    day: 22,
    dateStr: '22 Sep 2024',
    time: '14:00',
    patientName: 'Marcus Vance',
    patientId: 'PT-6420',
    age: 41,
    primaryCondition: 'Polysubstance Recovery (Maintenance)',
    recoveryDays: 240,
    assignedClinician: 'Dr. Sarah Jenkins',
    relapseSymptoms: {
      riskScore: 22,
      riskLevel: 'stable',
      currentStage: 'Maintenance / Resilient Recovery',
      identifiedTriggers: ['Normal work deadlines', 'Healthy routine maintained'],
      emotionalSymptoms: ['Mild fatigue after work week', 'Good emotional stability'],
      cognitiveSymptoms: ['Clear recovery commitment', 'Proactive trigger awareness'],
      behavioralSymptoms: ['Attended 3 community sessions this week', 'Regular meditation'],
      physicalSymptoms: ['No physical distress or tremors', 'Sleep average 7.5 hours']
    },
    conversation: [
      {
        id: 1,
        sender: 'care',
        senderName: 'Coherent AI Care Specialist',
        text: 'Hi Marcus, touching base for your 240-day milestone check-in! How are things feeling for you this week?',
        time: '14:00'
      },
      {
        id: 2,
        sender: 'patient',
        senderName: 'Marcus Vance',
        text: 'Doing great! Hit the 8-month mark yesterday. Work was a bit busy, but I made sure to hit the gym and caught up with my mentor on Friday.',
        time: '14:01'
      }
    ]
  },
  25: {
    id: 'ev-25',
    day: 25,
    dateStr: '25 Sep 2024',
    time: '09:30',
    patientName: 'Elena Rostova',
    patientId: 'PT-9931',
    age: 26,
    primaryCondition: 'Stimulant Use Disorder',
    recoveryDays: 19,
    assignedClinician: 'Dr. Michael Vance',
    relapseSymptoms: {
      riskScore: 68,
      riskLevel: 'high',
      currentStage: 'Stage 1 -> Stage 2 Transition (High Cravings)',
      identifiedTriggers: [
        'Encountered previous social acquaintance at coffee shop',
        'Dopamine rebound fatigue on Day 19',
        'Anhedonia and difficulty concentrating on work tasks'
      ],
      emotionalSymptoms: [
        'Severe apathy and flattened affect',
        'Sudden crying spells and anxiety'
      ],
      cognitiveSymptoms: [
        'Intrusive imagery of past stimulant intake',
        'Feeling that sobriety is "boring or grey"'
      ],
      behavioralSymptoms: [
        'Irregular sleep patterns (staying awake till 4 AM on screen)',
        'Delayed nutrition meals'
      ],
      physicalSymptoms: [
        'Intense sugar cravings and lethargy',
        'Head pressure and restlessness'
      ]
    },
    conversation: [
      {
        id: 1,
        sender: 'care',
        senderName: 'Coherent AI Care Specialist',
        text: 'Morning Elena, reaching out for your Day 19 recovery log. How are your energy levels and mood today?',
        time: '09:30'
      },
      {
        id: 2,
        sender: 'patient',
        senderName: 'Elena Rostova',
        text: 'Everything feels completely flat and grey. I ran into someone I used to party with, and I haven\'t been able to stop thinking about it since yesterday.',
        time: '09:31',
        flag: 'Trigger: Old Acquaintance Encounter & Anhedonia',
        severity: 'critical'
      }
    ]
  }
};

const Admin = () => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'watchlist' | 'patient-status'>('timeline');
  const [activeEvent, setActiveEvent] = useState<PatientSessionEvent | null>(null);
  const [modalTab, setModalTab] = useState<'symptoms' | 'conversation' | 'actions'>('symptoms');
  const [clinicianNote, setClinicianNote] = useState('');
  const [noteSavedMessage, setNoteSavedMessage] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  // Timeline View Switcher (Limits number of views/tables displayed simultaneously)
  const [timelineViewIndex, setTimelineViewIndex] = useState<number>(0); // 0 = Calendar, 1 = Upcoming Table

  // Table Row Pagination (Limits row count displayed per table)
  const [upcomingPage, setUpcomingPage] = useState<number>(1);
  const upcomingItemsPerPage = 3;

  const [watchlistPage, setWatchlistPage] = useState<number>(1);
  const watchlistItemsPerPage = 4;

  // AI Watchlist CRUD State
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(initialWatchlistItems);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [watchlistSearch, setWatchlistSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState<boolean>(true);

  // Patient Status Search & Filter State
  const [patientStatusFilter, setPatientStatusFilter] = useState<'all' | 'high' | 'moderate' | 'stable'>('all');
  const [patientSearch, setPatientSearch] = useState('');
  
  // Modal Edit / View Details State
  const [editingTrigger, setEditingTrigger] = useState<WatchlistItem | null>(null);
  const [newTriggerForm, setNewTriggerForm] = useState<Partial<WatchlistItem>>({
    name: '',
    category: 'Verbal Cues',
    severity: 'high',
    detectionCues: '',
    aiAction: 'Flag transcript & alert clinician of imminent relapse vulnerability',
    clinicalRationale: '',
    isActive: true
  });
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleOpenEvent = (event: PatientSessionEvent) => {
    setActiveEvent(event);
    setModalTab('symptoms');
    setClinicianNote('');
    setNoteSavedMessage('');
    setActionNotice('');
  };

  const handleCloseModal = () => {
    setActiveEvent(null);
  };

  const handleSaveNote = () => {
    if (!clinicianNote.trim()) return;
    setNoteSavedMessage('Clinical note logged successfully into medical record.');
    setTimeout(() => setNoteSavedMessage(''), 3500);
  };

  const handleTriggerAction = (actionName: string) => {
    setActionNotice(`Action initiated: ${actionName}`);
    setTimeout(() => setActionNotice(''), 4000);
  };

  // CRUD 1: Toggle Active / Paused
  const handleToggleWatchlistActive = (id: string) => {
    setWatchlist(prev =>
      prev.map(item => {
        if (item.id === id) {
          const nextState = !item.isActive;
          showToast(`Trigger "${item.name}" is now ${nextState ? 'Active' : 'Paused'}`);
          return { ...item, isActive: nextState };
        }
        return item;
      })
    );
  };

  // CRUD 2: Delete
  const handleDeleteTrigger = (id: string) => {
    const target = watchlist.find(item => item.id === id);
    setWatchlist(prev => prev.filter(item => item.id !== id));
    if (editingTrigger && editingTrigger.id === id) {
      setEditingTrigger(null);
    }
    showToast(`Trigger "${target?.name || id}" removed from watchlist.`);
  };

  // CRUD 3: Open Eye Button (View/Edit Details)
  const handleOpenDetails = (item: WatchlistItem) => {
    setEditingTrigger({ ...item });
  };

  // CRUD 4: Save Edited Details
  const handleSaveEditedTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrigger || !editingTrigger.name.trim()) return;

    setWatchlist(prev =>
      prev.map(item => (item.id === editingTrigger.id ? { ...editingTrigger } : item))
    );
    showToast(`Changes saved for "${editingTrigger.name}"`);
    setEditingTrigger(null);
  };

  // CRUD 5: Create New Trigger
  const handleCreateTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTriggerForm.name?.trim() || !newTriggerForm.detectionCues?.trim()) return;

    const newItem: WatchlistItem = {
      id: `wl-${Date.now()}`,
      name: newTriggerForm.name.trim(),
      category: (newTriggerForm.category as WatchlistItem['category']) || 'Verbal Cues',
      severity: (newTriggerForm.severity as WatchlistItem['severity']) || 'high',
      detectionCues: newTriggerForm.detectionCues.trim(),
      aiAction: newTriggerForm.aiAction || 'Flag transcript & alert clinician of imminent relapse vulnerability',
      clinicalRationale: newTriggerForm.clinicalRationale?.trim() || 'Custom clinical trigger added by clinician administrator.',
      detectionCount: 0,
      isActive: true
    };

    setWatchlist(prev => [newItem, ...prev]);
    setShowAddForm(false);
    setNewTriggerForm({
      name: '',
      category: 'Verbal Cues',
      severity: 'high',
      detectionCues: '',
      aiAction: 'Flag transcript & alert clinician of imminent relapse vulnerability',
      clinicalRationale: '',
      isActive: true
    });
    showToast(`New trigger "${newItem.name}" created and active!`);
  };

  // Calendar setup for September 2024
  const leadingBlanks = [null, null, null, null, null];
  const trailingBlanks = [null, null, null, null, null];
  const calendarDays = Array.from({ length: 25 }, (_, i) => i + 6); // 6 to 30

  const filteredUpcomingEvents = Object.values(patientEventsData);

  const totalUpcomingPages = Math.max(1, Math.ceil(filteredUpcomingEvents.length / upcomingItemsPerPage));
  const currentUpcomingPage = Math.min(upcomingPage, totalUpcomingPages);
  const paginatedUpcomingEvents = filteredUpcomingEvents.slice(
    (currentUpcomingPage - 1) * upcomingItemsPerPage,
    currentUpcomingPage * upcomingItemsPerPage
  );

  const filteredWatchlist = watchlist.filter(item => {
    const matchesCategory = selectedCategoryFilter === 'All' || item.category === selectedCategoryFilter;
    const matchesSearch =
      item.name.toLowerCase().includes(watchlistSearch.toLowerCase()) ||
      item.detectionCues.toLowerCase().includes(watchlistSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(watchlistSearch.toLowerCase()) ||
      item.aiAction.toLowerCase().includes(watchlistSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalWatchlistPages = Math.max(1, Math.ceil(filteredWatchlist.length / watchlistItemsPerPage));
  const currentWatchlistPage = Math.min(watchlistPage, totalWatchlistPages);
  const paginatedWatchlist = filteredWatchlist.slice(
    (currentWatchlistPage - 1) * watchlistItemsPerPage,
    currentWatchlistPage * watchlistItemsPerPage
  );

  // Filtered Patients for Patient Status Roster
  const filteredPatients = Object.values(patientEventsData).filter((patient) => {
    const matchesStatus =
      patientStatusFilter === 'all' || patient.relapseSymptoms.riskLevel === patientStatusFilter;
    const query = patientSearch.toLowerCase().trim();
    const matchesSearch =
      !query ||
      patient.patientName.toLowerCase().includes(query) ||
      patient.patientId.toLowerCase().includes(query) ||
      patient.primaryCondition.toLowerCase().includes(query) ||
      patient.assignedClinician.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  // Sidebar matching Booking page sidebar layout & CSS
  const sidebarContent = (
    <div className="bookings-sidebar">
      <button
        className={`sidebar-nav-btn ${activeTab === 'timeline' ? 'active' : ''}`}
        onClick={() => setActiveTab('timeline')}
      >
        Patient Timeline
      </button>
      <button
        className={`sidebar-nav-btn ${activeTab === 'watchlist' ? 'active' : ''}`}
        onClick={() => setActiveTab('watchlist')}
      >
        AI Watchlist
      </button>
      <button
        className={`sidebar-nav-btn ${activeTab === 'patient-status' ? 'active' : ''}`}
        onClick={() => setActiveTab('patient-status')}
      >
        Patient Status
      </button>
    </div>
  );

  return (
    <SidebarLayout sidebarContent={sidebarContent}>
      <div className="admin-container">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="notification-banner success" style={{ margin: 0 }}>
            {toastMessage}
          </div>
        )}

        {/* =========================================================================
            TAB 1: PATIENT TIMELINE (WITH CALENDAR & DETAIL REVEAL)
           ========================================================================= */}
        {activeTab === 'timeline' && (
          <>
            <div className="admin-header-row">
              <div>
                <h1 className="display-header admin-page-title">PATIENT TIMELINE</h1>
                <p className="admin-subtitle">
                  Supervised sessions, flagged relapse symptoms, and conversation transcripts
                </p>
              </div>
              {/* UNCLUTTERED SEGMENTED VIEW SWITCHER */}
              <div className="timeline-view-switch-wrapper">
                <div className="timeline-segmented-pills" role="tablist" aria-label="Timeline Views">
                  <button
                    type="button"
                    className={`timeline-seg-btn ${timelineViewIndex === 0 ? 'active' : ''}`}
                    onClick={() => setTimelineViewIndex(0)}
                    aria-selected={timelineViewIndex === 0}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>Calendar</span>
                  </button>
                  <button
                    type="button"
                    className={`timeline-seg-btn ${timelineViewIndex === 1 ? 'active' : ''}`}
                    onClick={() => setTimelineViewIndex(1)}
                    aria-selected={timelineViewIndex === 1}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" y1="6" x2="21" y2="6"></line>
                      <line x1="8" y1="12" x2="21" y2="12"></line>
                      <line x1="8" y1="18" x2="21" y2="18"></line>
                      <line x1="3" y1="6" x2="3.01" y2="6"></line>
                      <line x1="3" y1="12" x2="3.01" y2="12"></line>
                      <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                    <span>Sessions Table</span>
                    <span className="seg-badge">{filteredUpcomingEvents.length}</span>
                  </button>
                </div>

                <div className="timeline-stepper-arrows" aria-label="Step view">
                  <button
                    type="button"
                    className="stepper-arrow-btn"
                    disabled={timelineViewIndex === 0}
                    onClick={() => setTimelineViewIndex((prev) => Math.max(0, prev - 1))}
                    title="Previous View (Calendar)"
                    aria-label="Previous view"
                  >
                    &larr;
                  </button>
                  <span className="stepper-counter">{timelineViewIndex + 1} / 2</span>
                  <button
                    type="button"
                    className="stepper-arrow-btn"
                    disabled={timelineViewIndex === 1}
                    onClick={() => setTimelineViewIndex((prev) => Math.min(1, prev + 1))}
                    title="Next View (Sessions Table)"
                    aria-label="Next view"
                  >
                    &rarr;
                  </button>
                </div>
              </div>
            </div>

            {/* VIEW 1: CALENDAR (MATCHING REFERENCE IMAGE) */}
            {timelineViewIndex === 0 && (
              <div className="calendar-card">
                <div className="calendar-header">
                  <h2 className="month-title">September 2024</h2>
                  <div className="cal-nav-buttons">
                    <button className="cal-arrow-btn" aria-label="Previous month">&lt;</button>
                    <button className="cal-arrow-btn" aria-label="Next month">&gt;</button>
                  </div>
                </div>

                <div className="weekdays-row">
                  <div className="weekday-col">Mo</div>
                  <div className="weekday-col">Tu</div>
                  <div className="weekday-col">We</div>
                  <div className="weekday-col">Th</div>
                  <div className="weekday-col">Fr</div>
                  <div className="weekday-col">Sa</div>
                  <div className="weekday-col">Su</div>
                </div>

                <div className="calendar-grid">
                  {/* 5 Leading Blank Tiles */}
                  {leadingBlanks.map((_, idx) => (
                    <div key={`lead-${idx}`} className="calendar-cell empty-cell" />
                  ))}

                  {/* Days 6 to 30 */}
                  {calendarDays.map((day) => {
                    const event = patientEventsData[day];
                    const hasEvent = Boolean(event);

                    return (
                      <div
                        key={day}
                        className={`calendar-cell has-date ${hasEvent ? 'has-event' : ''}`}
                        onClick={() => {
                          if (hasEvent) {
                            handleOpenEvent(event);
                          }
                        }}
                        title={hasEvent ? `Click to inspect ${event.patientName} conversation & relapse symptoms` : `Day ${day}`}
                      >
                        <span className="cell-day-number">{day}</span>
                        {hasEvent && (
                          <>
                            <span className="cell-event-time">{event.time}</span>
                            <span className="cell-event-patient">{event.patientName}</span>
                            {event.relapseSymptoms.riskLevel === 'high' && (
                              <span className="cell-risk-indicator" title="High Relapse Warning" />
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}

                  {/* 5 Trailing Blank Tiles */}
                  {trailingBlanks.map((_, idx) => (
                    <div key={`trail-${idx}`} className="calendar-cell empty-cell" />
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 2: UPCOMING SESSIONS TABLE (WITH SLIDER AT TOP & PAGINATION) */}
            {timelineViewIndex === 1 && (
              <div className="upcoming-card">
                <div className="table-header-action-bar" style={{ marginBottom: '0.85rem' }}>
                  <div>
                    <h3 className="upcoming-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                      Upcoming Sessions & Clinical Triage
                    </h3>
                    <p className="admin-subtitle" style={{ fontSize: '0.82rem', marginTop: '0.2rem', color: '#64748b' }}>
                      Select any session row to inspect dialogue transcripts and clinical relapse symptoms
                    </p>
                  </div>
                </div>

                <div className="admin-table-top-slider-wrapper">
                  <table className="watchlist-table upcoming-table">
                    <thead>
                      <tr>
                        <th style={{ minWidth: '170px' }}>Date & Time</th>
                        <th style={{ minWidth: '160px' }}>Patient</th>
                        <th style={{ minWidth: '220px' }}>Diagnosis / Condition</th>
                        <th style={{ minWidth: '145px' }}>Relapse Status</th>
                        <th style={{ minWidth: '160px' }}>Assigned Clinician</th>
                        <th style={{ minWidth: '130px', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUpcomingEvents.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                            No sessions found for this patient filter.
                          </td>
                        </tr>
                      ) : (
                        paginatedUpcomingEvents.map((ev) => (
                          <tr
                            key={ev.id}
                            onClick={() => handleOpenEvent(ev)}
                            style={{ cursor: 'pointer' }}
                            title="Click to inspect patient conversation and relapse symptoms"
                          >
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div className="upcoming-badge-square" style={{ width: '36px', height: '36px', fontSize: '0.9rem' }}>
                                  {ev.day}
                                </div>
                                <div>
                                  <strong style={{ fontSize: '0.88rem', color: '#1a1a1a', display: 'block' }}>
                                    {ev.day} Sep 2024
                                  </strong>
                                  <span style={{ fontSize: '0.78rem', color: '#666' }}>{ev.time}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <strong style={{ fontSize: '0.9rem', color: '#111827', display: 'block' }}>
                                {ev.patientName}
                              </strong>
                              <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                                {ev.patientId} &middot; Age {ev.age}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.86rem', color: '#334155' }}>
                                {ev.primaryCondition}
                              </span>
                            </td>
                            <td>
                              <span className={`risk-pill ${ev.relapseSymptoms.riskLevel}`}>
                                <span className="risk-dot" />
                                {ev.relapseSymptoms.riskLevel === 'high' && 'Relapse Alert'}
                                {ev.relapseSymptoms.riskLevel === 'moderate' && 'Relapse Check'}
                                {ev.relapseSymptoms.riskLevel === 'stable' && 'Stable Routine'}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.84rem', color: '#475569' }}>
                                {ev.assignedClinician}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                className="btn-inspect-timeline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEvent(ev);
                                }}
                              >
                                Inspect &rarr;
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Pagination Footer (Limits row display count) */}
                <div className="table-pagination-footer">
                  <div className="pagination-info">
                    Showing {(currentUpcomingPage - 1) * upcomingItemsPerPage + 1} -{' '}
                    {Math.min(currentUpcomingPage * upcomingItemsPerPage, filteredUpcomingEvents.length)} of{' '}
                    {filteredUpcomingEvents.length} sessions
                  </div>
                  <div className="pagination-controls">
                    <button
                      className="pagination-btn"
                      disabled={currentUpcomingPage <= 1}
                      onClick={() => setUpcomingPage((p) => Math.max(1, p - 1))}
                    >
                      &larr; Previous
                    </button>
                    <span className="pagination-page-badge">
                      Page {currentUpcomingPage} of {totalUpcomingPages}
                    </span>
                    <button
                      className="pagination-btn"
                      disabled={currentUpcomingPage >= totalUpcomingPages}
                      onClick={() => setUpcomingPage((p) => Math.min(totalUpcomingPages, p + 1))}
                    >
                      Next &rarr;
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* =========================================================================
            TAB 2: AI WATCHLIST (TABLE FORM WITH FULL CRUD & EYE BUTTON DETAILS)
           ========================================================================= */}
        {activeTab === 'watchlist' && (
          <div className="watchlist-container">
            <div className="admin-header-row">
              <div>
                <h1 className="display-header admin-page-title">AI WATCHLIST</h1>
                <p className="admin-subtitle">
                  Configure symptoms, keywords, and relapse triggers the AI actively monitors during patient conversations
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="watchlist-stats-row">
              <div className="stat-metric-card">
                <span className="stat-label">Active AI Watchers</span>
                <span className="stat-value">{watchlist.filter(w => w.isActive).length}</span>
                <span className="stat-desc">Triggers monitored across all chats</span>
              </div>
              <div className="stat-metric-card">
                <span className="stat-label">High-Risk Triggers</span>
                <span className="stat-value" style={{ color: '#dc2626' }}>
                  {watchlist.filter(w => w.severity === 'high').length}
                </span>
                <span className="stat-desc">Prompts immediate crisis escalation</span>
              </div>
              <div className="stat-metric-card">
                <span className="stat-label">AI Detection Rate</span>
                <span className="stat-value" style={{ color: '#059669' }}>96.8%</span>
                <span className="stat-desc">Relapse markers verified by clinicians</span>
              </div>
              <div className="stat-metric-card">
                <span className="stat-label">Detections Today</span>
                <span className="stat-value">5</span>
                <span className="stat-desc">Flagged in Amelia Chen & Elena Rostova transcripts</span>
              </div>
            </div>

            {/* Symmetrical 2-Tier Modular Creator Card */}
            {showAddForm && (
              <div className="watchlist-creator-card">
                <div className="creator-title-row">
                  <div>
                    <h3 className="creator-card-heading">Add New Trigger for AI Monitoring</h3>
                    <p className="creator-card-subheading">
                      Define the clinical symptoms, phrases, and behavioral cues the AI actively listens for during patient dialogues.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCreateTrigger}>
                  <div className="creator-form-grid">
                    {/* Row 1: Trigger Name (50%) & Category (50%) */}
                    <div className="form-field-group">
                      <label className="form-label">Trigger / Symptom Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Romanticizing Substance Use, Severe Insomnia"
                        value={newTriggerForm.name}
                        onChange={(e) => setNewTriggerForm({ ...newTriggerForm, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-field-group">
                      <label className="form-label">Category</label>
                      <select
                        className="form-select"
                        value={newTriggerForm.category}
                        onChange={(e) => setNewTriggerForm({
                          ...newTriggerForm,
                          category: e.target.value as WatchlistItem['category']
                        })}
                      >
                        <option value="Verbal Cues">Verbal Cues (Phrases & Words)</option>
                        <option value="Behavioral Signs">Behavioral Signs (Missed Meetings, Sleep)</option>
                        <option value="Cognitive Patterns">Cognitive Patterns (Rationalization, Bargaining)</option>
                        <option value="Emotional Shifts">Emotional Shifts (Anhedonia, Panic)</option>
                        <option value="Physical Indicators">Physical Indicators (Tremors, Pain Spikes)</option>
                      </select>
                    </div>

                    {/* Row 2: Severity (50%) & Automated AI Protocol (50%) */}
                    <div className="form-field-group">
                      <label className="form-label">Alert Severity Level</label>
                      <select
                        className="form-select"
                        value={newTriggerForm.severity}
                        onChange={(e) => setNewTriggerForm({
                          ...newTriggerForm,
                          severity: e.target.value as WatchlistItem['severity']
                        })}
                      >
                        <option value="high">High Alert (Immediate Crisis Triage)</option>
                        <option value="moderate">Moderate Warning (Flag in Transcript)</option>
                        <option value="stable">Advisory (Routine Observation)</option>
                      </select>
                    </div>

                    <div className="form-field-group">
                      <label className="form-label">Automated AI Response Protocol</label>
                      <select
                        className="form-select"
                        value={newTriggerForm.aiAction}
                        onChange={(e) => setNewTriggerForm({ ...newTriggerForm, aiAction: e.target.value })}
                      >
                        <option value="Flag transcript & alert clinician of imminent relapse vulnerability">
                          Flag transcript & alert clinician
                        </option>
                        <option value="Flag critical relapse marker & initiate immediate de-escalation protocol">
                          Flag marker & prompt de-escalation protocol
                        </option>
                        <option value="Alert care team & suggest urgent same-day recovery coordinator reach-out">
                          Alert care team & schedule rapid triage
                        </option>
                        <option value="Log mood dip in behavioral summary & prompt reflective grounding dialogue">
                          Log mood dip & prompt grounding dialogue
                        </option>
                      </select>
                    </div>

                    {/* Row 3: Keywords & Cues (Full Width) */}
                    <div className="form-field-group form-field-full">
                      <label className="form-label">
                        Keywords & Cues AI Should Watch For (comma separated)
                      </label>
                      <textarea
                        className="form-textarea"
                        rows={2}
                        placeholder="e.g. just one drink, nobody cares, haven't slept in days, feeling empty, what is the point"
                        value={newTriggerForm.detectionCues}
                        onChange={(e) => setNewTriggerForm({ ...newTriggerForm, detectionCues: e.target.value })}
                        required
                      />
                      <span className="form-hint">
                        Separate trigger phrases with commas. The AI monitors both text chat messages and transcribed audio check-ins for these exact and semantic matches.
                      </span>
                    </div>

                    {/* Row 4: Clinical Intent & Guidance (Full Width) */}
                    <div className="form-field-group form-field-full">
                      <label className="form-label">Clinical Intent & Guidance (Optional)</label>
                      <textarea
                        className="form-textarea"
                        rows={2}
                        placeholder="Document clinical context or rationale why this trigger signals active relapse vulnerability..."
                        value={newTriggerForm.clinicalRationale}
                        onChange={(e) => setNewTriggerForm({ ...newTriggerForm, clinicalRationale: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="creator-action-row">
                    <div className="creator-status-badge">
                      <span className="risk-dot" style={{ backgroundColor: '#10b981' }} />
                      <span>Status: Active upon creation</span>
                    </div>

                    <div className="creator-buttons-group">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setShowAddForm(false)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary-brand">
                        + Add to AI Watchlist
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Watchlist Table Card */}
            <div className="watchlist-table-card">
              <div className="table-header-action-bar">
                <div className="table-filter-group">
                  {['All', 'Verbal Cues', 'Behavioral Signs', 'Cognitive Patterns', 'Emotional Shifts', 'Physical Indicators'].map(cat => (
                    <button
                      key={cat}
                      className={`category-pill-btn ${selectedCategoryFilter === cat ? 'active' : ''}`}
                      onClick={() => setSelectedCategoryFilter(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="table-search-and-add">
                  <input
                    type="text"
                    className="watchlist-search-input"
                    placeholder="Search triggers or cues..."
                    value={watchlistSearch}
                    onChange={(e) => setWatchlistSearch(e.target.value)}
                  />
                  <button
                    className="btn-add-trigger"
                    onClick={() => setShowAddForm(true)}
                  >
                    + Add New Trigger
                  </button>
                </div>
              </div>

              {/* Responsive Table Form with Top Slider */}
              <div className="admin-table-top-slider-wrapper">
                <table className="watchlist-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: '190px' }}>Trigger / Symptom</th>
                      <th style={{ minWidth: '130px' }}>Category</th>
                      <th style={{ minWidth: '120px' }}>Severity</th>
                      <th style={{ minWidth: '220px' }}>Detection Cues & Patterns</th>
                      <th style={{ minWidth: '200px' }}>Automated AI Protocol</th>
                      <th style={{ minWidth: '95px' }}>Status</th>
                      <th style={{ minWidth: '90px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWatchlist.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                          No AI watch triggers match your search criteria.
                        </td>
                      </tr>
                    ) : (
                      paginatedWatchlist.map(item => (
                        <tr key={item.id} className={!item.isActive ? 'paused' : ''}>
                          <td>
                            <span className="table-trigger-name">{item.name}</span>
                            {item.detectionCount !== undefined && item.detectionCount > 0 && (
                              <span style={{ fontSize: '0.74rem', color: '#888' }}>
                                {item.detectionCount} catches recorded
                              </span>
                            )}
                          </td>
                          <td>
                            <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#444' }}>
                              {item.category}
                            </span>
                          </td>
                          <td>
                            <span className={`risk-pill ${item.severity}`}>
                              <span className="risk-dot" />
                              {item.severity === 'high' && 'High Alert'}
                              {item.severity === 'moderate' && 'Moderate'}
                              {item.severity === 'stable' && 'Advisory'}
                            </span>
                          </td>
                          <td className="table-cues-cell">
                            <span>{item.detectionCues}</span>
                          </td>
                          <td className="table-action-cell">
                            <span>{item.aiAction}</span>
                          </td>
                          <td>
                            <button
                              className={`status-toggle-pill ${item.isActive ? 'active' : 'paused'}`}
                              onClick={() => handleToggleWatchlistActive(item.id)}
                              title={item.isActive ? 'Click to pause' : 'Click to activate'}
                            >
                              <span className="risk-dot" style={{ backgroundColor: item.isActive ? '#137333' : '#777' }} />
                              {item.isActive ? 'Active' : 'Paused'}
                            </button>
                          </td>
                          <td>
                            <div className="table-actions-group" style={{ justifyContent: 'center' }}>
                              {/* Eye Button to reveal all editable details */}
                              <button
                                className="icon-action-btn eye-btn"
                                onClick={() => handleOpenDetails(item)}
                                title="View & edit all trigger details"
                                aria-label="View and edit trigger details"
                              >
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              </button>
                              {/* Delete Button */}
                              <button
                                className="icon-action-btn delete-btn"
                                onClick={() => handleDeleteTrigger(item.id)}
                                title="Delete trigger"
                                aria-label="Delete trigger"
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination Footer (Limits row display count) */}
              <div className="table-pagination-footer">
                <div className="pagination-info">
                  Showing {(currentWatchlistPage - 1) * watchlistItemsPerPage + 1} -{' '}
                  {Math.min(currentWatchlistPage * watchlistItemsPerPage, filteredWatchlist.length)} of{' '}
                  {filteredWatchlist.length} triggers
                </div>
                <div className="pagination-controls">
                  <button
                    className="pagination-btn"
                    disabled={currentWatchlistPage <= 1}
                    onClick={() => setWatchlistPage((p) => Math.max(1, p - 1))}
                  >
                    &larr; Previous
                  </button>
                  <span className="pagination-page-badge">
                    Page {currentWatchlistPage} of {totalWatchlistPages}
                  </span>
                  <button
                    className="pagination-btn"
                    disabled={currentWatchlistPage >= totalWatchlistPages}
                    onClick={() => setWatchlistPage((p) => Math.min(totalWatchlistPages, p + 1))}
                  >
                    Next &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: PATIENT STATUS (CLINICAL ROSTER & SOBRIETY HEALTH OVERVIEW)
           ========================================================================= */}
        {activeTab === 'patient-status' && (
          <div className="patient-status-container">
            <div className="admin-header-row">
              <div>
                <h1 className="display-header admin-page-title">PATIENT STATUS</h1>
                <p className="admin-subtitle">
                  Roster of active patients under clinical care, sobriety duration, and risk statuses
                </p>
              </div>
            </div>

            {/* Filter by Patient Status & Searchbar */}
            <div className="table-header-action-bar" style={{ marginBottom: '0.4rem' }}>
              <div className="table-filter-group">
                {[
                  { label: 'All Statuses', val: 'all' },
                  { label: 'High Risk', val: 'high' },
                  { label: 'Moderate Risk', val: 'moderate' },
                  { label: 'Stable', val: 'stable' }
                ].map(({ label, val }) => (
                  <button
                    key={val}
                    className={`category-pill-btn ${patientStatusFilter === val ? 'active' : ''}`}
                    onClick={() => setPatientStatusFilter(val as any)}
                  >
                    {val !== 'all' && (
                      <span
                        className="risk-dot"
                        style={{
                          backgroundColor:
                            val === 'high' ? '#dc2626' : val === 'moderate' ? '#d97706' : '#10b981',
                          marginRight: '6px'
                        }}
                      />
                    )}
                    {label}
                  </button>
                ))}
              </div>

              <div className="table-search-and-add">
                <input
                  type="text"
                  className="watchlist-search-input"
                  placeholder="Search by patient, ID, condition, or doctor..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  style={{ minWidth: '290px' }}
                />
              </div>
            </div>

            <div className="patient-cards-grid">
              {filteredPatients.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b' }}>
                  <p style={{ fontSize: '1.05rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    No matching patients found
                  </p>
                  <span style={{ fontSize: '0.85rem' }}>
                    Try adjusting your status filter or search keyword.
                  </span>
                </div>
              ) : (
                filteredPatients.map((patient) => (
                  <div key={patient.id} className="patient-status-card">
                    <div className="status-card-header">
                      <div>
                        <h3 className="status-patient-name">{patient.patientName}</h3>
                        <span className="status-patient-meta">
                          ID {patient.patientId} &middot; Age {patient.age}
                        </span>
                      </div>
                      <span className={`minimal-risk-badge ${patient.relapseSymptoms.riskLevel}`}>
                        <span className="risk-dot" />
                        {patient.relapseSymptoms.riskLevel.toUpperCase()}
                      </span>
                    </div>

                    {/* Clean Milestone Metric Display */}
                    <div className="status-milestone-box">
                      <div className="milestone-stat">
                        <span className="milestone-number">{patient.recoveryDays}</span>
                        <span className="milestone-unit">Days Clean</span>
                      </div>
                      <div className="milestone-score-wrap">
                        <span className="milestone-score-val">{patient.relapseSymptoms.riskScore}%</span>
                        <span className="milestone-score-label">Relapse Risk</span>
                      </div>
                    </div>

                    {/* Uncluttered Condition & Clinician Care Info */}
                    <div className="status-info-list">
                      <div className="status-condition-chip">
                        {patient.primaryCondition}
                      </div>
                      <div className="status-care-line">
                        <span className="care-doctor">{patient.assignedClinician}</span>
                        <span>&middot;</span>
                        <span
                          className="care-stage"
                          style={{
                            color: patient.relapseSymptoms.riskLevel === 'high' ? '#b91c1c' : '#475569'
                          }}
                        >
                          {patient.relapseSymptoms.riskLevel === 'high'
                            ? 'Stage 2: Mental Relapse'
                            : patient.relapseSymptoms.riskLevel === 'moderate'
                            ? 'Stage 1: Emotional Relapse'
                            : 'Maintenance Routine'}
                        </span>
                      </div>
                    </div>

                    <div className="status-card-footer">
                      <span className="status-session-time">
                        Session: {patient.dateStr} &middot; {patient.time}
                      </span>
                      <button
                        className="status-action-link"
                        onClick={() => {
                          setActiveTab('timeline');
                          handleOpenEvent(patient);
                        }}
                      >
                        Timeline & Chat &rarr;
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL 1: EDITABLE DETAILS (DISPLAYED WHEN EYE BUTTON IS CLICKED)
         ========================================================================= */}
      {editingTrigger && (
        <div className="detail-modal-overlay" onClick={() => setEditingTrigger(null)}>
          <div className="edit-trigger-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="detail-modal-header">
              <div>
                <div className="patient-header-badge-row">
                  <h2 className="patient-modal-name">Trigger Details & Configuration</h2>
                  <span className={`risk-pill ${editingTrigger.severity}`}>
                    <span className="risk-dot" />
                    {editingTrigger.severity.toUpperCase()}
                  </span>
                </div>
                <div className="patient-modal-meta">
                  <span><strong>ID:</strong> {editingTrigger.id}</span>
                  <span><strong>Detections:</strong> {editingTrigger.detectionCount ?? 0} flags</span>
                  <span><strong>Status:</strong> {editingTrigger.isActive ? 'Active' : 'Paused'}</span>
                </div>
              </div>

              <button className="modal-close-btn" onClick={() => setEditingTrigger(null)} aria-label="Close modal">
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEditedTrigger}>
              <div className="modal-form-body">
                <div className="form-grid-2col">
                  <div className="form-field-group">
                    <label className="form-label">Trigger / Symptom Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingTrigger.name}
                      onChange={(e) => setEditingTrigger({ ...editingTrigger, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-field-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={editingTrigger.category}
                      onChange={(e) => setEditingTrigger({
                        ...editingTrigger,
                        category: e.target.value as WatchlistItem['category']
                      })}
                    >
                      <option value="Verbal Cues">Verbal Cues</option>
                      <option value="Behavioral Signs">Behavioral Signs</option>
                      <option value="Cognitive Patterns">Cognitive Patterns</option>
                      <option value="Emotional Shifts">Emotional Shifts</option>
                      <option value="Physical Indicators">Physical Indicators</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid-2col">
                  <div className="form-field-group">
                    <label className="form-label">Alert Severity Level</label>
                    <select
                      className="form-select"
                      value={editingTrigger.severity}
                      onChange={(e) => setEditingTrigger({
                        ...editingTrigger,
                        severity: e.target.value as WatchlistItem['severity']
                      })}
                    >
                      <option value="high">High Alert (Immediate Crisis Triage)</option>
                      <option value="moderate">Moderate Warning (Flag in Transcript)</option>
                      <option value="stable">Advisory (Routine Observation)</option>
                    </select>
                  </div>

                  <div className="form-field-group">
                    <label className="form-label">AI Monitoring Status</label>
                    <select
                      className="form-select"
                      value={editingTrigger.isActive ? 'active' : 'paused'}
                      onChange={(e) => setEditingTrigger({
                        ...editingTrigger,
                        isActive: e.target.value === 'active'
                      })}
                    >
                      <option value="active">Active (Actively listening during patient chats)</option>
                      <option value="paused">Paused (Monitoring temporarily disabled)</option>
                    </select>
                  </div>
                </div>

                <div className="form-field-group">
                  <label className="form-label">Detection Cues & Keywords (comma separated)</label>
                  <textarea
                    className="form-textarea"
                    value={editingTrigger.detectionCues}
                    onChange={(e) => setEditingTrigger({ ...editingTrigger, detectionCues: e.target.value })}
                    required
                  />
                  <span style={{ fontSize: '0.78rem', color: '#888' }}>
                    When the patient types or speaks any of these cues, the AI will trigger the protocol below.
                  </span>
                </div>

                <div className="form-field-group">
                  <label className="form-label">Automated AI Response Protocol</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingTrigger.aiAction}
                    onChange={(e) => setEditingTrigger({ ...editingTrigger, aiAction: e.target.value })}
                    required
                  />
                </div>

                <div className="form-field-group">
                  <label className="form-label">Clinical Rationale & Context</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Document clinical guidance or reason why this trigger signals relapse vulnerability..."
                    value={editingTrigger.clinicalRationale || ''}
                    onChange={(e) => setEditingTrigger({ ...editingTrigger, clinicalRationale: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-form-footer">
                <button
                  type="button"
                  className="btn-danger-outline"
                  onClick={() => handleDeleteTrigger(editingTrigger.id)}
                >
                  Delete Trigger
                </button>

                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setEditingTrigger(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-dark">
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* =========================================================================
          MODAL 3: REVEAL ALL DETAIL OF PATIENT CONVERSATION & RELAPSE SYMPTOMS
         ========================================================================= */}
      {activeEvent && (
        <div className="detail-modal-overlay" onClick={handleCloseModal}>
          <div className="detail-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="detail-modal-header">
              <div>
                <div className="patient-header-badge-row">
                  <h2 className="patient-modal-name">{activeEvent.patientName}</h2>
                  <span className={`minimal-risk-badge ${activeEvent.relapseSymptoms.riskLevel}`}>
                    <span className="risk-dot" />
                    {activeEvent.relapseSymptoms.riskScore}% Relapse Risk
                  </span>
                </div>
                <div className="patient-modal-meta-chips">
                  <span className="meta-chip">ID {activeEvent.patientId}</span>
                  <span className="meta-chip">{activeEvent.age} yrs</span>
                  <span className="meta-chip">Day {activeEvent.recoveryDays} Sobriety</span>
                  <span className="meta-chip">{activeEvent.assignedClinician}</span>
                  <span className="meta-chip">{activeEvent.dateStr} &middot; {activeEvent.time}</span>
                </div>
              </div>

              <button className="modal-close-btn" onClick={handleCloseModal} aria-label="Close modal">
                &times;
              </button>
            </div>

            {/* Minimalist Clinical Insight Callout (Replaces loud red banner) */}
            <div className="minimal-insight-card">
              <div className="insight-top">
                <div className="insight-tag">
                  <span className="risk-dot" />
                  <span>{activeEvent.relapseSymptoms.currentStage}</span>
                </div>
                <span className="insight-urgency">Priority Clinical Triage</span>
              </div>
              <p className="insight-desc">
                AI and clinical markers indicate active relapse vulnerability. Immediate support review is active.
              </p>
            </div>

            {/* Minimalist Modal Navigation Tabs */}
            <div className="modal-tabs-nav">
              <button
                className={`modal-tab-btn ${modalTab === 'symptoms' ? 'active' : ''}`}
                onClick={() => setModalTab('symptoms')}
              >
                Clinical Breakdown
              </button>
              <button
                className={`modal-tab-btn ${modalTab === 'conversation' ? 'active' : ''}`}
                onClick={() => setModalTab('conversation')}
              >
                Conversation Transcript ({activeEvent.conversation.length})
              </button>
              <button
                className={`modal-tab-btn ${modalTab === 'actions' ? 'active' : ''}`}
                onClick={() => setModalTab('actions')}
              >
                Interventions & Notes
              </button>
            </div>

            <div className="detail-modal-body">
              {modalTab === 'symptoms' && (
                <>
                  {/* Minimalist Relapse Risk Gauge Card */}
                  <div className="minimal-gauge-card">
                    <div className="stage-title-row">
                      <div>
                        <span className="minimal-section-kicker">ASSESSMENT GAUGE</span>
                        <h4 className="minimal-gauge-heading">Relapse Progression Risk</h4>
                      </div>
                      <div className="gauge-score-wrap">
                        <span className="gauge-big-num">{activeEvent.relapseSymptoms.riskScore}%</span>
                        <span className="gauge-big-label">Vulnerability Probability</span>
                      </div>
                    </div>
                    <div className="minimal-progress-track">
                      <div
                        className={`minimal-progress-fill ${activeEvent.relapseSymptoms.riskLevel}`}
                        style={{ width: `${activeEvent.relapseSymptoms.riskScore}%` }}
                      />
                    </div>
                    <div className="stage-steps-legend minimal-legend">
                      <span className="legend-step">Phase 1: Emotional</span>
                      <span className="legend-step current-step">Phase 2: Mental (Current)</span>
                      <span className="legend-step">Phase 3: Physical</span>
                    </div>
                  </div>

                  {/* Minimalist Root Triggers Section */}
                  <div className="minimal-section-block">
                    <div className="minimal-section-header">
                      <span className="minimal-section-kicker">IDENTIFIED ROOT TRIGGERS</span>
                      <span className="minimal-count-pill">
                        {activeEvent.relapseSymptoms.identifiedTriggers.length} Triggers
                      </span>
                    </div>
                    <div className="minimal-triggers-grid">
                      {activeEvent.relapseSymptoms.identifiedTriggers.map((trig, i) => (
                        <div key={i} className="minimal-trigger-item">
                          <span className="trigger-index-num">0{i + 1}</span>
                          <span className="trigger-text">{trig}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Minimalist 4-Dimensional Relapse Symptom Breakdown */}
                  <div className="minimal-section-block">
                    <div className="minimal-section-header">
                      <span className="minimal-section-kicker">FOUR-DIMENSIONAL SYMPTOM ANALYSIS</span>
                    </div>
                    <div className="minimal-matrix-grid">
                      <div className="minimal-matrix-col">
                        <div className="col-header">
                          <span>Emotional</span>
                          <span className="col-count">{activeEvent.relapseSymptoms.emotionalSymptoms.length}</span>
                        </div>
                        <div className="col-items-list">
                          {activeEvent.relapseSymptoms.emotionalSymptoms.map((sym, i) => (
                            <div key={i} className="minimal-symptom-card">
                              <span className="risk-dot moderate" />
                              <span>{sym}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="minimal-matrix-col">
                        <div className="col-header">
                          <span>Cognitive & Mental</span>
                          <span className="col-count">{activeEvent.relapseSymptoms.cognitiveSymptoms.length}</span>
                        </div>
                        <div className="col-items-list">
                          {activeEvent.relapseSymptoms.cognitiveSymptoms.map((sym, i) => (
                            <div key={i} className="minimal-symptom-card">
                              <span className="risk-dot high" />
                              <span>{sym}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="minimal-matrix-col">
                        <div className="col-header">
                          <span>Behavioral</span>
                          <span className="col-count">{activeEvent.relapseSymptoms.behavioralSymptoms.length}</span>
                        </div>
                        <div className="col-items-list">
                          {activeEvent.relapseSymptoms.behavioralSymptoms.map((sym, i) => (
                            <div key={i} className="minimal-symptom-card">
                              <span className="risk-dot high" />
                              <span>{sym}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="minimal-matrix-col">
                        <div className="col-header">
                          <span>Physical</span>
                          <span className="col-count">{activeEvent.relapseSymptoms.physicalSymptoms.length}</span>
                        </div>
                        <div className="col-items-list">
                          {activeEvent.relapseSymptoms.physicalSymptoms.map((sym, i) => (
                            <div key={i} className="minimal-symptom-card">
                              <span className="risk-dot moderate" />
                              <span>{sym}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {modalTab === 'conversation' && (
                <div className="conversation-transcript-container">
                  <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                    Transcript recorded during {activeEvent.dateStr} session at {activeEvent.time}. AI flagged markers indicate relapse indicators extracted in real-time.
                  </div>

                  {activeEvent.conversation.map((msg) => (
                    <div
                      key={msg.id}
                      className={`transcript-message-item ${msg.sender === 'patient' ? 'patient' : 'care'}`}
                    >
                      <div className="message-meta-row">
                        <strong>{msg.senderName}</strong>
                        <span>{msg.time}</span>
                      </div>
                      <div className="message-bubble">{msg.text}</div>
                      {msg.flag && (
                        <div className="flagged-relapse-badge">
                          <span className="risk-dot" />
                          <span>{msg.flag}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {modalTab === 'actions' && (
                <div className="clinical-action-center">
                  <div className="action-center-title">Direct Clinician Escalation Protocols</div>
                  
                  {actionNotice && (
                    <div className="notification-banner success" style={{ margin: 0 }}>
                      {actionNotice}
                    </div>
                  )}

                  <div className="action-buttons-row">
                    <button
                      className="btn-escalate"
                      onClick={() => handleTriggerAction('Crisis Intervention Team Dispatched')}
                    >
                      Dispatch Rapid Crisis Outreach
                    </button>
                    <button
                      className="btn-urgent-session"
                      onClick={() => handleTriggerAction(`Emergency Session booked for ${activeEvent.patientName} with ${activeEvent.assignedClinician}`)}
                    >
                      Schedule Same-Day Clinical Triage
                    </button>
                    <button
                      className="btn-care-note"
                      onClick={() => handleTriggerAction('Alert broadcasted to Patient Primary Sponsor & Care Contact')}
                    >
                      Notify Primary Sponsor & Care Circle
                    </button>
                  </div>

                  <div style={{ marginTop: '0.8rem' }}>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#333', marginBottom: '0.4rem' }}>
                      Provider Observation Log & Clinical Notes:
                    </label>
                    <textarea
                      className="clinician-note-input"
                      placeholder={`Document therapeutic notes, risk mitigation strategies, or medication instructions for ${activeEvent.patientName}...`}
                      value={clinicianNote}
                      onChange={(e) => setClinicianNote(e.target.value)}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem' }}>
                      <span style={{ fontSize: '0.82rem', color: '#15803d', fontWeight: 600 }}>
                        {noteSavedMessage}
                      </span>
                      <button className="btn-dark" onClick={handleSaveNote}>
                        Save Observation Note
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
};

export default Admin;
