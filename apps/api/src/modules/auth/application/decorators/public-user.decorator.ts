import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type PublicSession = {
  publicUserId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
};

export type PublicRequest = Request & {
  publicUser: PublicSession;
};

export const PublicUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PublicSession => {
    const req = ctx.switchToHttp().getRequest<PublicRequest>();
    return req.publicUser;
  },
);
