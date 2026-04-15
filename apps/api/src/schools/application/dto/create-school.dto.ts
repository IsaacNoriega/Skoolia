import { IsOptional, IsString, MinLength, IsNumber } from 'class-validator';

export class CreateSchoolDto {
  @IsString()
  @MinLength(3)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Ubicación
  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}
