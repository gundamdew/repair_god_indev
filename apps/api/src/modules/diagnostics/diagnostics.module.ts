import { Module } from '@nestjs/common';
import { DiagnosticsController } from './diagnostics.controller';
import { DiagnosticsService } from './diagnostics.service';
import { DIAGNOSTIC_ENGINE_PORT } from './ports/diagnostic-engine.port';
import { GeminiDiagnosticAdapter } from './adapters/gemini-diagnostic.adapter';

@Module({
  controllers: [DiagnosticsController],
  providers: [
    DiagnosticsService,
    {
      provide: DIAGNOSTIC_ENGINE_PORT,
      useClass: GeminiDiagnosticAdapter,
    },
  ],
  exports: [DiagnosticsService, DIAGNOSTIC_ENGINE_PORT],
})
export class DiagnosticsModule {}
