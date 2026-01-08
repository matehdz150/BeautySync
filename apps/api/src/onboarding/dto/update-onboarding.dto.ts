import { PartialType } from '@nestjs/mapped-types';
import { OnboardOwnerDto } from './onboard-owner.dto';

export class UpdateOnboardingDto extends PartialType(OnboardOwnerDto) {}
