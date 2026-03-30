import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GIFT_CARD_REPOSITORY } from '../ports/tokens';
import { GiftCardRepository } from '../ports/gift-card.repository';
import { AuthenticatedUser } from 'src/modules/auth/core/entities/authenticatedUser.entity';
import { BranchesRepository } from 'src/modules/branches/core/ports/branches.repository';
import { BRANCHES_REPOSITORY } from 'src/modules/branches/core/ports/tokens';

@Injectable()
export class CreateGiftCardUseCase {
  constructor(
    @Inject(GIFT_CARD_REPOSITORY)
    private readonly repo: GiftCardRepository,

    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: BranchesRepository,
  ) {}

  async execute(input: {
    branchId: string;
    initialAmountCents: number;
    ownerUserId?: string;
    expiresAt?: Date | null;
    user: AuthenticatedUser;
  }) {
    // =========================
    // VALIDATIONS
    // =========================
    if (!input.branchId) {
      throw new BadRequestException('branchId requerido');
    }

    if (!input.initialAmountCents || input.initialAmountCents <= 0) {
      throw new BadRequestException('Monto inválido');
    }

    if (input.initialAmountCents < 100) {
      throw new BadRequestException('Monto mínimo 1.00');
    }

    if (input.expiresAt && input.expiresAt < new Date()) {
      throw new BadRequestException('Fecha de expiración inválida');
    }

    // =========================
    // 🔥 ACCESS CONTROL
    // =========================
    const branch = await this.branchesRepo.findById(input.branchId);

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (!input.user.belongsToOrg(branch.organizationId)) {
      throw new ForbiddenException('No tienes acceso a esta sucursal');
    }

    // =========================
    // GENERATE CODE
    // =========================
    const code = this.generateCode();

    // =========================
    // CREATE
    // =========================
    return this.repo.create({
      branchId: input.branchId,
      code,
      initialAmountCents: input.initialAmountCents,
      ownerUserId: input.ownerUserId ?? null,
      expiresAt: input.expiresAt ?? null,
    });
  }

  private generateCode() {
    return `GC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  }
}
