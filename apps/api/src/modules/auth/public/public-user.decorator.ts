import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type PublicUserSession = {
  publicUserId: string;
};

export const PublicUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PublicUserSession | null => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const req = ctx.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unnecessary-type-assertion
    return (req as any).publicUser ?? null;
  },
);
