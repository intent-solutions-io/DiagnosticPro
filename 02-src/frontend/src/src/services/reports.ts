/**
 * Reports service - Direct download via GCS signed URLs
 */

export interface DiagnosticStatus {
  id: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  gcsPath?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Download report by getting signed URL from Firestore and navigating to it
 */
export async function downloadReport(id: string): Promise<void> {
  try {
    const { db } = await import('../config/firebase');
    const { doc, getDoc } = await import('firebase/firestore');

    const docRef = doc(db, 'diagnosticSubmissions', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Diagnostic submission not found');
    }

    const data = docSnap.data();

    if (!data.downloadUrl) {
      throw new Error('Download URL not available - report may still be processing');
    }

    window.location.href = data.downloadUrl;
  } catch (error) {
    console.error('Error downloading report:', error);
    throw error;
  }
}

/**
 * Get diagnostic status for polling - Firebase Firestore version
 */
export async function getDiagnosticStatus(diagnosticId: string): Promise<{ data: DiagnosticStatus | null; status: number; error?: string }> {
  try {
    const { db } = await import('../config/firebase');
    const { doc, getDoc } = await import('firebase/firestore');

    const docRef = doc(db, 'diagnosticSubmissions', diagnosticId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        data: null,
        status: 404,
        error: 'Diagnostic submission not found'
      };
    }

    const data = docSnap.data();

    return {
      data: {
        id: diagnosticId,
        status: data.analysisStatus === 'completed' ? 'ready' :
               data.analysisStatus === 'processing' ? 'processing' :
               data.analysisStatus === 'failed' ? 'failed' : 'pending',
        gcsPath: data.reportPath,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.analysisCompletedAt?.toDate?.()?.toISOString() || data.updatedAt
      },
      status: 200
    };
  } catch (error) {
    console.error('Error getting diagnostic status from Firestore:', error);
    return {
      data: null,
      status: 500,
      error: `Failed to get diagnostic status: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Poll diagnostic status until ready or failed
 */
export async function pollDiagnosticStatus(
  diagnosticId: string,
  onUpdate?: (status: DiagnosticStatus) => void,
  maxAttempts: number = 60,
  intervalMs: number = 5000
): Promise<DiagnosticStatus | null> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await getDiagnosticStatus(diagnosticId);

      if (response.data) {
        onUpdate?.(response.data);

        if (response.data.status === 'ready' || response.data.status === 'failed') {
          return response.data;
        }
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
      attempts++;
    } catch (error) {
      console.error('Error polling diagnostic status:', error);
      attempts++;
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  return null;
}
