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
import {
  BRANCH_IMAGES_REPOSITORY,
  BRANCHES_REPOSITORY,
} from 'src/modules/branches/core/ports/tokens';

import { mailQueue } from 'src/modules/queues/mail/mail.queue';
import { BranchImagesRepository } from 'src/modules/branches/core/ports/branch-images.repository';

@Injectable()
export class CreateGiftCardUseCase {
  constructor(
    @Inject(GIFT_CARD_REPOSITORY)
    private readonly repo: GiftCardRepository,

    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: BranchesRepository,

    @Inject(BRANCH_IMAGES_REPOSITORY)
    private readonly branchImagesRepo: BranchImagesRepository,
  ) {}

  async execute(input: {
    branchId: string;
    initialAmountCents: number;
    ownerUserId?: string;
    expiresAt?: Date | null;
    issuedToEmail?: string; // 🔥
    user: AuthenticatedUser;
  }) {
    const MIN_AMOUNT = 100; // $1
    const MAX_AMOUNT = 100_000_00; // $10,000

    // =========================
    // VALIDATIONS
    // =========================
    if (!input.branchId) {
      throw new BadRequestException('branchId requerido');
    }

    if (!input.initialAmountCents || input.initialAmountCents <= 0) {
      throw new BadRequestException('Monto inválido');
    }

    if (input.initialAmountCents < MIN_AMOUNT) {
      throw new BadRequestException('Monto mínimo $1.00');
    }

    if (input.initialAmountCents > MAX_AMOUNT) {
      throw new BadRequestException('Monto máximo $10,000');
    }

    if (input.expiresAt && input.expiresAt < new Date()) {
      throw new BadRequestException('Fecha de expiración inválida');
    }

    if (input.issuedToEmail && !input.issuedToEmail.includes('@')) {
      throw new BadRequestException('Email inválido');
    }

    // =========================
    // ACCESS CONTROL
    // =========================
    const branch = await this.branchesRepo.findById(input.branchId);

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const images = await this.branchImagesRepo.getByBranch(branch.id);

    const coverUrl = images?.[0]?.url ?? null;

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
    const giftCard = await this.repo.create({
      branchId: input.branchId,
      code,
      initialAmountCents: input.initialAmountCents,
      ownerUserId: input.ownerUserId ?? null,
      issuedToEmail: input.issuedToEmail, // 🔥 importante
      expiresAt: input.expiresAt ?? null,
    });

    // =========================
    // SEND EMAIL (ASYNC)
    // =========================
    if (input.issuedToEmail) {
      mailQueue
        .add('gift-card-issued', {
          to: input.issuedToEmail,
          code,
          amountCents: input.initialAmountCents,
          organization: branch.organizationId,
          branch: branch.name,
          claimLink: `${process.env.PUBLIC_APP_URL}/gift-card/claim/${code}`,
          coverUrl,
        })
        .catch((e) => {
          console.error('Failed to enqueue gift card email', e);
        });
    }

    return giftCard;
  }

  private generateCode() {
    return `GC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  }
}
