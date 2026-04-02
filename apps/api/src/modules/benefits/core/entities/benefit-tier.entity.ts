export interface BenefitTier {
  id: string;

  programId: string;

  name: string;
  description: string | null;

  color: string | null;
  icon: string | null;

  minPoints: number;
  position: number;

  createdAt: Date | null;
}
