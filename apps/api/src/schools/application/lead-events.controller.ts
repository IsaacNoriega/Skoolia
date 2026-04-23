import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { LeadEventsService } from '../services/lead-events.service';
import { AuthGuard } from 'src/auth/application/guards/auth.guard';
import { RolesGuard } from 'src/auth/application/guards/roles.guard';
import { Roles } from 'src/auth/application/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/application/decorators/current-user.decorator';
import type { JwtPayload } from 'src/auth/core/types/jwt-payload';

@Controller('lead-events')
export class LeadEventsController {
  constructor(private readonly leadEventsService: LeadEventsService) {}

  // 🔒 Solo usuarios privados pueden consultar eventos de una escuela
  @Get('school/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('private')
  async getEventsBySchool(@Param('id') schoolId: string) {
    return this.leadEventsService.getEventsBySchool(schoolId);
  }

  // 🎯 Registrar un evento de interés (clic a contacto, etc.)
  @Post('interest/:schoolId')
  @UseGuards(AuthGuard)
  async createInterest(
    @Param('schoolId') schoolId: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { action: 'contact_click' | 'info_request' | 'visit_scheduled'; metadata?: any },
  ) {
    return this.leadEventsService.createInterestEvent({
      schoolId,
      userId: user.sub,
      action: body.action,
      metadata: body.metadata,
    });
  }

  // 💰 Registrar un evento de inscripción
  @Post('enrollment/:schoolId')
  @UseGuards(AuthGuard)
  async createEnrollment(
    @Param('schoolId') schoolId: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { enrollmentAmount: number; metadata?: any },
  ) {
    return this.leadEventsService.createEnrollmentEvent({
      schoolId,
      userId: user.sub,
      enrollmentAmount: body.enrollmentAmount,
      metadata: body.metadata,
    });
  }
}
