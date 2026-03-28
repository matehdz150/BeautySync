import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLContext } from 'src/types/graphql-context';

export const GqlPublicUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const gqlCtx = GqlExecutionContext.create(ctx);

    const { req } = gqlCtx.getContext<GraphQLContext>();

    return req.publicUser?.publicUserId;
  },
);
