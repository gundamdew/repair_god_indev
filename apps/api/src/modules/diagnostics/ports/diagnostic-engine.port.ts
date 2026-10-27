export interface TriageInput {
  category: string;
  brand: string;
  model: string;
  symptoms: string[];
  userDescription?: string;
  photoUrls?: string[];
}

export interface AIDiagnosticOutput {
  suspectedFailure: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  batteryHazardWarning: boolean;
  estimatedPartsRequired: string[];
  repairFeasibilityScore: number; // 0.0 - 1.0
  estimatedPriceRangeGrosze: {
    min: number; // integer in grosze
    max: number; // integer in grosze
  };
  estimatedTurnaroundDays: {
    min: number;
    max: number;
  };
  confidence: number; // 0.0 - 1.0
  technicianFocusNotes: string;
}

export const DIAGNOSTIC_ENGINE_PORT = Symbol('DIAGNOSTIC_ENGINE_PORT');

export interface IDiagnosticEnginePort {
  diagnose(input: TriageInput): Promise<AIDiagnosticOutput>;
}
