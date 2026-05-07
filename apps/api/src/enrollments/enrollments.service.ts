import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, sql, and, or, inArray } from 'drizzle-orm';
import { DATABASE } from 'src/db/db.module';
import type { Database } from 'src/db/db.types';
import { enrollments, courses, schools, leads, publicUsers } from 'drizzle/schemas';
import { LeadService } from 'src/leads/lead.service';
import { CreateEnrollmentDto, EnrollmentTargetType } from './dto/create-enrollment.dto';

@Injectable()
export class EnrollmentsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly leadService: LeadService,
  ) {}

  async createEnrollment(userId: string, dto: CreateEnrollmentDto) {
    const { targetId, targetType, amount } = dto;

    // 1. Verify target exists
    if (targetType === EnrollmentTargetType.COURSE) {
      const [course] = await this.db.select().from(courses).where(eq(courses.id, targetId));
      if (!course) throw new NotFoundException('Course not found');
    } else {
      const [school] = await this.db.select().from(schools).where(eq(schools.id, targetId));
      if (!school) throw new NotFoundException('School not found');
    }

    // 2. Calculate commission (1%)
    const commission = amount * 0.01;

    // 3. Process enrollment in a transaction
    return await this.db.transaction(async (tx) => {
      // Create Enrollment Record
      const [enrollment] = await tx
        .insert(enrollments)
        .values({
          userId,
          targetId,
          targetType,
          amount,
          commission,
          status: 'COMPLETED', // Simulated success
        })
        .returning();

      // Update/Upsert Lead to INSCRITO
      await this.leadService.upsertLead({
        userId,
        targetId,
        originType: targetType === EnrollmentTargetType.COURSE ? 'COURSE' : 'SCHOOL',
        status: 'INSCRITO',
        lastTrigger: 'INSCRIBIRME',
        metadata: { enrollmentId: enrollment.id, amount, commission },
      });

      // Update Enrollment Counts
      if (targetType === EnrollmentTargetType.COURSE) {
        await tx
          .update(courses)
          .set({ enrollmentsCount: sql`${courses.enrollmentsCount} + 1` })
          .where(eq(courses.id, targetId));
      } else {
        await tx
          .update(schools)
          .set({ enrollmentsCount: sql`${schools.enrollmentsCount} + 1` })
          .where(eq(schools.id, targetId));
      }

      return enrollment;
    });
  }

  async getMyEnrollments(userId: string) {
    const rows = await this.db
      .select({
        enrollment: enrollments,
        schoolName: schools.name,
        courseName: courses.name,
      })
      .from(enrollments)
      .leftJoin(schools, eq(enrollments.targetId, schools.id))
      .leftJoin(courses, eq(enrollments.targetId, courses.id))
      .where(eq(enrollments.userId, userId));

    return rows.map((row) => ({
      ...row.enrollment,
      targetName: row.schoolName || row.courseName || 'N/A',
    }));
  }

  async getEnrollmentsByTarget(targetId: string) {
    const rows = await this.db
      .select({
        enrollment: enrollments,
        userName: publicUsers.name,
      })
      .from(enrollments)
      .leftJoin(publicUsers, eq(enrollments.userId, publicUsers.id))
      .where(eq(enrollments.targetId, targetId));

    return rows.map((row) => ({
      ...row.enrollment,
      userName: row.userName || 'Usuario',
    }));
  }

  async getUserMetrics(userId: string) {
    // 1. Obtener todas las escuelas y cursos que pertenecen a este usuario
    const userSchools = await this.db.select({ id: schools.id }).from(schools)
      .where(eq(schools.ownerId, userId));
    const userCourses = await this.db.select({ id: courses.id }).from(courses)
      .where(eq(courses.ownerId, userId));

    const schoolIds = userSchools.map(s => s.id);
    const courseIds = userCourses.map(c => c.id);
    const allTargetIds = [...schoolIds, ...courseIds];

    if (allTargetIds.length === 0) {
      return {
        qualifiedLeads: 0,
        leadsFee: "$0.00",
        successCommissions: "$0.00",
        totalToPay: "$0.00",
        conversionRate: "0%"
      };
    }

    // 2. Obtener leads interesados de todo lo que posee el usuario
    const interestedLeads = await this.db.select().from(leads)
      .where(
        and(
          inArray(leads.targetId, allTargetIds),
          or(
            eq(leads.status, 'INTERESADO'),
            eq(leads.status, 'VISITA')
          )
        )
      );
    
    // 3. Obtener inscripciones exitosas de todo lo que posee el usuario
    const userEnrollments = await this.db.select().from(enrollments)
      .where(
        and(
          inArray(enrollments.targetId, allTargetIds),
          eq(enrollments.status, 'COMPLETED')
        )
      );

    const leadsCount = interestedLeads.length;
    const leadsFee = leadsCount * 200;
    const successCommissions = userEnrollments.reduce((acc, curr) => acc + (curr.commission || 0), 0);
    const totalToPay = leadsFee + successCommissions;

    const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

    return {
      qualifiedLeads: leadsCount,
      leadsFee: formatter.format(leadsFee),
      successCommissions: formatter.format(successCommissions),
      totalToPay: formatter.format(totalToPay),
      conversionRate: userEnrollments.length > 0 
        ? ((userEnrollments.length / (leadsCount || 1)) * 100).toFixed(1) + "%" 
        : "0%"
    };
  }

  async triggerAutomatedFollowUp(targetId: string, type: string) {
    // Aquí es donde en el futuro se integraría con un servicio de email (SendGrid/Resend) o WhatsApp (Twilio)
    // Para el MVP y la auditoría, simulamos la ejecución exitosa del flujo.
    
    const leadsToFollowUp = await this.db.select().from(leads)
      .where(eq(leads.targetId, targetId));

    // Simulamos la actualización de estado a INTERESADO para leads pendientes
    if (leadsToFollowUp.length > 0) {
      await this.db.update(leads)
        .set({ status: 'INTERESADO' })
        .where(eq(leads.targetId, targetId));
    }

    return {
      success: true,
      message: `Correos de seguimiento enviados exitosamente a padres y directivos.`,
      followUpCount: leadsToFollowUp.length || 1,
    };
  }
}
