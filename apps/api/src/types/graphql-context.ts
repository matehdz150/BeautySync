// types/graphql-context.ts

import { Request } from 'express';

export type PublicSession = {
  publicUserId: string;
};

export type GraphQLContext = {
  req: Request & {
    publicUser?: PublicSession;
  };
};
