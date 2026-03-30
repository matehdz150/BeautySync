import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GIFT_CARD_REPOSITORY } from '../ports/tokens';
import { GiftCardRepository } from '../ports/gift-card.repository';
import { BRANCHES_REPOSITORY } from 'src/modules/branches/core/ports/tokens';
import { BranchesRepository } from 'src/modules/branches/core/ports/branches.repository';
import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';

@Injectable()
export class GetGiftCardUseCase {
  constructor(
    @Inject(GIFT_CARD_REPOSITORY)
    private readonly repo: GiftCardRepository,

    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: BranchesRepository,
  ) {}

  async execute(input: { id: string; user: AuthenticatedUser }) {
    if (!input.id) {
      throw new BadRequestException('id requerido');
    }

    const card = await this.repo.findById(input.id);

    if (!card) {
      throw new NotFoundException('Gift card not found');
    }

    // 🔥 validar acceso por branch
    const branch = await this.branchesRepo.findById(card.branchId);

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (!input.user.belongsToOrg(branch.organizationId)) {
      throw new ForbiddenException('No autorizado');
    }

    return card;
  }
}
