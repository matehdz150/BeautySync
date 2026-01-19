import { Injectable } from '@nestjs/common';
import { BranchesService } from '../branches/branches.service';
import { GroqService } from './groq.service';

@Injectable()
export class AiService {
  constructor(
    private readonly branches: BranchesService,
    private readonly groq: GroqService,
  ) {}

  async generateBranchDescription(branchId: string) {
    const { branch, services } = await this.branches.getBranchForAi(branchId);

    const description = await this.groq.generateBranchDescription({
      branchName: branch.name,
      branchAddress: branch.address,
      services: services.map((s) => ({ name: s.name })),
    });

    return { description };
  }
}
