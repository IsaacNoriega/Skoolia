import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { schools } from 'drizzle/schemas';
import { schoolFavorites } from 'drizzle/schemas/schools/school-favorites';
import { DATABASE } from 'src/db/db.module';
import * as dbTypes from 'src/db/db.types';
import { FavoritesRepository } from 'src/schools/core/ports/favorites.repository';
import type { School } from 'src/schools/core/entities/school.types';

@Injectable()
export class DrizzleFavoritesRepository implements FavoritesRepository {
  constructor(@Inject(DATABASE) private readonly db: dbTypes.Database) {}

  async existsByUserAndSchool(params: {
    publicUserId: string;
    schoolId: string;
  }): Promise<boolean> {
    const rows = await this.db
      .select({ id: schoolFavorites.id })
      .from(schoolFavorites)
      .where(
        and(
          eq(schoolFavorites.publicUserId, params.publicUserId),
          eq(schoolFavorites.schoolId, params.schoolId),
        ),
      )
      .limit(1);

    return !!rows[0];
  }

  async add(params: { publicUserId: string; schoolId: string }): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.insert(schoolFavorites).values({
        publicUserId: params.publicUserId,
        schoolId: params.schoolId,
      });

      await tx
        .update(schools)
        .set({
          favoritesCount: sql`${schools.favoritesCount} + 1`,
        })
        .where(eq(schools.id, params.schoolId));
    });
  }

  async remove(params: {
    publicUserId: string;
    schoolId: string;
  }): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .delete(schoolFavorites)
        .where(
          and(
            eq(schoolFavorites.publicUserId, params.publicUserId),
            eq(schoolFavorites.schoolId, params.schoolId),
          ),
        );

      await tx
        .update(schools)
        .set({
          favoritesCount: sql`GREATEST(${schools.favoritesCount} - 1, 0)`,
        })
        .where(eq(schools.id, params.schoolId));
    });
  }

  async listForUser(publicUserId: string): Promise<School[]> {
    const rows = await this.db
      .select({
        id: schools.id,
        name: schools.name,
        description: schools.description,
        logoUrl: schools.logoUrl,
        coverImageUrl: schools.coverImageUrl,
        address: schools.address,
        city: schools.city,
        latitude: schools.latitude,
        longitude: schools.longitude,
        educationalLevel: schools.educationalLevel,
        institutionType: schools.institutionType,
        schedule: schools.schedule,
        languages: schools.languages,
        maxStudentsPerClass: schools.maxStudentsPerClass,
        enrollmentYear: schools.enrollmentYear,
        enrollmentOpen: schools.enrollmentOpen,
        monthlyPrice: schools.monthlyPrice,
        averageRating: schools.averageRating,
        ratingsCount: schools.ratingsCount,
        favoritesCount: schools.favoritesCount,
        rankingScore: schools.rankingScore,
        isFeatured: schools.isFeatured,
        isVerified: schools.isVerified,
        ownerId: schools.ownerId,
        createdAt: schools.createdAt,
        updatedAt: schools.updatedAt,
      })
      .from(schools)
      .innerJoin(schoolFavorites, eq(schoolFavorites.schoolId, schools.id))
      .where(eq(schoolFavorites.publicUserId, publicUserId));

    // rows are already typed with the selected fields
    return rows as unknown as School[];
  }
}
