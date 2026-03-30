import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { GIFT_CARD_REPOSITORY } from '../ports/tokens';
import { GiftCardRepository } from '../ports/gift-card.repository';
import { BRANCHES_REPOSITORY } from 'src/modules/branches/core/ports/tokens';
import { BranchesRepository } from 'src/modules/branches/core/ports/branches.repository';
import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';

@Injectable()
export class GetUserGiftCardsUseCase {
  constructor(
    @Inject(GIFT_CARD_REPOSITORY)
    private readonly repo: GiftCardRepository,

    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: BranchesRepository,
  ) {}

  async execute(input: { userId: string; requester: AuthenticatedUser }) {
    if (!input.userId) {
      throw new BadRequestException('userId requerido');
    }

    const branchResult = await this.branchesRepo.findBranchByUser(
      input.requester.id,
    );

    if (!branchResult.branch) {
      throw new ForbiddenException('No tienes acceso');
    }

    if (!input.requester.belongsToOrg(branchResult.branch.organizationId)) {
      throw new ForbiddenException('No autorizado');
    }

    return this.repo.findByUser(input.userId);
  }
}
