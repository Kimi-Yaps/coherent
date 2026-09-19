import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';

export interface DbBooking {
  id: string;
  patientId: string;
  counselorName: string;
  counselorRole: string;
  dateStr: string;
  timeSlot: string;
  status: 'Confirmed' | 'Scheduled' | 'Rescheduled' | 'Completed' | 'Cancelled';
  createdAt?: unknown;
  updatedAt?: unknown;
}

/**
 * Create a new appointment booking in Firestore.
 */
export async function createBooking(
  patientId: string,
  counselorName: string,
  counselorRole: string,
  dateStr: string,
  timeSlot: string
): Promise<string> {
  if (!isFirebaseConfigured) return `mock_booking_${Date.now()}`;

  const bookingsCol = collection(db, 'bookings');
  const docRef = await addDoc(bookingsCol, {
    patientId,
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
 * Retrieve all bookings for a patient.
 */
export async function getPatientBookings(patientId: string): Promise<DbBooking[]> {
  if (!isFirebaseConfigured) return [];

  const bookingsCol = collection(db, 'bookings');
  const q = query(
    bookingsCol,
    where('patientId', '==', patientId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    patientId: d.data().patientId,
    counselorName: d.data().counselorName,
    counselorRole: d.data().counselorRole,
    dateStr: d.data().dateStr,
    timeSlot: d.data().timeSlot,
    status: d.data().status,
    createdAt: d.data().createdAt,
    updatedAt: d.data().updatedAt,
  }));
}
