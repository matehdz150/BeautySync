import { ObjectType, Field, Float, Int, InputType } from '@nestjs/graphql';

@ObjectType()
export class ServicePreviewGql {
  @Field()
  name!: string;

  @Field(() => Int, { nullable: true })
  priceCents?: number;

  @Field(() => Int)
  durationMin!: number;

  @Field({ nullable: true })
  categoryName?: string;
}

@ObjectType()
export class ExploreBranchGql {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  address?: string;

  @Field(() => Float, { nullable: true })
  lat?: number;

  @Field(() => Float, { nullable: true })
  lng?: number;

  // 🔥 ESTE ERA EL QUE FALTABA
  @Field({ nullable: true })
  publicSlug?: string;

  @Field({ nullable: true })
  coverImage?: string;

  @Field(() => Float)
  ratingAvg!: number;

  @Field(() => Int)
  ratingCount!: number;

  @Field(() => Int)
  servicesCount!: number;

  @Field(() => Float, { nullable: true })
  distanceKm?: number;

  @Field(() => [ServicePreviewGql])
  servicesPreview!: ServicePreviewGql[];
}

@InputType()
export class ExploreFiltersInput {
  @Field(() => Float, { nullable: true })
  lat?: number;

  @Field(() => Float, { nullable: true })
  lng?: number;

  @Field(() => Float, { nullable: true })
  radius?: number;

  @Field({ nullable: true })
  categories?: string;

  @Field(() => Int, { nullable: true })
  minPrice?: number;

  @Field(() => Int, { nullable: true })
  maxPrice?: number;

  @Field(() => Float, { nullable: true })
  rating?: number;

  @Field({ nullable: true })
  sort?: 'distance' | 'rating' | 'price';
}
