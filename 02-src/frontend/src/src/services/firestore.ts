/**
 * Firestore service layer
 * Provides type-safe database operations for DiagnosticPro
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  CollectionReference,
  DocumentData,
} from 'firebase/firestore';
import { firestore } from '@/integrations/firebase';

// Type definitions for Firestore collections
export interface DiagnosticSubmission {
  id?: string;
  analysisStatus?: string | null;
  createdAt?: Timestamp | string;
  email: string;
  equipmentType?: string | null;
  errorCodes?: string | null;
  frequency?: string | null;
  fullName: string;
  locationEnvironment?: string | null;
  make?: string | null;
  mileageHours?: string | null;
  model?: string | null;
  modifications?: string | null;
  orderId?: string | null;
  paidAt?: Timestamp | string | null;
  paymentId?: string | null;
  paymentStatus?: string | null;
  phone?: string | null;
  previousRepairs?: string | null;
  problemDescription?: string | null;
  serialNumber?: string | null;
  shopQuoteAmount?: number | null;
  shopRecommendation?: string | null;
  symptoms?: string[] | null;
  troubleshootingSteps?: string | null;
  updatedAt?: Timestamp | string;
  urgencyLevel?: string | null;
  usagePattern?: string | null;
  userId?: string | null;
  whenStarted?: string | null;
  year?: string | null;
}

// Collection reference
const diagnosticSubmissionsRef = collection(firestore, 'diagnosticSubmissions') as CollectionReference<DiagnosticSubmission>;

// Utility function to convert Firestore timestamps
function convertTimestamps<T extends DocumentData>(data: T): T {
  const converted = { ...data };
  Object.keys(converted).forEach(key => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate().toISOString();
    }
  });
  return converted;
}

/**
 * Diagnostic Submissions Service
 */
export const diagnosticSubmissionsService = {
  async create(data: Omit<DiagnosticSubmission, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ id: string; data: DiagnosticSubmission }> {
    const submission = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(diagnosticSubmissionsRef, submission);
    const docSnap = await getDoc(docRef);

    return {
      id: docRef.id,
      data: convertTimestamps({ id: docRef.id, ...docSnap.data() } as DiagnosticSubmission)
    };
  },

  async getById(id: string): Promise<DiagnosticSubmission | null> {
    const docRef = doc(diagnosticSubmissionsRef, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return convertTimestamps({ id: docSnap.id, ...docSnap.data() } as DiagnosticSubmission);
  },

  async update(id: string, data: Partial<DiagnosticSubmission>): Promise<void> {
    const docRef = doc(diagnosticSubmissionsRef, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async getByEmail(email: string): Promise<DiagnosticSubmission[]> {
    const q = query(
      diagnosticSubmissionsRef,
      where('email', '==', email),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc =>
      convertTimestamps({ id: doc.id, ...doc.data() } as DiagnosticSubmission)
    );
  },

  async getRecent(limitCount = 10): Promise<DiagnosticSubmission[]> {
    const q = query(
      diagnosticSubmissionsRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc =>
      convertTimestamps({ id: doc.id, ...doc.data() } as DiagnosticSubmission)
    );
  }
};

// Export for convenience
export const firestoreServices = {
  diagnosticSubmissions: diagnosticSubmissionsService,
};
