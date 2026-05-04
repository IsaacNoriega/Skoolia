import { IsEnum, IsNumber, IsString, IsUUID } from 'class-validator';

export enum EnrollmentTargetType {
  SCHOOL = 'SCHOOL',
  COURSE = 'COURSE',
}

export class CreateEnrollmentDto {
  @IsUUID()
  targetId: string;

  @IsEnum(EnrollmentTargetType)
  targetType: EnrollmentTargetType;

  @IsNumber()
  amount: number;
}
