import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Read config from environment variables loaded via --env-file=.env
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('Error: Firebase configuration missing in .env');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedDatabase() {
  console.log(`\nInitializing Firestore Collections for Project: ${firebaseConfig.projectId}...\n`);

  // 1. Counselors Collection
  console.log('Creating [counselors] collection...');
  const counselors = [
    {
      id: 'amelia',
      name: 'Dr. Amelia Chen',
      role: 'Clinical Psychologist',
      username: 'dr_amelia',
      initials: 'AC',
      avatarBg: '#3b6e58',
      specialty: 'Anxiety, Stress & Mindfulness',
      bio: '10+ years specializing in cognitive behavioral therapy and workplace stress management.',
      online: true,
    },
    {
      id: 'iman',
      name: 'Iman Hakimi',
      role: 'Peer Counselor',
      username: 'ImanHakimi',
      initials: 'IH',
      avatarBg: '#4e6e48',
      specialty: 'Mindfulness & Active Listening',
      bio: 'Compassionate peer supporter ready to walk through life challenges together.',
      online: true,
    },
    {
      id: 'sachin',
      name: 'Sachin Kumar',
      role: 'Youth & Academic Counselor',
      username: 'sachin_k',
      initials: 'SK',
      avatarBg: '#3e5c5a',
      specialty: 'Academic & Career Pressure',
      bio: 'Passionate about student wellness, resilience building, and stress relief.',
      online: true,
    },
    {
      id: 'sarah',
      name: 'Sarah Jenkins',
      role: 'Licensed Therapist',
      username: 'sarah_j',
      initials: 'SJ',
      avatarBg: '#2c5364',
      specialty: 'Sleep, Trauma & Burnout',
      bio: 'Empathetic counselor focusing on gentle grounding techniques and burnout recovery.',
      online: true,
    },
    {
      id: 'aqil',
      name: 'Aqil Mansor',
      role: 'Life & Wellness Coach',
      username: 'aqil_m',
      initials: 'AM',
      avatarBg: '#5a6243',
      specialty: 'Personal Growth & Daily Habits',
      bio: 'Dedicated to helping you cultivate emotional clarity and inner calm.',
      online: false,
    },
    {
      id: 'marcus',
      name: 'Marcus Lee',
      role: 'Behavioral Therapist',
      username: 'marcus_l',
      initials: 'ML',
      avatarBg: '#4b5563',
      specialty: 'Emotional Resilience & CBT',
      bio: 'Evidence-based counseling to navigate life transitions with confidence.',
      online: true,
    },
  ];

  for (const c of counselors) {
    const { id, ...data } = c;
    await setDoc(doc(db, 'counselors', id), { ...data, updatedAt: serverTimestamp() });
  }
  console.log(`✓ Seeded ${counselors.length} counselors.`);

  // 2. Watchlist Collection (Clinical Relapse Triggers)
  console.log('\nCreating [watchlist] collection...');
  const watchlist = [
    {
      id: 'wl-1',
      name: 'Acute Sleep Deprivation (<4h)',
      category: 'Behavioral Signs',
      severity: 'high',
      detectionCues: "haven't slept, can't sleep for days, awake all night, 3 hours sleep, severe insomnia",
      aiAction: 'Flag transcript & alert clinician of imminent relapse vulnerability',
      clinicalRationale: 'Prolonged sleep debt severely compromises prefrontal cortex self-regulation, multiplying craving vulnerability.',
      detectionCount: 6,
      isActive: true,
    },
    {
      id: 'wl-2',
      name: 'Rationalizing Substance Intake',
      category: 'Cognitive Patterns',
      severity: 'high',
      detectionCues: "just one drink, won't hurt once, one beer to sleep, deserve a drink, turning off my brain",
      aiAction: 'Flag critical relapse marker & initiate immediate de-escalation protocol',
      clinicalRationale: 'Cognitive bargaining represents transition from emotional to mental relapse phase; immediate reality-testing is essential.',
      detectionCount: 4,
      isActive: true,
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
      isActive: true,
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
      isActive: true,
    },
  ];

  for (const w of watchlist) {
    const { id, ...data } = w;
    await setDoc(doc(db, 'watchlist', id), { ...data, updatedAt: serverTimestamp() });
  }
  console.log(`✓ Seeded ${watchlist.length} watchlist triggers.`);

  // 3. Users Collection
  console.log('\nCreating [users] collection...');
  const users = [
    {
      id: 'demo_patient_iman',
      displayName: 'Iman Hakimi',
      username: 'ImanHakimi',
      email: 'ImanHakimi@gmail.com',
      role: 'patient',
    },
    {
      id: 'demo_counselor_amelia',
      displayName: 'Dr. Amelia Chen',
      username: 'dr_amelia',
      email: 'amelia.chen@coherent.care',
      role: 'counselor',
    },
    {
      id: 'demo_admin',
      displayName: 'Clinical Relapse Coordinator',
      username: 'admin_clinical',
      email: 'clinical-desk@coherent.care',
      role: 'clinician_admin',
    },
  ];

  for (const u of users) {
    const { id, ...data } = u;
    await setDoc(doc(db, 'users', id), { ...data, createdAt: serverTimestamp() });
  }
  console.log(`✓ Seeded ${users.length} users with roles.`);

  // 4. Bookings Collection
  console.log('\nCreating [bookings] collection...');
  const bookings = [
    {
      id: 'booking_1',
      patientId: 'demo_patient_iman',
      counselorName: 'Amelia Chen',
      counselorRole: 'Psychologist',
      dateStr: '14 Sep',
      timeSlot: '10:30',
      status: 'Confirmed',
    },
    {
      id: 'booking_2',
      patientId: 'demo_patient_iman',
      counselorName: 'Rafael Ortiz',
      counselorRole: 'Licensed Counselor',
      dateStr: '18 Sep',
      timeSlot: '17:00',
      status: 'Scheduled',
    },
    {
      id: 'booking_3',
      patientId: 'demo_patient_iman',
      counselorName: 'Nadia Rahman',
      counselorRole: 'Peer Specialist',
      dateStr: '25 Sep',
      timeSlot: '09:00',
      status: 'Scheduled',
    },
  ];

  for (const b of bookings) {
    const { id, ...data } = b;
    await setDoc(doc(db, 'bookings', id), { ...data, createdAt: serverTimestamp() });
  }
  console.log(`✓ Seeded ${bookings.length} bookings.`);

  // 5. AI Sessions Collection
  console.log('\nCreating [ai_sessions] collection and sample messages...');
  const aiSessionRef = doc(db, 'ai_sessions', 'session_mindfulness_daily');
  await setDoc(aiSessionRef, {
    userId: 'demo_patient_iman',
    title: 'Daily Mindfulness & Stress',
    preview: "Take three deep breaths. You are doing fine.",
    date: 'Today',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const aiMsgRef1 = doc(db, 'ai_sessions', 'session_mindfulness_daily', 'messages', 'msg_1');
  await setDoc(aiMsgRef1, {
    sender: 'assistant',
    text: "Hello! I'm your AI care companion. How are you feeling today?",
    time: '10:00 AM',
    createdAt: serverTimestamp(),
  });

  const aiMsgRef2 = doc(db, 'ai_sessions', 'session_mindfulness_daily', 'messages', 'msg_2');
  await setDoc(aiMsgRef2, {
    sender: 'user',
    text: "Feeling a bit overwhelmed with work deadlines.",
    time: '10:02 AM',
    createdAt: serverTimestamp(),
  });
  console.log('✓ Seeded [ai_sessions] with conversation messages.');

  // 6. Chats Collection (1-on-1 Peer Chat)
  console.log('\nCreating [chats] collection and messages...');
  const chatRoomId = 'iman_sachin';
  const chatRoomRef = doc(db, 'chats', chatRoomId);
  await setDoc(chatRoomRef, {
    participantIds: ['demo_patient_iman', 'sachin'],
    lastMessageText: 'Hello! Feel free to talk about whatever is weighing on you.',
    updatedAt: serverTimestamp(),
  });

  const chatMsgRef = doc(db, 'chats', chatRoomId, 'messages', 'msg_init');
  await setDoc(chatMsgRef, {
    senderId: 'sachin',
    receiverId: 'demo_patient_iman',
    text: 'Hello! Feel free to talk about whatever is weighing on you.',
    time: '09:30',
    createdAt: serverTimestamp(),
  });
  console.log('✓ Seeded [chats] with real-time peer messages.');

  // 7. Clinical Relapse Flags (Admin Portal)
  console.log('\nCreating [clinical_flags] collection...');
  const clinicalFlags = [
    {
      id: 'flag_amelia_day42',
      patientId: 'PT-7704',
      patientName: 'Amelia Chen',
      age: 28,
      condition: 'Alcohol Use Disorder (AUD)',
      recoveryDays: 42,
      assignedClinician: 'Dr. Sarah Jenkins',
      riskScore: 84,
      riskLevel: 'high',
      currentStage: 'Stage 2: Mental Relapse (Severe Craving)',
      flagReason: 'Critical Relapse Marker: Rationalizing Substance Intake & Meeting Avoidance',
      severity: 'critical',
    },
    {
      id: 'flag_rafael_day118',
      patientId: 'PT-8819',
      patientName: 'Rafael Ortiz',
      age: 34,
      condition: 'Opioid Recovery & Chronic Pain',
      recoveryDays: 118,
      assignedClinician: 'Dr. Michael Vance',
      riskScore: 58,
      riskLevel: 'moderate',
      currentStage: 'Stage 1: Emotional Relapse (Under Monitoring)',
      flagReason: 'Trigger Detected: Acute Sleep Deprivation & Stress Flare',
      severity: 'warning',
    },
  ];

  for (const f of clinicalFlags) {
    const { id, ...data } = f;
    await setDoc(doc(db, 'clinical_flags', id), { ...data, flaggedAt: serverTimestamp() });
  }
  console.log(`✓ Seeded ${clinicalFlags.length} clinical flags.`);

  // 8. Notifications Collection
  console.log('\nCreating [notifications] collection...');
  const notifications = [
    {
      id: 'notif_1',
      userId: 'demo_patient_iman',
      icon: '🗓️',
      title: 'Upcoming Session',
      description: 'Amelia Chen · 14 Sep at 10:30',
      time: '15m ago',
      read: false,
      link: '/bookings',
    },
    {
      id: 'notif_2',
      userId: 'demo_patient_iman',
      icon: '💬',
      title: 'Message from Iman Hakimi',
      description: 'Hey there! How has your day been...',
      time: '45m ago',
      read: false,
      link: '/chats',
    },
    {
      id: 'notif_3',
      userId: 'demo_patient_iman',
      icon: '🌱',
      title: 'Gentle Reminder',
      description: 'Take three deep breaths. You are doing fine.',
      time: '2h ago',
      read: false,
      link: '/ai-support',
    },
  ];

  for (const n of notifications) {
    const { id, ...data } = n;
    await setDoc(doc(db, 'notifications', id), { ...data, createdAt: serverTimestamp() });
  }
  console.log(`✓ Seeded ${notifications.length} notifications.`);

  console.log('\n=============================================');
  console.log('All 8 Firestore Collections Created Successfully!');
  console.log('=============================================\n');
  process.exit(0);
}

seedDatabase().catch((err) => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
