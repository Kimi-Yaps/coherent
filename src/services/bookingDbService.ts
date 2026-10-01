import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';

export interface DbBooking {
  id: string;
  patientId: string;
  patientName?: string;
  counselorName: string;
  counselorRole: string;
  dateStr: string;
  timeSlot: string;
  status: 'Confirmed' | 'Scheduled' | 'Rescheduled' | 'Completed' | 'Cancelled';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CounselorProfile {
  id: string;
  name: string;
  role: string;
  specialty?: string;
  avatarBg?: string;
  initials?: string;
  online?: boolean;
}

export const DEFAULT_DEMO_BOOKINGS: Omit<DbBooking, 'id'>[] = [
  {
    patientId: 'patient-elena',
    patientName: 'Elena Rostova',
    counselorName: 'Dr. Sarah Jenkins',
    counselorRole: 'Lead Addiction Psychiatrist',
    dateStr: '2026-10-06',
    timeSlot: '10:00 - 10:50 AM',
    status: 'Confirmed',
  },
  {
    patientId: 'patient-marcus',
    patientName: 'Marcus Vance',
    counselorName: 'Dr. Michael Vance',
    counselorRole: 'Senior Clinical Psychologist',
    dateStr: '2026-10-09',
    timeSlot: '02:30 - 03:20 PM',
    status: 'Confirmed',
  },
  {
    patientId: 'patient-amelia',
    patientName: 'Amelia Chen',
    counselorName: 'Dr. Sarah Jenkins',
    counselorRole: 'Lead Addiction Psychiatrist',
    dateStr: '2026-10-14',
    timeSlot: '09:00 - 09:50 AM',
    status: 'Confirmed',
  },
  {
    patientId: 'patient-liam',
    patientName: 'Liam Miller',
    counselorName: 'Dr. Amelia Chen',
    counselorRole: 'Clinical Care Specialist',
    dateStr: '2026-10-16',
    timeSlot: '11:15 AM - 12:05 PM',
    status: 'Confirmed',
  },
  {
    patientId: 'patient-sophia',
    patientName: 'Sophia Martinez',
    counselorName: 'Dr. Michael Vance',
    counselorRole: 'Senior Clinical Psychologist',
    dateStr: '2026-10-21',
    timeSlot: '03:45 - 04:35 PM',
    status: 'Confirmed',
  },
  {
    patientId: 'patient-david',
    patientName: 'David Kim',
    counselorName: 'Dr. Amelia Chen',
    counselorRole: 'Clinical Care Specialist',
    dateStr: '2026-10-27',
    timeSlot: '01:00 - 01:50 PM',
    status: 'Confirmed',
  },
];

/**
 * Universal helper to parse any date string format into year, month (0-indexed), and day.
 */
export function parseBookingDate(
  dateStr: string,
  fallbackYear?: number,
  fallbackMonth?: number
): { year: number; month: number; day: number } | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();

  // 1. ISO format: YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (isoMatch) {
    return {
      year: parseInt(isoMatch[1], 10),
      month: parseInt(isoMatch[2], 10) - 1,
      day: parseInt(isoMatch[3], 10),
    };
  }

  // 2. Standard Date parseable
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime()) && !/^[A-Za-z]{3}\s+\d{1,2}$/.test(trimmed)) {
    return {
      year: parsed.getFullYear(),
      month: parsed.getMonth(),
      day: parsed.getDate(),
    };
  }

  // 3. Relative or short format like "Mon 14", "Tue 15", "14"
  const dayMatch = trimmed.match(/\b(\d{1,2})\b/);
  if (dayMatch) {
    const now = new Date();
    return {
      year: fallbackYear ?? now.getFullYear(),
      month: fallbackMonth ?? now.getMonth(),
      day: parseInt(dayMatch[1], 10),
    };
  }

  return null;
}

/**
 * Create a new appointment booking in Firestore.
 */
export async function createBooking(
  patientId: string,
  counselorName: string,
  counselorRole: string,
  dateStr: string,
  timeSlot: string,
  patientName?: string
): Promise<string> {
  if (!isFirebaseConfigured) return `mock_booking_${Date.now()}`;

  const bookingsCol = collection(db, 'bookings');
  const docRef = await addDoc(bookingsCol, {
    patientId,
    patientName: patientName || 'Patient',
    counselorName,
    counselorRole,
    dateStr,
    timeSlot,
    status: 'Confirmed',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

/**
 * Reschedule an existing appointment booking.
 */
export async function rescheduleBooking(
  bookingId: string,
  newDateStr: string,
  newTimeSlot: string
): Promise<void> {
  if (!isFirebaseConfigured) return;

  const bookingRef = doc(db, 'bookings', bookingId);
  await updateDoc(bookingRef, {
    dateStr: newDateStr,
    timeSlot: newTimeSlot,
    status: 'Rescheduled',
    updatedAt: serverTimestamp(),
  });
}

/**
 * Retrieve all bookings for a specific patient.
 */
export async function getPatientBookings(patientId: string): Promise<DbBooking[]> {
  if (!isFirebaseConfigured || !patientId) return [];

  try {
    const bookingsCol = collection(db, 'bookings');
    // Using single-field query to avoid requiring composite indexes in Firestore
    const q = query(bookingsCol, where('patientId', '==', patientId));
    const snap = await getDocs(q);

    const list: DbBooking[] = snap.docs.map((d) => ({
      id: d.id,
      patientId: d.data().patientId,
      patientName: d.data().patientName || 'Patient',
      counselorName: d.data().counselorName,
      counselorRole: d.data().counselorRole,
      dateStr: d.data().dateStr,
      timeSlot: d.data().timeSlot,
      status: d.data().status,
      createdAt: d.data().createdAt,
      updatedAt: d.data().updatedAt,
    }));

    return list.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
  } catch (err) {
    console.warn('Error fetching patient bookings:', err);
    return [];
  }
}

/**
 * Retrieve ALL bookings across all patients and counselors for the Clinical Calendar / Admin.
 * Automatically seeds default baseline verified clinician bookings if collection is newly created.
 */
export async function getAllBookingsForAdmin(): Promise<DbBooking[]> {
  if (!isFirebaseConfigured) {
    return DEFAULT_DEMO_BOOKINGS.map((b, idx) => ({ ...b, id: `local_demo_${idx}` }));
  }

  try {
    const bookingsCol = collection(db, 'bookings');
    const snap = await getDocs(bookingsCol);

    if (snap.empty) {
      // Seed default baseline bookings to Firestore
      const seeded: DbBooking[] = [];
      for (const item of DEFAULT_DEMO_BOOKINGS) {
        try {
          const docRef = await addDoc(bookingsCol, {
            ...item,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          seeded.push({ ...item, id: docRef.id });
        } catch {
          // fallback
          seeded.push({ ...item, id: `seeded_${Date.now()}` });
        }
      }
      return seeded;
    }

    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        patientId: data.patientId || '',
        patientName: data.patientName || 'Patient',
        counselorName: data.counselorName || 'Counselor',
        counselorRole: data.counselorRole || 'Therapist',
        dateStr: data.dateStr || '',
        timeSlot: data.timeSlot || '',
        status: data.status || 'Confirmed',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    });
  } catch (err) {
    console.warn('Error reading all bookings from Firestore:', err);
    return DEFAULT_DEMO_BOOKINGS.map((b, idx) => ({ ...b, id: `fallback_${idx}` }));
  }
}

/**
 * Fetch verified doctors / counselors from Firestore `counselors` collection.
 */
export async function getCounselorsFromDb(): Promise<CounselorProfile[]> {
  if (!isFirebaseConfigured) return [];

  try {
    const counselorsCol = collection(db, 'counselors');
    const snap = await getDocs(counselorsCol);

    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name || '',
        role: data.role || 'Clinical Counselor',
        specialty: data.specialty || '',
        avatarBg: data.avatarBg || '#2b5a45',
        initials: data.initials || data.name?.slice(0, 2).toUpperCase() || 'DR',
        online: data.online !== false,
      };
    });
  } catch (err) {
    console.warn('Error reading counselors from Firestore:', err);
    return [];
  }
}
