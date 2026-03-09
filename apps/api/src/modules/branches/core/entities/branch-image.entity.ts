export class BranchImage {
  constructor(
    public id: string,
    public branchId: string,
    public url: string,
    public publicId: string,
    public isCover: boolean,
    public position: number,
    public createdAt: Date | null,
  ) {}
}
