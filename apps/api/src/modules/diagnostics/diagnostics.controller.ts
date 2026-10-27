import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DiagnosticsService } from './diagnostics.service';
import { TriageRequestDto } from './dto/triage-request.dto';

@ApiTags('Diagnostics')
@Controller('api/v1/diagnostics')
export class DiagnosticsController {
  constructor(private readonly diagnosticsService: DiagnosticsService) {}

  @Post('triage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Run AI diagnostic triage with Google Gemini simulation and structured estimates (all in grosze)',
  })
  @ApiResponse({
    status: 200,
    description: 'Structured AI diagnostic analysis, parts needed, hazard warning, and price range in grosze',
  })
  async triage(@Body() dto: TriageRequestDto) {
    return this.diagnosticsService.runTriage(dto);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Get saved diagnostic report for a specific order' })
  @ApiResponse({ status: 200, description: 'Diagnostic report record' })
  async getReport(@Param('orderId') orderId: string) {
    return this.diagnosticsService.getReportForOrder(orderId);
  }
}
