import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  ActivateBenefitProgramInput,
  BenefitProgramRepository,
} from '../ports/benefit-program.repository';
import { BENEFIT_PROGRAM_REPOSITORY } from '../ports/tokens';
import { BRANCHES_REPOSITORY } from 'src/modules/branches/core/ports/tokens';
import { BranchesRepository } from 'src/modules/branches/core/ports/branches.repository';
import { PaymentBenefitsRefreshService } from 'src/modules/payments/application/payment-benefits-refresh.service';

@Injectable()
export class ActivateBenefitProgramUseCase {
  constructor(
    @Inject(BENEFIT_PROGRAM_REPOSITORY)
    private readonly programRepository: BenefitProgramRepository,
    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepo: BranchesRepository,
    private readonly paymentBenefitsRefresh: PaymentBenefitsRefreshService,
  ) {}

  async execute(input: ActivateBenefitProgramInput) {
    // =========================
    // ACCESS
    // =========================
    const branch = await this.branchesRepo.findById(input.branchId);

    if (!branch) throw new BadRequestException('Sucursal inválida');

    if (!input.user.belongsToOrg(branch.organizationId)) {
      throw new ForbiddenException('Sin acceso');
    }

    const existing = await this.programRepository.findByBranchId(
      input.branchId,
    );

    if (!existing) {
      const program = await this.programRepository.create({
        branchId: input.branchId,
        isActive: true,
        name: input.name ?? 'Programa de beneficios',
      });
      await this.paymentBenefitsRefresh.invalidateBranch(input.branchId);
      return program;
    }

    if (!existing.isActive) {
      const program = await this.programRepository.update(existing.id, {
        isActive: true,
      });
      await this.paymentBenefitsRefresh.invalidateBranch(input.branchId);
      return program;
    }

    return existing; // ya estaba activo
  }
}
