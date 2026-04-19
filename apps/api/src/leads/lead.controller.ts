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
    // Validar body según tus necesidades
    return this.leadService.upsertLead(body);
  }

  @Get('school')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('private')
  async getSchoolLeads(
    @CurrentUser() user: JwtPayload,
    @Query('originType') originType: string = 'SCHOOL',
  ) {
    return this.leadService.getLeadsByOwner(user.sub, originType as LeadOriginType);
  }

  @Patch(':id/metadata')
  async patchLeadMetadata(@Param('id') id: string, @Body('metadata') metadata: any) {
    return this.leadService.updateLeadMetadata(id, metadata);
  }
}
