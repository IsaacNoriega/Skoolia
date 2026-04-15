import { InputType, Field, Float } from '@nestjs/graphql';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { SchoolSortEnum } from '../types/school-sort.enum';

@InputType()
export class SchoolsFeedInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  state?: string;
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  educationalLevel?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  city?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  schedule?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  languages?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

  @Field(() => SchoolSortEnum, { nullable: true })
  @IsOptional()
  @IsEnum(SchoolSortEnum)
  sortBy?: SchoolSortEnum;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  onlyVerified?: boolean;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}
