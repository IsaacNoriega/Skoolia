import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'node:path';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { DbModule } from './db/db.module';
import { SchoolsModule } from './schools/schools.module';
import { FavoritesModule } from './schools/favorites.module';
import { CoursesModule } from './courses/courses.module';
import { AppResolver } from './app.resolver';
import { RatingsModule } from './ratings/ratings.module';
import { StudentsModule } from './students/students.module';
import { FilesModule } from './files/files.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { MessagesModule } from './messages/messages.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { LeadModule } from './leads/lead.module';
import { PlansModule } from './plans/plans.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), '.env'),
        join(process.cwd(), 'apps/api/.env'),
      ],
    }),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'schema.gql'),
      playground: true,
    }),

    DbModule,
    AuthModule,
    SchoolsModule,
    FavoritesModule,
    CoursesModule,
    RatingsModule,
    StudentsModule,
    FilesModule,
    UsersModule,
    CategoriesModule,
    MessagesModule,
    SubscriptionsModule,
    LeadModule,
    PlansModule,
    EnrollmentsModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppResolver],
})
export class AppModule {}
