import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SkillGraphNode {
  @Field()
  name!: string;

  @Field()
  score!: number;
}

@ObjectType()
export class PortfolioSnapshot {
  @Field()
  slug!: string;

  @Field()
  title!: string;

  @Field(() => [SkillGraphNode])
  topSkills!: SkillGraphNode[];
}

@ObjectType()
export class PublicIdentity {
  @Field()
  userId!: string;

  @Field()
  displayName!: string;

  @Field(() => [PortfolioSnapshot])
  snapshots!: PortfolioSnapshot[];
}


