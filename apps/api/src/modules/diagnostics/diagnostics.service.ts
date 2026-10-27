import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import {
  AIDiagnosticOutput,
  DIAGNOSTIC_ENGINE_PORT,
  IDiagnosticEnginePort,
} from './ports/diagnostic-engine.port';
import { TriageRequestDto } from './dto/triage-request.dto';

export interface DiagnosticReportRecord {
  id: string;
  orderId: string;
  symptoms: any;
  severity: string;
  suspectedFailure: string;
  estimatedPriceMinGrosze: number;
  estimatedPriceMaxGrosze: number;
  confidence: number;
  notes: string | null;
  createdAt: Date;
}

@Injectable()
export class DiagnosticsService {
  private readonly memoryReports = new Map<string, DiagnosticReportRecord>();

  constructor(
    @Inject(DIAGNOSTIC_ENGINE_PORT)
    private readonly diagnosticEngine: IDiagnosticEnginePort,
    private readonly prisma: PrismaService,
  ) {}

  async runTriage(dto: TriageRequestDto): Promise<AIDiagnosticOutput> {
    const diagnosis = await this.diagnosticEngine.diagnose({
      category: dto.category,
      brand: dto.brand,
      model: dto.model,
      symptoms: dto.symptoms,
      userDescription: dto.userDescription,
      photoUrls: dto.photoUrls,
    });

    if (dto.orderId) {
      await this.saveDiagnosticReport(dto.orderId, dto.symptoms, diagnosis);
    }

    return diagnosis;
  }

  async saveDiagnosticReport(
    orderId: string,
    symptoms: string[],
    diagnosis: AIDiagnosticOutput,
  ): Promise<DiagnosticReportRecord> {
    const record: DiagnosticReportRecord = {
      id: `diag-${Date.now()}`,
      orderId,
      symptoms: symptoms,
      severity: diagnosis.severity,
      suspectedFailure: diagnosis.suspectedFailure.join('; '),
      estimatedPriceMinGrosze: diagnosis.estimatedPriceRangeGrosze.min,
      estimatedPriceMaxGrosze: diagnosis.estimatedPriceRangeGrosze.max,
      confidence: diagnosis.confidence,
      notes: diagnosis.technicianFocusNotes,
      createdAt: new Date(),
    };

    if (this.prisma.isConnected) {
      try {
        const saved = await this.prisma.diagnosticReport.upsert({
          where: { orderId },
          create: {
            orderId,
            symptoms: symptoms,
            severity: diagnosis.severity,
            suspectedFailure: diagnosis.suspectedFailure.join('; '),
            estimatedPriceMinGrosze: diagnosis.estimatedPriceRangeGrosze.min,
            estimatedPriceMaxGrosze: diagnosis.estimatedPriceRangeGrosze.max,
            confidence: diagnosis.confidence,
            notes: diagnosis.technicianFocusNotes,
          },
          update: {
            symptoms: symptoms,
            severity: diagnosis.severity,
            suspectedFailure: diagnosis.suspectedFailure.join('; '),
            estimatedPriceMinGrosze: diagnosis.estimatedPriceRangeGrosze.min,
            estimatedPriceMaxGrosze: diagnosis.estimatedPriceRangeGrosze.max,
            confidence: diagnosis.confidence,
            notes: diagnosis.technicianFocusNotes,
          },
        });
        return {
          ...saved,
          estimatedPriceMinGrosze: saved.estimatedPriceMinGrosze,
          estimatedPriceMaxGrosze: saved.estimatedPriceMaxGrosze,
        };
      } catch {
        // Fallback below
      }
    }

    this.memoryReports.set(orderId, record);
    return record;
  }

  async getReportForOrder(orderId: string): Promise<DiagnosticReportRecord> {
    if (this.prisma.isConnected) {
      try {
        const report = await this.prisma.diagnosticReport.findUnique({
          where: { orderId },
        });
        if (report) return report;
      } catch {
        // Fallback below
      }
    }

    const report = this.memoryReports.get(orderId);
    if (!report) {
      throw new NotFoundException(`Raport diagnostyczny dla zlecenia '${orderId}' nie został odnaleziony.`);
    }
    return report;
  }
}
