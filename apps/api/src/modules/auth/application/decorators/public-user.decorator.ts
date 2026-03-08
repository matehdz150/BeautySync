import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type PublicSession = {
  publicUserId: string;
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
