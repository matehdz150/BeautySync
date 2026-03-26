import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class ServicePreviewGql {
  @Field()
  name!: string;

  @Field(() => Int, { nullable: true })
  priceCents?: number;

  @Field(() => Int)
  durationMin!: number;
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

  @Field(() => [ServicePreviewGql])
  servicesPreview!: ServicePreviewGql[];
}
