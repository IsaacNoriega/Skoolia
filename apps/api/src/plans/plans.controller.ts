
import { Controller, Get, Inject } from '@nestjs/common';
import { plans } from 'drizzle/schemas';
import { DATABASE } from 'src/db/db.module';
import type { Database } from 'src/db/db.types';

@Controller('plans')
export class PlansController {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  @Get()
  async findAll() {
    // Devuelve todos los planes
    return this.db.select().from(plans);
  }
}
