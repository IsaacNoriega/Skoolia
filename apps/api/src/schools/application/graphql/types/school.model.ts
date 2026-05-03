import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class SchoolModel {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  logoUrl?: string;

  @Field({ nullable: true })
  coverImageUrl?: string;

  @Field({ nullable: true })
  address?: string;


  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  state?: string;

  @Field(() => Float)
  averageRating?: number;

  @Field(() => Int)
  favoritesCount?: number;

  @Field()
  isVerified?: boolean;

  @Field(() => Int, { nullable: true })
  monthlyPrice?: number;

  @Field(() => [String], { nullable: true })
  gallery?: string[];
}
