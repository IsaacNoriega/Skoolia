import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
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
}
