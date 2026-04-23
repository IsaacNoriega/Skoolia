import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';

import { LeadService } from './lead.service';
import { ListMyCoursesUseCase } from '../courses/core/use-cases/list-my-courses.use-case';

import { AuthGuard } from '../auth/application/guards/auth.guard';
import { RolesGuard } from '../auth/application/guards/roles.guard';
import { Roles } from '../auth/application/decorators/roles.decorator';
import { CurrentUser } from '../auth/application/decorators/current-user.decorator';

import type { JwtPayload } from '../auth/core/types/jwt-payload';
import type { LeadOriginType, LeadStatus } from './lead.types';

@Controller('leads')
export class LeadController {
  constructor(
    private readonly leadService: LeadService,
    private readonly listMyCoursesUseCase: ListMyCoursesUseCase,
  ) {}

  // 🔥 Leads de cursos del usuario
  @Get('courses')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('private')
  async getCoursesLeads(@CurrentUser() user: JwtPayload) {
    const courses = await this.listMyCoursesUseCase.execute(user);

    const courseIds = courses.map((c) => c.id);

    if (!courseIds.length) return [];

    return this.leadService.getLeadsByTargetIds(courseIds, 'COURSE');
  }

  // 🔥 Upsert lead
  @Post('upsert')
  async upsertLead(@Body() body: any) {
    console.log('POST /leads/upsert body:', body);
    return this.leadService.upsertLead(body);
  }

  // 🔥 Cambiar status
  @Patch(':id/status')
  async patchLeadStatus(
    @Param('id') id: string,
    @Body('status') status: LeadStatus,
  ) {
    return this.leadService.updateLeadStatus(id, status);
  }

  // 🔥 Leads de escuela
  @Get('school')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('private')
  async getSchoolLeads(
    @CurrentUser() user: JwtPayload,
    @Query('originType') originType: LeadOriginType = 'SCHOOL',
    @Query('schoolId') schoolId?: string,
  ) {
    const targetId = schoolId || user.sub;

    console.log('[GET /leads/school]', { targetId, originType });

    const leads = await this.leadService.getLeadsByOwner(
      targetId,
      originType,
    );

    return leads;
  }

  // 🔥 Update metadata
  @Patch(':id/metadata')
  async patchLeadMetadata(
    @Param('id') id: string,
    @Body('metadata') metadata: any,
  ) {
    return this.leadService.updateLeadMetadata(id, metadata);
  }
}