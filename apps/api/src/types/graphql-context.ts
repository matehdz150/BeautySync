// types/graphql-context.ts

import { Request } from 'express';

export type PublicSession = {
  publicUserId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
};

export type GraphQLContext = {
  req: Request & {
    publicUser?: PublicSession;
  };
};
