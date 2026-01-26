/* eslint-disable @typescript-eslint/no-unsafe-return */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  (_, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user,
);
