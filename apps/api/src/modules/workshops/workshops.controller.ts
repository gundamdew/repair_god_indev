import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WorkshopsService } from './workshops.service';
import { QueryWorkshopsDto } from './dto/query-workshops.dto';

@ApiTags('Workshops')
@Controller('api/v1/workshops')
export class WorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Get()
  @ApiOperation({
    summary: 'Search and filter verified repair workshops by distance, rating, price, or turnaround',
  })
  @ApiResponse({ status: 200, description: 'List of matching partner workshops' })
  async listWorkshops(@Query() query: QueryWorkshopsDto) {
    return this.workshopsService.listWorkshops(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get partner repair workshop details and metrics by ID' })
  @ApiResponse({ status: 200, description: 'Workshop profile and metrics' })
  async getWorkshop(@Param('id') id: string) {
    return this.workshopsService.getWorkshopById(id);
  }
}
