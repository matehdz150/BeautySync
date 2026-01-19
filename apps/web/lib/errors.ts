export type PublicApiErrorCode =
  | "UNAUTHORIZED"
  | "PHONE_REQUIRED"
  | "UNKNOWN";

export class PublicApiError extends Error {
  code: PublicApiErrorCode;
  status?: number;

  constructor(params: { code: PublicApiErrorCode; message: string; status?: number }) {
    super(params.message);
    this.code = params.code;
    this.status = params.status;
  }
}