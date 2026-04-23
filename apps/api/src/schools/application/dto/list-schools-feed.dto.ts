import { IsOptional, IsString, IsNumber, IsBoolean, IsIn } from 'class-validator';

export class ListSchoolsFeedDto {
  @IsOptional()
  @IsString()
  educationalLevel?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  schedule?: string;

  @IsOptional()
  @IsString()
  languages?: string;

  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['favorites', 'rating', 'recent'])
  sortBy?: 'favorites' | 'rating' | 'recent';

  @IsOptional()
  @IsBoolean()
  onlyVerified?: boolean;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  first?: number;

  @IsOptional()
  @IsString()
  after?: string;
}
