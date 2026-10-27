import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AIDiagnosticOutput,
  IDiagnosticEnginePort,
  TriageInput,
} from '../ports/diagnostic-engine.port';

@Injectable()
export class GeminiDiagnosticAdapter implements IDiagnosticEnginePort {
  private readonly logger = new Logger(GeminiDiagnosticAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  async diagnose(input: TriageInput): Promise<AIDiagnosticOutput> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    const model = this.configService.get<string>('GEMINI_MODEL', 'gemini-flash-latest');

    this.logger.log(
      `Running AI Diagnostic triage for ${input.brand} ${input.model} (engine: ${
        apiKey ? model : 'Deterministic Mock / Heuristic Gemini Simulation'
      })`,
    );

    if (apiKey && apiKey.trim().length > 0) {
      try {
        const liveResult = await this.callGeminiApi(apiKey.trim(), model, input);
        if (liveResult) return liveResult;
      } catch (err) {
        this.logger.warn(`Live Gemini call failed, using heuristic triage: ${err}`);
      }
    }

    return this.simulateGeminiTriage(input);
  }

  private async callGeminiApi(apiKey: string, model: string, input: TriageInput): Promise<AIDiagnosticOutput | null> {
    const prompt = `Jesteś ekspertem diagnostyki sprzętu elektronicznego w platformie Repair God.
Zdiagnozuj urządzenie na podstawie parametrów:
- Kategoria: ${input.category}
- Marka i model: ${input.brand} ${input.model}
- Objawy: ${input.symptoms.join(', ')}
- Opis użytkownika: ${input.userDescription || 'Brak'}

Odpowiedz WYŁĄCZNIE poprawnym obiektem JSON w formacie:
{
  "suspectedFailure": ["nazwa usterki 1", "nazwa usterki 2"],
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "batteryHazardWarning": boolean,
  "estimatedPartsRequired": ["część 1", "część 2"],
  "repairFeasibilityScore": number (od 0.0 do 1.0),
  "estimatedPriceRangeGrosze": { "min": number (w groszach), "max": number (w groszach) },
  "estimatedTurnaroundDays": { "min": number, "max": number },
  "confidence": number (od 0.0 do 1.0),
  "technicianFocusNotes": "Krótka notatka dla serwisanta"
}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini HTTP error ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as any;
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Empty response from Gemini');

    const parsed = JSON.parse(rawText) as AIDiagnosticOutput;
    return parsed;
  }

  private simulateGeminiTriage(input: TriageInput): AIDiagnosticOutput {
    const symptomsUpper = input.symptoms.map((s) => s.toUpperCase());
    const descUpper = (input.userDescription || '').toUpperCase();

    const isDisplay =
      symptomsUpper.some((s) => s.includes('SCREEN') || s.includes('DISPLAY') || s.includes('EKRAN')) ||
      descUpper.includes('EKRAN') ||
      descUpper.includes('SZYBK');

    const isBattery =
      symptomsUpper.some((s) => s.includes('BATTERY') || s.includes('BATERIA') || s.includes('CHARGING')) ||
      descUpper.includes('BATERI') ||
      descUpper.includes('ROZDĘT') ||
      descUpper.includes('PUCHNI');

    const isLiquid =
      symptomsUpper.some((s) => s.includes('WATER') || s.includes('LIQUID') || s.includes('ZALAN')) ||
      descUpper.includes('ZALAN') ||
      descUpper.includes('WOD');

    const isBoard =
      symptomsUpper.some((s) => s.includes('BOARD') || s.includes('DEAD') || s.includes('POWER')) ||
      descUpper.includes('NIE WŁĄCZA');

    // Default: Display damage (most common in mobile repair ~52%)
    if (isLiquid) {
      return {
        suspectedFailure: ['Korozja sekcji zasilania płyty głównej', 'Zwarcie na linii VDD_MAIN'],
        severity: 'HIGH',
        batteryHazardWarning: false,
        estimatedPartsRequired: ['Zestaw chemii do czyszczenia ultradźwiękowego', 'Kondensatory ceramiczne SMD'],
        repairFeasibilityScore: 0.82,
        estimatedPriceRangeGrosze: {
          min: 35000, // 350 PLN
          max: 75000, // 750 PLN
        },
        estimatedTurnaroundDays: { min: 3, max: 5 },
        confidence: 0.88,
        technicianFocusNotes:
          'Zalecana natychmiastowa deoksydacja płyty w myjce ultradźwiękowej przed podłączeniem zasilacza serwisowego. Weryfikacja poboru prądu pod kamerą termowizyjną.',
      };
    }

    if (isBattery) {
      const isSwollen = descUpper.includes('ROZDĘT') || descUpper.includes('PUCH');
      return {
        suspectedFailure: [
          isSwollen ? 'Degradacja elektrochemiczna ogniwa (pakiet spuchnięty)' : 'Zużycie ogniwa litowo-jonowego (>800 cykli)',
        ],
        severity: isSwollen ? 'CRITICAL' : 'MEDIUM',
        batteryHazardWarning: isSwollen,
        estimatedPartsRequired: [`Oryginalny moduł akumulatora Li-Ion (${input.brand} ${input.model})`, 'Paski montażowe tesa'],
        repairFeasibilityScore: 0.98,
        estimatedPriceRangeGrosze: {
          min: 19000, // 190 PLN
          max: 29000, // 290 PLN
        },
        estimatedTurnaroundDays: { min: 1, max: 2 },
        confidence: 0.94,
        technicianFocusNotes: isSwollen
          ? 'UWAGA: Ryzyko pożarowe! Demontaż w komorze ogniowej. Odizolować baterię przed podważaniem.'
          : 'Standardowa wymiana baterii z zachowaniem kondycji ogniwa i kalibracją kontrolera BMS.',
      };
    }

    if (isBoard) {
      return {
        suspectedFailure: ['Uszkodzenie kontrolera zasilania PMIC', 'Uszkodzona cewka sekcji DC-DC'],
        severity: 'HIGH',
        batteryHazardWarning: false,
        estimatedPartsRequired: ['Układ scalony PMIC', 'Mikrolut BGA'],
        repairFeasibilityScore: 0.75,
        estimatedPriceRangeGrosze: {
          min: 30000, // 300 PLN
          max: 60000, // 600 PLN
        },
        estimatedTurnaroundDays: { min: 2, max: 4 },
        confidence: 0.85,
        technicianFocusNotes: 'Diagnoza oscyloskopowa szyn zasilania PMIC i przetwornic impulsowych.',
      };
    }

    return {
      suspectedFailure: ['Pęknięcie matrycy OLED/IPS', 'Uszkodzenie digitizera dotyku'],
      severity: 'MEDIUM',
      batteryHazardWarning: false,
      estimatedPartsRequired: [`Oryginalny moduł wyświetlacza (${input.brand} ${input.model})`, 'Uszczelka wodoszczelna'],
      repairFeasibilityScore: 0.99,
      estimatedPriceRangeGrosze: {
        min: 29900, // 299 PLN
        max: 45000, // 450 PLN
      },
      estimatedTurnaroundDays: { min: 1, max: 2 },
      confidence: 0.96,
      technicianFocusNotes: 'Przeniesienie układu scalonego eeprom lub programowanie TrueTone/ambient light sensor po wymianie.',
    };
  }
}
