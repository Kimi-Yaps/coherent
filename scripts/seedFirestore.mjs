import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readdirSync, readFileSync } from 'fs';
import { resolve, join } from 'path';

// Locate service account key JSON file in project root
const rootDir = process.cwd();
let serviceAccountPath = null;

const files = readdirSync(rootDir);
const keyFile = files.find(
  (f) =>
    f.endsWith('.json') &&
    (f.includes('adminsdk') || f.includes('serviceAccount') || f.includes('firebase-adminsdk'))
);

if (keyFile) {
  serviceAccountPath = join(rootDir, keyFile);
} else {
  console.error('Error: Could not find a Firebase service account JSON key file in the project root.');
  console.error('Please place your downloaded service account key (e.g. serviceAccountKey.json) in the project directory.');
  process.exit(1);
}

console.log(`Using Service Account Key: ${keyFile}`);
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

const app = initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore(app);
const auth = getAuth(app);

async function createOrUpdateAuthUser(email, password, displayName, uid) {
  try {
    const existing = await auth.getUserByEmail(email);
    await auth.updateUser(existing.uid, {
      password,
      displayName,
    });
    console.log(`  ✓ Updated Auth user: ${email} (Password: ${password})`);
    return existing.uid;
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      const user = await auth.createUser({
        uid,
        email,
        password,
        displayName,
      });
      console.log(`  ✓ Created Auth user: ${email} (Password: ${password})`);
      return user.uid;
    }
    console.warn(`  ⚠️ Could not register Auth user ${email}:`, err.message);
    return uid;
  }
}

async function seedDatabase() {
  console.log(`\nInitializing Firestore & Firebase Auth for Project: ${serviceAccount.project_id}...\n`);

  // 1. Seed Authentication Users
  console.log('Registering default Firebase Auth login accounts...');
  const defaultPassword = 'Password123!';
  const authUsers = [
    {
      uid: 'demo_patient_iman',
      email: 'ImanHakimi@gmail.com',
      displayName: 'Iman Hakimi',
      username: 'ImanHakimi',
      role: 'patient',
    },
    {
      uid: 'demo_counselor_amelia',
      email: 'amelia.chen@coherent.care',
      displayName: 'Dr. Amelia Chen',
      username: 'dr_amelia',
      role: 'counselor',
    },
    {
      uid: 'demo_admin',
      email: 'clinical-desk@coherent.care',
      displayName: 'Clinical Relapse Coordinator',
      username: 'admin_clinical',
      role: 'clinician_admin',
    },
  ];

  for (const u of authUsers) {
    const assignedUid = await createOrUpdateAuthUser(u.email, defaultPassword, u.displayName, u.uid);
    // Write profile to Firestore
    await db.collection('users').doc(assignedUid).set(
      {
        uid: assignedUid,
        email: u.email,
        displayName: u.displayName,
        username: u.username,
        role: u.role,
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
  console.log(`✓ Firebase Auth users configured with password: "${defaultPassword}".`);

  // 2. Counselors Collection
  console.log('\nCreating [counselors] collection...');
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
    await db.collection('counselors').doc(id).set({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  console.log(`✓ Seeded ${counselors.length} counselors.`);

  // 3. Watchlist Collection (Clinical Relapse Triggers)
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
      detectionCues: "skipped meeting, didn't go to group, avoiding sponsor, missed session, embarrassed to face them",
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
    await db.collection('watchlist').doc(id).set({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  console.log(`✓ Seeded ${watchlist.length} watchlist triggers.`);

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
    await db.collection('bookings').doc(id).set({
      ...data,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  console.log(`✓ Seeded ${bookings.length} bookings.`);

  // 5. AI Sessions Collection
  console.log('\nCreating [ai_sessions] collection and sample messages...');
  const aiSessionRef = db.collection('ai_sessions').doc('session_mindfulness_daily');
  await aiSessionRef.set({
    userId: 'demo_patient_iman',
    title: 'Daily Mindfulness & Stress',
    preview: 'Take three deep breaths. You are doing fine.',
    date: 'Today',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await aiSessionRef.collection('messages').doc('msg_1').set({
    sender: 'assistant',
    text: "Hello! I'm your AI care companion. How are you feeling today?",
    time: '10:00 AM',
    createdAt: FieldValue.serverTimestamp(),
  });

  await aiSessionRef.collection('messages').doc('msg_2').set({
    sender: 'user',
    text: 'Feeling a bit overwhelmed with work deadlines.',
    time: '10:02 AM',
    createdAt: FieldValue.serverTimestamp(),
  });
  console.log('✓ Seeded [ai_sessions] with conversation messages.');

  // 6. Clinical Relapse Flags (Admin Portal)
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
    await db.collection('clinical_flags').doc(id).set({
      ...data,
      flaggedAt: FieldValue.serverTimestamp(),
    });
  }
  console.log(`✓ Seeded ${clinicalFlags.length} clinical flags.`);

  // 7. Notifications Collection
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
      icon: '✨',
      title: 'Mindfulness Practice',
      description: 'A 5-minute breathing exercise is ready for you.',
      time: '45m ago',
      read: false,
      link: '/ai-support',
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
    await db.collection('notifications').doc(id).set({
      ...data,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  console.log(`✓ Seeded ${notifications.length} notifications.`);

  console.log('\n=============================================');
  console.log('All Firebase Auth Users & Firestore Collections Seeded Successfully!');
  console.log('=============================================\n');
  process.exit(0);
}

seedDatabase().catch((err) => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
