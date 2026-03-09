import { Injectable } from '@nestjs/common';
import { GroqService } from './groq.service';
import { GetBranchForAiUseCase } from '../branches/core/use-cases/manager/get-branch-for-ai.use-case';

@Injectable()
export class AiService {
  constructor(
    private readonly getBranchForAi: GetBranchForAiUseCase,
    private readonly groq: GroqService,
  ) {}

  async generateBranchDescription(branchId: string) {
    const { branch, services } = await this.getBranchForAi.execute(branchId);

    const description = await this.groq.generateBranchDescription({
      branchName: branch.name,
      branchAddress: branch.address,
      services,
    });

    return { description };
  }
}
