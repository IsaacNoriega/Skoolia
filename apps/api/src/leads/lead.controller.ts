import { Controller, Post, Body, Get, Query, Patch, Param, UseGuards } from '@nestjs/common';
import { LeadService } from './lead.service';
import { AuthGuard } from '../auth/application/guards/auth.guard';
import { RolesGuard } from '../auth/application/guards/roles.guard';
import { Roles } from '../auth/application/decorators/roles.decorator';
import { CurrentUser } from '../auth/application/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/core/types/jwt-payload';
import type { LeadOriginType } from './lead.types';

@Controller('leads')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post('upsert')
  async upsertLead(@Body() body: any) {
    // Log para depuración
    console.log('POST /leads/upsert body:', body);
    return this.leadService.upsertLead(body);
  }

  @Patch(':id/status')
  async patchLeadStatus(@Param('id') id: string, @Body('status') status: string) {
    // Validar status si es necesario
    return this.leadService.updateLeadStatus(id, status as any);
  }

  @Get('school')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('private')
  async getSchoolLeads(
    @CurrentUser() user: JwtPayload,
    @Query('originType') originType: string = 'SCHOOL',
    @Query('schoolId') schoolId?: string,
  ) {
    const targetId = schoolId || user.sub;
    console.log('[GET /leads/school] targetId:', targetId, 'originType:', originType);
    const leads = await this.leadService.getLeadsByOwner(targetId, originType as LeadOriginType);
    console.log('[GET /leads/school] leads encontrados:', leads.length);
    return leads;
  }

  @Patch(':id/metadata')
  async patchLeadMetadata(@Param('id') id: string, @Body('metadata') metadata: any) {
    return this.leadService.updateLeadMetadata(id, metadata);
  }
}
