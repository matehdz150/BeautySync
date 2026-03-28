import { ObjectType, Field, Float, Int, ArgsType } from '@nestjs/graphql';
import { registerEnumType } from '@nestjs/graphql';

export enum ExploreSort {
  DISTANCE = 'distance',
  RATING = 'rating',
  PRICE = 'price',
}

registerEnumType(ExploreSort, {
  name: 'ExploreSort',
});

@ObjectType()
export class ServicePreviewGql {
  @Field()
  name!: string;

  @Field(() => Int, { nullable: true })
  priceCents?: number;

  @Field(() => Int)
  durationMin!: number;

  @Field({ nullable: true })
  categoryName?: string; // 👈 para UI

  @Field({ nullable: true })
  categorySlug?: string; // 👈 🔥 para filtros
}

@ObjectType()
export class ExploreBranchGql {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  isFavorite?: boolean;

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

@ArgsType()
export class ExploreFiltersInput {
  @Field(() => Float, { nullable: true })
  lat?: number;

  @Field(() => Float, { nullable: true })
  lng?: number;

  @Field(() => Float, { nullable: true })
  radius?: number;

  @Field(() => String, { nullable: true })
  categories?: string;

  @Field(() => Int, { nullable: true })
  minPrice?: number;

  @Field(() => Int, { nullable: true })
  maxPrice?: number;

  @Field(() => Float, { nullable: true })
  rating?: number;

  @Field(() => ExploreSort, { nullable: true })
  sort?: ExploreSort;
}
