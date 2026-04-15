import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSchoolDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  // 📍 ubicación
  @IsOptional()
  @IsString()
  address?: string;


  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  // 🎓 info académica
  @IsOptional()
  @IsString()
  educationalLevel?: string;

  @IsOptional()
  @IsString()
  institutionType?: string;

  @IsOptional()
  @IsString()
  schedule?: string;

  @IsOptional()
  @IsString()
  languages?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxStudentsPerClass?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  enrollmentYear?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  enrollmentOpen?: boolean;

  // 💰 precios
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  monthlyPrice?: number;
}
