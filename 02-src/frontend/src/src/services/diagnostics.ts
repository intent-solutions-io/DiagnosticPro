/**
 * Diagnostics service - handles diagnostic submissions and analysis
 */
import { api } from './api';
import { firestoreServices, DiagnosticSubmission } from './firestore';

// Frontend form interface
export interface DiagnosticFormData {
  fullName: string;
  email: string;
  phone?: string;
  equipmentType?: string;
  make?: string;
  model?: string;
  year?: string;
  serialNumber?: string;
  problemDescription?: string;
  symptoms?: string[];
  errorCodes?: string;
  whenStarted?: string;
  frequency?: string;
  urgencyLevel?: string;
  troubleshootingSteps?: string;
  previousRepairs?: string;
  usagePattern?: string;
  locationEnvironment?: string;
  modifications?: string;
  mileageHours?: string;
  shopRecommendation?: string;
  shopQuoteAmount?: number;
}

export interface DiagnosticAnalysis {
  id: string;
  submissionId: string;
  analysisResult: string;
  confidence: number;
  recommendations: string[];
  estimatedCost?: {
    min: number;
    max: number;
    currency: string;
  };
  createdAt: string;
  reportStatus: 'pending' | 'generating' | 'ready' | 'failed';
  reportUrl?: string;
}

export interface ApiResponse<T> {
  data?: T;
  success: boolean;
  error?: string;
  status?: number;
}

interface SubmissionResponse {
  success: boolean;
  submissionId?: string;
  error?: string;
}

/**
 * Submit diagnostic form - primary entry point
 */
export async function submitDiagnosticForm(data: DiagnosticFormData): Promise<SubmissionResponse> {
  try {
    const submissionData: Omit<DiagnosticSubmission, 'id' | 'createdAt' | 'updatedAt'> = {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      equipmentType: data.equipmentType,
      make: data.make,
      model: data.model,
      year: data.year,
      serialNumber: data.serialNumber,
      problemDescription: data.problemDescription,
      symptoms: data.symptoms,
      errorCodes: data.errorCodes,
      whenStarted: data.whenStarted,
      frequency: data.frequency,
      urgencyLevel: data.urgencyLevel,
      troubleshootingSteps: data.troubleshootingSteps,
      previousRepairs: data.previousRepairs,
      usagePattern: data.usagePattern,
      locationEnvironment: data.locationEnvironment,
      modifications: data.modifications,
      mileageHours: data.mileageHours,
      shopRecommendation: data.shopRecommendation,
      shopQuoteAmount: data.shopQuoteAmount,
      paymentStatus: 'pending',
      analysisStatus: 'pending'
    };

    const result = await firestoreServices.diagnosticSubmissions.create(submissionData);

    return {
      success: true,
      submissionId: result.id,
    };
  } catch (error) {
    console.error('Diagnostic submission error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Start diagnostic analysis
 */
export async function startAnalysis(
  submissionId: string,
  diagnosticData?: any
): Promise<ApiResponse<DiagnosticAnalysis>> {
  try {
    const response = await api<{ ok: boolean; path: string; analysisId: string }>('/analyzeDiagnostic', {
      method: 'POST',
      body: JSON.stringify({ submissionId }),
    });

    if (response.ok) {
      return {
        data: {
          id: response.analysisId,
          submissionId,
          analysisResult: 'Analysis completed successfully',
          confidence: 0.95,
          recommendations: [],
          createdAt: new Date().toISOString(),
          reportStatus: 'ready',
          reportUrl: response.path
        } as DiagnosticAnalysis,
        success: true
      };
    } else {
      return {
        error: 'Analysis failed',
        success: false
      };
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Analysis failed',
      success: false
    };
  }
}
