import { Module } from '@nestjs/common';
import { PlansController } from './plans.controller';
import { DbModule } from '../db/db.module';

@Module({
  imports: [DbModule],
  controllers: [PlansController],
})
export class PlansModule {}
