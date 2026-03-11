export class AvailableService {
  constructor(
    public id: string,
    public name: string,
    public durationMin: number,
    public priceCents: number,
    public categoryColor: string | null,
    public allowAny: boolean,
    public staff: {
      id: string;
      name: string;
      avatarUrl?: string | null;
    }[],
  ) {}
}
